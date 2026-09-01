from __future__ import annotations

from typing import Any, Dict, Iterable

from ..core.telemetry import TelemetryRun, telemetry_metadata
from ..core.structures import StructureType
from .base import BaseTelemetryAlgorithm


class QuickSort(BaseTelemetryAlgorithm):
    def __init__(self, array: Iterable[Any] | None = None, theme: str = "auto"):
        nodes = [{"id": index, "value": value} for index, value in enumerate(array)] if array else []
        run = TelemetryRun(
            structure=StructureType.QUICK_SORT,
            reducer=lambda snapshot, event: snapshot,
            initial_nodes=nodes,
            initial_metadata=telemetry_metadata(0, None),
        )
        super().__init__(run, theme=theme)
