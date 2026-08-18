import React from "react";
import { render, screen } from "@testing-library/react";
import StackRenderer, {
  type StackRendererItem,
} from "@/components/visualizers/stack/stack-renderer";
import StackVisualizer from "@/components/visualizers/stack-visualizer";

const controlledNodes: StackRendererItem[] = [
  { id: 1, value: 30 },
  { id: 2, value: 20, highlighted: true },
  { id: 3, value: 10 },
];

describe("StackRenderer", () => {
  it("renders stack items from external state with the top marker", () => {
    render(React.createElement(StackRenderer, { items: controlledNodes }));

    expect(screen.getByText("Top")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("renders the empty state when no stack items are provided", () => {
    render(React.createElement(StackRenderer, { items: [] }));

    expect(screen.getByText("Empty stack")).toBeInTheDocument();
  });

  it("renders the search result banner when present", () => {
    render(React.createElement(StackRenderer, { items: controlledNodes, searchResult: "Top element: 30" }));

    expect(screen.getByText("Top element: 30")).toBeInTheDocument();
  });
});

describe("StackVisualizer compatibility", () => {
  it("continues to render controlled nodes through the existing wrapper", () => {
    render(<StackVisualizer controlledNodes={controlledNodes} />);

    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });
});

describe("StackRenderer sizing", () => {
  /** The cell div carrying the height class, found via its value text. */
  const cellFor = (value: string) =>
    screen.getByText(value).parentElement as HTMLElement;

  const stackOf = (count: number): StackRendererItem[] =>
    Array.from({ length: count }, (_, i) => ({ id: i, value: (i + 1) * 10 }));

  it("uses full-size cells for a short stack", () => {
    render(React.createElement(StackRenderer, { items: stackOf(6) }));
    expect(cellFor("10").className).toContain("h-10");
  });

  it("shrinks cells once the stack outgrows the plate", () => {
    // A twelve-item stack at the old fixed 48px cell showed only nine: the
    // rest sat below the fold of a max-h-[60vh] scroller with no affordance,
    // so the stack looked bottomless.
    render(React.createElement(StackRenderer, { items: stackOf(12) }));
    const cls = cellFor("10").className;
    expect(cls).toContain("h-8");
    expect(cls).not.toContain("h-10");
  });

  it("shrinks again for a very tall stack", () => {
    render(React.createElement(StackRenderer, { items: stackOf(18) }));
    expect(cellFor("10").className).toContain("h-7");
  });

  it("keeps every item rendered at any height", () => {
    render(React.createElement(StackRenderer, { items: stackOf(20) }));
    for (let i = 1; i <= 20; i++) {
      expect(screen.getByText(String(i * 10))).toBeInTheDocument();
    }
  });

  it("tightens the gap between cells as well as their height", () => {
    const { container } = render(
      React.createElement(StackRenderer, { items: stackOf(12) }),
    );
    expect(container.querySelector(".space-y-1")).toBeTruthy();
    expect(container.querySelector(".space-y-2")).toBeNull();
  });
});
