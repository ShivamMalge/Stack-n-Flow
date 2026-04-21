from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List


@dataclass(frozen=True)
class TelemetryEvent:
    sequence: int
    structure: str
    op: str
    payload: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "sequence": self.sequence,
            "structure": self.structure,
            "op": self.op,
            "payload": dict(self.payload),
        }


@dataclass(frozen=True)
class TelemetrySnapshot:
    sequence: int
    structure: str
    nodes: Any = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "sequence": self.sequence,
            "structure": self.structure,
            "nodes": deepcopy(self.nodes),
            "metadata": deepcopy(self.metadata),
        }


Reducer = Callable[[TelemetrySnapshot, TelemetryEvent], TelemetrySnapshot]


class TelemetryRun:
    def __init__(
        self,
        structure: str,
        reducer: Reducer,
        initial_nodes: List[Any] | None = None,
        initial_metadata: Dict[str, Any] | None = None,
    ):
        self.structure = structure
        self.reducer = reducer
        self.events: List[TelemetryEvent] = []
        self.snapshots: List[TelemetrySnapshot] = [
            TelemetrySnapshot(
                sequence=0,
                structure=structure,
                nodes=deepcopy(initial_nodes if initial_nodes is not None else []),
                metadata=deepcopy(initial_metadata or {}),
            )
        ]

    def latest_snapshot(self) -> TelemetrySnapshot:
        return self.snapshots[-1]

    def emit(self, op: str, payload: Dict[str, Any] | None = None) -> TelemetrySnapshot:
        event = TelemetryEvent(
            sequence=len(self.events) + 1,
            structure=self.structure,
            op=op,
            payload=dict(payload or {}),
        )
        snapshot = self.reducer(self.latest_snapshot(), event)
        self.events.append(event)
        self.snapshots.append(snapshot)
        return snapshot

    def export_trace(self) -> Dict[str, Any]:
        return {
            "structure": self.structure,
            "events": [event.to_dict() for event in self.events],
            "snapshots": [snapshot.to_dict() for snapshot in self.snapshots],
        }
