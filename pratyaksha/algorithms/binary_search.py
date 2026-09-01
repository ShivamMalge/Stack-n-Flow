from __future__ import annotations

from typing import Any, Dict, Iterable

from ..core.telemetry import TelemetryEvent, TelemetryRun, TelemetrySnapshot, telemetry_metadata
from ..core.structures import StructureType
from .base import BaseTelemetryAlgorithm


def _reduce_binary_search(snapshot: TelemetrySnapshot, event: TelemetryEvent) -> TelemetrySnapshot:
    metadata = dict(snapshot.metadata)

    if event.op == "set_result":
        metadata["searchResult"] = event.payload["message"]

    return TelemetrySnapshot(
        sequence=event.sequence,
        structure=snapshot.structure,
        nodes=list(snapshot.nodes),
        metadata=telemetry_metadata(event.sequence, event.op, **metadata),
    )


class BinarySearch(BaseTelemetryAlgorithm):
    def __init__(self, array: Iterable[Any] | None = None, theme: str = "auto"):
        nodes = [{"value": v} for v in sorted(array)] if array else []
        run = TelemetryRun(
            structure=StructureType.BINARY_SEARCH,
            reducer=_reduce_binary_search,
            initial_nodes=nodes,
            initial_metadata=telemetry_metadata(0, None),
        )
        super().__init__(run, theme=theme)

    def set_result(self, message: str):
        self._emit("set_result", {"message": message})
