from __future__ import annotations

from typing import Any, Dict

from ..core.telemetry import TelemetryEvent, TelemetryRun, TelemetrySnapshot, telemetry_metadata
from ..core.structures import StructureType
from .base import BaseTelemetryStructure


def _reduce_stack(snapshot: TelemetrySnapshot, event: TelemetryEvent) -> TelemetrySnapshot:
    nodes = list(snapshot.nodes)

    if event.op == "push":
        nodes.insert(0, {"id": event.payload["id"], "value": event.payload["value"]})
    elif event.op == "pop" and nodes:
        nodes = nodes[1:]
    elif event.op == "peek":
        metadata = telemetry_metadata(event.sequence, event.op)
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
        metadata=telemetry_metadata(event.sequence, event.op),
    )


class Stack(BaseTelemetryStructure):
    def __init__(self):
        run = TelemetryRun(
            structure=StructureType.STACK,
            reducer=_reduce_stack,
            initial_nodes=[],
            initial_metadata=telemetry_metadata(0, None),
        )
        super().__init__(run)

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
