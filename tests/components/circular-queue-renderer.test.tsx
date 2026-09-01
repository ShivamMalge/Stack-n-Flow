import React from "react";
import { render, screen } from "@testing-library/react";
import CircularQueueRenderer, {
  type CircularQueueSlot,
} from "@/components/visualizers/circular-queue/circular-queue-renderer";

/** -1 is the empty marker the controller fills unused slots with. */
const empty: CircularQueueSlot = { id: -1, value: "" };

const slots: (CircularQueueSlot | undefined)[] = [
  empty,
  { id: 1, value: 10 },
  { id: 2, value: 20 },
  empty,
  empty,
];

const cells = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("div.rounded-md.border-2"));

describe("CircularQueueRenderer", () => {
  it("draws every slot, occupied or not", () => {
    const { container } = render(
      React.createElement(CircularQueueRenderer, { slots, front: 1, rear: 2, size: 2 }),
    );
    expect(cells(container)).toHaveLength(5);
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("indexes every slot by position", () => {
    render(React.createElement(CircularQueueRenderer, { slots, front: 1, rear: 2, size: 2 }));
    for (let i = 0; i < 5; i++) {
      expect(screen.getByText(`[${i}]`)).toBeInTheDocument();
    }
  });

  it("names the fixed capacity", () => {
    render(React.createElement(CircularQueueRenderer, { slots, capacity: 5 }));
    expect(screen.getByText("Fixed Size Array (5)")).toBeInTheDocument();
  });

  /*
    A circular queue that has wrapped has rear *behind* front, which is the
    whole point of the structure and the thing a picture has to get right.
  */
  it("marks front and rear even when the queue has wrapped", () => {
    render(
      React.createElement(CircularQueueRenderer, {
        slots: [{ id: 1, value: 30 }, empty, empty, { id: 2, value: 10 }, { id: 3, value: 20 }],
        front: 3,
        rear: 0,
        size: 3,
      }),
    );
    expect(screen.getByText("Front")).toBeInTheDocument();
    expect(screen.getByText("Rear")).toBeInTheDocument();
  });

  // With nothing in it there is no first or last element to point at, and the
  // indices are stale rather than meaningful.
  it("marks neither front nor rear while the queue is empty", () => {
    render(
      React.createElement(CircularQueueRenderer, {
        slots: [empty, empty, empty],
        front: 0,
        rear: 0,
        size: 0,
      }),
    );
    expect(screen.queryByText("Front")).toBeNull();
    expect(screen.queryByText("Rear")).toBeNull();
  });

  it("draws an empty slot as a dashed outline", () => {
    const { container } = render(
      React.createElement(CircularQueueRenderer, { slots, front: 1, rear: 2, size: 2 }),
    );
    expect(cells(container)[0].className).toContain("border-dashed");
    expect(cells(container)[1].className).not.toContain("border-dashed");
  });

  it("colours a highlighted slot from the shared state map", () => {
    const { container } = render(
      React.createElement(CircularQueueRenderer, {
        slots: [{ id: 1, value: 10, highlighted: true }, empty],
        front: 0,
        rear: 0,
        size: 1,
      }),
    );
    // amber is what `comparing` resolves to everywhere else in the app; this
    // view used to hand-write its own yellow.
    expect(cells(container)[0].className).toMatch(/amber/);
  });

  it("counts the occupied slots when it is not told the size", () => {
    render(React.createElement(CircularQueueRenderer, { slots, front: 1, rear: 2 }));
    expect(screen.getByText("Front")).toBeInTheDocument();
  });

  // Python sends 8-character uuids, which say nothing once truncated.
  it("hides a long uuid but keeps a short id", () => {
    const { rerender } = render(
      React.createElement(CircularQueueRenderer, { slots: [{ id: 7, value: 1 }], front: 0, rear: 0, size: 1 }),
    );
    expect(screen.getByText("id:7")).toBeInTheDocument();
    rerender(
      React.createElement(CircularQueueRenderer, {
        slots: [{ id: "c874f2a1", value: 1 }],
        front: 0,
        rear: 0,
        size: 1,
      }),
    );
    expect(screen.queryByText(/^id:/)).toBeNull();
  });

  it("shows an empty state when there is no array at all", () => {
    render(React.createElement(CircularQueueRenderer, { slots: [] }));
    expect(screen.getByText("Empty circular queue")).toBeInTheDocument();
  });

  // The capacity is fixed even before anything is enqueued, so the slots have
  // to be drawn whether or not the payload filled them in.
  it("draws the capacity even when handed fewer slots than that", () => {
    const { container } = render(
      React.createElement(CircularQueueRenderer, { slots: [{ id: 1, value: 10 }], capacity: 4 }),
    );
    expect(cells(container)).toHaveLength(4);
  });
});
