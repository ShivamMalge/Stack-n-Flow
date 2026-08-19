import { describe, it, expect } from "vitest"
import {
    buildAppend,
    buildRemove,
    loadFactor,
    logicalOrder,
    makeDynamic,
    physicalIndex,
    type DynMode,
    type DynState,
    DEFAULT_CAPACITY,
    MAX_CAPACITY,
    MIN_CAPACITY,
} from "@/lib/dynamic-array"

const MODES: DynMode[] = ["array", "stack", "queue"]

function appendAll(state: DynState, values: string[], mode: DynMode): DynState {
    let current = state
    for (const value of values) {
        const result = buildAppend(current, value, mode)
        if (!result.error) current = result.state
    }
    return current
}

function removeN(state: DynState, n: number, mode: DynMode): DynState {
    let current = state
    for (let i = 0; i < n; i++) {
        const result = buildRemove(current, mode)
        if (!result.error) current = result.state
    }
    return current
}

describe("makeDynamic", () => {
    it("starts empty at the default capacity", () => {
        const state = makeDynamic()
        expect(state.slots).toHaveLength(DEFAULT_CAPACITY)
        expect(state.size).toBe(0)
        expect(state.copies).toBe(0)
        expect(state.grows).toBe(0)
    })

    it("clamps the capacity", () => {
        expect(makeDynamic(0).slots).toHaveLength(MIN_CAPACITY)
        expect(makeDynamic(999).slots).toHaveLength(MAX_CAPACITY)
    })
})

describe("growth policy", () => {
    it.each(MODES)("doubles only when full (%s)", (mode) => {
        let state = makeDynamic(2)
        state = appendAll(state, ["a", "b"], mode)
        expect(state.slots).toHaveLength(2)
        expect(state.grows).toBe(0)

        state = appendAll(state, ["c"], mode)
        expect(state.slots).toHaveLength(4)
        expect(state.grows).toBe(1)
    })

    it.each(MODES)("keeps every element across a grow (%s)", (mode) => {
        const state = appendAll(makeDynamic(2), ["a", "b", "c", "d", "e"], mode)
        expect(logicalOrder(state, mode)).toEqual(["a", "b", "c", "d", "e"])
    })

    it("doubles capacity 2 -> 4 -> 8 -> 16", () => {
        const caps: number[] = []
        let state = makeDynamic(2)
        for (const value of ["a", "b", "c", "d", "e", "f", "g", "h", "i"]) {
            state = buildAppend(state, value, "array").state
            caps.push(state.slots.length)
        }
        expect([...new Set(caps)]).toEqual([2, 4, 8, 16])
    })

    // The amortised argument: n appends cost fewer than 2n copies in total,
    // which is why appending is O(1) amortised despite the O(n) copy.
    it("keeps total copies below 2n", () => {
        let state = makeDynamic(1)
        const n = 16
        for (let i = 0; i < n; i++) state = buildAppend(state, String(i), "array").state
        expect(state.size).toBe(n)
        expect(state.copies).toBeLessThan(2 * n)
        expect(state.copies).toBeGreaterThan(0)
    })

    it("refuses to grow past the demo ceiling rather than silently truncating", () => {
        let state = makeDynamic(MAX_CAPACITY)
        state = appendAll(state, Array.from({ length: MAX_CAPACITY }, (_, i) => String(i)), "array")
        expect(state.size).toBe(MAX_CAPACITY)
        const overflow = buildAppend(state, "x", "array")
        expect(overflow.error).toMatch(/ceiling/)
        expect(overflow.frames).toHaveLength(0)
    })

    it("never shrinks on removal", () => {
        let state = appendAll(makeDynamic(2), ["a", "b", "c", "d", "e"], "array")
        const grown = state.slots.length
        state = removeN(state, 4, "array")
        expect(state.size).toBe(1)
        expect(state.slots).toHaveLength(grown)
    })
})

describe("stack mode", () => {
    it("removes the most recently added element", () => {
        let state = appendAll(makeDynamic(4), ["a", "b", "c"], "stack")
        state = buildRemove(state, "stack").state
        expect(logicalOrder(state, "stack")).toEqual(["a", "b"])
    })

    it("reports the popped value", () => {
        const state = appendAll(makeDynamic(4), ["a", "b"], "stack")
        expect(buildRemove(state, "stack").result).toBe('removed "b"')
    })

    it("refuses to pop when empty", () => {
        expect(buildRemove(makeDynamic(4), "stack").error).toMatch(/Stack is empty/)
    })
})

