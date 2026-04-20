import type React from "react";
import StackVisualizer from "../../components/visualizers/stack-visualizer";
import QueueVisualizer from "../../components/visualizers/queue-visualizer";
import ArrayVisualizer from "../../components/visualizers/array-visualizer";
import TreeVisualizer from "../../components/visualizers/tree-visualizer";
import LinkedListVisualizer from "../../components/visualizers/linked-list-visualizer";
import AVLTreeVisualizer from "../../components/visualizers/avl-tree-visualizer";
import GraphVisualizer from "../../components/visualizers/graph-visualizer";
import HashTableVisualizer from "../../components/visualizers/hash-table-visualizer";
import HeapVisualizer from "../../components/visualizers/heap-visualizer";
import CircularLinkedListVisualizer from "../../components/visualizers/circular-linked-list-visualizer";
import DoublyLinkedListVisualizer from "../../components/visualizers/doubly-linked-list-visualizer";
import CircularQueueVisualizer from "../../components/visualizers/circular-queue-visualizer";
import BinarySearchVisualizer from "../../components/visualizers/algorithms/binary-search-visualizer";
import QuickSortVisualizer from "../../components/visualizers/algorithms/quick-sort-visualizer";
import StackRenderer from "../../components/visualizers/stack/stack-renderer";
import QueueRenderer from "../../components/visualizers/queue/queue-renderer";

export type BridgeVisualizerComponent = React.ComponentType<any>;

const componentRegistry: Record<string, BridgeVisualizerComponent> = {
  STACK: StackRenderer,
  QUEUE: QueueRenderer,
  ARRAY: ArrayVisualizer,
  LINKED_LIST: LinkedListVisualizer,
  TREE: TreeVisualizer,
  AVL_TREE: AVLTreeVisualizer,
  GRAPH: GraphVisualizer,
  HASH_TABLE: HashTableVisualizer,
  HEAP: HeapVisualizer,
  CIRCULAR_LINKED_LIST: CircularLinkedListVisualizer,
  DOUBLY_LINKED_LIST: DoublyLinkedListVisualizer,
  CIRCULAR_QUEUE: CircularQueueVisualizer,
  BINARY_SEARCH: BinarySearchVisualizer,
  QUICK_SORT: QuickSortVisualizer,
};

export function getVisualizerComponent(structure: string): BridgeVisualizerComponent | undefined {
  return componentRegistry[structure];
}

export function isRendererOnlyComponent(component: BridgeVisualizerComponent | undefined): boolean {
  return component === StackRenderer || component === QueueRenderer;
}
