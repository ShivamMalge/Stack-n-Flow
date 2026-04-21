from __future__ import annotations

from typing import Any, Dict, List

from ..core.telemetry import TelemetryEvent, TelemetryRun, TelemetrySnapshot
from .base import BaseTelemetryStructure


def _telemetry_metadata(event_count: int, last_op: str | None) -> Dict[str, Any]:
    return {"telemetry": {"event_count": event_count, "last_op": last_op}}


def _hash(key: Any, size: int) -> int:
    h = 0
    for char in str(key):
        h = (h * 31 + ord(char)) % size
    return h


def _reduce_hash_table(snapshot: TelemetrySnapshot, event: TelemetryEvent) -> TelemetrySnapshot:
    nodes = [[dict(entry) for entry in bucket] for bucket in snapshot.nodes]
    metadata = dict(snapshot.metadata)
    size = metadata["size"]

    key = event.payload["key"]
    bucket_index = _hash(key, size)
    bucket = nodes[bucket_index]

    if event.op == "insert":
        bucket.append({"key": str(key), "value": str(event.payload["value"]), "state": "default"})
    elif event.op == "update":
        for entry in bucket:
            if entry["key"] == key:
                entry["value"] = str(event.payload["value"])
                break

    metadata.update(_telemetry_metadata(event.sequence, event.op))
    return TelemetrySnapshot(
        sequence=event.sequence,
        structure=snapshot.structure,
        nodes=nodes,
        metadata=metadata,
    )


class HashTable(BaseTelemetryStructure):
    def __init__(self, size: int = 10):
        run = TelemetryRun(
            structure="HASH_TABLE",
            reducer=_reduce_hash_table,
            initial_nodes=[[] for _ in range(size)],
            initial_metadata={"size": size, **_telemetry_metadata(0, None)},
        )
        self.size = size
        super().__init__("HASH_TABLE", run)

    def insert(self, key: Any, value: Any):
        bucket_index = _hash(key, self.size)
        bucket: List[Dict[str, Any]] = self.nodes[bucket_index]
        if any(entry["key"] == key for entry in bucket):
            self._emit("update", {"key": key, "value": value})
        else:
            self._emit("insert", {"key": key, "value": value})
