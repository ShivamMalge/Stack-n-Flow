from __future__ import annotations

from typing import Any, Dict

from ..core.telemetry import TelemetryEvent, TelemetryRun, TelemetrySnapshot
from .base import BaseTelemetryStructure


def _telemetry_metadata(event_count: int, last_op: str | None) -> Dict[str, Any]:
    return {"telemetry": {"event_count": event_count, "last_op": last_op}}


def _reduce_array(snapshot: TelemetrySnapshot, event: TelemetryEvent) -> TelemetrySnapshot:
    nodes = list(snapshot.nodes)

    if event.op == "append":
        nodes.append({"id": event.payload["id"], "value": event.payload["value"]})
    elif event.op == "insert":
        index = event.payload["index"]
        nodes.insert(index, {"id": event.payload["id"], "value": event.payload["value"]})
    elif event.op == "remove_at":
        index = event.payload["index"]
        if 0 <= index < len(nodes):
            nodes.pop(index)

    metadata = _telemetry_metadata(event.sequence, event.op)
    if event.op == "remove_at":
        metadata["removedIndex"] = event.payload["index"]

    return TelemetrySnapshot(
        sequence=event.sequence,
        structure=snapshot.structure,
        nodes=nodes,
        metadata=metadata,
    )


class ArrayList(BaseTelemetryStructure):
    def __init__(self):
        run = TelemetryRun(
            structure="ARRAY",
            reducer=_reduce_array,
            initial_nodes=[],
            initial_metadata=_telemetry_metadata(0, None),
        )
        super().__init__("ARRAY", run)

    def append(self, value: Any):
        self._emit("append", {"id": self._gen_id(), "value": value})

    def insert(self, index: int, value: Any):
        self._emit("insert", {"id": self._gen_id(), "index": index, "value": value})

    def remove_at(self, index: int):
        if 0 <= index < len(self.nodes):
            value = self.nodes[index]["value"]
            self._emit("remove_at", {"index": index, "value": value})
            return value
        return None
