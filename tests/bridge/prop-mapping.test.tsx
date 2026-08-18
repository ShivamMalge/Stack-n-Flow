import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * The router maps one flat telemetry payload onto components with very different
 * prop names. None of those branches were covered, so a rename on either side of
 * the Python/React boundary would have gone unnoticed until a notebook was open.
 *
 * The real visualizers are replaced with probes that record the props they were
 * handed, which keeps these tests about routing rather than rendering.
 */

const received: Record<string, any> = {};

function probe(name: string) {
  const Probe = (props: Record<string, any>) => {
    received[name] = props;
    return <div data-testid={`probe-${name}`} />;
  };
  Probe.displayName = `Probe(${name})`;
  return Probe;
}

const StackRenderer = probe("STACK");
const QueueRenderer = probe("QUEUE");
const Generic = probe("GENERIC");

const REGISTRY: Record<string, any> = {
  STACK: StackRenderer,
  QUEUE: QueueRenderer,
  TREE: probe("TREE"),
  AVL_TREE: probe("AVL_TREE"),
  GRAPH: probe("GRAPH"),
  HASH_TABLE: probe("HASH_TABLE"),
  HEAP: probe("HEAP"),
  CIRCULAR_QUEUE: probe("CIRCULAR_QUEUE"),
  BINARY_SEARCH: probe("BINARY_SEARCH"),
  ARRAY: Generic,
};

vi.mock("@/src/bridge/registry", () => ({
  getVisualizerComponent: (structure: string) => REGISTRY[structure],
  isRendererOnlyComponent: (component: unknown) =>
    component === REGISTRY.STACK || component === REGISTRY.QUEUE,
}));

// The router subscribes to change events on mount, so the fake model needs the
// full surface it touches, not just `get`.
let model: {
  get: (key: string) => any;
  on: (event: string, handler: () => void) => void;
  off: (event: string, handler: () => void) => void;
};

vi.mock("@anywidget/react", () => ({
  useModel: () => model,
  createRender: (component: unknown) => component,
}));

// Imported after the mocks so the router resolves them.
const { VisualizerRouter } = await import("@/src/bridge/pratyaksha-bridge");

function renderStructure(structure: string, nodes: any, metadata: Record<string, any> = {}) {
  const values: Record<string, any> = { structure, nodes, metadata };
  model = {
    get: (key: string) => values[key],
    on: () => {},
    off: () => {},
  };
  return render(<VisualizerRouter />);
}

beforeEach(() => {
  for (const key of Object.keys(received)) delete received[key];
});

describe("bridge prop mapping", () => {
  it("passes stack nodes as `items`, not a controlled prop", () => {
    renderStructure("STACK", [{ id: "a1", value: 1 }], { searchResult: "Top: 1" });

    expect(received.STACK.items).toEqual([{ id: "a1", value: 1 }]);
    expect(received.STACK.searchResult).toBe("Top: 1");
    expect(received.STACK.controlledNodes).toBeUndefined();
  });

  it("coerces a null payload to an empty array for renderer-only components", () => {
    // Renderers read `items.length`; null would throw.
    renderStructure("QUEUE", null);

    expect(received.QUEUE.items).toEqual([]);
  });

  it.each(["TREE", "AVL_TREE"])("maps %s nodes to controlledRoot", (structure) => {
    const root = { value: 8, left: null, right: null };
    renderStructure(structure, root);

    expect(received[structure].controlledRoot).toEqual(root);
  });

  it("preserves null for a tree so an empty root stays null", () => {
    // The components type this as `TreeNode | null`; [] is not a valid empty root.
    renderStructure("TREE", null);

    expect(received.TREE.controlledRoot).toBeNull();
  });

  it("maps graph nodes and edges to separate props", () => {
    const edges = [{ id: "A-B", source: "A", target: "B" }];
    renderStructure("GRAPH", [{ id: "A" }], { edges });

    expect(received.GRAPH.controlledNodes).toEqual([{ id: "A" }]);
    expect(received.GRAPH.controlledEdges).toEqual(edges);
  });

  it("defaults graph edges to an empty array when metadata omits them", () => {
    renderStructure("GRAPH", [{ id: "A" }]);

    expect(received.GRAPH.controlledEdges).toEqual([]);
  });

  it("maps hash table buckets", () => {
    const buckets = [[{ key: "a", value: "1", state: "default" }], []];
    renderStructure("HASH_TABLE", buckets);

    expect(received.HASH_TABLE.controlledBuckets).toEqual(buckets);
  });

  it("maps heap values and their per-node states", () => {
    renderStructure("HEAP", [5, 3], { states: ["default", "comparing"] });

    expect(received.HEAP.controlledHeap).toEqual([5, 3]);
    expect(received.HEAP.controlledStates).toEqual(["default", "comparing"]);
  });

  it("maps the circular queue's front, rear and size indices", () => {
    renderStructure("CIRCULAR_QUEUE", [{ id: "x", value: 1 }], {
      front: 0,
      rear: 2,
      size: 3,
    });

    expect(received.CIRCULAR_QUEUE.controlledFront).toBe(0);
    expect(received.CIRCULAR_QUEUE.controlledRear).toBe(2);
    expect(received.CIRCULAR_QUEUE.controlledSize).toBe(3);
  });

  it("maps binary search array and result", () => {
    renderStructure("BINARY_SEARCH", [{ value: 1 }], { searchResult: "found" });

    expect(received.BINARY_SEARCH.controlledArray).toEqual([{ value: 1 }]);
    expect(received.BINARY_SEARCH.controlledSearchResult).toBe("found");
  });

  it("gives unmapped structures both generic array props", () => {
    const nodes = [{ id: "n1", value: 7 }];
    renderStructure("ARRAY", nodes);

    expect(received.GENERIC.controlledNodes).toEqual(nodes);
    expect(received.GENERIC.controlledArray).toEqual(nodes);
  });

  it("reports an unsupported structure instead of rendering nothing", () => {
    renderStructure("NOT_A_STRUCTURE", []);

    expect(screen.getByText(/Unsupported structure/)).toBeInTheDocument();
  });
});
