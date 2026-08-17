from __future__ import annotations

from enum import Enum


class StructureType(str, Enum):
    """Identifiers shared with the TypeScript bridge.

    Each value must match a key in ``src/bridge/registry.tsx``. These were
    previously bare string literals written out twice in every constructor —
    once for the telemetry run and once for the widget — so the two could drift
    apart and route a snapshot to the wrong renderer.

    Subclassing ``str`` keeps the members usable anywhere a plain string is
    expected, including traitlets assignment and JSON serialisation.
    """

    STACK = "STACK"
    QUEUE = "QUEUE"
    ARRAY = "ARRAY"
    LINKED_LIST = "LINKED_LIST"
    CIRCULAR_LINKED_LIST = "CIRCULAR_LINKED_LIST"
    DOUBLY_LINKED_LIST = "DOUBLY_LINKED_LIST"
    CIRCULAR_QUEUE = "CIRCULAR_QUEUE"
    TREE = "TREE"
    AVL_TREE = "AVL_TREE"
    GRAPH = "GRAPH"
    HASH_TABLE = "HASH_TABLE"
    HEAP = "HEAP"
    BINARY_SEARCH = "BINARY_SEARCH"
    QUICK_SORT = "QUICK_SORT"

    def __str__(self) -> str:
        return self.value
