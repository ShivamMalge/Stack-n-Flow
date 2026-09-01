from __future__ import annotations

from typing import Any, Dict, List

from ..core.telemetry import TelemetryEvent, TelemetryRun, TelemetrySnapshot, telemetry_metadata
from ..core.structures import StructureType
from .base import BaseTelemetryStructure


def _reduce_graph(snapshot: TelemetrySnapshot, event: TelemetryEvent) -> TelemetrySnapshot:
    nodes = list(snapshot.nodes)
    edges = list(snapshot.metadata.get("edges", []))

    if event.op == "add_node":
        nodes.append(
            {
                "id": event.payload["label"],
                "label": event.payload["label"],
                "x": event.payload["x"],
                "y": event.payload["y"],
            }
        )
    elif event.op == "add_edge":
        edges.append(
            {
                "id": f"{event.payload['source']}-{event.payload['target']}",
                "source": event.payload["source"],
                "target": event.payload["target"],
            }
        )

    return TelemetrySnapshot(
        sequence=event.sequence,
        structure=snapshot.structure,
        nodes=nodes,
        metadata=telemetry_metadata(event.sequence, event.op, edges=list(edges)),
    )


class Graph(BaseTelemetryStructure):
    def __init__(self, theme: str = "auto"):
        run = TelemetryRun(
            structure=StructureType.GRAPH,
            reducer=_reduce_graph,
            initial_nodes=[],
            initial_metadata=telemetry_metadata(0, None, edges=[]),
        )
        super().__init__(run, theme=theme)
        self.edges = []

    def add_node(self, label: str, x: Any, y: Any):
        self._emit("add_node", {"label": label, "x": x, "y": y})
        self.edges = list(self.metadata.get("edges", []))

    def add_edge(self, source: str, target: str):
        self._emit("add_edge", {"source": source, "target": target})
        self.edges = list(self.metadata.get("edges", []))
