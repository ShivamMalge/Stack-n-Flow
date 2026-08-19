/**
 * Sparse matrices: the triple representation, its transpose, and the linked form.
 *
 * BCS304 names sparse matrices twice — module 1 for the array-of-triples
 * representation and its transpose, module 3 for the linked representation.
 * Neither was built.
 *
 * The transpose is the reason the topic exists in an exam. The obvious method
 * rescans every triple once per column, which is O(cols x terms) and is
 * *slower* than transposing the dense matrix when the matrix is not very
 * sparse. The fast method counts first and computes where each column's terms
 * will land, giving O(cols + terms). Both are here so the operation counters
 * can be compared directly.
 *
 * Kept free of React so both methods can be tested against a reference.
 */

import type { VisualizerState } from "@/lib/visualizer-states"

export interface Triple {
    row: number
    col: number
    value: number
}

export interface TripleCell extends Triple {
    state: VisualizerState
}

export type TransposeMethod = "simple" | "fast"

export interface SparseSnapshot {
    /** Source triples, in row-major order. */
    triples: TripleCell[]
    /** Transposed triples built so far. */
    result: TripleCell[]
    /** Terms per column of the source. Fast transpose only. */
    rowTerms: number[] | null
    /** Where each column's run begins in the result. Fast transpose only. */
    startingPos: number[] | null
    /** Column currently being gathered, or -1. */
    scanCol: number
    /** Index of the source triple under examination, or -1. */
    cursor: number
    /** Triple inspections so far — the cost being compared. */
    inspections: number
    activeLine: number
    result_: string | null
}

export interface SparseFrame {
    snapshot: SparseSnapshot
    description: string
}

export interface SparseResult {
    frames: SparseFrame[]
    triples: Triple[]
    error: string | null
    inspections: number
}

export const MAX_DIMENSION = 6
export const MIN_DIMENSION = 2

/** Line indices into the visualizer's code panels. */
const SIMPLE_LINES = { outer: 1, inner: 2, test: 3, emit: 4 }
const FAST_LINES = { count: 1, positions: 3, place: 6, bump: 7 }

/** Non-zero entries in row-major order — the standard triple representation. */
export function toTriples(matrix: number[][]): Triple[] {
    const triples: Triple[] = []
    for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
            if (matrix[r][c] !== 0) triples.push({ row: r, col: c, value: matrix[r][c] })
        }
    }
    return triples
}

export function toDense(triples: readonly Triple[], rows: number, cols: number): number[][] {
    const dense = Array.from({ length: rows }, () => Array(cols).fill(0))
    for (const t of triples) {
        if (t.row < rows && t.col < cols) dense[t.row][t.col] = t.value
    }
    return dense
}

export function makeMatrix(rows: number, cols: number): number[][] {
    return Array.from({ length: rows }, () => Array(cols).fill(0))
}

/**
 * Storage in machine words for both forms.
 *
 * Triples only pay off below roughly one third density, because each term
 * costs three words against the dense form's one. That crossover is the point
 * worth showing, so it is computed rather than claimed.
 */
export function storageComparison(rows: number, cols: number, terms: number) {
    const dense = rows * cols
    // One header triple carrying rows, cols and the term count.
    const sparse = 3 * (terms + 1)
    return { dense, sparse, worthwhile: sparse < dense }
}

/** Reference transpose, for tests and for checking the animated versions. */
export function transposeTriples(triples: readonly Triple[]): Triple[] {
    return [...triples]
        .map((t) => ({ row: t.col, col: t.row, value: t.value }))
        .sort((a, b) => (a.row - b.row) || (a.col - b.col))
}

/** Grouped by row, for the linked representation view. */
export function rowChains(triples: readonly Triple[], rows: number): Triple[][] {
    return Array.from({ length: rows }, (_, r) => triples.filter((t) => t.row === r))
}

function snap(
    triples: readonly Triple[],
    result: readonly Triple[],
    partial: Partial<SparseSnapshot>,
    marks: { source?: Record<number, VisualizerState>; out?: Record<number, VisualizerState> } = {},
): SparseSnapshot {
    return {
        triples: triples.map((t, i) => ({ ...t, state: marks.source?.[i] ?? "default" })),
        result: result.map((t, i) => ({ ...t, state: marks.out?.[i] ?? "default" })),
        rowTerms: null,
        startingPos: null,
        scanCol: -1,
        cursor: -1,
        inspections: 0,
        activeLine: 0,
        result_: null,
        ...partial,
    }
}

/**
 * The obvious transpose: for each column of the source, sweep every triple
 * looking for it. Correct, and quadratic in the wrong things.
 */