describe("queue mode", () => {
    it("removes the earliest added element", () => {
        let state = appendAll(makeDynamic(4), ["a", "b", "c"], "queue")
        state = buildRemove(state, "queue").state
        expect(logicalOrder(state, "queue")).toEqual(["b", "c"])
    })

    it("walks front forward and wraps", () => {
        let state = appendAll(makeDynamic(4), ["a", "b", "c", "d"], "queue")
        state = removeN(state, 3, "queue")
        expect(state.front).toBe(3)
        state = appendAll(state, ["e", "f"], "queue")
        // e and f wrap round to physical slots 0 and 1.
        expect(state.slots[0]).toBe("e")
        expect(logicalOrder(state, "queue")).toEqual(["d", "e", "f"])
    })

    it("maps logical to physical with the modulo", () => {
        const state: DynState = { slots: ["c", null, "a", "b"], size: 3, front: 2, copies: 0, grows: 0 }
        expect(physicalIndex(state, 0, "queue")).toBe(2)
        expect(physicalIndex(state, 2, "queue")).toBe(0)
        expect(logicalOrder(state, "queue")).toEqual(["a", "b", "c"])
    })

    // Copying physically would carry the split layout into the bigger array,
    // leaving a hole between rear and front. Copying logically unwraps it.
    it("unwraps a wrapped queue when it grows", () => {
        let state = appendAll(makeDynamic(4), ["a", "b", "c", "d"], "queue")
        state = removeN(state, 2, "queue")
        state = appendAll(state, ["e", "f"], "queue")
        expect(state.front).toBe(2) // wrapped: c d at 2,3 and e f at 0,1
        expect(state.size).toBe(4)

        state = buildAppend(state, "g", "queue").state
        expect(state.slots).toHaveLength(8)
        expect(state.front).toBe(0)
        expect(state.slots.slice(0, 5)).toEqual(["c", "d", "e", "f", "g"])
        expect(logicalOrder(state, "queue")).toEqual(["c", "d", "e", "f", "g"])
    })

    it("says so in the frames when it unwraps", () => {
        let state = appendAll(makeDynamic(4), ["a", "b", "c", "d"], "queue")
        state = removeN(state, 2, "queue")
        state = appendAll(state, ["e", "f"], "queue")
        const { frames } = buildAppend(state, "g", "queue")
        expect(frames.some((f) => f.description.includes("unwrap"))).toBe(true)
    })

    it("refuses to dequeue when empty", () => {
        expect(buildRemove(makeDynamic(4), "queue").error).toMatch(/Queue is empty/)
    })
})

describe("frames", () => {
    it("shows the old array only while copying", () => {
        const state = appendAll(makeDynamic(2), ["a", "b"], "array")
        const { frames } = buildAppend(state, "c", "array")
        expect(frames.some((f) => f.snapshot.oldCells !== null)).toBe(true)
        expect(frames[frames.length - 1].snapshot.oldCells).toBeNull()
    })

    it("emits no frames and no change when it errors", () => {
        const state = makeDynamic(4)
        const result = buildAppend(state, "", "array")
        expect(result.frames).toHaveLength(0)
        expect(result.state.size).toBe(0)
    })

    it("carries the running copy count", () => {
        const state = appendAll(makeDynamic(2), ["a", "b"], "array")
        const { frames } = buildAppend(state, "c", "array")
        expect(frames[frames.length - 1].snapshot.copies).toBe(2)
    })

    it("never reports size above capacity", () => {
        let state = makeDynamic(1)
        for (let i = 0; i < 10; i++) {
            const { frames } = buildAppend(state, String(i), "array")
            for (const f of frames) {
                expect(f.snapshot.size).toBeLessThanOrEqual(f.snapshot.capacity)
            }
            state = buildAppend(state, String(i), "array").state
        }
    })
})

describe("loadFactor", () => {
    it("is size over capacity", () => {
        const state = appendAll(makeDynamic(4), ["a", "b"], "array")
        expect(loadFactor(state)).toBe(0.5)
    })

    it("hits 1 exactly before a grow and halves after", () => {
        let state = appendAll(makeDynamic(4), ["a", "b", "c", "d"], "array")
        expect(loadFactor(state)).toBe(1)
        state = buildAppend(state, "e", "array").state
        expect(loadFactor(state)).toBeCloseTo(5 / 8)
    })
})
