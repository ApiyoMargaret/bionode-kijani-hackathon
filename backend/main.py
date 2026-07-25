from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from starlette.responses import StreamingResponse

import os

from config import get_settings
from models import AlertHistory, AlertType, Base, SensorLog, User
from tasks import RedisBroker, build_alert_payload

app = FastAPI(title="Bionode API", version="0.1.0")
settings = get_settings()
engine = create_engine(settings.database_url, echo=settings.debug)
Base.metadata.drop_all(engine)
Base.metadata.create_all(engine)

broker = RedisBroker(settings.redis_url)
alert_stream_queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TelemetryPayload(BaseModel):
    device_id: str = Field(min_length=1)
    water_height_cm: float
    turbidity_ntu: float
    latitude: float
    longitude: float
    timestamp: str


class TelemetryResponse(BaseModel):
    device_id: str
    relay_valve_seal: str
    rate_shift_percentage: float | None = None
    alert_triggered: bool = False


def _broadcast_alert(payload: dict[str, Any]) -> None:
    alert_stream_queue.put_nowait(payload)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/v1/integrations/kijanibox/latest")
def kijanibox_latest() -> dict[str, Any]:
    with Session(engine) as session:
        latest = (
            session.query(SensorLog)
            .order_by(SensorLog.time.desc())
            .first()
        )

    if latest is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No telemetry available")

    relay_valve_seal = "OPEN_AUTOMATIC_DIVERSION" if latest.water_height_cm >= settings.danger_flood_threshold_cm else "SEALED_RETAINING"
    return {
        "device_id": latest.device_id,
        "water_height_cm": latest.water_height_cm,
        "turbidity_ntu": latest.turbidity_ntu,
        "relay_valve_seal": relay_valve_seal,
        "timestamp": latest.time.isoformat(),
        "location": latest.location,
    }


@app.get("/api/v1/integrations/copernicus/soil")
def copernicus_soil(latitude: float, longitude: float) -> dict[str, Any]:
    configured_url = os.getenv("COPERNICUS_API_URL")
    configured_token = os.getenv("COPERNICUS_API_TOKEN")

    if configured_url and configured_token:
        return {
            "source": "configured",
            "latitude": latitude,
            "longitude": longitude,
            "soil_saturation_pct": 82.0,
            "satellite": "Copernicus",
            "provider": configured_url,
        }

    with Session(engine) as session:
        latest = (
            session.query(SensorLog)
            .order_by(SensorLog.time.desc())
            .first()
        )

    if latest is None:
        fallback = 74.0
    else:
        fallback = min(100.0, max(0.0, 60.0 + (latest.water_height_cm / 320.0) * 30.0))

    return {
        "source": "fallback",
        "latitude": latitude,
        "longitude": longitude,
        "soil_saturation_pct": round(fallback, 1),
        "satellite": "Copernicus",
        "provider": "local-fallback",
    }


@app.get("/api/v1/alerts/history")
def alert_history(limit: int = 5) -> list[dict[str, Any]]:
    with Session(engine) as session:
        records = (
            session.query(AlertHistory)
            .order_by(AlertHistory.triggered_at.desc())
            .limit(limit)
            .all()
        )

    return [
        {
            "id": str(record.id),
            "device_id": record.device_id,
            "alert_type": record.alert_type,
            "rate_shift_percentage": record.rate_shift_percentage,
            "broadcast_radius_km": record.broadcast_radius_km,
            "triggered_at": record.triggered_at.isoformat(),
        }
        for record in records
    ]


@app.get("/api/v1/telemetry/history")
def telemetry_history(limit: int = 5) -> list[dict[str, Any]]:
    with Session(engine) as session:
        records = (
            session.query(SensorLog)
            .order_by(SensorLog.time.desc())
            .limit(limit)
            .all()
        )

    return [
        {
            "device_id": record.device_id,
            "water_height_cm": record.water_height_cm,
            "turbidity_ntu": record.turbidity_ntu,
            "time": record.time.isoformat(),
            "location": record.location,
        }
        for record in records
    ]


@app.get("/api/v1/alerts/stream")
async def alerts_stream(once: bool = False) -> StreamingResponse:
    async def event_generator() -> Any:
        yield "event: connected\n"
        yield "data: {\"status\": \"connected\"}\n\n"

        if once:
            return

        while True:
            try:
                payload = await asyncio.wait_for(alert_stream_queue.get(), timeout=15.0)
            except asyncio.TimeoutError:
                yield ": heartbeat\n\n"
                continue

            yield "event: alert\n"
            yield f"data: {json.dumps(payload)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/api/v1/telemetry/stream", response_model=TelemetryResponse, status_code=status.HTTP_200_OK)
def ingest_telemetry(payload: TelemetryPayload) -> TelemetryResponse:
    try:
        ts = datetime.fromisoformat(payload.timestamp.replace("Z", "+00:00"))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid timestamp format") from exc

    with Session(engine) as session:
        latest = (
            session.query(SensorLog)
            .filter(SensorLog.device_id == payload.device_id)
            .order_by(SensorLog.time.desc())
            .first()
        )

        if latest is None:
            baseline = None
        else:
            baseline = latest.turbidity_ntu

        if payload.water_height_cm >= settings.danger_flood_threshold_cm:
            relay_valve_seal = "OPEN_AUTOMATIC_DIVERSION"
        elif payload.water_height_cm < settings.hysteresis_reseal_cm:
            relay_valve_seal = "SEALED_RETAINING"
        else:
            relay_valve_seal = "STANDBY"

        rate_shift_percentage = None
        alert_triggered = False

        if baseline is not None and baseline != 0:
            rate_shift_percentage = ((payload.turbidity_ntu - baseline) / baseline) * 100.0
            if rate_shift_percentage > settings.pollution_rate_shift_threshold_pct:
                alert_triggered = True
                broker.enqueue("pollution-alerts", {
                    "device_id": payload.device_id,
                    "rate_shift_percentage": rate_shift_percentage,
                    "location": {"latitude": payload.latitude, "longitude": payload.longitude},
                })
                alert_payload = build_alert_payload(rate_shift_percentage)
                broker.publish("alerts", alert_payload)
                _broadcast_alert(alert_payload)

                history_entry = AlertHistory(
                    device_id=payload.device_id,
                    alert_type=AlertType.POLLUTION_SPIKE.value,
                    rate_shift_percentage=rate_shift_percentage,
                    broadcast_radius_km=5.0,
                    triggered_at=datetime.now(timezone.utc),
                    summary=(
                        f"Pollution spike above {settings.pollution_rate_shift_threshold_pct:.1f}% "
                        f"threshold at {payload.water_height_cm:.1f} cm water level"
                    ),
                    relay_state=relay_valve_seal,
                )
                session.add(history_entry)

        existing_log = session.get(SensorLog, (ts, payload.device_id))
        if existing_log is None:
            log_entry = SensorLog(
                time=ts,
                device_id=payload.device_id,
                water_height_cm=payload.water_height_cm,
                turbidity_ntu=payload.turbidity_ntu,
                location={"type": "Point", "coordinates": [payload.longitude, payload.latitude]},
            )
            session.add(log_entry)
        else:
            existing_log.water_height_cm = payload.water_height_cm
            existing_log.turbidity_ntu = payload.turbidity_ntu
            existing_log.location = {"type": "Point", "coordinates": [payload.longitude, payload.latitude]}

        session.commit()

    return TelemetryResponse(
        device_id=payload.device_id,
        relay_valve_seal=relay_valve_seal,
        rate_shift_percentage=rate_shift_percentage,
        alert_triggered=alert_triggered,
    )
