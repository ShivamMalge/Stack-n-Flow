from __future__ import annotations

from typing import Any, Dict, Optional

from ..core.telemetry import TelemetryEvent, TelemetryRun, TelemetrySnapshot, telemetry_metadata
from ..core.structures import StructureType
from .base import BaseTelemetryStructure


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
        metadata=telemetry_metadata(event.sequence, event.op),
    )


class BinaryTree(BaseTelemetryStructure):
    def __init__(self):
        run = TelemetryRun(
            structure=StructureType.TREE,
            reducer=_reduce_tree,
            initial_nodes=None,
            initial_metadata=telemetry_metadata(0, None),
        )
        super().__init__(run)

    def set_root(self, value: Any):
        self._emit("set_root", {"id": self._gen_id(), "value": value})


class AVLTree(BinaryTree):
    def __init__(self):
        run = TelemetryRun(
            structure=StructureType.AVL_TREE,
            reducer=_reduce_tree,
            initial_nodes=None,
            initial_metadata=telemetry_metadata(0, None),
        )
        BaseTelemetryStructure.__init__(self, run)

    def set_root(self, value: Any):
        self._emit("set_root", {"id": self._gen_id(), "value": value})
