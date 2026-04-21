import unittest

from pratyaksha.core.telemetry import TelemetryRun, TelemetrySnapshot


class TelemetryCoreTests(unittest.TestCase):
    def test_emit_records_event_and_updates_snapshot(self):
        def reducer(snapshot: TelemetrySnapshot, event):
            nodes = list(snapshot.nodes)
            if event.op == "push":
                nodes.insert(0, {"id": event.payload["id"], "value": event.payload["value"]})
            metadata = dict(snapshot.metadata)
            metadata["last_op"] = event.op
            return TelemetrySnapshot(
                sequence=event.sequence,
                structure=snapshot.structure,
                nodes=nodes,
                metadata=metadata,
            )

        run = TelemetryRun(
            structure="STACK",
            reducer=reducer,
            initial_nodes=[],
            initial_metadata={},
        )

        snapshot = run.emit("push", {"id": "n1", "value": 10})

        self.assertEqual(snapshot.sequence, 1)
        self.assertEqual(snapshot.nodes[0]["value"], 10)
        self.assertEqual(snapshot.metadata["last_op"], "push")
        self.assertEqual(len(run.events), 1)
        self.assertEqual(run.events[0].sequence, 1)
        self.assertEqual(run.events[0].op, "push")

    def test_export_trace_includes_events_and_snapshots(self):
        def reducer(snapshot: TelemetrySnapshot, event):
            nodes = list(snapshot.nodes)
            if event.op == "enqueue":
                nodes.append({"id": event.payload["id"], "value": event.payload["value"]})
            return TelemetrySnapshot(
                sequence=event.sequence,
                structure=snapshot.structure,
                nodes=nodes,
                metadata=dict(snapshot.metadata),
            )

        run = TelemetryRun(
            structure="QUEUE",
            reducer=reducer,
            initial_nodes=[],
            initial_metadata={"kind": "queue"},
        )
        run.emit("enqueue", {"id": "q1", "value": 5})

        trace = run.export_trace()

        self.assertEqual(trace["structure"], "QUEUE")
        self.assertEqual(trace["events"][0]["op"], "enqueue")
        self.assertEqual(trace["snapshots"][-1]["nodes"][0]["value"], 5)


if __name__ == "__main__":
    unittest.main()
