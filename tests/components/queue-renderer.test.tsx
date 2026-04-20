import React from "react";
import { render, screen } from "@testing-library/react";
import QueueRenderer, {
  type QueueRendererItem,
} from "@/components/visualizers/queue/queue-renderer";
import QueueVisualizer from "@/components/visualizers/queue-visualizer";

const controlledNodes: QueueRendererItem[] = [
  { id: 1, value: 10, highlighted: true },
  { id: 2, value: 20 },
  { id: 3, value: 30 },
];

describe("QueueRenderer", () => {
  it("renders queue items with front and rear markers", () => {
    render(React.createElement(QueueRenderer, { items: controlledNodes }));

    expect(screen.getByText("Front")).toBeInTheDocument();
    expect(screen.getByText("Rear")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  it("renders the empty state when no queue items are provided", () => {
    render(React.createElement(QueueRenderer, { items: [] }));

    expect(screen.getByText("Empty queue")).toBeInTheDocument();
  });

  it("renders the search result banner when present", () => {
    render(React.createElement(QueueRenderer, { items: controlledNodes, searchResult: "Front element: 10" }));

    expect(screen.getByText("Front element: 10")).toBeInTheDocument();
  });
});

describe("QueueVisualizer compatibility", () => {
  it("continues to render controlled nodes through the existing wrapper", () => {
    render(React.createElement(QueueVisualizer, { controlledNodes }));

    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
  });
});
