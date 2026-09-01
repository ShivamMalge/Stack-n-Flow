import React from "react";
import { render, screen } from "@testing-library/react";
import ArrayRenderer, {
  type ArrayRendererItem,
} from "@/components/visualizers/array/array-renderer";

const items: ArrayRendererItem[] = [
  { id: 1, value: 10 },
  { id: 2, value: 20, highlighted: true },
  { id: 3, value: 30 },
];

const cellFor = (value: string) =>
  screen.getByText(value).parentElement as HTMLElement;

describe("ArrayRenderer", () => {
  it("draws every element in order", () => {
    render(React.createElement(ArrayRenderer, { items }));
    for (const value of [10, 20, 30]) {
      expect(screen.getByText(String(value))).toBeInTheDocument();
    }
  });

  // The index is what distinguishes an array from a list, so it is the
  // position that gets the label, not the id.
  it("labels each element with its index", () => {
    render(React.createElement(ArrayRenderer, { items }));
    for (const index of [0, 1, 2]) {
      expect(screen.getByText(`[${index}]`)).toBeInTheDocument();
    }
  });

  it("renumbers the labels by position, not by id", () => {
    render(React.createElement(ArrayRenderer, { items: [{ id: 99, value: 5 }] }));
    expect(screen.getByText("[0]")).toBeInTheDocument();
    expect(screen.queryByText("[99]")).toBeNull();
  });

  it("shows an empty state rather than an empty box", () => {
    render(React.createElement(ArrayRenderer, { items: [] }));
    expect(screen.getByText("Empty array")).toBeInTheDocument();
  });

  it("lets the caller word the empty state", () => {
    render(React.createElement(ArrayRenderer, { items: [], emptyLabel: "No elements yet" }));
    expect(screen.getByText("No elements yet")).toBeInTheDocument();
  });

  it("marks the highlighted element and leaves the others alone", () => {
    render(React.createElement(ArrayRenderer, { items }));
    expect(cellFor("20").className).toMatch(/amber/);
    expect(cellFor("10").className).not.toMatch(/amber/);
  });

  /*
    Python can hand us a whole array at once where the web app builds it up one
    insert at a time, so the cells have to give way before the row wraps past
    the scroller.
  */
  it("shrinks the cells as the array grows", () => {
    const sized = (count: number) => {
      const many = Array.from({ length: count }, (_, i) => ({ id: i, value: i }));
      const { unmount } = render(React.createElement(ArrayRenderer, { items: many }));
      const className = cellFor("0").className;
      unmount();
      return className;
    };
    expect(sized(5)).toContain("w-14");
    expect(sized(20)).toContain("w-11");
    expect(sized(40)).toContain("w-9");
  });

  it("renders a search result when given one", () => {
    render(React.createElement(ArrayRenderer, { items, searchResult: "Element found at index 1" }));
    expect(screen.getByText("Element found at index 1")).toBeInTheDocument();
  });

  // mini is the /learn embed, which supplies its own heading.
  it("drops the card heading in mini mode", () => {
    const { rerender } = render(React.createElement(ArrayRenderer, { items }));
    expect(screen.getByText("Visualization")).toBeInTheDocument();
    rerender(React.createElement(ArrayRenderer, { items, mini: true }));
    expect(screen.queryByText("Visualization")).toBeNull();
  });

  it("accepts string values, which Python can send", () => {
    render(React.createElement(ArrayRenderer, { items: [{ id: "a", value: "hello" }] }));
    expect(screen.getByText("hello")).toBeInTheDocument();
  });
});
