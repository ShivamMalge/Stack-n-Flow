/**
 * Dynamically allocated arrays: capacity, doubling, and the copy that pays for it.
 *
 * BCS304 names this three times — "Dynamically allocated arrays" and "Stacks
 * using dynamic arrays" in module 1, "Queues using dynamic arrays" in module 2 —
 * and it is one idea each time. The visualizers grew without bound and never
 * showed the doubling-and-copy step, which is the entire topic.
 *
 * The three modes share one model on purpose, because the interesting
 * difference only shows when they sit side by side: a stack grows at the tail
 * and copies straight across, while a circular queue whose contents have
 * wrapped past the end must be *unwrapped* during the copy. That unwrapping is
 * the part students get wrong.
 *
 * Kept free of React so the growth policy can be tested directly.
 */

import type { VisualizerState } from "@/lib/visualizer-states"

export type DynMode = "array" | "stack" | "queue"

export const MODE_LABELS: Record<DynMode, string> = {
    array: "Dynamic array",
    stack: "Stack on a dynamic array",
    queue: "Circular queue on a dynamic array",
}

export interface DynCell {
    value: string | null
    state: VisualizerState
}

export interface DynState {
    /** Physical storage. `capacity` is its length. */
    slots: (string | null)[]
    /** Number of live elements. */
    size: number
    /** Physical index of the logical first element. Always 0 outside queue mode. */
    front: number
    /** Every element copy performed since the table was created. */
    copies: number
    /** Every reallocation performed since the table was created. */
    grows: number
}

export interface DynSnapshot {
    cells: DynCell[]
    /** Storage being copied *from* during a grow, else null. */
    oldCells: DynCell[] | null
    size: number
    capacity: number
    front: number
    copies: number
    grows: number
    activeLine: number
    result: string | null
}

export interface DynFrame {
    snapshot: DynSnapshot
    description: string
}

export interface DynResult {
    frames: DynFrame[]
    state: DynState
    error: string | null
    result: string | null
}

export const MIN_CAPACITY = 1
export const MAX_CAPACITY = 32
export const DEFAULT_CAPACITY = 4

/** Line indices into the visualizer's code panel. */
const LINES = { full: 1, callGrow: 2, store: 3, bump: 4, allocate: 7, copy: 9, swap: 10 }

export function makeDynamic(capacity = DEFAULT_CAPACITY): DynState {
    const cap = Math.max(MIN_CAPACITY, Math.min(MAX_CAPACITY, Math.trunc(capacity)))
    return { slots: Array(cap).fill(null), size: 0, front: 0, copies: 0, grows: 0 }
}

function cloneState(state: DynState): DynState {
    return { ...state, slots: [...state.slots] }
}

/** Physical index of logical position `i`. */
export function physicalIndex(state: DynState, i: number, mode: DynMode): number {
    return mode === "queue" ? (state.front + i) % state.slots.length : i
}

/** Live elements in logical order. */
export function logicalOrder(state: DynState, mode: DynMode): string[] {
    return Array.from({ length: state.size }, (_, i) => state.slots[physicalIndex(state, i, mode)] ?? "")
}

export function loadFactor(state: DynState): number {
    return state.slots.length === 0 ? 0 : state.size / state.slots.length
}

function cells(state: DynState, marks: Record<number, VisualizerState> = {}): DynCell[] {
    return state.slots.map((value, index) => ({ value, state: marks[index] ?? "default" }))
}

function frame(
    state: DynState,
    activeLine: number,
    description: string,
    marks: Record<number, VisualizerState> = {},
    oldState: DynState | null = null,
    oldMarks: Record<number, VisualizerState> = {},
    result: string | null = null,
): DynFrame {
    return {
        snapshot: {
            cells: cells(state, marks),
            oldCells: oldState ? cells(oldState, oldMarks) : null,
            size: state.size,
            capacity: state.slots.length,
            front: state.front,
            copies: state.copies,
            grows: state.grows,
            activeLine,
            result,
        },
        description,
    }
}

/**
 * Doubles the storage, copying in *logical* order.
 *
 * Copying physically would preserve a wrapped queue's split layout in the
 * larger array, leaving front ahead of rear with a hole between them. Copying
 * logically unwraps it and lets front reset to 0.
 */
