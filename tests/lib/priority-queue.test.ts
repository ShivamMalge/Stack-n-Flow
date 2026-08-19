import { describe, it, expect } from "vitest"
import {
    buildExtract,
    buildInsert,
    holdsInvariant,
    isMinLevel,
    levelOf,
    maxIndex,
    minIndex,
    type PQMode,
    MAX_SIZE,
} from "@/lib/priority-queue"

const MODES: PQMode[] = ["min", "max", "minmax"]

function insertAll(values: number[], mode: PQMode): number[] {
    let heap: number[] = []
    for (const v of values) {
        const result = buildInsert(heap, v, mode)
        if (!result.error) heap = result.heap
    }
    return heap
}

/** Repeatedly extract one end and collect what comes out. */
function drain(heap: number[], mode: PQMode, end: "min" | "max"): number[] {
    const out: number[] = []
    let current = heap
    while (current.length > 0) {
        const result = buildExtract(current, mode, end)
        if (result.error) break
        out.push(Number(result.result!.replace("extracted ", "")))
        current = result.heap
    }
    return out
}

const SAMPLE = [42, 17, 93, 8, 55, 31, 76, 4, 61, 23]

describe("level helpers", () => {
    it("numbers the levels of a complete binary tree", () => {
        expect([0, 1, 2, 3, 6, 7, 14].map(levelOf)).toEqual([0, 1, 1, 2, 2, 3, 3])
    })

    it("alternates min and max levels from the root", () => {
        expect([0, 1, 2, 3, 4, 5, 6, 7].map(isMinLevel))
            .toEqual([true, false, false, true, true, true, true, false])
    })
})

describe("the min-max invariant", () => {
    // The shape of a min-max heap after an operation is not something you can
    // eyeball, so every structural test asserts the invariant rather than a
    // hard-coded array.
    it("accepts a correct heap", () => {
        expect(holdsInvariant([8, 71, 41, 31, 10, 11, 16, 46, 51, 31], "minmax")).toBe(true)
    })

    it("rejects a min level holding more than a descendant", () => {
        expect(holdsInvariant([50, 71, 41, 31], "minmax")).toBe(false)
    })

    it("rejects a max level holding less than a descendant", () => {
        expect(holdsInvariant([8, 20, 41, 99], "minmax")).toBe(false)
    })

    it("checks whole subtrees, not just parents", () => {
        // 5 is a grandchild of the min root 8 and smaller than it, which only
        // shows if descendants beyond the immediate children are inspected.
        expect(holdsInvariant([8, 90, 80, 5], "minmax")).toBe(false)
    })

    it("holds after every insert", () => {
        let heap: number[] = []
        for (const value of SAMPLE) {
            heap = buildInsert(heap, value, "minmax").heap
            expect(holdsInvariant(heap, "minmax"), `broken after inserting ${value}: ${heap}`).toBe(true)
        }
    })

    it("holds after every extract from either end", () => {
        for (const end of ["min", "max"] as const) {
            let heap = insertAll(SAMPLE, "minmax")
            while (heap.length > 0) {
                heap = buildExtract(heap, "minmax", end).heap
                expect(holdsInvariant(heap, "minmax"), `broken after extract-${end}: ${heap}`).toBe(true)
            }
        }
    })

    it("holds under alternating extracts", () => {
        let heap = insertAll(SAMPLE, "minmax")
        let takeMin = true
        while (heap.length > 0) {
            heap = buildExtract(heap, "minmax", takeMin ? "min" : "max").heap
            expect(holdsInvariant(heap, "minmax")).toBe(true)
            takeMin = !takeMin
        }
    })
})

describe("ordinary heaps", () => {
    it.each(["min", "max"] as const)("keeps the heap property after inserts (%s)", (mode) => {
        let heap: number[] = []
        for (const value of SAMPLE) {
            heap = buildInsert(heap, value, mode).heap
            expect(holdsInvariant(heap, mode)).toBe(true)
        }
    })

    it("drains a min-heap in ascending order", () => {
        expect(drain(insertAll(SAMPLE, "min"), "min", "min")).toEqual([...SAMPLE].sort((a, b) => a - b))
    })

    it("drains a max-heap in descending order", () => {
        expect(drain(insertAll(SAMPLE, "max"), "max", "max")).toEqual([...SAMPLE].sort((a, b) => b - a))
    })

    // The whole reason the double-ended structure exists.
    it("refuses the wrong end and says why", () => {
        expect(buildExtract(insertAll(SAMPLE, "min"), "min", "max").error).toMatch(/min-max heap is for/)
        expect(buildExtract(insertAll(SAMPLE, "max"), "max", "min").error).toMatch(/min-max heap is for/)
    })
})

