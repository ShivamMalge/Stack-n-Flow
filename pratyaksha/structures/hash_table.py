from __future__ import annotations

from typing import Any, Dict, List

from ..core.telemetry import TelemetryEvent, TelemetryRun, TelemetrySnapshot, telemetry_metadata
from ..core.structures import StructureType
from .base import BaseTelemetryStructure

# Odd prime multiplier, as used by Java's String.hashCode.
HASH_MULTIPLIER = 31
DEFAULT_TABLE_SIZE = 10


def _normalize_key(key: Any) -> str:
    """Bucket entries store keys as strings, so lookups must normalise too.

    Entries were written with ``str(key)`` but compared against the raw value,
    so ``insert(5, ...)`` twice compared ``"5" == 5`` and appended a duplicate
    instead of updating.
    """
    return str(key)


def _hash(key: Any, size: int) -> int:
    h = 0
    for char in str(key):
        h = (h * HASH_MULTIPLIER + ord(char)) % size
    return h


def _reduce_hash_table(snapshot: TelemetrySnapshot, event: TelemetryEvent) -> TelemetrySnapshot:
    nodes = [[dict(entry) for entry in bucket] for bucket in snapshot.nodes]
    metadata = dict(snapshot.metadata)
    size = metadata["size"]

    key = _normalize_key(event.payload["key"])
    bucket_index = _hash(key, size)
    bucket = nodes[bucket_index]

    if event.op == "insert":
        bucket.append({"key": key, "value": str(event.payload["value"]), "state": "default"})
    elif event.op == "update":
        for entry in bucket:
            if entry["key"] == key:
                entry["value"] = str(event.payload["value"])
                break

    metadata.update(telemetry_metadata(event.sequence, event.op))
    return TelemetrySnapshot(
        sequence=event.sequence,
        structure=snapshot.structure,
        nodes=nodes,
        metadata=metadata,
    )


class HashTable(BaseTelemetryStructure):
    def __init__(self, size: int = DEFAULT_TABLE_SIZE, theme: str = "auto"):
        run = TelemetryRun(
            structure=StructureType.HASH_TABLE,
            reducer=_reduce_hash_table,
            initial_nodes=[[] for _ in range(size)],
            initial_metadata={"size": size, **telemetry_metadata(0, None)},
        )
        self.size = size
        super().__init__(run, theme=theme)

    def insert(self, key: Any, value: Any):
        key = _normalize_key(key)
        bucket_index = _hash(key, self.size)
        bucket: List[Dict[str, Any]] = self.nodes[bucket_index]
        if any(entry["key"] == key for entry in bucket):
            self._emit("update", {"key": key, "value": value})
        else:
            self._emit("insert", {"key": key, "value": value})
