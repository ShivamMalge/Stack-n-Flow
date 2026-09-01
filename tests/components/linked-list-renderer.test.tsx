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

/**
 * The three lists differ only in what is drawn between and after the nodes, so
 * they share one renderer. Before that they were three copies, and only the
 * singly list had learned to shorten an id — the other two printed Python's
 * 8-character uuids in full.
 */
describe("LinkedListRenderer variants", () => {
  const arrows = (container: HTMLElement) => container.querySelectorAll("svg.lucide").length;

  it("draws one connector per gap in a singly list", () => {
    const { container } = render(React.createElement(LinkedListRenderer, { nodes }));
    expect(arrows(container)).toBe(nodes.length - 1);
  });

  it("draws both directions between nodes of a doubly list", () => {
    const { container } = render(
      React.createElement(LinkedListRenderer, { nodes, variant: "doubly" }),
    );
    expect(arrows(container)).toBe((nodes.length - 1) * 2);
  });

  it("marks the wrap back to the head on a circular list", () => {
    render(React.createElement(LinkedListRenderer, { nodes, variant: "circular" }));
    expect(screen.getByText("Tail links back to head")).toBeInTheDocument();
  });

  it.each(["singly", "doubly"] as const)("draws no wrap on a %s list", (variant) => {
    render(React.createElement(LinkedListRenderer, { nodes, variant }));
    expect(screen.queryByText("Tail links back to head")).toBeNull();
  });

  // One node points back at itself, which the row cannot show and the bracket
  // would only clutter.
  it("draws no wrap for a circular list of one", () => {
    render(
      React.createElement(LinkedListRenderer, {
        nodes: [{ id: 1, value: 10 }],
        variant: "circular",
      }),
    );
    expect(screen.queryByText("Tail links back to head")).toBeNull();
  });

  it.each(["singly", "doubly", "circular"] as const)("hides a long uuid on a %s list", (variant) => {
    render(
      React.createElement(LinkedListRenderer, {
        nodes: [{ id: "c874f2a1", value: 1 }],
        variant,
      }),
    );
    expect(screen.queryByText(/^id:/)).toBeNull();
  });

  it.each([
    ["singly", "Empty linked list"],
    ["doubly", "Empty doubly linked list"],
    ["circular", "Empty circular linked list"],
  ] as const)("words the %s empty state for its own variant", (variant, label) => {
    render(React.createElement(LinkedListRenderer, { nodes: [], variant }));
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
