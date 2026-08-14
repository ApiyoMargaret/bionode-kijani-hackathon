import sys
from pathlib import Path

from fastapi.testclient import TestClient

sys.path.append(str(Path(__file__).resolve().parents[1]))

from main import app as shared_app

client = TestClient(shared_app)


def test_health_endpoint() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_ingest_telemetry_flood_action() -> None:
    response = client.post(
        "/api/v1/telemetry/stream",
        json={
            "device_id": "NYANDO_01",
            "water_height_cm": 260.0,
            "turbidity_ntu": 180.0,
            "latitude": -0.1,
            "longitude": 34.7,
            "timestamp": "2026-07-25T12:00:00Z",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["relay_valve_seal"] == "OPEN_AUTOMATIC_DIVERSION"


def test_ingest_telemetry_reseal_action() -> None:
    response = client.post(
        "/api/v1/telemetry/stream",
        json={
            "device_id": "NYANDO_01",
            "water_height_cm": 220.0,
            "turbidity_ntu": 40.0,
            "latitude": -0.1,
            "longitude": 34.7,
            "timestamp": "2026-07-25T12:05:00Z",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["relay_valve_seal"] == "SEALED_RETAINING"
