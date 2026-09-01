from __future__ import annotations

import uuid
from copy import deepcopy
from typing import Any, Dict, List

from .telemetry import TelemetryEvent, TelemetryRun
from ..widget import VisualizerWidget

# Length of the short identifiers handed to the renderer as React keys.
NODE_ID_LENGTH = 8


class BaseTelemetryObject:
    """Shared behaviour for every telemetry-backed structure and algorithm.

    Structures and algorithms previously carried near-identical copies of this
    class, which is how ``event_history()`` came to exist on one and not the
    other.
    """

    def __init__(self, run: TelemetryRun, theme: str = "auto"):
        # The structure name is derived from the run rather than passed
        # separately, so a snapshot cannot be labelled one structure while the
        # widget renders another.
        self.widget = VisualizerWidget()
        self.widget.structure = str(run.structure)
        self.widget.theme = theme
        self._run = run
        self.nodes: Any = []
        self.metadata: Dict[str, Any] = {}
        self._sync_latest()

    def set_theme(self, theme: str) -> None:
        """Switch between "auto", "light" and "dark" after construction."""
        if theme not in ("auto", "light", "dark"):
            raise ValueError('theme must be "auto", "light" or "dark"')
        self.widget.theme = theme

    def _gen_id(self) -> str:
        return str(uuid.uuid4())[:NODE_ID_LENGTH]

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

    def event_history(self) -> List[TelemetryEvent]:
        return list(self._run.events)

    def _repr_mimebundle_(self, **kwargs):
        """Renders as the underlying widget in a notebook.

        This delegated to ``widget._repr_html_()`` previously, which anywidget
        does not define — ipywidgets uses the mimebundle protocol. IPython also
        prefers ``_repr_html_`` when a class defines it, so its mere presence
        suppressed widget rendering. A static HTML string cannot carry the comm
        channel that live updates travel over, either.
        """
        return self.widget._repr_mimebundle_(**kwargs)
