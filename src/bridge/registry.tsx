import type React from "react";
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
import LinkedListRenderer from "../../components/visualizers/linked-list/linked-list-renderer";
import ArrayRenderer from "../../components/visualizers/array/array-renderer";
import TreeRenderer from "../../components/visualizers/tree/tree-renderer";

export type BridgeVisualizerComponent = React.ComponentType<any>;

/** State the widget receives from Python, before it is shaped into props. */
export interface BridgeState {
  nodes: unknown;
  metadata: Record<string, any>;
}

export interface RegistryEntry {
  component: BridgeVisualizerComponent;
  /**
   * Shapes the synced state into this component's props.
   *
   * Each entry owns its own mapping because the components genuinely disagree:
   * a renderer takes `items`, a full visualizer takes `controlled*`, and the
   * graph and circular queue need fields out of `metadata`. This used to be a
   * chain of `if (structure === ...)` in the bridge, which grew a branch for
   * every structure and hid the mapping away from the component it belongs to.
   */
  props: (state: BridgeState) => Record<string, unknown>;
  /**
   * True once the entry points at a presentational renderer rather than the
   * full interactive visualizer.
   *
   * Notebook users of a full visualizer see inputs, tabs and buttons that do
   * nothing, because Python drives the state. Extracting the remaining ones is
   * pratyaksha_phases.md P2; this flag is what measures the progress, and it
   * goes away when every entry is true.
   */
  rendererOnly: boolean;
}

const asArray = (nodes: unknown) => (Array.isArray(nodes) ? nodes : []);

/**
 * A tree's null is not an array's null: it means "no root", and the empty
 * array a renderer wants would draw a root that is not there.
 */
const asRoot = (nodes: unknown) =>
  nodes && typeof nodes === "object" && !Array.isArray(nodes) ? (nodes as Record<string, unknown>) : null;

const componentRegistry: Record<string, RegistryEntry> = {
  STACK: {
    component: StackRenderer,
    props: ({ nodes, metadata }) => ({ items: asArray(nodes), searchResult: metadata.searchResult }),
    rendererOnly: true,
  },
  QUEUE: {
    component: QueueRenderer,
    props: ({ nodes, metadata }) => ({ items: asArray(nodes), searchResult: metadata.searchResult }),
    rendererOnly: true,
  },
  LINKED_LIST: {
    component: LinkedListRenderer,
    props: ({ nodes, metadata }) => ({ nodes: asArray(nodes), searchResult: metadata.searchResult }),
    rendererOnly: true,
  },
  ARRAY: {
    component: ArrayRenderer,
    props: ({ nodes, metadata }) => ({ items: asArray(nodes), searchResult: metadata.searchResult }),
    rendererOnly: true,
  },
  TREE: {
    component: TreeRenderer,
    props: ({ nodes, metadata }) => ({ root: asRoot(nodes), searchResult: metadata.searchResult }),
    rendererOnly: true,
  },
  AVL_TREE: {
    component: TreeRenderer,
    props: ({ nodes, metadata }) => ({
      root: asRoot(nodes),
      variant: "avl",
      searchResult: metadata.searchResult,
    }),
    rendererOnly: true,
  },
  GRAPH: {
    component: GraphVisualizer,
    props: ({ nodes, metadata }) => ({
      controlledNodes: nodes,
      controlledEdges: metadata.edges || [],
    }),
    rendererOnly: false,
  },
  HASH_TABLE: {
    component: HashTableVisualizer,
    props: ({ nodes }) => ({ controlledBuckets: nodes }),
    rendererOnly: false,
  },
  HEAP: {
    component: HeapVisualizer,
    props: ({ nodes, metadata }) => ({
      controlledHeap: nodes,
      controlledStates: metadata.states || [],
    }),
    rendererOnly: false,
  },
  CIRCULAR_LINKED_LIST: {
    component: CircularLinkedListVisualizer,
    props: ({ nodes }) => ({ controlledNodes: nodes, controlledArray: nodes }),
    rendererOnly: false,
  },
  DOUBLY_LINKED_LIST: {
    component: DoublyLinkedListVisualizer,
    props: ({ nodes }) => ({ controlledNodes: nodes, controlledArray: nodes }),
    rendererOnly: false,
  },
  CIRCULAR_QUEUE: {
    component: CircularQueueVisualizer,
    props: ({ nodes, metadata }) => ({
      controlledQueue: nodes,
      controlledFront: metadata.front,
      controlledRear: metadata.rear,
      controlledSize: metadata.size,
    }),
    rendererOnly: false,
  },
  BINARY_SEARCH: {
    component: BinarySearchVisualizer,
    props: ({ nodes, metadata }) => ({
      controlledArray: nodes,
      controlledSearchResult: metadata.searchResult,
    }),
    rendererOnly: false,
  },
  QUICK_SORT: {
    component: QuickSortVisualizer,
    props: ({ nodes }) => ({ controlledNodes: nodes, controlledArray: nodes }),
    rendererOnly: false,
  },
};

export function getRegistryEntry(structure: string): RegistryEntry | undefined {
  return componentRegistry[structure];
}

/** Structures still mounting a full interactive visualizer. Drives P2. */
export function structuresAwaitingRenderer(): string[] {
  return Object.entries(componentRegistry)
    .filter(([, entry]) => !entry.rendererOnly)
    .map(([structure]) => structure)
    .sort();
}

export function registeredStructures(): string[] {
  return Object.keys(componentRegistry).sort();
}
