import React from "react";
import { render, screen } from "@testing-library/react";
import LinkedListRenderer, {
  type LinkedListRendererNode,
} from "@/components/visualizers/linked-list/linked-list-renderer";

const nodes: LinkedListRendererNode[] = [
  { id: 1, value: 10 },
  { id: 2, value: 20, highlighted: true },
  { id: 3, value: 30 },
];

describe("LinkedListRenderer", () => {
  it("draws every node in order", () => {
    render(React.createElement(LinkedListRenderer, { nodes }));
    for (const value of [10, 20, 30]) {
      expect(screen.getByText(String(value))).toBeInTheDocument();
    }
  });

  it("shows an empty state rather than an empty box", () => {
    render(React.createElement(LinkedListRenderer, { nodes: [] }));
    expect(screen.getByText("Empty linked list")).toBeInTheDocument();
  });

  it("lets the caller word the empty state, for the list variants", () => {
    render(React.createElement(LinkedListRenderer, { nodes: [], emptyLabel: "No nodes yet" }));
    expect(screen.getByText("No nodes yet")).toBeInTheDocument();
  });

  it("shows a short id, as the web app uses", () => {
    render(React.createElement(LinkedListRenderer, { nodes: [{ id: 7, value: 1 }] }));
    expect(screen.getByText("id: 7")).toBeInTheDocument();
  });

  // Python sends 8-character UUIDs, which truncate into meaningless noise.
  it("hides a long uuid instead of truncating it", () => {
    render(React.createElement(LinkedListRenderer, { nodes: [{ id: "c874f2a1", value: 1 }] }));
    expect(screen.queryByText(/^id:/)).toBeNull();
  });

  it("renders a search result when given one", () => {
    render(React.createElement(LinkedListRenderer, { nodes, searchResult: "Element found" }));
    expect(screen.getByText("Element found")).toBeInTheDocument();
  });

  // mini is the /learn embed, which supplies its own heading.
  it("drops the card heading in mini mode", () => {
    const { rerender } = render(React.createElement(LinkedListRenderer, { nodes }));
    expect(screen.getByText("Visualization")).toBeInTheDocument();
    rerender(React.createElement(LinkedListRenderer, { nodes, mini: true }));
    expect(screen.queryByText("Visualization")).toBeNull();
  });

  it("accepts string values, which Python can send", () => {
    render(React.createElement(LinkedListRenderer, { nodes: [{ id: "a", value: "hello" }] }));
    expect(screen.getByText("hello")).toBeInTheDocument();
  });
});
