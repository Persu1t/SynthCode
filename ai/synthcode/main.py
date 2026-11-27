import time
from datetime import datetime, timezone

from fastapi import FastAPI

SERVICE_NAME = "synthcode-ai"
VERSION = "0.1.0"

app = FastAPI(title="SynthCode AI", version=VERSION)

_started_at = time.monotonic()


@app.get("/health")
def health() -> dict:
    """Same payload shape as the Node backend's GET /api/health."""
    return {
        "status": "ok",
        "service": SERVICE_NAME,
        "version": VERSION,
        "uptimeSeconds": round(time.monotonic() - _started_at),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
