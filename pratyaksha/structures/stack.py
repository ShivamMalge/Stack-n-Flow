from __future__ import annotations

from typing import Any, Dict

from ..core.telemetry import TelemetryEvent, TelemetryRun, TelemetrySnapshot
from .base import BaseTelemetryStructure


def _telemetry_metadata(event_count: int, last_op: str | None) -> Dict[str, Any]:
    return {
        "telemetry": {
            "event_count": event_count,
            "last_op": last_op,
        }
    }


def _reduce_stack(snapshot: TelemetrySnapshot, event: TelemetryEvent) -> TelemetrySnapshot:
    nodes = list(snapshot.nodes)

    if event.op == "push":
        nodes.insert(0, {"id": event.payload["id"], "value": event.payload["value"]})
    elif event.op == "pop" and nodes:
        nodes = nodes[1:]
    elif event.op == "peek":
        metadata = _telemetry_metadata(event.sequence, event.op)
        if nodes:
            metadata["searchResult"] = f"Top element: {nodes[0]['value']}"
        return TelemetrySnapshot(
            sequence=event.sequence,
            structure=snapshot.structure,
            nodes=nodes,
            metadata=metadata,
        )

    return TelemetrySnapshot(
        sequence=event.sequence,
        structure=snapshot.structure,
        nodes=nodes,
        metadata=_telemetry_metadata(event.sequence, event.op),
    )


class Stack(BaseTelemetryStructure):
    def __init__(self):
        run = TelemetryRun(
            structure="STACK",
            reducer=_reduce_stack,
            initial_nodes=[],
            initial_metadata=_telemetry_metadata(0, None),
        )
        super().__init__("STACK", run)

    def push(self, value: Any):
        self._emit("push", {"id": self._gen_id(), "value": value})

    def pop(self):
        if not self.nodes:
            return None
        value = self.nodes[0]["value"]
        self._emit("pop", {"value": value})
        return value

    def peek(self):
        if not self.nodes:
            return None
        self._emit("peek", {"value": self.nodes[0]["value"]})
        return self.nodes[0]["value"]
