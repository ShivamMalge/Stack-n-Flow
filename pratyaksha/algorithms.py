from typing import List, Dict, Any, Optional
from .widget import VisualizerWidget

class AlgorithmDriver:
    nodes: List[Dict[str, Any]]
    metadata: Dict[str, Any]

    def __init__(self, structure_type: str):
        self.widget = VisualizerWidget()
        self.widget.structure = structure_type
        # self.nodes and self.metadata defined by subclasses
        self._sync()

    def _sync(self):
        self.widget.nodes = getattr(self, "nodes", [])
        self.widget.metadata = getattr(self, "metadata", {})

    def _repr_html_(self):
        return self.widget._repr_html_()

class BinarySearch(AlgorithmDriver):
    def __init__(self, array=None):
        self.nodes = []
        self.metadata = {}
        if array:
            self.nodes = [{"value": v} for v in sorted(array)]
        super().__init__("BINARY_SEARCH")

    def set_result(self, message):
        self.metadata["searchResult"] = message
        self._sync()

class QuickSort(AlgorithmDriver):
    def __init__(self, array=None):
        self.nodes = []
        self.metadata = {}
        if array:
            self.nodes = [{"id": i, "value": v} for i, v in enumerate(array)]
        super().__init__("QUICK_SORT")


from .algorithms.binary_search import BinarySearch as TelemetryBinarySearch
from .algorithms.quick_sort import QuickSort as TelemetryQuickSort

BinarySearch = TelemetryBinarySearch
QuickSort = TelemetryQuickSort
