from __future__ import annotations

from typing import Any, Dict, Iterable

from ..core.telemetry import TelemetryEvent, TelemetryRun, TelemetrySnapshot
from .base import BaseTelemetryAlgorithm


def _telemetry_metadata(event_count: int, last_op: str | None, base: Dict[str, Any] | None = None) -> Dict[str, Any]:
    metadata = dict(base or {})
    metadata["telemetry"] = {
        "event_count": event_count,
        "last_op": last_op,
    }
    return metadata


def _reduce_binary_search(snapshot: TelemetrySnapshot, event: TelemetryEvent) -> TelemetrySnapshot:
    metadata = dict(snapshot.metadata)

    if event.op == "set_result":
        metadata["searchResult"] = event.payload["message"]

    return TelemetrySnapshot(
        sequence=event.sequence,
        structure=snapshot.structure,
        nodes=list(snapshot.nodes),
        metadata=_telemetry_metadata(event.sequence, event.op, metadata),
    )


class BinarySearch(BaseTelemetryAlgorithm):
    def __init__(self, array: Iterable[Any] | None = None):
        nodes = [{"value": v} for v in sorted(array)] if array else []
        run = TelemetryRun(
            structure="BINARY_SEARCH",
            reducer=_reduce_binary_search,
            initial_nodes=nodes,
            initial_metadata=_telemetry_metadata(0, None),
        )
        super().__init__("BINARY_SEARCH", run)

    def set_result(self, message: str):
        self._emit("set_result", {"message": message})
