import sys
from pathlib import Path

from fastapi.testclient import TestClient

sys.path.append(str(Path(__file__).resolve().parents[1]))

from main import app


client = TestClient(app)


def test_kijanibox_latest_endpoint_returns_latest_telemetry() -> None:
    client.post(
        "/api/v1/telemetry/stream",
        json={
            "device_id": "NYANDO_01",
            "water_height_cm": 270.0,
            "turbidity_ntu": 170.0,
            "latitude": -0.1,
            "longitude": 34.7,
            "timestamp": "2026-07-25T12:30:00Z",
        },
    )

    response = client.get("/api/v1/integrations/kijanibox/latest")
    assert response.status_code == 200
    body = response.json()
    assert body["device_id"] == "NYANDO_01"
    assert body["water_height_cm"] == 270.0
    assert body["relay_valve_seal"] == "OPEN_AUTOMATIC_DIVERSION"


def test_copernicus_soil_endpoint_returns_structured_data() -> None:
    response = client.get("/api/v1/integrations/copernicus/soil?latitude=-0.1&longitude=34.7")
    assert response.status_code == 200
    body = response.json()
    assert body["source"] in {"configured", "fallback"}
    assert body["soil_saturation_pct"] >= 0
    assert body["soil_saturation_pct"] <= 100
