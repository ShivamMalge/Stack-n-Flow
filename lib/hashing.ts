/**
 * Static hashing: one table, four collision-resolution strategies.
 *
 * BCS304 module 5 names "Static Hashing" as a single topic, and the whole point
 * of it is the comparison — the same keys land differently under chaining,
 * linear probing, quadratic probing and double hashing, and each has a failure
 * mode the others do not. The visualizer previously did chaining only, with a
 * table size fixed at 10 and no way to see the hash being computed.
 *
 * Kept free of React so the strategies can be tested directly.
 */

import type { VisualizerState } from "@/lib/visualizer-states"

export type Strategy = "chaining" | "linear" | "quadratic" | "double"

export const STRATEGY_LABELS: Record<Strategy, string> = {
    chaining: "Separate chaining",
    linear: "Linear probing",
    quadratic: "Quadratic probing",
    double: "Double hashing",
}

export interface HashEntry {
    key: string
    value: string
    state: VisualizerState
}

export interface HashSlot {
    entries: HashEntry[]
    state: VisualizerState
    /**
     * Set when a key was deleted from an open-addressed slot.
     *
     * Clearing the slot outright would break every probe chain that passes
     * through it, so a deleted slot has to stay "occupied but available" —
     * a classic exam point and the reason deletion is harder than insertion.
     */
    tombstone: boolean
}

export interface HashSnapshot {
    slots: HashSlot[]
    /** Slot being probed, or -1. */
    probe: number
    /** Home slot the hash produced, or -1 before it is computed. */
    home: number
    /** How many probes this operation has taken. */
    probes: number
    activeLine: number
    result: string | null
}

export interface HashFrame {
    snapshot: HashSnapshot
    description: string
}

export interface HashResult {
    frames: HashFrame[]
    slots: HashSlot[]
    error: string | null
    result: string | null
}

export interface HashOptions {
    strategy: Strategy
    /** Base for the polynomial hash used on non-numeric keys. */
    multiplier: number
}

export const MIN_TABLE_SIZE = 5
export const MAX_TABLE_SIZE = 19
export const DEFAULT_MULTIPLIER = 31

/** Line indices into the code panels in the visualizer. */
const CHAIN_LINES = { hash: 1, walk: 3, update: 4, append: 6 }
const PROBE_LINES = { hash: 1, next: 3, empty: 4, place: 5, match: 7, update: 8, full: 10 }

export function makeTable(size: number): HashSlot[] {
    const n = Math.max(MIN_TABLE_SIZE, Math.min(MAX_TABLE_SIZE, Math.trunc(size)))
    return Array.from({ length: n }, () => ({ entries: [], state: "default" as VisualizerState, tombstone: false }))
}

function clone(slots: readonly HashSlot[]): HashSlot[] {
    return slots.map((slot) => ({
        entries: slot.entries.map((e) => ({ ...e, state: "default" as VisualizerState })),
        state: "default" as VisualizerState,
        tombstone: slot.tombstone,
    }))
}

export interface HashInfo {
    index: number
    /** Human-readable working, shown beside the table. */
    working: string
}

/**
 * `h(k) = k mod m` for a numeric key, the division method every textbook opens
 * with; a polynomial hash for anything else. Which one ran is reported rather
 * than inferred, so a student never has to guess why 42 landed where it did.
 */
export function hashOf(key: string, size: number, multiplier = DEFAULT_MULTIPLIER): HashInfo {
    if (/^\d+$/.test(key)) {
        const n = Number(key)
        return { index: n % size, working: `h(${n}) = ${n} mod ${size} = ${n % size}` }
    }
    let acc = 0
    for (const ch of key) acc = (acc * multiplier + ch.charCodeAt(0)) % size
    return { index: acc, working: `h("${key}") = polynomial base ${multiplier} mod ${size} = ${acc}` }
}

/** Secondary hash for double hashing. Never zero, or probing would not move. */
export function secondaryHash(key: string, size: number, multiplier = DEFAULT_MULTIPLIER): number {
    const base = /^\d+$/.test(key)
        ? Number(key)
        : [...key].reduce((acc, ch) => (acc * multiplier + ch.charCodeAt(0)) % 1_000_003, 0)
    // size - 1 keeps the step coprime with a prime table size and non-zero.
    return 1 + (base % Math.max(1, size - 1))
}

