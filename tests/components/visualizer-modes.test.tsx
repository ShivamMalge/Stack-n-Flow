import React from "react";
import { render, screen } from "@testing-library/react";
import StackVisualizer from "@/components/visualizers/stack-visualizer";
import QueueVisualizer from "@/components/visualizers/queue-visualizer";

/**
 * The mini variants are embedded in the /learn pages as read-only previews, and
 * the controlled variants are driven by the Pratyaksha bridge. Both used to
 * render the full operations panel: in mini mode it was never hidden, and in
 * controlled mode its buttons wrote to internal state that was never read, so
 * they silently did nothing.
 */
describe("StackVisualizer modes", () => {
  it("hides the operations panel in mini mode", () => {
    render(<StackVisualizer mini />);

    expect(screen.queryByRole("button", { name: /push/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /pop/i })).toBeNull();
  });

  it("hides the operations panel when a parent controls the nodes", () => {
    render(<StackVisualizer controlledNodes={[{ id: 1, value: 7 }]} />);

    expect(screen.queryByRole("button", { name: /push/i })).toBeNull();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("shows the operations panel when uncontrolled", () => {
    render(<StackVisualizer />);

    expect(screen.getByRole("button", { name: /push/i })).toBeInTheDocument();
  });
});

describe("QueueVisualizer modes", () => {
  it("accepts a mini prop and hides the operations panel", () => {
    render(<QueueVisualizer mini />);

    expect(screen.queryByRole("button", { name: /enqueue/i })).toBeNull();
  });

  it("shows the operations panel when uncontrolled", () => {
    render(<QueueVisualizer />);

    expect(screen.getByRole("button", { name: /enqueue/i })).toBeInTheDocument();
  });
});