export function buildSimpleTranspose(
    triples: readonly Triple[],
    cols: number,
): SparseResult {
    if (triples.length === 0) {
        return { frames: [], triples: [], error: "The matrix has no non-zero entries to transpose.", inspections: 0 }
    }

    const frames: SparseFrame[] = []
    const out: Triple[] = []
    let inspections = 0

    frames.push({
        snapshot: snap(triples, out, { activeLine: SIMPLE_LINES.outer, inspections }),
        description: `Sweep the ${triples.length} terms once for each of the ${cols} columns.`,
    })

    for (let c = 0; c < cols; c++) {
        frames.push({
            snapshot: snap(triples, out, { activeLine: SIMPLE_LINES.outer, scanCol: c, inspections }),
            description: `Gather every term whose column is ${c}.`,
        })

        for (let i = 0; i < triples.length; i++) {
            inspections++
            const t = triples[i]
            const hit = t.col === c

            frames.push({
                snapshot: snap(triples, out, {
                    activeLine: SIMPLE_LINES.test, scanCol: c, cursor: i, inspections,
                }, { source: { [i]: hit ? "pivot" : "comparing" } }),
                description: hit
                    ? `Term ${i} is (${t.row}, ${t.col}) — column matches.`
                    : `Term ${i} is in column ${t.col}, not ${c}. Skip.`,
            })

            if (hit) {
                out.push({ row: t.col, col: t.row, value: t.value })
                frames.push({
                    snapshot: snap(triples, out, {
                        activeLine: SIMPLE_LINES.emit, scanCol: c, cursor: i, inspections,
                    }, { source: { [i]: "visited" }, out: { [out.length - 1]: "inserted" } }),
                    description: `Emit it as (${t.col}, ${t.row}) — row and column swapped.`,
                })
            }
        }
    }

    frames.push({
        snapshot: snap(triples, out, {
            activeLine: SIMPLE_LINES.outer,
            inspections,
            result_: `${inspections} inspections for ${triples.length} terms across ${cols} columns`,
        }),
        description: `Done after ${inspections} inspections — ${cols} columns x ${triples.length} terms.`,
    })

    return { frames, triples: out, error: null, inspections }
}

/**
 * Fast transpose: count the terms per column, turn the counts into starting
 * positions, then place every term in one pass.
 */
export function buildFastTranspose(
    triples: readonly Triple[],
    cols: number,
): SparseResult {
    if (triples.length === 0) {
        return { frames: [], triples: [], error: "The matrix has no non-zero entries to transpose.", inspections: 0 }
    }

    const frames: SparseFrame[] = []
    const rowTerms = Array(cols).fill(0)
    const startingPos = Array(cols).fill(0)
    let inspections = 0

    frames.push({
        snapshot: snap(triples, [], { activeLine: FAST_LINES.count, rowTerms: [...rowTerms], inspections }),
        description: `Count how many terms sit in each of the ${cols} columns.`,
    })

    for (let i = 0; i < triples.length; i++) {
        inspections++
        rowTerms[triples[i].col]++
        frames.push({
            snapshot: snap(triples, [], {
                activeLine: FAST_LINES.count, cursor: i, rowTerms: [...rowTerms], inspections,
            }, { source: { [i]: "comparing" } }),
            description: `Term ${i} is in column ${triples[i].col}; that column now has ${rowTerms[triples[i].col]}.`,
        })
    }

    startingPos[0] = 0
    for (let c = 1; c < cols; c++) startingPos[c] = startingPos[c - 1] + rowTerms[c - 1]

    frames.push({
        snapshot: snap(triples, [], {
            activeLine: FAST_LINES.positions, rowTerms: [...rowTerms], startingPos: [...startingPos], inspections,
        }),
        description: `Running total gives where each column's run begins: [${startingPos.join(", ")}].`,
    })

    const out: (Triple | null)[] = Array(triples.length).fill(null)
    const cursorPos = [...startingPos]

    for (let i = 0; i < triples.length; i++) {
        inspections++
        const t = triples[i]
        const at = cursorPos[t.col]++
        out[at] = { row: t.col, col: t.row, value: t.value }

        frames.push({
            snapshot: snap(triples, out.filter((x): x is Triple => x !== null), {
                activeLine: FAST_LINES.place,
                cursor: i,
                rowTerms: [...rowTerms],
                startingPos: [...cursorPos],
                inspections,
            }, { source: { [i]: "pivot" }, out: { [out.filter((x) => x !== null).length - 1]: "inserted" } }),
            description: `(${t.row}, ${t.col}) belongs at position ${at}, because column ${t.col} starts there. One pass, no searching.`,
        })
    }

    const placed = out.filter((x): x is Triple => x !== null)
    frames.push({
        snapshot: snap(triples, placed, {
            activeLine: FAST_LINES.bump,
            rowTerms: [...rowTerms],
            startingPos: [...startingPos],
            inspections,
            result_: `${inspections} inspections for ${triples.length} terms across ${cols} columns`,
        }),
        description: `Done after ${inspections} inspections — ${cols} + ${triples.length} work rather than ${cols} x ${triples.length}.`,
    })

    return { frames, triples: placed, error: null, inspections }
}

export function buildTranspose(
    triples: readonly Triple[],
    cols: number,
    method: TransposeMethod,
): SparseResult {
    return method === "fast" ? buildFastTranspose(triples, cols) : buildSimpleTranspose(triples, cols)
}
