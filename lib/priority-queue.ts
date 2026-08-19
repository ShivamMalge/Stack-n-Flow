/**
 * Priority queues, single- and double-ended.
 *
 * BCS304 module 5 asks for both. The single-ended case is an ordinary heap
 * presented as the ADT — insert, peek, extract the highest priority — which the
 * heap visualizer already animated but never framed that way. The double-ended
 * case is the min-max heap, which supports extracting *either* end in O(log n)
 * and is a genuinely different structure.
 *
 * A min-max heap alternates levels. The root is on a min level, its children on
 * a max level, their children on a min level, and so on. The invariant: a node
 * on a min level is the smallest in its subtree, a node on a max level is the
 * largest in its subtree. That is why the minimum is always the root and the
 * maximum is always the larger of the root's two children.
 *
 * Kept free of React so the invariant can be asserted after every operation.
 */

import type { VisualizerState } from "@/lib/visualizer-states"

export type PQMode = "min" | "max" | "minmax"

export const MODE_LABELS: Record<PQMode, string> = {
    min: "Min-heap priority queue",
    max: "Max-heap priority queue",
    minmax: "Min-max heap (double-ended)",
}

export interface PQNode {
    value: number
    state: VisualizerState
}

export interface PQSnapshot {
    heap: PQNode[]
    comparisons: number
    swaps: number
    activeLine: number
    result: string | null
}

export interface PQFrame {
    snapshot: PQSnapshot
    description: string
}

export interface PQResult {
    frames: PQFrame[]
    heap: number[]
    error: string | null
    result: string | null
}

export const MAX_SIZE = 20
export const MIN_VALUE = 1
export const MAX_VALUE = 999

/** Line indices into the visualizer's code panels. */
const SINGLE = { append: 1, compare: 3, swap: 4, take: 1, moveLast: 2, sift: 3 }
const MINMAX = { append: 1, parentCheck: 3, parentSwap: 4, grandCheck: 5, grandSwap: 6 }

const parent = (i: number) => Math.floor((i - 1) / 2)
const grandparent = (i: number) => parent(parent(i))
const left = (i: number) => 2 * i + 1
const right = (i: number) => 2 * i + 2

/** Depth of index `i`, zero-based. */
export function levelOf(i: number): number {
    return Math.floor(Math.log2(i + 1))
}

/** Even levels hold minima, odd levels hold maxima. */
export function isMinLevel(i: number): boolean {
    return levelOf(i) % 2 === 0
}

/**
 * Checks the structural invariant.
 *
 * Exported because it is the only honest way to test a min-max heap: the shape
 * after an operation is not something you can eyeball, so every test asserts
 * this instead of a hard-coded array.
 */
export function holdsInvariant(heap: readonly number[], mode: PQMode): boolean {
    if (mode === "minmax") {
        for (let i = 0; i < heap.length; i++) {
            const wantMin = isMinLevel(i)
            // Compare against every descendant, which is what the invariant says.
            const stack = [left(i), right(i)]
            while (stack.length) {
                const j = stack.pop()!
                if (j >= heap.length) continue
                if (wantMin && heap[j] < heap[i]) return false
                if (!wantMin && heap[j] > heap[i]) return false
                stack.push(left(j), right(j))
            }
        }
        return true
    }

    for (let i = 1; i < heap.length; i++) {
        const p = parent(i)
        if (mode === "min" && heap[p] > heap[i]) return false
        if (mode === "max" && heap[p] < heap[i]) return false
    }
    return true
}

/** Index of the smallest element. */
export function minIndex(heap: readonly number[], mode: PQMode): number {
    if (heap.length === 0) return -1
    if (mode === "max") return heap.indexOf(Math.min(...heap))
    return 0
}