/** Slot visited on probe `i`, given the home slot. */
export function probeSlot(
    home: number,
    i: number,
    size: number,
    strategy: Strategy,
    key: string,
    multiplier = DEFAULT_MULTIPLIER,
): number {
    switch (strategy) {
        case "linear":
            return (home + i) % size
        case "quadratic":
            return (home + i * i) % size
        case "double":
            return (home + i * secondaryHash(key, size, multiplier)) % size
        default:
            return home
    }
}

export function loadFactor(slots: readonly HashSlot[]): number {
    const entries = slots.reduce((n, slot) => n + slot.entries.length, 0)
    return slots.length === 0 ? 0 : entries / slots.length
}

export function entryCount(slots: readonly HashSlot[]): number {
    return slots.reduce((n, slot) => n + slot.entries.length, 0)
}

function snap(
    slots: readonly HashSlot[],
    activeLine: number,
    probe: number,
    home: number,
    probes: number,
    marks: { slot?: Record<number, VisualizerState>; entry?: Record<number, VisualizerState> } = {},
    result: string | null = null,
): HashSnapshot {
    return {
        slots: slots.map((slot, index) => ({
            entries: slot.entries.map((entry, ei) => ({
                ...entry,
                state: index === probe && marks.entry?.[ei] ? marks.entry[ei] : "default",
            })),
            state: marks.slot?.[index] ?? "default",
            tombstone: slot.tombstone,
        })),
        probe,
        home,
        probes,
        activeLine,
        result,
    }
}

function validKey(key: string): string | null {
    if (!key.trim()) return "Enter a key first."
    if (key.length > 12) return "Keep keys to 12 characters so the table stays readable."
    return null
}

/** Insert or update, animating every probe. */
export function buildInsert(
    slots: readonly HashSlot[],
    key: string,
    value: string,
    options: HashOptions,
): HashResult {
    const invalid = validKey(key)
    if (invalid) return { frames: [], slots: clone(slots), error: invalid, result: null }

    const working = clone(slots)
    const size = working.length
    const frames: HashFrame[] = []
    const { index: home, working: sum } = hashOf(key, size, options.multiplier)

    if (options.strategy === "chaining") {
        frames.push({
            snapshot: snap(working, CHAIN_LINES.hash, home, home, 0, { slot: { [home]: "comparing" } }),
            description: `${sum}. Bucket ${home} holds the chain for this key.`,
        })

        const existing = working[home].entries.findIndex((e) => e.key === key)
        if (existing !== -1) {
            frames.push({
                snapshot: snap(working, CHAIN_LINES.walk, home, home, 1, {
                    slot: { [home]: "comparing" },
                    entry: { [existing]: "comparing" },
                }),
                description: `"${key}" is already in the chain at position ${existing}.`,
            })
            working[home].entries[existing].value = value
            frames.push({
                snapshot: snap(working, CHAIN_LINES.update, home, home, 1, {
                    slot: { [home]: "comparing" },
                    entry: { [existing]: "inserted" },
                }, `updated "${key}"`),
                description: `Updated its value to "${value}".`,
            })
            return { frames, slots: working, error: null, result: `updated "${key}" in bucket ${home}` }
        }

        const collided = working[home].entries.length > 0
        working[home].entries.push({ key, value, state: "default" })
        frames.push({
            snapshot: snap(working, CHAIN_LINES.append, home, home, 1, {
                slot: { [home]: collided ? "warning" : "comparing" },
                entry: { [working[home].entries.length - 1]: "inserted" },
            }, `"${key}" in bucket ${home}`),
            description: collided
                ? `Collision: bucket ${home} was already occupied, so "${key}" joins the chain — length ${working[home].entries.length}.`
                : `Bucket ${home} was empty. "${key}" goes straight in.`,
        })
        return { frames, slots: working, error: null, result: `"${key}" stored in bucket ${home}` }
    }

    // Open addressing.
    frames.push({
        snapshot: snap(working, PROBE_LINES.hash, home, home, 0, { slot: { [home]: "comparing" } }),
        description: `${sum}. Slot ${home} is the home slot.`,
    })

    for (let i = 0; i < size; i++) {
        const j = probeSlot(home, i, size, options.strategy, key, options.multiplier)
        const slot = working[j]

        frames.push({
            snapshot: snap(working, PROBE_LINES.next, j, home, i + 1, { slot: { [j]: "comparing" } }),
            description: i === 0
                ? `Probe 1: slot ${j}.`
                : `Occupied. Probe ${i + 1} under ${STRATEGY_LABELS[options.strategy].toLowerCase()} goes to slot ${j}.`,
        })

        if (slot.entries.length > 0 && slot.entries[0].key === key) {
            slot.entries[0].value = value
            frames.push({
                snapshot: snap(working, PROBE_LINES.update, j, home, i + 1, {
                    slot: { [j]: "inserted" }, entry: { 0: "inserted" },
                }, `updated "${key}"`),
                description: `Slot ${j} already holds "${key}". Updated in place after ${i + 1} probe${i ? "s" : ""}.`,
            })
            return { frames, slots: working, error: null, result: `updated "${key}" at slot ${j}` }
        }

        if (slot.entries.length === 0) {
            const reused = slot.tombstone
            slot.entries.push({ key, value, state: "default" })
            slot.tombstone = false
            frames.push({
                snapshot: snap(working, PROBE_LINES.place, j, home, i + 1, {
                    slot: { [j]: "inserted" }, entry: { 0: "inserted" },
                }, `"${key}" at slot ${j}`),
                description: reused
                    ? `Slot ${j} was a tombstone, so it can be reused. Stored after ${i + 1} probe${i ? "s" : ""}.`
                    : `Slot ${j} is free. Stored after ${i + 1} probe${i ? "s" : ""}.`,
            })
            return { frames, slots: working, error: null, result: `"${key}" stored at slot ${j} in ${i + 1} probe${i ? "s" : ""}` }
        }
    }

    // Quadratic probing can exhaust its sequence while the table still has room,
    // because (h + i^2) mod m does not necessarily visit every slot.
    const full = entryCount(working) >= size
    return {
        frames: [],
        slots: clone(slots),
        error: full
            ? `The table is full (${size}/${size}). Nothing more fits without resizing.`
            : `${STRATEGY_LABELS[options.strategy]} ran out of probes after ${size} attempts even though the table is not full — its sequence does not reach every slot. This is the classic failure of quadratic probing.`,
        result: null,
    }
}

