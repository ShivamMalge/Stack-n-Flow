from __future__ import annotations

from typing import Any, Dict, Optional

from ..core.telemetry import TelemetryEvent, TelemetryRun, TelemetrySnapshot
from .base import BaseTelemetryStructure


def _telemetry_metadata(event_count: int, last_op: str | None) -> Dict[str, Any]:
    return {"telemetry": {"event_count": event_count, "last_op": last_op}}


def _reduce_tree(snapshot: TelemetrySnapshot, event: TelemetryEvent) -> TelemetrySnapshot:
    nodes: Optional[Dict[str, Any]] = snapshot.nodes

    if event.op == "set_root":
        nodes = {
            "id": event.payload["id"],
            "value": event.payload["value"],
            "left": None,
            "right": None,
        }

    return TelemetrySnapshot(
        sequence=event.sequence,
        structure=snapshot.structure,
        nodes=nodes,
        metadata=_telemetry_metadata(event.sequence, event.op),
    )


class BinaryTree(BaseTelemetryStructure):
    def __init__(self):
        run = TelemetryRun(
            structure="TREE",
            reducer=_reduce_tree,
            initial_nodes=None,
            initial_metadata=_telemetry_metadata(0, None),
        )
        super().__init__("TREE", run)

    def set_root(self, value: Any):
        self._emit("set_root", {"id": self._gen_id(), "value": value})


class AVLTree(BinaryTree):
    def __init__(self):
        run = TelemetryRun(
            structure="AVL_TREE",
            reducer=_reduce_tree,
            initial_nodes=None,
            initial_metadata=_telemetry_metadata(0, None),
        )
        BaseTelemetryStructure.__init__(self, "AVL_TREE", run)

    def set_root(self, value: Any):
        self._emit("set_root", {"id": self._gen_id(), "value": value})
