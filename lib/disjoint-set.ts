/**
 * Disjoint sets (union-find), as step sequences.
 *
 * BCS304 module 4 calls this "Representation of disjoint sets", and the
 * representation *is* the topic: a parent array that encodes a forest. So both
 * are surfaced — the trees and the array they are stored in — and the two
 * optimisations are toggles rather than assumptions, because seeing what
 * happens without them is the argument for having them.
 *
 * Kruskal's algorithm in BCS401 module 4 needs exactly this, so it is
 * deliberately a standalone module rather than something private to a
 * component.
 *
 * Kept free of React so the algorithm can be tested directly.
 */

import type { VisualizerState } from "@/lib/visualizer-states"

export interface DsuNodeState {
    id: number
    /** Index of the parent. A root is its own parent. */
    parent: number
    /** Upper bound on tree height, used by union by rank. */
    rank: number
    state: VisualizerState
}

export interface DsuSnapshot {
    nodes: DsuNodeState[]
    activeLine: number
    /** Set on the final frame of an operation. */
    result: string | null
}

export interface DsuFrame {
    snapshot: DsuSnapshot
    description: string
}

export interface DsuResult {
    frames: DsuFrame[]
    /** State after the operation. Unchanged from the input when `error` is set. */
    nodes: DsuNodeState[]
    error: string | null
    result: string | null
}

export interface DsuOptions {
    /** Point every node on the find path straight at the root. */
    pathCompression: boolean
    /** Hang the shorter tree under the taller one. */
    unionByRank: boolean
}

/** Line indices into the code panels; see the visualizer's FIND_CODE/UNION_CODE. */
const FIND_LINES = { check: 1, walk: 2, compress: 3 }
const UNION_FIND_LINES = { check: 1, walk: 1, compress: 1 }

export const MIN_SET_SIZE = 2
export const MAX_SET_SIZE = 16

/** n singleton sets, each its own parent — the `makeSet` of the textbook. */
export function makeSets(n: number): DsuNodeState[] {
    const size = Math.max(MIN_SET_SIZE, Math.min(MAX_SET_SIZE, Math.trunc(n)))
    return Array.from({ length: size }, (_, id) => ({ id, parent: id, rank: 0, state: "default" as VisualizerState }))
}

function clone(nodes: readonly DsuNodeState[]): DsuNodeState[] {
    return nodes.map((node) => ({ ...node, state: "default" as VisualizerState }))
}

/** Root of `x`, with no frames and no mutation. For assertions and callers. */
export function findRoot(nodes: readonly DsuNodeState[], x: number): number {
    let cur = x
    // The parent array is always a forest, so this cannot cycle; the bound is
    // belt and braces against a malformed input.
    for (let guard = 0; guard <= nodes.length; guard++) {
        if (nodes[cur].parent === cur) return cur
        cur = nodes[cur].parent
    }
    return cur
}

/** True when every element sits in the same set. */
export function isSingleSet(nodes: readonly DsuNodeState[]): boolean {
    return nodes.filter((node) => node.parent === node.id).length === 1
}

export function setCount(nodes: readonly DsuNodeState[]): number {
    return nodes.filter((node) => node.parent === node.id).length
}

/** Members of each set, keyed by root, for the legend and assertions. */
export function groupsOf(nodes: readonly DsuNodeState[]): Map<number, number[]> {
    const groups = new Map<number, number[]>()
    for (const node of nodes) {
        const root = findRoot(nodes, node.id)
        const members = groups.get(root)
        if (members) members.push(node.id)
        else groups.set(root, [node.id])
    }
    return groups
}

function snap(
    nodes: readonly DsuNodeState[],
    activeLine: number,
    marks: Record<number, VisualizerState>,
    result: string | null = null,
): DsuSnapshot {
    return {
        nodes: nodes.map((node) => ({ ...node, state: marks[node.id] ?? "default" })),
        activeLine,
        result,
    }
}

function validIndex(nodes: readonly DsuNodeState[], x: number, label: string): string | null {
    if (!Number.isInteger(x)) return `${label} must be a whole number.`
    if (x < 0 || x >= nodes.length) return `${label} must be between 0 and ${nodes.length - 1}.`
    return null
}

/**
 * Walks `x` up to its root, recording a frame per hop, then compresses the path
 * if asked. Returns the frames plus the mutated nodes.
 */
interface FindLines {
    /** Line for "checking whether this node is the root". */
    check: number
    /** Line for "step to the parent". */
    walk: number
    /** Line for "re-point at the root". */
    compress: number
}

function runFind(
    nodes: DsuNodeState[],
    x: number,
    options: DsuOptions,
    frames: DsuFrame[],
    label: string,
    // union() runs two finds inside itself, so it maps every find frame onto
    // its own `ra, rb = find(a), find(b)` line rather than highlighting lines
    // from a function whose source is not on screen.
    lines: FindLines,
): number {
    const path: number[] = []
    let cur = x

    frames.push({
        snapshot: snap(nodes, lines.check, { [cur]: "comparing" }),
        description: `${label}: start at ${cur}.`,
    })

    while (nodes[cur].parent !== cur) {
        path.push(cur)
        const next = nodes[cur].parent
        frames.push({
            snapshot: snap(nodes, lines.walk, {
                ...Object.fromEntries(path.map((id) => [id, "visited" as VisualizerState])),
                [next]: "comparing",
            }),
            description: `parent[${cur}] = ${next}, so walk up to ${next}.`,
        })
        cur = next
    }

    const root = cur
    frames.push({
        snapshot: snap(nodes, lines.check, {
            ...Object.fromEntries(path.map((id) => [id, "visited" as VisualizerState])),
            [root]: "pivot",
        }),
        description: `parent[${root}] = ${root}, so ${root} is the root.`,
    })

    if (options.pathCompression && path.length > 0) {
        for (const id of path) {
            if (nodes[id].parent === root) continue
            nodes[id].parent = root
            frames.push({
                snapshot: snap(nodes, lines.compress, { [id]: "inserted", [root]: "pivot" }),
                description: `Path compression: point ${id} straight at ${root}.`,
            })
        }
    }

    return root
}

