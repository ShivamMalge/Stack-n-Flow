import unittest

from pratyaksha import (
    AVLTree,
    ArrayList,
    BinaryTree,
    CircularLinkedList,
    CircularQueue,
    DoublyLinkedList,
    Graph,
    HashTable,
    Heap,
    QuickSort,
)


class RemainingTelemetryTests(unittest.TestCase):
    def test_array_list_operations_emit_telemetry(self):
        array_list = ArrayList()
        array_list.append(10)
        array_list.insert(1, 20)
        removed = array_list.remove_at(0)

        trace = array_list.export_trace()

        self.assertEqual(removed, 10)
        self.assertEqual([event["op"] for event in trace["events"]], ["append", "insert", "remove_at"])
        self.assertEqual(trace["snapshots"][-1]["nodes"][0]["value"], 20)

    def test_binary_tree_root_updates_emit_telemetry(self):
        tree = BinaryTree()
        tree.set_root(42)

        trace = tree.export_trace()

        self.assertEqual(trace["events"][0]["op"], "set_root")
        self.assertEqual(trace["snapshots"][-1]["nodes"]["value"], 42)

    def test_avl_tree_uses_avl_structure_type(self):
        tree = AVLTree()
        tree.set_root(7)

        self.assertEqual(tree.widget.structure, "AVL_TREE")
        self.assertEqual(tree.export_trace()["structure"], "AVL_TREE")

    def test_graph_node_and_edge_updates_emit_telemetry(self):
        graph = Graph()
        graph.add_node("A", 0, 0)
        graph.add_node("B", 1, 1)
        graph.add_edge("A", "B")

        trace = graph.export_trace()

        self.assertEqual([event["op"] for event in trace["events"]], ["add_node", "add_node", "add_edge"])
        self.assertEqual(len(trace["snapshots"][-1]["metadata"]["edges"]), 1)

    def test_hash_table_insert_and_update_emit_telemetry(self):
        table = HashTable(size=5)
        table.insert("alpha", 1)
        table.insert("alpha", 2)

        trace = table.export_trace()

        self.assertEqual([event["op"] for event in trace["events"]], ["insert", "update"])
        buckets = trace["snapshots"][-1]["nodes"]
        flattened = [entry for bucket in buckets for entry in bucket]
        self.assertEqual(flattened[0]["value"], "2")

    def test_heap_insert_emits_telemetry(self):
        heap = Heap()
        heap.insert(5)
        heap.insert(10)

        trace = heap.export_trace()

        self.assertEqual([event["op"] for event in trace["events"]], ["insert", "insert"])
        self.assertEqual(trace["snapshots"][-1]["nodes"], [5, 10])
        self.assertEqual(trace["snapshots"][-1]["metadata"]["states"], ["default", "default"])

    def test_linked_list_variants_preserve_structure_type(self):
        circular = CircularLinkedList()
        circular.insert_front(1)
        doubly = DoublyLinkedList()
        doubly.insert_front(2)

        self.assertEqual(circular.widget.structure, "CIRCULAR_LINKED_LIST")
        self.assertEqual(circular.export_trace()["structure"], "CIRCULAR_LINKED_LIST")
        self.assertEqual(doubly.widget.structure, "DOUBLY_LINKED_LIST")
        self.assertEqual(doubly.export_trace()["structure"], "DOUBLY_LINKED_LIST")

    def test_circular_queue_enqueue_emits_telemetry(self):
        queue = CircularQueue(max_size=3)
        queue.enqueue(11)
        queue.enqueue(22)

        trace = queue.export_trace()

        self.assertEqual([event["op"] for event in trace["events"]], ["enqueue", "enqueue"])
        self.assertEqual(trace["snapshots"][-1]["metadata"]["size"], 2)
        self.assertEqual(trace["snapshots"][-1]["metadata"]["rear"], 1)

    def test_quick_sort_uses_telemetry_base_for_initial_state(self):
        quick_sort = QuickSort([3, 1, 2])

        trace = quick_sort.export_trace()

        self.assertEqual(trace["events"], [])
        self.assertEqual([node["value"] for node in trace["snapshots"][-1]["nodes"]], [3, 1, 2])
        self.assertEqual(quick_sort.widget.structure, "QUICK_SORT")


if __name__ == "__main__":
    unittest.main()