/** Index of the largest element. For a min-max heap it is a child of the root. */
export function maxIndex(heap: readonly number[], mode: PQMode): number {
    if (heap.length === 0) return -1
    if (mode === "max") return 0
    if (mode === "min") return heap.indexOf(Math.max(...heap))
    if (heap.length === 1) return 0
    if (heap.length === 2) return 1
    return heap[1] >= heap[2] ? 1 : 2
}

function snap(
    heap: readonly number[],
    activeLine: number,
    comparisons: number,
    swaps: number,
    marks: Record<number, VisualizerState> = {},
    result: string | null = null,
): PQSnapshot {
    return {
        heap: heap.map((value, i) => ({ value, state: marks[i] ?? "default" })),
        comparisons,
        swaps,
        activeLine,
        result,
    }
}

interface Counters { comparisons: number; swaps: number }

function swap(heap: number[], a: number, b: number, counters: Counters) {
    const tmp = heap[a]
    heap[a] = heap[b]
    heap[b] = tmp
    counters.swaps++
}

/** Sift up for an ordinary heap. */
function siftUpSingle(heap: number[], start: number, mode: PQMode, frames: PQFrame[], counters: Counters) {
    let i = start
    while (i > 0) {
        const p = parent(i)
        counters.comparisons++
        const better = mode === "min" ? heap[i] < heap[p] : heap[i] > heap[p]
        frames.push({
            snapshot: snap(heap, SINGLE.compare, counters.comparisons, counters.swaps, {
                [i]: "comparing", [p]: "pivot",
            }),
            description: better
                ? `${heap[i]} beats its parent ${heap[p]}, so they swap.`
                : `${heap[i]} does not beat its parent ${heap[p]}. It has reached its place.`,
        })
        if (!better) return
        swap(heap, i, p, counters)
        frames.push({
            snapshot: snap(heap, SINGLE.swap, counters.comparisons, counters.swaps, { [p]: "swapping" }),
            description: `Swapped up to index ${p}.`,
        })
        i = p
    }
}

/** Sift down for an ordinary heap. */
function siftDownSingle(heap: number[], start: number, mode: PQMode, frames: PQFrame[], counters: Counters) {
    let i = start
    for (;;) {
        const l = left(i)
        const r = right(i)
        let best = i
        if (l < heap.length) {
            counters.comparisons++
            if (mode === "min" ? heap[l] < heap[best] : heap[l] > heap[best]) best = l
        }
        if (r < heap.length) {
            counters.comparisons++
            if (mode === "min" ? heap[r] < heap[best] : heap[r] > heap[best]) best = r
        }
        if (best === i) {
            frames.push({
                snapshot: snap(heap, SINGLE.sift, counters.comparisons, counters.swaps, { [i]: "pivot" }),
                description: `${heap[i]} is already in order against its children.`,
            })
            return
        }
        frames.push({
            snapshot: snap(heap, SINGLE.sift, counters.comparisons, counters.swaps, {
                [i]: "comparing", [best]: "pivot",
            }),
            description: `${heap[best]} at index ${best} belongs above ${heap[i]}. Swap them.`,
        })
        swap(heap, i, best, counters)
        i = best
    }
}

