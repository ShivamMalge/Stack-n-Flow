from __future__ import annotations

from typing import Any, Dict, Iterable

from ..core.telemetry import TelemetryRun
from .base import BaseTelemetryAlgorithm


def _telemetry_metadata(event_count: int, last_op: str | None) -> Dict[str, Any]:
    return {"telemetry": {"event_count": event_count, "last_op": last_op}}


class QuickSort(BaseTelemetryAlgorithm):
    def __init__(self, array: Iterable[Any] | None = None):
        nodes = [{"id": index, "value": value} for index, value in enumerate(array)] if array else []
        run = TelemetryRun(
            structure="QUICK_SORT",
            reducer=lambda snapshot, event: snapshot,
            initial_nodes=nodes,
            initial_metadata=_telemetry_metadata(0, None),
        )
        super().__init__("QUICK_SORT", run)
