import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TreeRenderer, {
  type TreeRendererNode,
} from "@/components/visualizers/tree/tree-renderer";

const leaf = (id: number, value: number): TreeRendererNode => ({ id, value, left: null, right: null });

/**
 *        10
 *       /  \
 *      5    15
 */
const balanced: TreeRendererNode = {
  id: 1,
  value: 10,
  left: leaf(2, 5),
  right: leaf(3, 15),
};

/**
 *   30
 *   /
 *  20
 *  /
 * 10       — balance factor +2 at the root, so it is unbalanced.
 *
 * The values avoid 0, 1 and 2 so a node's value can never be mistaken for the
 * balance factor printed beneath it.
 */
const leftHeavy: TreeRendererNode = {
  id: 1,
  value: 30,
  left: { id: 2, value: 20, left: leaf(3, 10), right: null },
  right: null,
};

/*
  Scoped to the tree's own svg. The toolbar's lucide icons are svgs full of
  circles and lines too, so a bare `querySelectorAll("circle")` counts zoom
  buttons as tree nodes — which is what made the first version of the drag test
  pass a magnifier icon to fireEvent and conclude that drag did nothing.
*/
const canvas = (container: HTMLElement) =>
  container.querySelector('[data-testid="tree-canvas"]') as SVGSVGElement | null;

const circles = (container: HTMLElement) =>
  Array.from(canvas(container)?.querySelectorAll("circle") ?? []);

describe("TreeRenderer", () => {
  it("draws every node", () => {
    render(React.createElement(TreeRenderer, { root: balanced }));
    for (const value of [10, 5, 15]) {
      expect(screen.getByText(String(value))).toBeInTheDocument();
    }
  });

  it("draws one edge per child, not one per node", () => {
    const { container } = render(React.createElement(TreeRenderer, { root: balanced }));
    expect(circles(container)).toHaveLength(3);
    expect(canvas(container)!.querySelectorAll("line")).toHaveLength(2);
  });

  it("shows an empty state rather than an empty svg", () => {
    const { container } = render(React.createElement(TreeRenderer, { root: null }));
    expect(screen.getByText("Empty tree")).toBeInTheDocument();
    expect(canvas(container)).toBeNull();
  });

  /*
    The viewBox used to be guessed from a different model than the layout, so
    nodes past the guessed extent were clipped with nothing to scroll to. It has
    to enclose the layout no matter how lopsided the tree is.
  */
  it("sizes the viewBox to enclose every node it drew", () => {
    const { container } = render(React.createElement(TreeRenderer, { root: leftHeavy }));
    const svg = canvas(container)!;
    const [, , width, height] = svg.getAttribute("viewBox")!.split(" ").map(Number);

    for (const circle of circles(container)) {
      const cx = Number(circle.getAttribute("cx"));
      const cy = Number(circle.getAttribute("cy"));
      const r = Number(circle.getAttribute("r"));
      expect(cx - r).toBeGreaterThanOrEqual(0);
      expect(cy - r).toBeGreaterThanOrEqual(0);
      expect(cx + r).toBeLessThanOrEqual(width);
      expect(cy + r).toBeLessThanOrEqual(height);
    }
  });

  it("keeps the in-order layout free of overlapping nodes", () => {
    const { container } = render(React.createElement(TreeRenderer, { root: balanced }));
    const centres = Array.from(circles(container)).map((c) => [
      Number(c.getAttribute("cx")),
      Number(c.getAttribute("cy")),
    ]);
    const seen = new Set(centres.map(([x, y]) => `${x},${y}`));
    expect(seen.size).toBe(centres.length);
  });

  it("marks the node the algorithm is looking at", () => {
    const highlighted = { ...balanced, left: { ...leaf(2, 5), highlighted: true } };
    const { container } = render(React.createElement(TreeRenderer, { root: highlighted }));
    const marked = Array.from(circles(container)).filter((c) => c.getAttribute("class")?.includes("amber"));
    expect(marked).toHaveLength(1);
  });
});