/** Sift up for a min-max heap: fix the level, then jump grandparents. */
function siftUpMinMax(heap: number[], start: number, frames: PQFrame[], counters: Counters) {
    let i = start

    if (i > 0) {
        const p = parent(i)
        counters.comparisons++
        const onMin = isMinLevel(i)
        const wrongSide = onMin ? heap[i] > heap[p] : heap[i] < heap[p]

        frames.push({
            snapshot: snap(heap, MINMAX.parentCheck, counters.comparisons, counters.swaps, {
                [i]: "comparing", [p]: "pivot",
            }),
            description: wrongSide
                ? `${heap[i]} sits on a ${onMin ? "min" : "max"} level but is ${onMin ? "larger" : "smaller"} than its parent ${heap[p]}. It belongs on the other kind of level, so swap first.`
                : `${heap[i]} is on the right side of its parent ${heap[p]}. Now compare against grandparents.`,
        })

        if (wrongSide) {
            swap(heap, i, p, counters)
            i = p
            frames.push({
                snapshot: snap(heap, MINMAX.parentSwap, counters.comparisons, counters.swaps, { [i]: "swapping" }),
                description: `Moved to index ${i}, now on a ${isMinLevel(i) ? "min" : "max"} level.`,
            })
        }
    }

    // From here the node only ever compares with its grandparent, two levels up,
    // because that is the nearest ancestor of the same kind.
    while (i > 2) {
        const g = grandparent(i)
        counters.comparisons++
        const onMin = isMinLevel(i)
        const out = onMin ? heap[i] < heap[g] : heap[i] > heap[g]

        frames.push({
            snapshot: snap(heap, MINMAX.grandCheck, counters.comparisons, counters.swaps, {
                [i]: "comparing", [g]: "pivot",
            }),
            description: out
                ? `${heap[i]} beats its grandparent ${heap[g]} on this ${onMin ? "min" : "max"} level. Swap.`
                : `${heap[i]} does not beat its grandparent ${heap[g]}. Done.`,
        })

        if (!out) return
        swap(heap, i, g, counters)
        i = g
        frames.push({
            snapshot: snap(heap, MINMAX.grandSwap, counters.comparisons, counters.swaps, { [i]: "swapping" }),
            description: `Jumped two levels to index ${i}.`,
        })
    }
}

/** Smallest (or largest) among the children and grandchildren of `i`. */
function bestDescendant(heap: readonly number[], i: number, wantMin: boolean): number {
    let best = -1
    for (const child of [left(i), right(i)]) {
        if (child >= heap.length) continue
        if (best === -1 || (wantMin ? heap[child] < heap[best] : heap[child] > heap[best])) best = child
        for (const grand of [left(child), right(child)]) {
            if (grand >= heap.length) continue
            if (wantMin ? heap[grand] < heap[best] : heap[grand] > heap[best]) best = grand
        }
    }
    return best
}

/** Sift down for a min-max heap, considering children and grandchildren. */
function siftDownMinMax(heap: number[], start: number, frames: PQFrame[], counters: Counters) {
    let i = start
    for (;;) {
        const wantMin = isMinLevel(i)
        const m = bestDescendant(heap, i, wantMin)
        if (m === -1) {
            frames.push({
                snapshot: snap(heap, MINMAX.grandCheck, counters.comparisons, counters.swaps, { [i]: "pivot" }),
                description: `Index ${i} has no descendants left to check.`,
            })
            return
        }

        counters.comparisons++
        const isGrandchild = grandparent(m) === i
        const shouldMove = wantMin ? heap[m] < heap[i] : heap[m] > heap[i]

        frames.push({
            snapshot: snap(heap, MINMAX.grandCheck, counters.comparisons, counters.swaps, {
                [i]: "comparing", [m]: "pivot",
            }),
            description: shouldMove
                ? `${heap[m]} at index ${m} is the ${wantMin ? "smallest" : "largest"} among the children and grandchildren, and beats ${heap[i]}.`
                : `${heap[i]} already beats every child and grandchild.`,
        })

        if (!shouldMove) return

        swap(heap, i, m, counters)

        if (!isGrandchild) {
            // A child swap ends the walk: the levels below are already correct.
            frames.push({
                snapshot: snap(heap, MINMAX.grandSwap, counters.comparisons, counters.swaps, { [m]: "swapping" }),
                description: `Swapped with a child at index ${m}. Nothing below can be out of order.`,
            })
            return
        }

        const p = parent(m)
        counters.comparisons++
        const needsParentFix = wantMin ? heap[m] > heap[p] : heap[m] < heap[p]
        if (needsParentFix) {
            swap(heap, m, p, counters)
            frames.push({
                snapshot: snap(heap, MINMAX.parentSwap, counters.comparisons, counters.swaps, { [p]: "swapping" }),
                description: `The displaced value broke the level above it, so swap it with its parent at index ${p}.`,
            })
        }

        frames.push({
            snapshot: snap(heap, MINMAX.grandSwap, counters.comparisons, counters.swaps, { [m]: "swapping" }),
            description: `Continue from the grandchild at index ${m}.`,
        })
        i = m
    }
}

