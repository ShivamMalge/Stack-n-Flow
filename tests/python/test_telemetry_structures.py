import unittest

from pratyaksha.data_structures import LinkedList, Queue, Stack


class TelemetryStructureTests(unittest.TestCase):
    def test_stack_push_and_pop_emit_telemetry(self):
        stack = Stack()
        stack.push(10)
        stack.push(20)
        popped = stack.pop()

        trace = stack.export_trace()

        self.assertEqual(popped, 20)
        self.assertEqual([event["op"] for event in trace["events"]], ["push", "push", "pop"])
        self.assertEqual(trace["snapshots"][-1]["nodes"][0]["value"], 10)
        self.assertEqual(stack.widget.metadata["telemetry"]["event_count"], 3)

    def test_queue_enqueue_and_dequeue_emit_telemetry(self):
        queue = Queue()
        queue.enqueue(1)
        queue.enqueue(2)
        value = queue.dequeue()

        trace = queue.export_trace()

        self.assertEqual(value, 1)
        self.assertEqual([event["op"] for event in trace["events"]], ["enqueue", "enqueue", "dequeue"])
        self.assertEqual(trace["snapshots"][-1]["nodes"][0]["value"], 2)
        self.assertEqual(queue.widget.metadata["telemetry"]["event_count"], 3)

    def test_linked_list_operations_emit_telemetry(self):
        linked_list = LinkedList()
        linked_list.insert_front(10)
        linked_list.insert_rear(20)
        removed = linked_list.remove_at(0)

        trace = linked_list.export_trace()

        self.assertEqual(removed, 10)
        self.assertEqual(
            [event["op"] for event in trace["events"]],
            ["insert_front", "insert_rear", "remove_at"],
        )
        self.assertEqual(trace["snapshots"][-1]["nodes"][0]["value"], 20)
        self.assertEqual(linked_list.widget.metadata["telemetry"]["event_count"], 3)


if __name__ == "__main__":
    unittest.main()