/** Search, animating every probe. */
export function buildSearch(
    slots: readonly HashSlot[],
    key: string,
    options: HashOptions,
): HashResult {
    const invalid = validKey(key)
    if (invalid) return { frames: [], slots: clone(slots), error: invalid, result: null }

    const working = clone(slots)
    const size = working.length
    const frames: HashFrame[] = []
    const { index: home, working: sum } = hashOf(key, size, options.multiplier)

    if (options.strategy === "chaining") {
        frames.push({
            snapshot: snap(working, CHAIN_LINES.hash, home, home, 0, { slot: { [home]: "comparing" } }),
            description: `${sum}. Search bucket ${home}.`,
        })
        for (let i = 0; i < working[home].entries.length; i++) {
            const entry = working[home].entries[i]
            const hit = entry.key === key
            frames.push({
                snapshot: snap(working, hit ? CHAIN_LINES.update : CHAIN_LINES.walk, home, home, i + 1, {
                    slot: { [home]: "comparing" }, entry: { [i]: hit ? "inserted" : "comparing" },
                }, hit ? `${key} = ${entry.value}` : null),
                description: hit
                    ? `Found "${key}" at chain position ${i} after ${i + 1} comparison${i ? "s" : ""}. Value: ${entry.value}.`
                    : `Chain position ${i} holds "${entry.key}", not a match. Keep walking.`,
            })
            if (hit) return { frames, slots: working, error: null, result: `${key} = ${entry.value}` }
        }
        frames.push({
            snapshot: snap(working, CHAIN_LINES.walk, home, home, working[home].entries.length, {
                slot: { [home]: "warning" },
            }, `"${key}" not found`),
            description: `Reached the end of bucket ${home}'s chain. "${key}" is not in the table.`,
        })
        return { frames, slots: working, error: null, result: `"${key}" is not in the table` }
    }

    frames.push({
        snapshot: snap(working, PROBE_LINES.hash, home, home, 0, { slot: { [home]: "comparing" } }),
        description: `${sum}. Start probing at slot ${home}.`,
    })

    for (let i = 0; i < size; i++) {
        const j = probeSlot(home, i, size, options.strategy, key, options.multiplier)
        const slot = working[j]

        frames.push({
            snapshot: snap(working, PROBE_LINES.next, j, home, i + 1, { slot: { [j]: "comparing" } }),
            description: `Probe ${i + 1}: slot ${j}.`,
        })

        if (slot.entries.length === 0 && !slot.tombstone) {
            frames.push({
                snapshot: snap(working, PROBE_LINES.empty, j, home, i + 1, { slot: { [j]: "warning" } },
                    `"${key}" not found`),
                description: `Slot ${j} is empty and never held anything, so the probe chain ends here. "${key}" is not in the table.`,
            })
            return { frames, slots: working, error: null, result: `"${key}" is not in the table` }
        }

        if (slot.entries.length > 0 && slot.entries[0].key === key) {
            frames.push({
                snapshot: snap(working, PROBE_LINES.match, j, home, i + 1, {
                    slot: { [j]: "inserted" }, entry: { 0: "inserted" },
                }, `${key} = ${slot.entries[0].value}`),
                description: `Found "${key}" at slot ${j} after ${i + 1} probe${i ? "s" : ""}. Value: ${slot.entries[0].value}.`,
            })
            return { frames, slots: working, error: null, result: `${key} = ${slot.entries[0].value}` }
        }
    }

    return { frames, slots: working, error: null, result: `"${key}" is not in the table` }
}

