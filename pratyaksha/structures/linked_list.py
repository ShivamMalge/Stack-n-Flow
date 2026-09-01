from __future__ import annotations

from typing import Any, Dict

from ..core.telemetry import TelemetryEvent, TelemetryRun, TelemetrySnapshot, telemetry_metadata
from ..core.structures import StructureType
from .base import BaseTelemetryStructure


def _reduce_linked_list(snapshot: TelemetrySnapshot, event: TelemetryEvent) -> TelemetrySnapshot:
    nodes = list(snapshot.nodes)

    if event.op == "insert_front":
        nodes.insert(0, {"id": event.payload["id"], "value": event.payload["value"]})
    elif event.op == "insert_rear":
        nodes.append({"id": event.payload["id"], "value": event.payload["value"]})
    elif event.op == "remove_at":
        index = event.payload["index"]
        if 0 <= index < len(nodes):
            nodes.pop(index)

    metadata = telemetry_metadata(event.sequence, event.op)
    if event.op == "remove_at":
        metadata["removedIndex"] = event.payload["index"]

    return TelemetrySnapshot(
        sequence=event.sequence,
        structure=snapshot.structure,
        nodes=nodes,
        metadata=metadata,
    )


class LinkedList(BaseTelemetryStructure):
    def __init__(self, theme: str = "auto"):
        run = TelemetryRun(
            structure=StructureType.LINKED_LIST,
            reducer=_reduce_linked_list,
            initial_nodes=[],
            initial_metadata=telemetry_metadata(0, None),
        )
        super().__init__(run, theme=theme)

    def insert_front(self, value: Any):
        self._emit("insert_front", {"id": self._gen_id(), "value": value})

    def insert_rear(self, value: Any):
        self._emit("insert_rear", {"id": self._gen_id(), "value": value})

    def remove_at(self, index: int):
        if 0 <= index < len(self.nodes):
            value = self.nodes[index]["value"]
            self._emit("remove_at", {"index": index, "value": value})
            return value
        return None
