from __future__ import annotations

from typing import Any, Dict

from ..core.telemetry import TelemetryEvent, TelemetryRun, TelemetrySnapshot
from .base import BaseTelemetryStructure


def _telemetry_metadata(event_count: int, last_op: str | None, states=None) -> Dict[str, Any]:
    return {
        "states": list(states or []),
        "telemetry": {"event_count": event_count, "last_op": last_op},
    }


def _reduce_heap(snapshot: TelemetrySnapshot, event: TelemetryEvent) -> TelemetrySnapshot:
    nodes = list(snapshot.nodes)
    if event.op == "insert":
        nodes.append(event.payload["value"])
    states = ["default"] * len(nodes)

    return TelemetrySnapshot(
        sequence=event.sequence,
        structure=snapshot.structure,
        nodes=nodes,
        metadata=_telemetry_metadata(event.sequence, event.op, states),
    )


class Heap(BaseTelemetryStructure):
    def __init__(self, heap_type: str = "min"):
        self.heap_type = heap_type
        run = TelemetryRun(
            structure="HEAP",
            reducer=_reduce_heap,
            initial_nodes=[],
            initial_metadata=_telemetry_metadata(0, None, []),
        )
        super().__init__("HEAP", run)
        self.states = []

    def insert(self, value: Any):
        self._emit("insert", {"value": value})
        self.states = list(self.metadata.get("states", []))