/** Delete, leaving a tombstone behind under open addressing. */
export function buildDelete(
    slots: readonly HashSlot[],
    key: string,
    options: HashOptions,
): HashResult {
    const invalid = validKey(key)
    if (invalid) return { frames: [], slots: clone(slots), error: invalid, result: null }

    const working = clone(slots)
    const size = working.length
    const frames: HashFrame[] = []
    const { index: home, working: sum } = hashOf(key, size, options.multiplier)

    if (options.strategy === "chaining") {
        frames.push({
            snapshot: snap(working, CHAIN_LINES.hash, home, home, 0, { slot: { [home]: "comparing" } }),
            description: `${sum}. Look in bucket ${home}.`,
        })
        const at = working[home].entries.findIndex((e) => e.key === key)
        if (at === -1) {
            return { frames: [], slots: clone(slots), error: `"${key}" is not in the table.`, result: null }
        }
        frames.push({
            snapshot: snap(working, CHAIN_LINES.walk, home, home, at + 1, {
                slot: { [home]: "comparing" }, entry: { [at]: "removed" },
            }),
            description: `Found "${key}" at chain position ${at}.`,
        })
        working[home].entries.splice(at, 1)
        frames.push({
            snapshot: snap(working, CHAIN_LINES.update, home, home, at + 1, { slot: { [home]: "removed" } },
                `removed "${key}"`),
            description: `Unlinked from the chain. A chain needs no tombstone — the link simply closes.`,
        })
        return { frames, slots: working, error: null, result: `removed "${key}" from bucket ${home}` }
    }

    frames.push({
        snapshot: snap(working, PROBE_LINES.hash, home, home, 0, { slot: { [home]: "comparing" } }),
        description: `${sum}. Start probing at slot ${home}.`,
    })

    for (let i = 0; i < size; i++) {
        const j = probeSlot(home, i, size, options.strategy, key, options.multiplier)
        const slot = working[j]

        frames.push({
            snapshot: snap(working, PROBE_LINES.next, j, home, i + 1, { slot: { [j]: "comparing" } }),
            description: `Probe ${i + 1}: slot ${j}.`,
        })

        if (slot.entries.length === 0 && !slot.tombstone) break

        if (slot.entries.length > 0 && slot.entries[0].key === key) {
            slot.entries = []
            slot.tombstone = true
            frames.push({
                snapshot: snap(working, PROBE_LINES.place, j, home, i + 1, { slot: { [j]: "removed" } },
                    `removed "${key}"`),
                description: `Removed "${key}" and left a tombstone at slot ${j}. Clearing it outright would cut every probe chain that passes through here.`,
            })
            return { frames, slots: working, error: null, result: `removed "${key}", slot ${j} is now a tombstone` }
        }
    }

    return { frames: [], slots: clone(slots), error: `"${key}" is not in the table.`, result: null }
}
