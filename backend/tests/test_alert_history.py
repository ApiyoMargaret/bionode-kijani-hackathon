import sys
from pathlib import Path

from fastapi.testclient import TestClient

sys.path.append(str(Path(__file__).resolve().parents[1]))

from main import app as shared_app

client = TestClient(shared_app)


def test_recent_alerts_history_endpoint_returns_entries() -> None:
    client.post(
        "/api/v1/telemetry/stream",
        json={
            "device_id": "NYANDO_01",
            "water_height_cm": 220.0,
            "turbidity_ntu": 40.0,
            "latitude": -0.1,
            "longitude": 34.7,
            "timestamp": "2026-07-25T12:00:00Z",
        },
    )

    client.post(
        "/api/v1/telemetry/stream",
        json={
            "device_id": "NYANDO_01",
            "water_height_cm": 260.0,
            "turbidity_ntu": 180.0,
            "latitude": -0.1,
            "longitude": 34.7,
            "timestamp": "2026-07-25T12:10:00Z",
        },
    )

    response = client.get("/api/v1/alerts/history?limit=5")
    print("history_response", response.json())
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert body
    assert body[0]["device_id"] == "NYANDO_01"