export function buildInsert(input: readonly number[], value: number, mode: PQMode): PQResult {
    if (!Number.isInteger(value) || value < MIN_VALUE || value > MAX_VALUE) {
        return { frames: [], heap: [...input], error: `Enter a whole number between ${MIN_VALUE} and ${MAX_VALUE}.`, result: null }
    }
    if (input.length >= MAX_SIZE) {
        return { frames: [], heap: [...input], error: `This demo holds ${MAX_SIZE} elements so the tree stays readable.`, result: null }
    }

    const heap = [...input]
    const frames: PQFrame[] = []
    const counters: Counters = { comparisons: 0, swaps: 0 }

    heap.push(value)
    frames.push({
        snapshot: snap(heap, mode === "minmax" ? MINMAX.append : SINGLE.append, 0, 0, {
            [heap.length - 1]: "inserted",
        }),
        description: `Place ${value} at the end, index ${heap.length - 1}, then move it up.`,
    })

    if (mode === "minmax") siftUpMinMax(heap, heap.length - 1, frames, counters)
    else siftUpSingle(heap, heap.length - 1, mode, frames, counters)

    frames.push({
        snapshot: snap(heap, 0, counters.comparisons, counters.swaps, {},
            `inserted ${value} in ${counters.comparisons} comparison${counters.comparisons === 1 ? "" : "s"}`),
        description: `Done. ${counters.comparisons} comparisons, ${counters.swaps} swaps.`,
    })

    return { frames, heap, error: null, result: `inserted ${value}` }
}

/** Extract the smallest, or the largest, depending on `end`. */
export function buildExtract(input: readonly number[], mode: PQMode, end: "min" | "max"): PQResult {
    if (input.length === 0) {
        return { frames: [], heap: [], error: "The queue is empty.", result: null }
    }
    if (mode === "min" && end === "max") {
        return { frames: [], heap: [...input], error: "A min-heap cannot give the maximum in O(log n) — that is what a min-max heap is for.", result: null }
    }
    if (mode === "max" && end === "min") {
        return { frames: [], heap: [...input], error: "A max-heap cannot give the minimum in O(log n) — that is what a min-max heap is for.", result: null }
    }

    const heap = [...input]
    const frames: PQFrame[] = []
    const counters: Counters = { comparisons: 0, swaps: 0 }
    const at = end === "min" ? minIndex(heap, mode) : maxIndex(heap, mode)
    const taken = heap[at]

    frames.push({
        snapshot: snap(heap, SINGLE.take, 0, 0, { [at]: "removed" }),
        description: mode === "minmax" && end === "max"
            ? `The maximum is always the larger child of the root — ${taken} at index ${at}.`
            : `The ${end === "min" ? "minimum" : "maximum"} is at the root: ${taken}.`,
    })

    const last = heap.pop()!
    if (heap.length > 0 && at < heap.length) {
        heap[at] = last
        frames.push({
            snapshot: snap(heap, SINGLE.moveLast, 0, 0, { [at]: "swapping" }),
            description: `Move the last element ${last} into index ${at}, then sift it down.`,
        })
        if (mode === "minmax") siftDownMinMax(heap, at, frames, counters)
        else siftDownSingle(heap, at, mode, frames, counters)
    }

    frames.push({
        snapshot: snap(heap, 0, counters.comparisons, counters.swaps, {},
            `extracted ${taken}`),
        description: `Done. Removed ${taken} in ${counters.comparisons} comparisons.`,
    })

    return { frames, heap, error: null, result: `extracted ${taken}` }
}
