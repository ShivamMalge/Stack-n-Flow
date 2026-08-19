import { describe, it, expect } from "vitest"
import {
    buildFastTranspose,
    buildSimpleTranspose,
    buildTranspose,
    makeMatrix,
    rowChains,
    storageComparison,
    toDense,
    toTriples,
    transposeTriples,
    type Triple,
} from "@/lib/sparse-matrix"

/** The worked example most textbooks use for this topic. */
const SAMPLE = [
    [15, 0, 0, 22, 0, -15],
    [0, 11, 3, 0, 0, 0],
    [0, 0, 0, -6, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [91, 0, 0, 0, 0, 0],
    [0, 0, 28, 0, 0, 0],
]

const key = (t: Triple) => `${t.row},${t.col},${t.value}`

describe("toTriples", () => {
    it("keeps only non-zero entries, in row-major order", () => {
        const triples = toTriples(SAMPLE)
        expect(triples).toHaveLength(8)
        expect(triples[0]).toEqual({ row: 0, col: 0, value: 15 })
        expect(triples[1]).toEqual({ row: 0, col: 3, value: 22 })
        expect(triples[7]).toEqual({ row: 5, col: 2, value: 28 })
    })

    it("keeps negative values", () => {
        expect(toTriples(SAMPLE).some((t) => t.value === -15)).toBe(true)
    })

    it("returns nothing for an all-zero matrix", () => {
        expect(toTriples(makeMatrix(4, 4))).toEqual([])
    })

    it("round-trips through toDense", () => {
        expect(toDense(toTriples(SAMPLE), 6, 6)).toEqual(SAMPLE)
    })
})

describe("storageComparison", () => {
    it("counts three words per term plus a header", () => {
        const { dense, sparse } = storageComparison(6, 6, 8)
        expect(dense).toBe(36)
        expect(sparse).toBe(27)
    })

    // Triples cost three words per term against the dense form's one, so they
    // only pay off below roughly a third density. Worth showing, not claiming.
    it("stops being worthwhile as density rises", () => {
        expect(storageComparison(6, 6, 8).worthwhile).toBe(true)
        expect(storageComparison(6, 6, 20).worthwhile).toBe(false)
    })
})

describe("transposeTriples", () => {
    it("swaps row and column", () => {
        const out = transposeTriples([{ row: 1, col: 4, value: 9 }])
        expect(out).toEqual([{ row: 4, col: 1, value: 9 }])
    })

    it("returns row-major order", () => {
        const out = transposeTriples(toTriples(SAMPLE))
        for (let i = 1; i < out.length; i++) {
            const prev = out[i - 1]
            const cur = out[i]
            expect(prev.row < cur.row || (prev.row === cur.row && prev.col < cur.col)).toBe(true)
        }
    })

    it("is its own inverse", () => {
        const triples = toTriples(SAMPLE)
        expect(transposeTriples(transposeTriples(triples)).map(key)).toEqual(triples.map(key))
    })
})

describe("both transpose methods", () => {
    const triples = toTriples(SAMPLE)

    it("agree with the reference", () => {
        const reference = transposeTriples(triples).map(key)
        expect(buildSimpleTranspose(triples, 6).triples.map(key)).toEqual(reference)
        expect(buildFastTranspose(triples, 6).triples.map(key)).toEqual(reference)
    })

    it("agree with each other on a range of shapes", () => {
        const shapes: number[][][] = [
            [[1, 0], [0, 2]],
            [[0, 0, 5], [0, 0, 0], [7, 0, 0]],
            [[1, 2, 3], [4, 5, 6]],
            [[0, 1, 0, 0, 0, 2]],
        ]
        for (const matrix of shapes) {
            const t = toTriples(matrix)
            const cols = matrix[0].length
            expect(buildSimpleTranspose(t, cols).triples.map(key))
                .toEqual(buildFastTranspose(t, cols).triples.map(key))
        }
    })

    it("produce the transpose of the dense matrix", () => {
        const out = buildFastTranspose(triples, 6).triples
        const dense = toDense(out, 6, 6)
        for (let r = 0; r < 6; r++) {
            for (let c = 0; c < 6; c++) expect(dense[r][c]).toBe(SAMPLE[c][r])
        }
    })

    it("keep every term", () => {
        expect(buildSimpleTranspose(triples, 6).triples).toHaveLength(triples.length)
        expect(buildFastTranspose(triples, 6).triples).toHaveLength(triples.length)
    })

    it("refuse an empty matrix rather than animating nothing", () => {
        expect(buildSimpleTranspose([], 4).error).toMatch(/no non-zero/)
        expect(buildFastTranspose([], 4).error).toMatch(/no non-zero/)
        expect(buildSimpleTranspose([], 4).frames).toHaveLength(0)
    })

    it("are selectable through buildTranspose", () => {
        expect(buildTranspose(triples, 6, "fast").inspections)
            .toBe(buildFastTranspose(triples, 6).inspections)
    })
})

describe("the cost difference", () => {
    const triples = toTriples(SAMPLE)

    // This is the reason the fast method is taught at all.
    it("charges the simple method cols x terms", () => {
        expect(buildSimpleTranspose(triples, 6).inspections).toBe(6 * triples.length)
    })

    it("charges the fast method two passes over the terms", () => {
        expect(buildFastTranspose(triples, 6).inspections).toBe(2 * triples.length)
    })

    it("widens the gap as columns grow", () => {
        const wide = [[1, 0, 0, 0, 0, 2]]
        const t = toTriples(wide)
        const simple = buildSimpleTranspose(t, 6).inspections
        const fast = buildFastTranspose(t, 6).inspections
        expect(simple).toBeGreaterThan(fast)
    })
})

describe("frames", () => {
    const triples = toTriples(SAMPLE)

    it("never let the output shrink", () => {
        for (const build of [buildSimpleTranspose, buildFastTranspose]) {
            let seen = 0
            for (const frame of build(triples, 6).frames) {
                expect(frame.snapshot.result.length).toBeGreaterThanOrEqual(seen)
                seen = frame.snapshot.result.length
            }
        }
    })

    it("count inspections monotonically", () => {
        let seen = 0
        for (const frame of buildSimpleTranspose(triples, 6).frames) {
            expect(frame.snapshot.inspections).toBeGreaterThanOrEqual(seen)
            seen = frame.snapshot.inspections
        }
    })

    it("show the counting arrays only in the fast method", () => {
        expect(buildSimpleTranspose(triples, 6).frames.every((f) => f.snapshot.rowTerms === null)).toBe(true)
        expect(buildFastTranspose(triples, 6).frames.some((f) => f.snapshot.rowTerms !== null)).toBe(true)
    })

    it("finish with the full result on the last frame", () => {
        for (const build of [buildSimpleTranspose, buildFastTranspose]) {
            const { frames } = build(triples, 6)
            const last = frames[frames.length - 1].snapshot
            expect(last.result).toHaveLength(triples.length)
            expect(last.result_).toBeTruthy()
        }
    })

    it("derive starting positions as a running total of the counts", () => {
        const { frames } = buildFastTranspose(triples, 6)
        const withPositions = frames.find((f) => f.snapshot.startingPos !== null)!
        const { rowTerms, startingPos } = withPositions.snapshot
        for (let c = 1; c < startingPos!.length; c++) {
            expect(startingPos![c]).toBe(startingPos![c - 1] + rowTerms![c - 1])
        }
    })
})

describe("rowChains", () => {
    it("groups terms by row for the linked view", () => {
        const chains = rowChains(toTriples(SAMPLE), 6)
        expect(chains).toHaveLength(6)
        expect(chains[0].map((t) => t.col)).toEqual([0, 3, 5])
        expect(chains[3]).toEqual([]) // the all-zero row
    })

    it("keeps every term across the chains", () => {
        const triples = toTriples(SAMPLE)
        expect(rowChains(triples, 6).flat()).toHaveLength(triples.length)
    })
})
