from __future__ import annotations

from typing import Any, Dict, List

from ..core.telemetry import TelemetryEvent, TelemetryRun, TelemetrySnapshot, telemetry_metadata
from ..core.structures import StructureType
from .base import BaseTelemetryStructure

DEFAULT_CAPACITY = 5
# Sentinel for "no element has been enqueued yet".
EMPTY_REAR = -1


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

    metadata.update(telemetry_metadata(event.sequence, event.op, front=front, rear=rear, size=size))
    return TelemetrySnapshot(
        sequence=event.sequence,
        structure=snapshot.structure,
        nodes=nodes,
        metadata=metadata,
    )


class CircularQueue(BaseTelemetryStructure):
    def __init__(self, max_size: int = DEFAULT_CAPACITY):
        self.max_size = max_size
        initial_nodes: List[Dict[str, Any]] = [{"id": "empty", "value": 0} for _ in range(max_size)]
        initial_metadata = {
            "max_size": max_size,
            **telemetry_metadata(0, None, front=0, rear=EMPTY_REAR, size=0),
        }
        run = TelemetryRun(
            structure=StructureType.CIRCULAR_QUEUE,
            reducer=_reduce_circular_queue,
            initial_nodes=initial_nodes,
            initial_metadata=initial_metadata,
        )
        super().__init__(run)
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
