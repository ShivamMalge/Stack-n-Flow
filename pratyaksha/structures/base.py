from __future__ import annotations

import uuid
from copy import deepcopy
from typing import Any, Dict

from ..core.telemetry import TelemetryRun
from ..widget import VisualizerWidget


class BaseTelemetryStructure:
    def __init__(self, structure_type: str, run: TelemetryRun):
        self.widget = VisualizerWidget()
        self.widget.structure = structure_type
        self._run = run
        self.nodes = []
        self.metadata: Dict[str, Any] = {}
        self._sync_latest()

    def _gen_id(self) -> str:
        return str(uuid.uuid4())[:8]

    def _sync_latest(self) -> None:
        snapshot = self._run.latest_snapshot()
        self.nodes = deepcopy(snapshot.nodes)
        self.metadata = deepcopy(snapshot.metadata)
        self.widget.nodes = deepcopy(self.nodes)
        self.widget.metadata = deepcopy(self.metadata)

    def _emit(self, op: str, payload: Dict[str, Any] | None = None) -> None:
        self._run.emit(op, payload)
        self._sync_latest()

    def export_trace(self) -> Dict[str, Any]:
        return self._run.export_trace()

    def event_history(self):
        return list(self._run.events)

    def _repr_html_(self):
        return self.widget._repr_html_()
