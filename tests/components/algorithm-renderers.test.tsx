import React from "react";
import { render, screen } from "@testing-library/react";
import BinarySearchRenderer, {
  type BinarySearchCell,
} from "@/components/visualizers/algorithms/binary-search/binary-search-renderer";
import QuickSortRenderer, {
  barHeight,
  MAX_BAR_HEIGHT,
  type QuickSortBar,
} from "@/components/visualizers/algorithms/quick-sort/quick-sort-renderer";

const cells = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("div.rounded-md.border-2"));

const array: BinarySearchCell[] = [
  { value: 10, highlighted: true, isLow: true },
  { value: 20, highlighted: true, isMid: true },
  { value: 30, highlighted: true, isHigh: true },
  { value: 40 },
];

describe("BinarySearchRenderer", () => {
  it("draws a cell per element, indexed by position", () => {
    const { container } = render(React.createElement(BinarySearchRenderer, { array }));
    expect(cells(container)).toHaveLength(4);
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  it("shows an empty state rather than an empty row", () => {
    render(React.createElement(BinarySearchRenderer, { array: [] }));
    expect(screen.getByText("Add elements to create an array")).toBeInTheDocument();
  });

  /*
    The states are ordered by intent, not by whichever class Tailwind emits
    last: a target inside the live range is the target, and the midpoint of the
    range is the midpoint. Emitting one class is what makes that decidable.
  */
  it("lets the target outrank the range it sits in", () => {
    const { container } = render(
      React.createElement(BinarySearchRenderer, {
        array: [{ value: 10, highlighted: true, isTarget: true }],
      }),
    );
    expect(cells(container)[0].className).toMatch(/emerald/);
    expect(cells(container)[0].className).not.toMatch(/amber/);
  });

  it("lets the midpoint outrank the range it sits in", () => {
    const { container } = render(
      React.createElement(BinarySearchRenderer, {
        array: [{ value: 10, highlighted: true, isMid: true }],
      }),
    );
    expect(cells(container)[0].className).toMatch(/purple/);
    expect(cells(container)[0].className).not.toMatch(/amber/);
  });

  // The range pointers are an edge on the cell, not a state it is in, so they
  // have to survive alongside whatever state it has.
  it("draws the low and high pointers as edges", () => {
    const { container } = render(React.createElement(BinarySearchRenderer, { array }));
    expect(cells(container)[0].className).toContain("border-l-green-500");
    expect(cells(container)[2].className).toContain("border-r-green-500");
    expect(cells(container)[3].className).not.toContain("border-l-green-500");
  });

  it("shows the narration and the result when it is given them", () => {
    render(
      React.createElement(BinarySearchRenderer, {
        array,
        description: "Checking index 1",
        searchResult: "Found at index 1",
      }),
    );
    expect(screen.getByText("Checking index 1")).toBeInTheDocument();
    expect(screen.getByText("Found at index 1")).toBeInTheDocument();
  });

  it("drops the card heading in mini mode", () => {
    const { rerender } = render(React.createElement(BinarySearchRenderer, { array }));
    expect(screen.getByText("Visualization")).toBeInTheDocument();
    rerender(React.createElement(BinarySearchRenderer, { array, mini: true }));
    expect(screen.queryByText("Visualization")).toBeNull();
  });
});

const bars = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("div[style*='height']")) as HTMLElement[];

const heightOf = (el: HTMLElement) => Number.parseFloat(el.style.height);

describe("QuickSortRenderer", () => {
  const values: QuickSortBar[] = [{ value: 30 }, { value: 10 }, { value: 20 }];

  it("draws a bar per value", () => {
    const { container } = render(React.createElement(QuickSortRenderer, { array: values }));
    expect(bars(container)).toHaveLength(3);
  });

  it("shows an empty state rather than an empty plate", () => {
    render(React.createElement(QuickSortRenderer, { array: [] }));
    expect(screen.getByText("Add elements to create an array")).toBeInTheDocument();
  });

  it("orders the bar heights the way the values are ordered", () => {
    const { container } = render(React.createElement(QuickSortRenderer, { array: values }));
    const [a, b, c] = bars(container).map(heightOf);
    expect(a).toBeGreaterThan(c);
    expect(c).toBeGreaterThan(b);
  });

  it("colours a bar by the state that outranks the others", () => {
    const { container } = render(
      React.createElement(QuickSortRenderer, {
        array: [
          { value: 10, isPivot: true, highlighted: true },
          { value: 20, isSorted: true },
        ],
      }),
    );
    expect(bars(container)[0].className).toMatch(/purple/);
    expect(bars(container)[1].className).toMatch(/emerald/);
  });

  it("shows the narration when it is given one", () => {
    render(
      React.createElement(QuickSortRenderer, { array: values, description: "Partitioning" }),
    );
    expect(screen.getByText("Partitioning")).toBeInTheDocument();
  });
});

/**
 * The old formula was `min(value * 2 + 20, 180)`, which assumed values roughly
 * 0-80. Every value at or above 80 drew the same full-height bar, so a notebook
 * sorting anything larger got a flat row of identical bars — the one thing a bar
 * chart must not do. Heights are relative to the tallest value now.
 */
describe("barHeight", () => {
  it("gives the tallest value the full plate", () => {
    expect(barHeight(50, 50)).toBe(MAX_BAR_HEIGHT);
  });

  it("keeps every bar visible, however small", () => {
    expect(barHeight(0, 500)).toBe(20);
    expect(barHeight(1, 1_000_000)).toBeGreaterThanOrEqual(20);
  });

  it("separates large values that the old cap flattened together", () => {
    expect(barHeight(100, 900)).toBeLessThan(barHeight(900, 900));
    expect(barHeight(5_000, 10_000)).toBeLessThan(barHeight(10_000, 10_000));
  });

  it("stays inside the plate", () => {
    for (const [value, max] of [[1, 1], [700, 700], [10, 700], [900, 700]]) {
      expect(barHeight(value, max)).toBeLessThanOrEqual(MAX_BAR_HEIGHT + 1e-9);
    }
  });

  // Python is not bound by the web form's input validation.
  it.each([
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
  ])("survives %s as a value", (_label, value) => {
    expect(Number.isFinite(barHeight(value, 100))).toBe(true);
  });

  it("survives an all-zero array, where there is no tallest", () => {
    expect(Number.isFinite(barHeight(0, 0))).toBe(true);
  });

  it("does not draw a negative value below the baseline", () => {
    expect(barHeight(-50, 100)).toBe(20);
  });
});
