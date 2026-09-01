import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import GraphRenderer, {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  NODE_RADIUS,
  type GraphRendererNode,
  type GraphRendererEdge,
} from "@/components/visualizers/graph/graph-renderer";

const nodes: GraphRendererNode[] = [
  { id: "A", label: "A", x: 100, y: 100 },
  { id: "B", label: "B", x: 300, y: 200 },
];

const edges: GraphRendererEdge[] = [{ id: "A-B", source: "A", target: "B" }];

const canvas = (container: HTMLElement) =>
  container.querySelector('[data-testid="graph-canvas"]') as SVGSVGElement | null;

const groups = (container: HTMLElement) =>
  Array.from(canvas(container)?.querySelectorAll("g[transform]") ?? []);

const at = (g: Element): [number, number] => {
  const m = /^translate\((-?[\d.]+), (-?[\d.]+)\)$/.exec(g.getAttribute("transform")!)!;
  return [Number(m[1]), Number(m[2])];
};

describe("GraphRenderer", () => {
  it("draws every node and edge", () => {
    const { container } = render(React.createElement(GraphRenderer, { nodes, edges }));
    expect(groups(container)).toHaveLength(2);
    expect(canvas(container)!.querySelectorAll("line")).toHaveLength(1);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("shows an empty state rather than a blank canvas", () => {
    const { container } = render(React.createElement(GraphRenderer, { nodes: [], edges: [] }));
    expect(screen.getByText("Empty graph")).toBeInTheDocument();
    expect(canvas(container)).toBeNull();
  });

  // An edge whose endpoint was never added would otherwise draw to NaN.
  it("skips an edge that names a node it does not have", () => {
    const { container } = render(
      React.createElement(GraphRenderer, {
        nodes: [nodes[0]],
        edges: [{ id: "A-Z", source: "A", target: "Z" }],
      }),
    );
    expect(canvas(container)!.querySelectorAll("line")).toHaveLength(0);
  });

  it("marks the start node", () => {
    const { container } = render(
      React.createElement(GraphRenderer, { nodes, edges, selectedNode: "B" }),
    );
    const marked = Array.from(canvas(container)!.querySelectorAll("circle")).filter((c) =>
      c.getAttribute("class")?.includes("stroke-blue-500"),
    );
    expect(marked).toHaveLength(1);
  });

  it("shows the frame narration when it is given one", () => {
    render(React.createElement(GraphRenderer, { nodes, edges, description: "Visiting node A" }));
    expect(screen.getByText("Visiting node A")).toBeInTheDocument();
  });
});

/**
 * Clicking a node picks the algorithm's start node, which only makes sense when
 * something local can act on it. A notebook is driven from Python, so the bridge
 * passes no handler and the affordance has to disappear with it — otherwise the
 * cursor invites a click that does nothing.
 */
describe("GraphRenderer node clicks", () => {
  it("calls back and shows a pointer when a handler is given", () => {
    const onNodeClick = vi.fn();
    const { container } = render(React.createElement(GraphRenderer, { nodes, edges, onNodeClick }));
    const node = groups(container)[0];
    expect(node.getAttribute("class")).toContain("cursor-pointer");
    fireEvent.click(node);
    expect(onNodeClick).toHaveBeenCalledWith("A");
  });

  it("offers no pointer when there is no handler", () => {
    const { container } = render(React.createElement(GraphRenderer, { nodes, edges }));
    expect(groups(container)[0].getAttribute("class")).not.toContain("cursor-pointer");
  });
});

/**
 * Drag used to write straight back into the controller's node list, so in a
 * notebook — where Python owns that list — grabbing a node did nothing at all.
 * The positions are a view overlay now, which works either way.
 */
describe("GraphRenderer drag", () => {
  const drag = (node: Element, dx: number, dy: number) => {
    fireEvent.mouseDown(node, { clientX: 0, clientY: 0 });
    fireEvent(document, new MouseEvent("mousemove", { clientX: dx, clientY: dy }));
    fireEvent(document, new MouseEvent("mouseup"));
  };

  it("moves a node without being handed a setter", () => {
    const { container } = render(React.createElement(GraphRenderer, { nodes, edges }));
    drag(groups(container)[0], 40, 20);
    expect(at(groups(container)[0])).toEqual([140, 120]);
  });

  it("takes the edge endpoint with it", () => {
    const { container } = render(React.createElement(GraphRenderer, { nodes, edges }));
    drag(groups(container)[0], 40, 20);
    const line = canvas(container)!.querySelector("line")!;
    expect([Number(line.getAttribute("x1")), Number(line.getAttribute("y1"))]).toEqual([140, 120]);
  });

  // This view has no pan and no reset, so a node dragged past the edge would be
  // gone for good.
  it("keeps a node on the canvas however far it is dragged", () => {
    const { container } = render(React.createElement(GraphRenderer, { nodes, edges }));
    drag(groups(container)[0], -5000, -5000);
    expect(at(groups(container)[0])).toEqual([NODE_RADIUS, NODE_RADIUS]);

    drag(groups(container)[0], 5000, 5000);
    expect(at(groups(container)[0])).toEqual([
      CANVAS_WIDTH - NODE_RADIUS,
      CANVAS_HEIGHT - NODE_RADIUS,
    ]);
  });

  it("refuses to drag while an animation is playing", () => {
    const { container } = render(
      React.createElement(GraphRenderer, { nodes, edges, interactionsDisabled: true }),
    );
    drag(groups(container)[0], 40, 20);
    expect(at(groups(container)[0])).toEqual([100, 100]);
  });
});
