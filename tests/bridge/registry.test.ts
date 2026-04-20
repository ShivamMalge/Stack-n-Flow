import { describe, expect, it } from "vitest";
import { getVisualizerComponent } from "@/src/bridge/registry";
import StackRenderer from "@/components/visualizers/stack/stack-renderer";
import QueueRenderer from "@/components/visualizers/queue/queue-renderer";

describe("bridge registry", () => {
  it("resolves the stack renderer for STACK structures", () => {
    expect(getVisualizerComponent("STACK")).toBe(StackRenderer);
  });

  it("resolves the queue renderer for QUEUE structures", () => {
    expect(getVisualizerComponent("QUEUE")).toBe(QueueRenderer);
  });

  it("returns undefined for unsupported structures", () => {
    expect(getVisualizerComponent("MISSING_STRUCTURE")).toBeUndefined();
  });
});
