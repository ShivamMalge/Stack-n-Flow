/**
 * One vocabulary for the states a visualiser can put an element in.
 *
 * Before this, the same idea was drawn seven different ways: "highlighted" was
 * `bg-yellow-100 dark:bg-yellow-900` in the linear structures, `fill-yellow-200`
 * in the trees, `bg-blue-500/20` in the heap, solid `bg-blue-400` in two sorters
 * and solid `bg-yellow-400` in a third. Legends were written by hand from the
 * same guesswork, so several disagreed with the nodes they described.
 *
 * Everything a visualiser draws now resolves to one of these states, and the
 * classes come from here rather than being retyped per file.
 */

export type VisualizerState =
    | "default"
    /** The element the algorithm is currently examining. */
    | "comparing"
    /** The element is being moved. */
    | "swapping"
    /** A reference element the algorithm partitions around. */
    | "pivot"
    /** Newly added. */
    | "inserted"
    /** About to be removed. */
    | "removed"
    /** Already processed, or in its final position. */
    | "visited"
    /** Violates an invariant the structure is supposed to maintain. */
    | "warning"

/**
 * Which state wins when an element qualifies for several at once.
 *
 * The tree visualisers used to concatenate one class string per flag, so a node
 * that was both highlighted and unbalanced emitted `fill-yellow-200` *and*
 * `fill-orange-200`. Which of those actually rendered was decided by the order
 * Tailwind happened to emit its palette in — not by intent. Lower index wins.
 */
const PRECEDENCE: VisualizerState[] = [
    "removed",
    "swapping",
    "comparing",
    "pivot",
    "inserted",
    "warning",
    "visited",
    "default",
]

/** Picks the single state that should be drawn, highest precedence first. */
export function resolveState(flags: Partial<Record<VisualizerState, boolean | undefined>>): VisualizerState {
    return PRECEDENCE.find((state) => flags[state]) ?? "default"
}

/** Classes for an element drawn as a DOM box (linear structures, bars, cells). */
export const STATE_BOX: Record<VisualizerState, string> = {
    default: "bg-card border-primary",
    comparing: "bg-amber-100 border-amber-500 dark:bg-amber-900 dark:border-amber-500",
    swapping: "bg-orange-100 border-orange-500 dark:bg-orange-900 dark:border-orange-500",
    pivot: "bg-purple-100 border-purple-500 dark:bg-purple-900 dark:border-purple-500",
    // Insertion is an outline change, not a fill: it reads as "arriving" and
    // stays distinguishable from `visited`, which shares the same hue.
    inserted: "bg-card border-emerald-500",
    removed: "bg-red-100 border-red-500 dark:bg-red-900 dark:border-red-500",
    visited: "bg-emerald-100 border-emerald-500 dark:bg-emerald-900 dark:border-emerald-500",
    warning: "bg-orange-100 border-orange-500 dark:bg-orange-950 dark:border-orange-400",
}

/** Classes for an element drawn as an SVG shape (trees, graph, heap). */
export const STATE_SHAPE: Record<VisualizerState, string> = {
    default: "fill-card stroke-primary",
    comparing: "fill-amber-200 stroke-amber-500 dark:fill-amber-900",
    swapping: "fill-orange-200 stroke-orange-500 dark:fill-orange-900",
    pivot: "fill-purple-200 stroke-purple-500 dark:fill-purple-900",
    inserted: "fill-card stroke-emerald-500 stroke-[2]",
    removed: "fill-red-200 stroke-red-500 dark:fill-red-900",
    visited: "fill-emerald-100 stroke-emerald-500 dark:fill-emerald-900",
    warning: "fill-orange-200 stroke-orange-500 dark:fill-orange-900",
}

/**
 * Background only, for marks whose container already supplies a border.
 *
 * `STATE_BOX` carries a border colour, which collides with a grid that draws its
 * own hairline — two border-colour classes on one element, resolved by Tailwind's
 * emit order rather than intent. `inserted` and `visited` share a fill here
 * because what separates them in `STATE_BOX` is the outline, which this map omits.
 */
export const STATE_FILL: Record<VisualizerState, string> = {
    default: "bg-card",
    comparing: "bg-amber-100 dark:bg-amber-900",
    swapping: "bg-orange-100 dark:bg-orange-900",
    pivot: "bg-purple-100 dark:bg-purple-900",
    inserted: "bg-emerald-100 dark:bg-emerald-900",
    removed: "bg-red-100 dark:bg-red-900",
    visited: "bg-emerald-100 dark:bg-emerald-900",
    warning: "bg-orange-100 dark:bg-orange-950",
}

/** Solid fills for bar charts, where a bar is the mark rather than a container. */
export const STATE_BAR: Record<VisualizerState, string> = {
    default: "bg-primary/60",
    comparing: "bg-amber-400 dark:bg-amber-500",
    swapping: "bg-orange-400 dark:bg-orange-500",
    pivot: "bg-purple-500 dark:bg-purple-400",
    inserted: "bg-emerald-400 dark:bg-emerald-500",
    removed: "bg-red-400 dark:bg-red-500",
    visited: "bg-emerald-400 dark:bg-emerald-500",
    warning: "bg-orange-400 dark:bg-orange-500",
}

/**
 * Picks the swatch that matches how the mark itself is drawn.
 *
 * A legend beside a bar chart should show the saturated bar fill; a legend beside
 * pale-filled cells should show the pale fill. Using one swatch set for both put
 * a saturated dot next to a pale cell — in hue, but not the same colour, which is
 * the drift this module exists to prevent.
 */
export function swatchFor(state: VisualizerState, mark: "box" | "bar" | "shape" = "shape"): string {
    if (mark === "bar") return STATE_BAR[state]
    if (mark === "box") return STATE_BOX[state] + " border-2"
    return STATE_SWATCH[state]
}

/** Swatch classes for legends beside SVG marks, whose fill-* classes cannot be reused on a div. */
export const STATE_SWATCH: Record<VisualizerState, string> = {
    default: "bg-card border border-primary",
    comparing: "bg-amber-400",
    swapping: "bg-orange-400",
    pivot: "bg-purple-500",
    inserted: "bg-card border-2 border-emerald-500",
    removed: "bg-red-400",
    visited: "bg-emerald-400",
    warning: "bg-orange-400",
}

/** Default wording, so the same state is not called three different things. */
export const STATE_LABEL: Record<VisualizerState, string> = {
    default: "Unvisited",
    comparing: "Comparing",
    swapping: "Swapping",
    pivot: "Pivot",
    inserted: "New",
    removed: "Removing",
    visited: "Visited",
    warning: "Unbalanced",
}
