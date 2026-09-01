import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import HeapRenderer, {
  HeapArrayView,
  parentOf,
  leftOf,
  rightOf,
  type HeapNodeState,
} from "@/components/visualizers/heap/heap-renderer";

const heap = [10, 20, 30, 40, 50];

const canvas = (container: HTMLElement) =>
  container.querySelector('[data-testid="heap-canvas"]') as SVGSVGElement | null;

const circles = (container: HTMLElement) =>
  Array.from(canvas(container)?.querySelectorAll("circle") ?? []);

describe("HeapRenderer", () => {
  it("draws one node per value", () => {
    const { container } = render(React.createElement(HeapRenderer, { heap }));
    expect(circles(container)).toHaveLength(heap.length);
  });

  /*
    A heap of n has n-1 edges: every node but the root hangs off its parent.
    Drawing them from the parent side means a node with one child must produce
    exactly one line, not two.
  */
  it("draws an edge for every node except the root", () => {
    const { container } = render(React.createElement(HeapRenderer, { heap: [1, 2, 3, 4] }));
    expect(canvas(container)!.querySelectorAll("line")).toHaveLength(3);
  });

  it("shows an empty state rather than a blank canvas", () => {
    const { container } = render(React.createElement(HeapRenderer, { heap: [] }));
    expect(screen.getByText("Insert values to build the heap")).toBeInTheDocument();
    expect(canvas(container)).toBeNull();
  });

  it("labels every node with its array index", () => {
    render(React.createElement(HeapRenderer, { heap }));
    for (let i = 0; i < heap.length; i++) {
      expect(screen.getAllByText(`[${i}]`).length).toBeGreaterThan(0);
    }
  });

  it("colours a node by its state", () => {
    const states: HeapNodeState[] = ["comparing", "default", "default", "default", "default"];
    const { container } = render(React.createElement(HeapRenderer, { heap, states }));
    const fills = circles(container).map((c) => c.getAttribute("fill"));
    expect(fills[0]).toBe("hsl(var(--node-comparing-fill))");
    expect(fills[1]).toBe("hsl(var(--node-default-fill))");
  });

  // Python sends no states when it is not mid-animation, and a short list is
  // what an in-flight frame looks like before the tail is filled in.
  it("falls back to the neutral state for nodes it has no state for", () => {
    const { container } = render(
      React.createElement(HeapRenderer, { heap, states: ["comparing"] as HeapNodeState[] }),
    );
    const fills = circles(container).map((c) => c.getAttribute("fill"));
    expect(fills.slice(1).every((f) => f === "hsl(var(--node-default-fill))")).toBe(true);
  });
});

/**
 * The web page carries its own Array Representation card in the left column. A
 * notebook has no left column, so without this the storage the whole structure
 * is about would never appear there.
 */
describe("HeapRenderer array strip", () => {
  it("draws the array by default", () => {
    render(React.createElement(HeapRenderer, { heap }));
    expect(screen.getByText("Stored as a level-order array")).toBeInTheDocument();
    expect(screen.getByText("Heapified")).toBeInTheDocument();
  });

  it("leaves it out when the page supplies its own", () => {
    render(React.createElement(HeapRenderer, { heap, showArray: false }));
    expect(screen.queryByText("Stored as a level-order array")).toBeNull();
  });

  it("leaves it out for an empty heap", () => {
    render(React.createElement(HeapRenderer, { heap: [] }));
    expect(screen.queryByText("Stored as a level-order array")).toBeNull();
  });
});

describe("HeapRenderer view controls", () => {
  const style = (container: HTMLElement) => canvas(container)!.getAttribute("style") ?? "";
  const viewBox = (container: HTMLElement) => canvas(container)!.getAttribute("viewBox")!;

  it("zooms in and back out", () => {
    const { container } = render(React.createElement(HeapRenderer, { heap }));
    const before = style(container);
    fireEvent.click(screen.getByText("Zoom In"));
    expect(style(container)).not.toBe(before);
    fireEvent.click(screen.getByText("Reset View"));
    expect(style(container)).toBe(before);
  });

  // pan.y was already interpolated into the viewBox but nothing ever set it, so
  // vertical clipping had no control at all.
  it("pans vertically as well as horizontally", () => {
    const { container } = render(React.createElement(HeapRenderer, { heap }));
    const [x0, y0] = viewBox(container).split(" ").map(Number);
    fireEvent.click(screen.getByText("Pan Down"));
    expect(viewBox(container).split(" ").map(Number)[1]).toBe(y0 + 40);
    fireEvent.click(screen.getByText("Pan Right"));
    expect(viewBox(container).split(" ").map(Number)[0]).toBe(x0 + 40);
  });

  it("will not zoom past its limits", () => {
    const { container } = render(React.createElement(HeapRenderer, { heap }));
    for (let i = 0; i < 20; i++) fireEvent.click(screen.getByText("Zoom In"));
    expect(style(container)).toContain("scale(4)");
    for (let i = 0; i < 40; i++) fireEvent.click(screen.getByText("Zoom Out"));
    expect(style(container)).toContain("scale(0.2)");
  });
});

describe("heap index arithmetic", () => {
  it.each([
    [1, 0],
    [2, 0],
    [3, 1],
    [4, 1],
  ])("parent of %i is %i", (child, parent) => {
    expect(parentOf(child)).toBe(parent);
  });

  it("names children the parent claims back", () => {
    for (let i = 0; i < 10; i++) {
      expect(parentOf(leftOf(i))).toBe(i);
      expect(parentOf(rightOf(i))).toBe(i);
    }
  });
});

describe("HeapArrayView", () => {
  it("draws a cell per value with its index", () => {
    render(React.createElement(HeapArrayView, { heap: [7, 8], states: [] }));
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("[1]")).toBeInTheDocument();
  });

  it("colours a cell by its state", () => {
    const { container } = render(
      React.createElement(HeapArrayView, {
        heap: [7, 8],
        states: ["swapping", "default"] as HeapNodeState[],
      }),
    );
    const cells = Array.from(container.querySelectorAll("div.border"));
    expect(cells[0].className).toContain("yellow");
    expect(cells[1].className).not.toContain("yellow");
  });
});
