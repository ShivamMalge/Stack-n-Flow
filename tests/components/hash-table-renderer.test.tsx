import React from "react";
import { render, screen } from "@testing-library/react";
import HashTableRenderer, {
  fromBuckets,
} from "@/components/visualizers/hash-table/hash-table-renderer";
import type { HashSlot } from "@/lib/hashing";

const slot = (entries: HashSlot["entries"], extra: Partial<HashSlot> = {}): HashSlot => ({
  entries,
  state: "default",
  tombstone: false,
  ...extra,
});

const slots: HashSlot[] = [
  slot([{ key: "12", value: "a", state: "default" }]),
  slot([]),
  slot([
    { key: "22", value: "b", state: "default" },
    { key: "32", value: "c", state: "comparing" },
  ]),
];

describe("HashTableRenderer", () => {
  it("draws one row per slot, indexed by position", () => {
    render(React.createElement(HashTableRenderer, { slots }));
    for (const index of [0, 1, 2]) {
      expect(screen.getByText(`[${index}]`)).toBeInTheDocument();
    }
  });

  it("draws every entry in a chained bucket", () => {
    render(React.createElement(HashTableRenderer, { slots }));
    expect(screen.getByText("22")).toBeInTheDocument();
    expect(screen.getByText("32")).toBeInTheDocument();
  });

  it("distinguishes an empty slot from a tombstone", () => {
    render(
      React.createElement(HashTableRenderer, {
        slots: [slot([]), slot([], { tombstone: true })],
      }),
    );
    expect(screen.getByText("∅")).toBeInTheDocument();
    expect(screen.getByText("⌫ tombstone")).toBeInTheDocument();
  });

  it("picks out the home bucket", () => {
    render(React.createElement(HashTableRenderer, { slots, home: 2 }));
    expect(screen.getByText("[2]").className).toContain("text-primary");
    expect(screen.getByText("[0]").className).not.toContain("text-primary");
  });

  // The bridge sends null when there is no key in flight; -1 is what the
  // player's snapshot uses for the same thing.
  it.each([null, -1, undefined])("marks no home bucket for %s", (home) => {
    render(React.createElement(HashTableRenderer, { slots, home }));
    for (const index of [0, 1, 2]) {
      expect(screen.getByText(`[${index}]`).className).not.toContain("text-primary");
    }
  });

  it("shows an empty state rather than an empty list", () => {
    render(React.createElement(HashTableRenderer, { slots: [] }));
    expect(screen.getByText("Empty table")).toBeInTheDocument();
  });

  it("omits the hash working when it is not given one", () => {
    const { rerender } = render(
      React.createElement(HashTableRenderer, { slots, caption: "h(key) = key mod 3" }),
    );
    expect(screen.getByText("h(key) = key mod 3")).toBeInTheDocument();
    rerender(React.createElement(HashTableRenderer, { slots }));
    expect(screen.queryByText("h(key) = key mod 3")).toBeNull();
  });

  it("shows the frame narration when it is given one", () => {
    render(React.createElement(HashTableRenderer, { slots, description: "Probing slot 3" }));
    expect(screen.getByText("Probing slot 3")).toBeInTheDocument();
  });

  it("labels the legend for every state a slot can be in", () => {
    render(React.createElement(HashTableRenderer, { slots }));
    for (const label of ["Free", "Probing", "Placed", "Collision", "Deleted"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});

/**
 * Python sends HASH_TABLE as an array of chains — the shape separate chaining
 * produces — with none of the slot states, tombstones or probe marks the web
 * app's own model carries.
 */
describe("fromBuckets", () => {
  it("turns chains into slots, one per bucket", () => {
    const converted = fromBuckets([[{ key: "a", value: "1" }], [], [{ key: "b", value: "2" }]]);
    expect(converted).toHaveLength(3);
    expect(converted[0].entries).toEqual([{ key: "a", value: "1", state: "default" }]);
    expect(converted[1].entries).toEqual([]);
  });

  it("gives every slot a neutral state and no tombstone", () => {
    for (const converted of fromBuckets([[{ key: "a", value: "1" }], []])) {
      expect(converted.state).toBe("default");
      expect(converted.tombstone).toBe(false);
    }
  });

  // Whatever a notebook puts in the `state` field is not one of ours.
  it("ignores a state it does not recognise", () => {
    const converted = fromBuckets([[{ key: "a", value: "1", state: "on fire" }]]);
    expect(converted[0].entries[0].state).toBe("default");
  });

  it("survives an empty table", () => {
    expect(fromBuckets([])).toEqual([]);
  });
});
