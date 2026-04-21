from __future__ import annotations

from typing import Any, Dict, List

from ..core.telemetry import TelemetryEvent, TelemetryRun, TelemetrySnapshot
from .base import BaseTelemetryStructure


def _telemetry_metadata(event_count: int, last_op: str | None, front: int, rear: int, size: int) -> Dict[str, Any]:
    return {
        "front": front,
        "rear": rear,
        "size": size,
        "telemetry": {"event_count": event_count, "last_op": last_op},
    }


def _reduce_circular_queue(snapshot: TelemetrySnapshot, event: TelemetryEvent) -> TelemetrySnapshot:
    nodes = [dict(node) for node in snapshot.nodes]
    metadata = dict(snapshot.metadata)
    max_size = metadata["max_size"]
    front = metadata["front"]
    rear = metadata["rear"]
    size = metadata["size"]

    if event.op == "enqueue" and size < max_size:
        rear = (rear + 1) % max_size
        nodes[rear] = {"id": event.payload["id"], "value": event.payload["value"]}
        size += 1

    metadata.update(_telemetry_metadata(event.sequence, event.op, front, rear, size))
    return TelemetrySnapshot(
        sequence=event.sequence,
        structure=snapshot.structure,
        nodes=nodes,
        metadata=metadata,
    )


class CircularQueue(BaseTelemetryStructure):
    def __init__(self, max_size: int = 5):
        self.max_size = max_size
        initial_nodes: List[Dict[str, Any]] = [{"id": "empty", "value": 0} for _ in range(max_size)]
        initial_metadata = {
            "max_size": max_size,
            **_telemetry_metadata(0, None, front=0, rear=-1, size=0),
        }
        run = TelemetryRun(
            structure="CIRCULAR_QUEUE",
            reducer=_reduce_circular_queue,
            initial_nodes=initial_nodes,
            initial_metadata=initial_metadata,
        )
        super().__init__("CIRCULAR_QUEUE", run)
        self.front = self.metadata["front"]
        self.rear = self.metadata["rear"]
        self.size = self.metadata["size"]

    def enqueue(self, value: Any):
        if self.size == self.max_size:
            return
        self._emit("enqueue", {"id": self._gen_id(), "value": value})
        self.front = self.metadata["front"]
        self.rear = self.metadata["rear"]
        self.size = self.metadata["size"]