describe("TreeRenderer, avl variant", () => {
  it("prints a balance factor inside every node", () => {
    render(React.createElement(TreeRenderer, { root: balanced, variant: "avl" }));
    // A balanced three-node tree: 0 at the root and 0 at each leaf.
    expect(screen.getAllByText("0")).toHaveLength(3);
  });

  it("computes the balance factor when the caller does not supply one", () => {
    render(React.createElement(TreeRenderer, { root: leftHeavy, variant: "avl" }));
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  // Python owns the AVL's bookkeeping, so a supplied factor has to win over
  // anything the renderer would infer from the shape it was handed.
  it("prefers a supplied balance factor over the computed one", () => {
    render(
      React.createElement(TreeRenderer, {
        root: { ...leaf(1, 10), balanceFactor: -1 },
        variant: "avl",
      }),
    );
    expect(screen.getByText("-1")).toBeInTheDocument();
    expect(screen.queryByText("0")).toBeNull();
  });

  it("flags a node whose subtrees differ by more than one", () => {
    const { container } = render(React.createElement(TreeRenderer, { root: leftHeavy, variant: "avl" }));
    const flagged = Array.from(circles(container)).filter((c) => c.getAttribute("class")?.includes("orange"));
    expect(flagged).toHaveLength(1);
  });

  it("keeps the balance factor off a plain binary search tree", () => {
    render(React.createElement(TreeRenderer, { root: leftHeavy }));
    expect(screen.queryByText("2")).toBeNull();
  });

  it("shows the state legend only for the avl variant", () => {
    const { rerender } = render(React.createElement(TreeRenderer, { root: balanced, variant: "avl" }));
    expect(screen.getByText("Unbalanced")).toBeInTheDocument();
    expect(screen.getByText("Rotating")).toBeInTheDocument();
    rerender(React.createElement(TreeRenderer, { root: balanced }));
    expect(screen.queryByText("Unbalanced")).toBeNull();
  });
});

/**
 * Zoom, pan and drag are *view* state, not structure state, which is why they
 * belong to the renderer and keep working in a notebook where Python owns the
 * data. These assert they are wired at all — an earlier tree wrote node
 * positions on drag and then never read them, so dragging did nothing.
 */
describe("TreeRenderer view controls", () => {
  const transform = (container: HTMLElement) => canvas(container)!.getAttribute("style") ?? "";

  it("zooms in and back out", () => {
    const { container } = render(React.createElement(TreeRenderer, { root: balanced }));
    const before = transform(container);
    fireEvent.click(screen.getByText("Zoom In"));
    expect(transform(container)).not.toBe(before);
    fireEvent.click(screen.getByText("Reset View"));
    expect(transform(container)).toBe(before);
  });

  it("pans vertically as well as horizontally", () => {
    const { container } = render(React.createElement(TreeRenderer, { root: balanced }));
    fireEvent.click(screen.getByText("Pan Down"));
    expect(transform(container)).toContain("translate(0px, 20px)");
    fireEvent.click(screen.getByText("Pan Right"));
    expect(transform(container)).toContain("translate(20px, 20px)");
  });

  it("actually moves a dragged node", () => {
    const { container } = render(React.createElement(TreeRenderer, { root: balanced }));
    const node = circles(container)[0];
    const startX = Number(node.getAttribute("cx"));

    fireEvent.mouseDown(node, { clientX: 100, clientY: 100 });
    fireEvent(document, new MouseEvent("mousemove", { clientX: 140, clientY: 100 }));
    fireEvent(document, new MouseEvent("mouseup"));

    expect(Number(circles(container)[0].getAttribute("cx"))).toBe(startX + 40);
  });

  it("puts dragged nodes back where they belong on reset", () => {
    const { container } = render(React.createElement(TreeRenderer, { root: balanced }));
    const startX = Number(circles(container)[0].getAttribute("cx"));

    fireEvent.mouseDown(circles(container)[0], { clientX: 0, clientY: 0 });
    fireEvent(document, new MouseEvent("mousemove", { clientX: 60, clientY: 0 }));
    fireEvent(document, new MouseEvent("mouseup"));
    expect(Number(circles(container)[0].getAttribute("cx"))).not.toBe(startX);

    fireEvent.click(screen.getByText("Reset View"));
    expect(Number(circles(container)[0].getAttribute("cx"))).toBe(startX);
  });

  // Otherwise a drag fights the controller's animation for the same node.
  it("refuses to drag while the controller is animating", () => {
    const { container } = render(
      React.createElement(TreeRenderer, { root: balanced, interactionsDisabled: true }),
    );
    const startX = Number(circles(container)[0].getAttribute("cx"));

    fireEvent.mouseDown(circles(container)[0], { clientX: 0, clientY: 0 });
    fireEvent(document, new MouseEvent("mousemove", { clientX: 60, clientY: 0 }));
    fireEvent(document, new MouseEvent("mouseup"));

    expect(Number(circles(container)[0].getAttribute("cx"))).toBe(startX);
  });
});
