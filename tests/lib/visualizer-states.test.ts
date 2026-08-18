import { describe, expect, it } from "vitest";
import {
  resolveState,
  STATE_BAR,
  STATE_BOX,
  STATE_LABEL,
  STATE_FILL,
  STATE_SHAPE,
  STATE_SWATCH,
  swatchFor,
  type VisualizerState,
} from "@/lib/visualizer-states";

const ALL_STATES: VisualizerState[] = [
  "default",
  "comparing",
  "swapping",
  "pivot",
  "inserted",
  "removed",
  "visited",
  "warning",
];

describe("resolveState", () => {
  it("returns default when nothing is set", () => {
    expect(resolveState({})).toBe("default");
    expect(resolveState({ comparing: false, visited: undefined })).toBe("default");
  });

  it("returns the only active state", () => {
    expect(resolveState({ comparing: true })).toBe("comparing");
    expect(resolveState({ visited: true })).toBe("visited");
  });

  it("picks one state when several apply at once", () => {
    // The bug this replaces: the tree visualizers emitted a class per flag, so a
    // node that was both highlighted and unbalanced rendered whichever colour
    // Tailwind happened to emit later.
    expect(resolveState({ comparing: true, warning: true })).toBe("comparing");
    expect(resolveState({ removed: true, comparing: true })).toBe("removed");
    expect(resolveState({ swapping: true, comparing: true })).toBe("swapping");
    expect(resolveState({ inserted: true, visited: true })).toBe("inserted");
  });

  it("orders removal above everything else", () => {
    const everything = Object.fromEntries(ALL_STATES.map((s) => [s, true]));
    expect(resolveState(everything)).toBe("removed");
  });

  it("is deterministic regardless of key order", () => {
    expect(resolveState({ warning: true, comparing: true })).toBe(
      resolveState({ comparing: true, warning: true })
    );
  });
});

describe("state class maps", () => {
  it.each([
    ["STATE_BOX", STATE_BOX],
    ["STATE_SHAPE", STATE_SHAPE],
    ["STATE_BAR", STATE_BAR],
    ["STATE_SWATCH", STATE_SWATCH],
    ["STATE_FILL", STATE_FILL],
    ["STATE_LABEL", STATE_LABEL],
  ])("%s covers every state", (_name, map) => {
    for (const state of ALL_STATES) {
      expect(map[state as keyof typeof map]).toBeTruthy();
    }
  });

  it("gives every non-default state a distinct appearance", () => {
    const values = ALL_STATES.filter((s) => s !== "default" && s !== "warning").map((s) => STATE_BOX[s]);
    expect(new Set(values).size).toBe(values.length);
  });

  it("keeps inserted an outline rather than a fill, so it reads apart from visited", () => {
    // Both use the same hue; the encoding is what separates them.
    expect(STATE_BOX.inserted).toContain("bg-card");
    expect(STATE_BOX.visited).toContain("bg-emerald-100");
  });

  it("pairs a dark variant with every tinted background", () => {
    for (const state of ALL_STATES) {
      const classes = STATE_BOX[state];
      // A tinted light background with no dark counterpart is the asymmetry that
      // made several panels glare white in dark mode.
      if (/\bbg-(amber|orange|purple|red|emerald)-100\b/.test(classes)) {
        expect(classes).toMatch(/dark:bg-/);
      }
    }
  });
});

describe("swatchFor", () => {
  it("shows the bar fill beside a bar chart", () => {
    // A legend must show the colour its mark is actually drawn in. One generic
    // swatch set put a saturated dot next to a pale cell — in hue, but not the
    // same colour, which is the drift this module exists to prevent.
    expect(swatchFor("comparing", "bar")).toBe(STATE_BAR.comparing);
  });

  it("shows the box fill beside pale cells", () => {
    expect(swatchFor("visited", "box")).toContain("bg-emerald-100");
  });

  it("falls back to the neutral swatch for SVG marks", () => {
    // fill-* classes cannot be reused on a div, so shape legends need their own.
    expect(swatchFor("comparing")).toBe(STATE_SWATCH.comparing);
    expect(swatchFor("comparing", "shape")).toBe(STATE_SWATCH.comparing);
  });

  it("never returns an SVG-only utility for a div swatch", () => {
    for (const state of ALL_STATES) {
      for (const mark of ["box", "bar", "shape"] as const) {
        expect(swatchFor(state, mark)).not.toMatch(/fill-/);
      }
    }
  });
});

describe("STATE_FILL", () => {
  it("carries no border colour, so a grid's own hairline is not overridden", () => {
    // Two border-colour classes on one element resolve by Tailwind emit order,
    // not intent — the ambiguity this module exists to remove.
    for (const state of ALL_STATES) {
      expect(STATE_FILL[state]).not.toMatch(/border-/);
    }
  });

  it("pairs a dark variant with every tinted fill", () => {
    for (const state of ALL_STATES) {
      if (/-100/.test(STATE_FILL[state])) {
        expect(STATE_FILL[state]).toMatch(/dark:bg-/);
      }
    }
  });
});
