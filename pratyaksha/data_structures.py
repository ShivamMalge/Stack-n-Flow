import uuid
from typing import List, Dict, Any, Optional, Union
from .widget import VisualizerWidget

class BaseStructure:
    nodes: Any  # Type hint to allow subclasses to define different types

    def __init__(self, structure_type: str):
        self.widget = VisualizerWidget()
        self.widget.structure = structure_type
        # self.nodes is defined by subclasses
        self._sync()

    def _sync(self):
        nodes = getattr(self, "nodes", [])
        self.widget.nodes = nodes

    def _gen_id(self) -> str:
        # Simplest possible way to get a short ID that satisfies Pyre2
        u = uuid.uuid4()
        s = str(u)
        return s[:8]

    def _repr_html_(self):
        return self.widget._repr_html_()

class Stack(BaseStructure):
    nodes: List[Dict[str, Any]]

    def __init__(self):
        self.nodes = []
        super().__init__("STACK")

    def push(self, value):
        node = {"id": self._gen_id(), "value": value}
        self.nodes.insert(0, node) # Top is index 0 in visualizer
        self._sync()

    def pop(self):
        if not self.nodes:
            return None
        val = self.nodes.pop(0)
        self._sync()
        return val["value"]

class Queue(BaseStructure):
    nodes: List[Dict[str, Any]]

    def __init__(self):
        self.nodes = []
        super().__init__("QUEUE")

    def enqueue(self, value):
        node = {"id": self._gen_id(), "value": value}
        self.nodes.append(node)
        self._sync()

    def dequeue(self):
        if not self.nodes:
            return None
        val = self.nodes.pop(0)
        self._sync()
        return val["value"]

class ArrayList(BaseStructure):
    nodes: List[Dict[str, Any]]

    def __init__(self):
        self.nodes = [] # Defines its own nodes type
        super().__init__("ARRAY")

    def append(self, value):
        node = {"id": self._gen_id(), "value": value}
        self.nodes.append(node)
        self._sync()

    def insert(self, index, value):
        node = {"id": self._gen_id(), "value": value}
        self.nodes.insert(index, node)
        self._sync()

    def remove_at(self, index):
        if 0 <= index < len(self.nodes):
            val = self.nodes.pop(index)
            self._sync()
            return val["value"]
        return None
class LinkedList(BaseStructure):
    nodes: List[Dict[str, Any]]

    def __init__(self):
        self.nodes = [] # Defines its own nodes type
        super().__init__("LINKED_LIST")

    def insert_front(self, value):
        node = {"id": self._gen_id(), "value": value}
        self.nodes.insert(0, node)
        self._sync()

    def insert_rear(self, value):
        node = {"id": self._gen_id(), "value": value}
        self.nodes.append(node)
        self._sync()

    def remove_at(self, index):
        if 0 <= index < len(self.nodes):
            val = self.nodes.pop(index)
            self._sync()
            return val["value"]
        return None

class BinaryTree(BaseStructure):
    nodes: Optional[Dict[str, Any]]

    def __init__(self):
        # Initialize nodes with type hint to match expected type later
        self.nodes = None
        super().__init__("TREE")

    def set_root(self, value):
        self.nodes = {"id": self._gen_id(), "value": value, "left": None, "right": None}
        self._sync()

    def _sync(self):
        self.widget.nodes = self.nodes

class AVLTree(BinaryTree):
    def __init__(self):
        super().__init__()
        self.widget.structure = "AVL_TREE"

class Graph(BaseStructure):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

    def __init__(self):
        self.nodes = []
        self.edges = []
        super().__init__("GRAPH")

    def add_node(self, label, x, y):
        node = {"id": label, "label": label, "x": x, "y": y}
        self.nodes.append(node)
        self._sync()

    def add_edge(self, source, target):
        edge = {"id": f"{source}-{target}", "source": source, "target": target}
        self.edges.append(edge)
        self._sync()

    def _sync(self):
        self.widget.nodes = self.nodes
        self.widget.metadata = {"edges": self.edges}

class HashTable(BaseStructure):
    nodes: List[List[Dict[str, Any]]]

    def __init__(self, size: int = 10):
        self.size = size
        self.nodes = [[] for _ in range(size)]
        super().__init__("HASH_TABLE")

    def insert(self, key, value):
        # Simplistic hash for demo purposes, matching React hashFn if possible
        h = 0
        for char in str(key):
            h = (h * 31 + ord(char)) % self.size
        
        # Check if key exists
        for entry in self.nodes[h]:
            if entry["key"] == key:
                entry["value"] = value
                self._sync()
                return
        
        self.nodes[h].append({"key": str(key), "value": str(value), "state": "default"})
        self._sync()

class Heap(BaseStructure):
    nodes: List[Any]
    states: List[str]

    def __init__(self, heap_type: str = "min"):
        self.heap_type = heap_type
        self.nodes = [] # Array-based heap
        self.states = []
        super().__init__("HEAP")

    def insert(self, value):
        self.nodes.append(value)
        self.states = ["default"] * len(self.nodes)
        self._sync()

    def _sync(self):
        self.widget.nodes = self.nodes
        self.widget.metadata = {"states": self.states}

class CircularLinkedList(LinkedList):
    def __init__(self):
        super().__init__()
        self.widget.structure = "CIRCULAR_LINKED_LIST"

class DoublyLinkedList(LinkedList):
    def __init__(self):
        super().__init__()
        self.widget.structure = "DOUBLY_LINKED_LIST"

class CircularQueue(BaseStructure):
    nodes: List[Dict[str, Any]]

    def __init__(self, max_size: int = 5):
        self.max_size = max_size
        self.front = 0
        self.rear = -1
        self.size = 0
        # Initialize with consistent types to help the linter
        self.nodes = [{"id": "empty", "value": 0}] * max_size
        super().__init__("CIRCULAR_QUEUE")

    def enqueue(self, value):
        if self.size == self.max_size: return
        self.rear = (self.rear + 1) % self.max_size
        self.nodes[self.rear] = {"id": self._gen_id(), "value": value}
        self.size += 1
        self._sync()

    def _sync(self):
        self.widget.nodes = self.nodes
        self.widget.metadata = {
            "front": self.front,
            "rear": self.rear,
            "size": self.size
        }


from .structures.stack import Stack as TelemetryStack
from .structures.queue import Queue as TelemetryQueue
from .structures.linked_list import LinkedList as TelemetryLinkedList
from .structures.array_list import ArrayList as TelemetryArrayList
from .structures.tree import BinaryTree as TelemetryBinaryTree, AVLTree as TelemetryAVLTree
from .structures.graph import Graph as TelemetryGraph
from .structures.hash_table import HashTable as TelemetryHashTable
from .structures.heap import Heap as TelemetryHeap
from .structures.linked_list_variants import (
    CircularLinkedList as TelemetryCircularLinkedList,
    DoublyLinkedList as TelemetryDoublyLinkedList,
)
from .structures.circular_queue import CircularQueue as TelemetryCircularQueue

Stack = TelemetryStack
Queue = TelemetryQueue
LinkedList = TelemetryLinkedList
ArrayList = TelemetryArrayList
BinaryTree = TelemetryBinaryTree
AVLTree = TelemetryAVLTree
Graph = TelemetryGraph
HashTable = TelemetryHashTable
Heap = TelemetryHeap
CircularLinkedList = TelemetryCircularLinkedList
DoublyLinkedList = TelemetryDoublyLinkedList
CircularQueue = TelemetryCircularQueue
