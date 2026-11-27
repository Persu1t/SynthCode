from datetime import datetime

from fastapi.testclient import TestClient

from synthcode.main import app

client = TestClient(app)


def test_health_returns_ok_payload():
    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "synthcode-ai"
    assert body["uptimeSeconds"] >= 0


def test_health_timestamp_is_iso_8601():
    body = client.get("/health").json()

    assert datetime.fromisoformat(body["timestamp"])
