from __future__ import annotations

import json
import os
from typing import Any

import redis


class RedisBroker:
    def __init__(self, redis_url: str | None = None) -> None:
        self.client = redis.from_url(redis_url or os.getenv("REDIS_URL", "redis://localhost:6379/0"))

    def enqueue(self, queue_name: str, payload: dict[str, Any]) -> None:
        try:
            self.client.rpush(queue_name, json.dumps(payload))
        except Exception:
            return

    def publish(self, channel: str, payload: dict[str, Any]) -> None:
        try:
            self.client.publish(channel, json.dumps(payload))
        except Exception:
            return


def build_alert_payload(rate_shift_pct: float) -> dict[str, Any]:
    return {
        "headline": (
            f"Upstream sensors have detected a {rate_shift_pct:.1f}% increase in chemical and silt runoff over the last baseline cycle."
        ),
        "actions": [
            "Farming Communities: Immediately halt all upstream spraying of liquid nitrogen, fertilizers, or chemical pesticides for the next 24 hours to prevent additional field wash-off.",
            "Domestic Users: Do not allow cattle or poultry to drink directly from the open channel; utilize water pumped from secure wells.",
            "Community Action: Cooperative teams should inspect the nearest upstream canal junction for potential agricultural or industrial drainage leaks.",
        ],
    }
