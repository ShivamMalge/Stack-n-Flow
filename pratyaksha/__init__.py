"""Pratyaksha — Python-driven data structure visualisation for notebooks."""

from .widget import VisualizerWidget
from .core.structures import StructureType
from .data_structures import (
    Stack, Queue, ArrayList, LinkedList, BinaryTree,
    AVLTree, Graph, HashTable, Heap, CircularLinkedList,
    DoublyLinkedList, CircularQueue
)
from .algorithms import BinarySearch, QuickSort

# Keep in step with the version in pyproject.toml.
__version__ = "0.1.0"

__all__ = [
    "Stack", "Queue", "ArrayList", "VisualizerWidget",
    "LinkedList", "BinaryTree", "AVLTree", "Graph", "HashTable",
    "Heap", "CircularLinkedList", "DoublyLinkedList", "CircularQueue",
    "BinarySearch", "QuickSort", "StructureType", "__version__",
]