function grow(state: DynState, mode: DynMode, frames: DynFrame[]): DynState {
    const oldState = cloneState(state)
    const oldCapacity = state.slots.length
    const newCapacity = Math.max(1, oldCapacity * 2)

    const grown: DynState = {
        slots: Array(newCapacity).fill(null),
        size: 0,
        front: 0,
        copies: state.copies,
        grows: state.grows + 1,
    }

    frames.push(frame(
        grown,
        LINES.allocate,
        `Full at ${state.size}/${oldCapacity}. Allocate a new array of ${newCapacity} and copy across.`,
        {},
        oldState,
    ))

    const wrapped = mode === "queue" && oldCapacity > 0 && state.front + state.size > oldCapacity

    for (let i = 0; i < state.size; i++) {
        const from = physicalIndex(state, i, mode)
        grown.slots[i] = state.slots[from]
        grown.size = i + 1
        grown.copies += 1
        frames.push(frame(
            grown,
            LINES.copy,
            wrapped && from < state.front
                ? `Copy logical ${i} from wrapped slot ${from} to slot ${i}, unwrapping it.`
                : `Copy logical ${i} from slot ${from} to slot ${i}.`,
            { [i]: "inserted" },
            oldState,
            { [from]: "visited" },
        ))
    }

    grown.size = state.size
    frames.push(frame(
        grown,
        LINES.swap,
        wrapped
            ? `Old array released. The contents were wrapped and are now contiguous, so front resets to 0. ${state.size} element copies.`
            : `Old array released. Capacity is ${newCapacity}, after ${state.size} element copies.`,
        {},
    ))

    return grown
}

function validValue(value: string): string | null {
    if (!value.trim()) return "Enter a value first."
    if (value.length > 6) return "Keep values to 6 characters so the cells stay readable."
    return null
}

/** Append (array), push (stack) or enqueue (queue). One operation, three names. */
export function buildAppend(input: DynState, value: string, mode: DynMode): DynResult {
    const invalid = validValue(value)
    if (invalid) return { frames: [], state: cloneState(input), error: invalid, result: null }

    let state = cloneState(input)
    const frames: DynFrame[] = []

    frames.push(frame(state, LINES.full, `size ${state.size}, capacity ${state.slots.length}. Is it full?`))

    if (state.size === state.slots.length) {
        if (state.slots.length * 2 > MAX_CAPACITY) {
            return {
                frames: [],
                state: cloneState(input),
                error: `Doubling would exceed the ${MAX_CAPACITY}-slot ceiling this demo uses to stay readable.`,
                result: null,
            }
        }
        frames.push(frame(state, LINES.callGrow, "Full, so grow before storing anything."))
        state = grow(state, mode, frames)
    }

    const at = physicalIndex(state, state.size, mode)
    state.slots[at] = value.trim()
    state.size += 1

    frames.push(frame(
        state,
        LINES.store,
        mode === "queue"
            ? `Store "${value.trim()}" at slot (front + size) mod capacity = ${at}.`
            : `Store "${value.trim()}" at slot ${at}.`,
        { [at]: "inserted" },
    ))
    frames.push(frame(
        state,
        LINES.bump,
        `size is now ${state.size} of ${state.slots.length}.`,
        { [at]: "inserted" },
        null,
        {},
        `"${value.trim()}" stored, ${state.copies} copies so far`,
    ))

    return { frames, state, error: null, result: `"${value.trim()}" stored at slot ${at}` }
}

/** Remove (array), pop (stack) or dequeue (queue). */
export function buildRemove(input: DynState, mode: DynMode): DynResult {
    if (input.size === 0) {
        const what = mode === "queue" ? "Queue" : mode === "stack" ? "Stack" : "Array"
        return { frames: [], state: cloneState(input), error: `${what} is empty.`, result: null }
    }

    const state = cloneState(input)
    const frames: DynFrame[] = []

    // A stack and a plain array drop the last element; a queue drops the first
    // and walks `front` forward, which is what makes it circular.
    const at = mode === "queue" ? state.front : state.size - 1
    const value = state.slots[at]

    frames.push(frame(state, LINES.store, `Remove from slot ${at}.`, { [at]: "removed" }))

    state.slots[at] = null
    state.size -= 1
    if (mode === "queue") state.front = (state.front + 1) % state.slots.length

    frames.push(frame(
        state,
        LINES.bump,
        mode === "queue"
            ? `front moves to ${state.front}. size is now ${state.size}. Capacity never shrinks.`
            : `size is now ${state.size}. Capacity stays at ${state.slots.length} — removing does not free storage.`,
        {},
        null,
        {},
        `removed "${value}"`,
    ))

    return { frames, state, error: null, result: `removed "${value}"` }
}
