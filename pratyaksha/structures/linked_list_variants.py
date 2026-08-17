from __future__ import annotations

from .linked_list import LinkedList as BaseLinkedList, _reduce_linked_list
from ..core.structures import StructureType
from ..core.telemetry import TelemetryRun, telemetry_metadata
from .base import BaseTelemetryStructure


class CircularLinkedList(BaseLinkedList):
    def __init__(self):
        run = TelemetryRun(
            structure=StructureType.CIRCULAR_LINKED_LIST,
            reducer=_reduce_linked_list,
            initial_nodes=[],
            initial_metadata=telemetry_metadata(0, None),
        )
        BaseTelemetryStructure.__init__(self, run)


class DoublyLinkedList(BaseLinkedList):
    def __init__(self):
        run = TelemetryRun(
            structure=StructureType.DOUBLY_LINKED_LIST,
            reducer=_reduce_linked_list,
            initial_nodes=[],
            initial_metadata=telemetry_metadata(0, None),
        )
        BaseTelemetryStructure.__init__(self, run)
