from __future__ import annotations

from .linked_list import LinkedList as BaseLinkedList, _reduce_linked_list, _telemetry_metadata
from ..core.telemetry import TelemetryRun
from .base import BaseTelemetryStructure


class CircularLinkedList(BaseLinkedList):
    def __init__(self):
        run = TelemetryRun(
            structure="CIRCULAR_LINKED_LIST",
            reducer=_reduce_linked_list,
            initial_nodes=[],
            initial_metadata=_telemetry_metadata(0, None),
        )
        BaseTelemetryStructure.__init__(self, "CIRCULAR_LINKED_LIST", run)


class DoublyLinkedList(BaseLinkedList):
    def __init__(self):
        run = TelemetryRun(
            structure="DOUBLY_LINKED_LIST",
            reducer=_reduce_linked_list,
            initial_nodes=[],
            initial_metadata=_telemetry_metadata(0, None),
        )
        BaseTelemetryStructure.__init__(self, "DOUBLY_LINKED_LIST", run)
