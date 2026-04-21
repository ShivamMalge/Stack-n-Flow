import unittest

from pratyaksha.algorithms import BinarySearch


class TelemetryAlgorithmTests(unittest.TestCase):
    def test_binary_search_initializes_sorted_nodes(self):
        driver = BinarySearch([7, 1, 5])

        self.assertEqual([node["value"] for node in driver.nodes], [1, 5, 7])
        self.assertEqual(driver.widget.structure, "BINARY_SEARCH")

    def test_binary_search_set_result_emits_telemetry(self):
        driver = BinarySearch([7, 1, 5])
        driver.set_result("Found 5 at index 1")

        trace = driver.export_trace()

        self.assertEqual([event["op"] for event in trace["events"]], ["set_result"])
        self.assertEqual(trace["snapshots"][-1]["metadata"]["searchResult"], "Found 5 at index 1")
        self.assertEqual(driver.widget.metadata["telemetry"]["event_count"], 1)


if __name__ == "__main__":
    unittest.main()