/** Find with animation. */
export function buildFind(
    nodes: readonly DsuNodeState[],
    x: number,
    options: DsuOptions,
): DsuResult {
    const invalid = validIndex(nodes, x, "Element")
    if (invalid) return { frames: [], nodes: clone(nodes), error: invalid, result: null }

    const working = clone(nodes)
    const frames: DsuFrame[] = []
    const root = runFind(working, x, options, frames, `find(${x})`, FIND_LINES)

    frames.push({
        snapshot: snap(working, 4, { [root]: "pivot", [x]: x === root ? "pivot" : "visited" }, `find(${x}) = ${root}`),
        description: `find(${x}) returns ${root}.`,
    })

    return { frames, nodes: working, error: null, result: `find(${x}) = ${root}` }
}

/** Union with animation, running a find on each argument first. */
export function buildUnion(
    nodes: readonly DsuNodeState[],
    a: number,
    b: number,
    options: DsuOptions,
): DsuResult {
    const invalidA = validIndex(nodes, a, "First element")
    if (invalidA) return { frames: [], nodes: clone(nodes), error: invalidA, result: null }
    const invalidB = validIndex(nodes, b, "Second element")
    if (invalidB) return { frames: [], nodes: clone(nodes), error: invalidB, result: null }

    const working = clone(nodes)
    const frames: DsuFrame[] = []

    let rootA = runFind(working, a, options, frames, `union(${a}, ${b}) — find(${a})`, UNION_FIND_LINES)
    let rootB = runFind(working, b, options, frames, `union(${a}, ${b}) — find(${b})`, UNION_FIND_LINES)

    if (rootA === rootB) {
        frames.push({
            snapshot: snap(working, 2, { [rootA]: "pivot" }, `${a} and ${b} were already together`),
            description: `Both roots are ${rootA}: ${a} and ${b} are already in the same set. Nothing to do.`,
        })
        return { frames, nodes: working, error: null, result: `${a} and ${b} were already in the same set` }
    }

    if (options.unionByRank && working[rootA].rank < working[rootB].rank) {
        frames.push({
            snapshot: snap(working, 3, { [rootA]: "comparing", [rootB]: "pivot" }),
            description: `rank[${rootA}] = ${working[rootA].rank} < rank[${rootB}] = ${working[rootB].rank}, so ${rootB} becomes the parent.`,
        })
        const swap = rootA
        rootA = rootB
        rootB = swap
    } else if (options.unionByRank) {
        frames.push({
            snapshot: snap(working, 3, { [rootA]: "pivot", [rootB]: "comparing" }),
            description: `rank[${rootA}] = ${working[rootA].rank} >= rank[${rootB}] = ${working[rootB].rank}, so ${rootA} stays the parent.`,
        })
    }

    working[rootB].parent = rootA
    frames.push({
        snapshot: snap(working, 4, { [rootA]: "pivot", [rootB]: "inserted" }),
        description: `parent[${rootB}] = ${rootA}. The two trees are now one.`,
    })

    if (options.unionByRank && working[rootA].rank === working[rootB].rank) {
        working[rootA].rank += 1
        frames.push({
            snapshot: snap(working, 5, { [rootA]: "pivot" }),
            description: `The ranks were equal, so rank[${rootA}] becomes ${working[rootA].rank}.`,
        })
    }

    const result = `${a} and ${b} joined under ${rootA}`
    frames.push({
        snapshot: snap(working, 5, { [rootA]: "pivot" }, result),
        description: `union(${a}, ${b}) done. ${setCount(working)} set${setCount(working) === 1 ? "" : "s"} remain.`,
    })

    return { frames, nodes: working, error: null, result }
}

export interface ForestLayout {
    positions: Map<number, { x: number; y: number }>
    /** Total width in slot units. */
    width: number
    /** Deepest level, zero-based. */
    depth: number
}

/**
 * Lays the forest out in slot units: leaves take consecutive slots, a parent
 * centres over its children, and each tree is separated by a one-slot gap.
 *
 * Pure and unit-testable, like lib/tree-layout.ts — deriving the drawing area
 * from real extents rather than a guess is what stopped the tree visualizer
 * clipping nodes it had no way to scroll to.
 */
export function layoutForest(nodes: readonly DsuNodeState[]): ForestLayout {
    const children = new Map<number, number[]>()
    for (const node of nodes) {
        if (node.parent === node.id) continue
        const siblings = children.get(node.parent)
        if (siblings) siblings.push(node.id)
        else children.set(node.parent, [node.id])
    }

    const positions = new Map<number, { x: number; y: number }>()
    let cursor = 0
    let depth = 0

    const place = (id: number, level: number): number => {
        depth = Math.max(depth, level)
        const kids = children.get(id) ?? []
        if (kids.length === 0) {
            const x = cursor
            cursor += 1
            positions.set(id, { x, y: level })
            return x
        }
        const xs = kids.map((kid) => place(kid, level + 1))
        const x = (xs[0] + xs[xs.length - 1]) / 2
        positions.set(id, { x, y: level })
        return x
    }

    const roots = nodes.filter((node) => node.parent === node.id).map((node) => node.id)
    for (const root of roots) {
        place(root, 0)
        cursor += 1 // gap between trees
    }

    return { positions, width: Math.max(0, cursor - 1), depth }
}