describe("the min-max heap as a double-ended queue", () => {
    it("drains ascending from the min end", () => {
        expect(drain(insertAll(SAMPLE, "minmax"), "minmax", "min")).toEqual([...SAMPLE].sort((a, b) => a - b))
    })

    it("drains descending from the max end", () => {
        expect(drain(insertAll(SAMPLE, "minmax"), "minmax", "max")).toEqual([...SAMPLE].sort((a, b) => b - a))
    })

    it("keeps the minimum at the root", () => {
        const heap = insertAll(SAMPLE, "minmax")
        expect(minIndex(heap, "minmax")).toBe(0)
        expect(heap[0]).toBe(Math.min(...SAMPLE))
    })

    // This is the property that makes extract-max O(log n) rather than O(n).
    it("keeps the maximum as a child of the root", () => {
        const heap = insertAll(SAMPLE, "minmax")
        const at = maxIndex(heap, "minmax")
        expect([1, 2]).toContain(at)
        expect(heap[at]).toBe(Math.max(...SAMPLE))
    })

    it("holds both ends on a range of random inputs", () => {
        // Deterministic pseudo-random, so a failure can be reproduced.
        let seed = 12345
        const next = () => (seed = (seed * 1103515245 + 12345) % 2147483648) % 900 + 1
        for (let trial = 0; trial < 40; trial++) {
            const values = Array.from({ length: 12 }, next)
            const heap = insertAll(values, "minmax")
            expect(holdsInvariant(heap, "minmax"), `trial ${trial}: ${values}`).toBe(true)
            expect(heap[0]).toBe(Math.min(...values))
            expect(heap[maxIndex(heap, "minmax")]).toBe(Math.max(...values))
        }
    })

    it("handles the small sizes where root and children overlap", () => {
        for (const values of [[5], [5, 3], [5, 3, 9], [5, 3, 9, 1]]) {
            const heap = insertAll(values, "minmax")
            expect(holdsInvariant(heap, "minmax")).toBe(true)
            expect(heap[0]).toBe(Math.min(...values))
            expect(heap[maxIndex(heap, "minmax")]).toBe(Math.max(...values))
        }
    })
})

describe("validation and frames", () => {
    it.each(MODES)("rejects an out-of-range value (%s)", (mode) => {
        expect(buildInsert([], 0, mode).error).toMatch(/between/)
        expect(buildInsert([], 1000, mode).error).toMatch(/between/)
        expect(buildInsert([], 1.5, mode).error).toMatch(/whole number/)
    })

    it("caps the size so the tree stays readable", () => {
        const heap = insertAll(Array.from({ length: MAX_SIZE }, (_, i) => i + 1), "minmax")
        expect(heap).toHaveLength(MAX_SIZE)
        expect(buildInsert(heap, 500, "minmax").error).toMatch(/holds 20/)
    })

    it("refuses to extract from an empty queue", () => {
        expect(buildExtract([], "minmax", "min").error).toMatch(/empty/)
    })

    it("emits no frames and no change when it errors", () => {
        const heap = insertAll(SAMPLE, "minmax")
        const bad = buildInsert(heap, 0, "minmax")
        expect(bad.frames).toHaveLength(0)
        expect(bad.heap).toEqual(heap)
    })

    it("counts comparisons monotonically", () => {
        const heap = insertAll(SAMPLE, "minmax")
        let seen = 0
        for (const frame of buildInsert(heap, 50, "minmax").frames) {
            expect(frame.snapshot.comparisons).toBeGreaterThanOrEqual(seen)
            seen = frame.snapshot.comparisons
        }
    })

    it("ends every operation on a frame carrying the result", () => {
        const heap = insertAll(SAMPLE, "minmax")
        for (const outcome of [buildInsert(heap, 50, "minmax"), buildExtract(heap, "minmax", "max")]) {
            expect(outcome.frames[outcome.frames.length - 1].snapshot.result).toBeTruthy()
        }
    })

    it("shrinks the heap by exactly one per extract", () => {
        const heap = insertAll(SAMPLE, "minmax")
        expect(buildExtract(heap, "minmax", "min").heap).toHaveLength(heap.length - 1)
    })

    it("keeps every remaining value after an extract", () => {
        const heap = insertAll(SAMPLE, "minmax")
        const { heap: after } = buildExtract(heap, "minmax", "max")
        const expected = [...SAMPLE].sort((a, b) => a - b).slice(0, -1)
        expect([...after].sort((a, b) => a - b)).toEqual(expected)
    })
})
