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
    render(React.createElement(StackVisualizer, { controlledNodes }));

    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });
});
