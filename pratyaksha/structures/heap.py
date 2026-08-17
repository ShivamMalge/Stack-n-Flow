from __future__ import annotations

from typing import Any, Dict

from ..core.telemetry import TelemetryEvent, TelemetryRun, TelemetrySnapshot, telemetry_metadata
from ..core.structures import StructureType
from .base import BaseTelemetryStructure


def _reduce_heap(snapshot: TelemetrySnapshot, event: TelemetryEvent) -> TelemetrySnapshot:
    nodes = list(snapshot.nodes)
    if event.op == "insert":
        nodes.append(event.payload["value"])
    states = ["default"] * len(nodes)

    return TelemetrySnapshot(
        sequence=event.sequence,
        structure=snapshot.structure,
        nodes=nodes,
        metadata=telemetry_metadata(event.sequence, event.op, states=list(states)),
    )


class Heap(BaseTelemetryStructure):
    def __init__(self, heap_type: str = "min"):
        self.heap_type = heap_type
        run = TelemetryRun(
            structure=StructureType.HEAP,
            reducer=_reduce_heap,
            initial_nodes=[],
            initial_metadata=telemetry_metadata(0, None, states=[]),
        )
        super().__init__(run)
        self.states = []

    def insert(self, value: Any):
        self._emit("insert", {"value": value})
        self.states = list(self.metadata.get("states", []))
