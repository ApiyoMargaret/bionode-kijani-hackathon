import sys
from pathlib import Path

from fastapi.testclient import TestClient

sys.path.append(str(Path(__file__).resolve().parents[1]))

from main import app as shared_app

client = TestClient(shared_app)


def test_alert_stream_endpoint_returns_sse_headers() -> None:
    with client.stream("GET", "/api/v1/alerts/stream?once=true") as response:
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/event-stream")
