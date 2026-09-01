import React from "react";
import { render } from "@testing-library/react";
import GraphVisualizer from "@/components/visualizers/graph-visualizer";

/*
  Cast because the point of these payloads is that they do *not* satisfy the
  component's own node type. Python is not bound by it: `Graph.add_node` takes
  x and y as `Any`, so whatever a notebook passes arrives here unchecked.
*/
const Graph = GraphVisualizer as unknown as React.ComponentType<{
  controlledNodes: unknown[]
  controlledEdges: unknown[]
}>;

/**
 * Pratyaksha's `Graph.add_node(label, x, y)` types both coordinates as `Any`, so
 * a notebook can hand the widget None, a string, or nothing at all. That used to
 * reach the svg as transform="translate(undefined, undefined)", which the browser
 * rejects outright — the node and its edges disappeared, and the only sign of it
 * was a console error no notebook user is going to open.
 */

/*
  Parsed strictly, and every assertion goes through here.

  A lenient `replace(/[^\d.,-]/g, "")` reads "translate(null, null)" as the empty
  string, `Number("")` is 0, and 0 is finite — so the first version of these
  tests passed against the very bug they were written for. React also drops an
  attribute whose value is undefined, and `Number(null)` is 0 as well, which hid
  the missing edge endpoints the same way.
*/
function coordinates(transform: string | null): [number, number] {
  expect(transform).not.toBeNull();
  const match = /^translate\((-?\d+(?:\.\d+)?), ?(-?\d+(?:\.\d+)?)\)$/.exec(transform!);
  expect(match, `not a numeric transform: ${transform}`).not.toBeNull();
  return [Number(match![1]), Number(match![2])];
}

function attribute(element: Element, name: string): number {
  const raw = element.getAttribute(name);
  expect(raw, `${name} is missing`).not.toBeNull();
  expect(raw, `${name} is not a number: ${raw}`).toMatch(/^-?\d+(\.\d+)?$/);
  return Number(raw);
}

const placements = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("g[transform]")).map((g) => coordinates(g.getAttribute("transform")));

const CANVAS = { width: 500, height: 300 };

describe("graph node placement", () => {
  it("keeps the coordinates it is given", () => {
    const { container } = render(
      React.createElement(Graph, {
        controlledNodes: [{ id: "A", label: "A", x: 120, y: 150 }],
        controlledEdges: [],
      }),
    );
    expect(placements(container)).toContainEqual([120, 150]);
  });

  it("places a node that arrived without coordinates", () => {
    const { container } = render(
      React.createElement(Graph, {
        controlledNodes: [
          { id: "A", label: "A", x: 120, y: 150 },
          { id: "B", label: "B" },
        ],
        controlledEdges: [],
      }),
    );

    const placed = placements(container);
    expect(placed).toHaveLength(2);
    expect(placed).toContainEqual([120, 150]);
  });

  it.each([
    ["null", null],
    ["a string", "middle"],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
  ])("survives %s as a coordinate", (_label, value) => {
    const { container } = render(
      React.createElement(Graph, {
        controlledNodes: [{ id: "A", label: "A", x: value, y: value }],
        controlledEdges: [],
      }),
    );
    // coordinates() rejects anything that is not a plain number, so reaching
    // here at all is the assertion; the bounds check is what makes it useful.
    const [x, y] = placements(container)[0];
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x).toBeLessThanOrEqual(CANVAS.width);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(y).toBeLessThanOrEqual(CANVAS.height);
  });

  // An edge drawn from the node's original coordinates would hang in space once
  // the node itself moved to its fallback position.
  it("draws edges from where the nodes ended up", () => {
    const { container } = render(
      React.createElement(Graph, {
        controlledNodes: [
          { id: "A", label: "A", x: 120, y: 150 },
          { id: "B", label: "B" },
        ],
        controlledEdges: [{ id: "A-B", source: "A", target: "B" }],
      }),
    );

    const edge = container.querySelector("line")!;
    const from: [number, number] = [attribute(edge, "x1"), attribute(edge, "y1")];
    const to: [number, number] = [attribute(edge, "x2"), attribute(edge, "y2")];

    const placed = placements(container);
    expect(placed).toContainEqual(from);
    expect(placed).toContainEqual(to);
  });
});
