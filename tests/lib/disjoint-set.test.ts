import { describe, it, expect } from "vitest"
import {
    buildFind,
    buildUnion,
    findRoot,
    groupsOf,
    isSingleSet,
    layoutForest,
    makeSets,
    setCount,
    type DsuNodeState,
    type DsuOptions,
    MAX_SET_SIZE,
    MIN_SET_SIZE,
} from "@/lib/disjoint-set"

const BOTH: DsuOptions = { pathCompression: true, unionByRank: true }
const NEITHER: DsuOptions = { pathCompression: false, unionByRank: false }

/** Apply a sequence of unions and return the resulting state. */
function unionAll(nodes: DsuNodeState[], pairs: [number, number][], options = BOTH): DsuNodeState[] {
    let state = nodes
    for (const [a, b] of pairs) {
        state = buildUnion(state, a, b, options).nodes
    }
    return state
}

/**
 * Builds a deliberately degenerate chain: 4 <- 3 <- 2 <- 1 <- 0.
 *
 * Note the argument order. union(0,1), union(1,2), ... does *not* make a path,
 * because the root of the first argument always wins, so every later element is
 * attached directly to root 0 and the result is a star of depth 1. Making the
 * new element the first argument is what forces the chain, and that chain is
 * the worst case both optimisations exist to prevent.
 */
function degenerateChain(n: number): DsuNodeState[] {
    const pairs: [number, number][] = []
    for (let i = 1; i < n; i++) pairs.push([i, i - 1])
    return unionAll(makeSets(n), pairs, NEITHER)
}

describe("makeSets", () => {
    it("makes every element its own parent with rank zero", () => {
        const nodes = makeSets(5)
        expect(nodes).toHaveLength(5)
        expect(nodes.every((n) => n.parent === n.id && n.rank === 0)).toBe(true)
        expect(setCount(nodes)).toBe(5)
    })

    it("clamps to the supported range", () => {
        expect(makeSets(0)).toHaveLength(MIN_SET_SIZE)
        expect(makeSets(999)).toHaveLength(MAX_SET_SIZE)
    })
})

describe("buildUnion", () => {
    it("joins two singletons into one set", () => {
        const { nodes } = buildUnion(makeSets(5), 0, 1, BOTH)
        expect(findRoot(nodes, 0)).toBe(findRoot(nodes, 1))
        expect(setCount(nodes)).toBe(4)
    })

    it("is a no-op when both are already together", () => {
        const joined = unionAll(makeSets(5), [[0, 1]])
        const again = buildUnion(joined, 0, 1, BOTH)
        expect(setCount(again.nodes)).toBe(4)
        expect(again.result).toMatch(/already/)
    })

    it("makes the whole range one set after n-1 unions", () => {
        const nodes = unionAll(makeSets(6), [[0, 1], [2, 3], [4, 5], [0, 2], [0, 4]])
        expect(isSingleSet(nodes)).toBe(true)
        expect(setCount(nodes)).toBe(1)
    })

    it("is transitive: joining through a third element merges both", () => {
        const nodes = unionAll(makeSets(4), [[0, 1], [1, 2]])
        expect(findRoot(nodes, 0)).toBe(findRoot(nodes, 2))
    })

    it("rejects an out-of-range element", () => {
        expect(buildUnion(makeSets(4), 0, 9, BOTH).error).toMatch(/between 0 and 3/)
        expect(buildUnion(makeSets(4), -1, 2, BOTH).error).toMatch(/between 0 and 3/)
    })

    it("returns the state untouched when it errors", () => {
        const before = makeSets(4)
        const after = buildUnion(before, 0, 9, BOTH)
        expect(after.frames).toHaveLength(0)
        expect(after.nodes.map((n) => n.parent)).toEqual(before.map((n) => n.parent))
    })

    // Union by rank is what keeps the trees shallow. Without it, chaining
    // unions in order builds a path, which is the whole reason the
    // optimisation exists and the contrast the toggle is there to show.
    it("keeps trees shallow with union by rank", () => {
        const pairs: [number, number][] = []
        for (let i = 1; i < 8; i++) pairs.push([i, i - 1])
        // The same sequence that degenerates to a depth-7 path without it.
        expect(layoutForest(unionAll(makeSets(8), pairs, NEITHER)).depth).toBe(7)
        expect(layoutForest(unionAll(makeSets(8), pairs, BOTH)).depth).toBe(1)
    })

    it("raises the rank only when two equal-rank roots merge", () => {
        const a = buildUnion(makeSets(4), 0, 1, BOTH).nodes
        const rootA = findRoot(a, 0)
        expect(a[rootA].rank).toBe(1)

        // Attaching a rank-0 singleton must not raise it again.
        const b = buildUnion(a, 0, 2, BOTH).nodes
        expect(b[findRoot(b, 0)].rank).toBe(1)
    })

    it("hangs the shorter tree under the taller one", () => {
        const pair = buildUnion(makeSets(4), 0, 1, BOTH).nodes // root has rank 1
        const merged = buildUnion(pair, 0, 2, BOTH).nodes
        // 2 was a singleton, so it must have become the child.
        expect(merged[2].parent).toBe(findRoot(merged, 0))
    })

    it("reports the operation on the final frame", () => {
        const { frames } = buildUnion(makeSets(4), 0, 1, BOTH)
        expect(frames[frames.length - 1].snapshot.result).toMatch(/joined under/)
    })
})

describe("buildFind", () => {
    it("returns the element itself for a singleton", () => {
        expect(buildFind(makeSets(4), 2, BOTH).result).toBe("find(2) = 2")
    })

    it("returns the shared root for a joined pair", () => {
        const nodes = unionAll(makeSets(4), [[0, 1]])
        const root = findRoot(nodes, 0)
        expect(buildFind(nodes, 1, BOTH).result).toBe(`find(1) = ${root}`)
    })

    it("rejects an out-of-range element", () => {
        expect(buildFind(makeSets(4), 7, BOTH).error).toMatch(/between 0 and 3/)
    })

    it("records a frame per hop up the tree", () => {
        const chain = degenerateChain(5)
        // 0 sits four levels below the root, so the walk is four hops plus the
        // opening frame, the root frame and the return frame.
        const { frames } = buildFind(chain, 0, NEITHER)
        expect(frames.length).toBe(4 + 3)
    })

    // Path compression is the other half of the near-constant-time claim, and
    // the visible payoff is the tree flattening as you watch.
    it("points every node on the path straight at the root", () => {
        const chain = degenerateChain(5)
        expect(layoutForest(chain).depth).toBe(4)

        const root = findRoot(chain, 0)
        const { nodes } = buildFind(chain, 0, { pathCompression: true, unionByRank: false })

        // Every node the walk touched now points directly at the root, so the
        // whole chain collapses to depth 1.
        for (const node of nodes) {
            if (node.id !== root) expect(node.parent).toBe(root)
        }
        expect(layoutForest(nodes).depth).toBe(1)
    })

    it("leaves the forest alone when compression is off", () => {
        const chain = degenerateChain(5)
        const { nodes } = buildFind(chain, 0, NEITHER)
        expect(nodes.map((n) => n.parent)).toEqual(chain.map((n) => n.parent))
        expect(layoutForest(nodes).depth).toBe(4)
    })

    it("never changes which set an element belongs to", () => {
        const chain = unionAll(makeSets(6), [[0, 1], [1, 2], [3, 4]], NEITHER)
        const before = groupsOf(chain)
        const { nodes } = buildFind(chain, 2, BOTH)
        const after = groupsOf(nodes)
        expect([...after.values()].map((g) => g.sort().join(",")).sort())
            .toEqual([...before.values()].map((g) => g.sort().join(",")).sort())
    })
})

describe("layoutForest", () => {
    it("puts every singleton on its own slot at depth zero", () => {
        const { positions, depth } = layoutForest(makeSets(4))
        expect(depth).toBe(0)
        expect(new Set([...positions.values()].map((p) => p.x)).size).toBe(4)
    })

    it("places a child one level below its parent", () => {
        const nodes = unionAll(makeSets(3), [[0, 1]])
        const { positions } = layoutForest(nodes)
        const root = findRoot(nodes, 0)
        const child = root === 0 ? 1 : 0
        expect(positions.get(child)!.y).toBe(positions.get(root)!.y + 1)
    })

    it("centres a parent over its children", () => {
        const nodes = unionAll(makeSets(4), [[0, 1], [2, 3], [0, 2]])
        const { positions } = layoutForest(nodes)
        const root = findRoot(nodes, 0)
        const kids = nodes.filter((n) => n.parent === root && n.id !== root).map((n) => positions.get(n.id)!.x)
        expect(positions.get(root)!.x).toBeCloseTo((Math.min(...kids) + Math.max(...kids)) / 2)
    })

    it("gives every node a position", () => {
        const nodes = unionAll(makeSets(8), [[0, 1], [2, 3], [4, 5], [0, 2]])
        const { positions } = layoutForest(nodes)
        expect(positions.size).toBe(nodes.length)
    })

    // The tree visualizer clipped nodes because its drawing area was sized by
    // one model while its renderer used another. Reporting real extents is what
    // stops that recurring here.
    it("reports a width that contains every node", () => {
        const nodes = unionAll(makeSets(10), [[0, 1], [2, 3], [4, 5], [0, 2], [6, 7]])
        const { positions, width } = layoutForest(nodes)
        for (const pos of positions.values()) {
            expect(pos.x).toBeGreaterThanOrEqual(0)
            expect(pos.x).toBeLessThanOrEqual(width)
        }
    })

    it("does not overlap separate trees", () => {
        const nodes = unionAll(makeSets(6), [[0, 1], [2, 3]])
        const { positions } = layoutForest(nodes)
        const xs = [...positions.values()].map((p) => p.x)
        expect(new Set(xs.map((x) => Math.round(x * 2))).size).toBeGreaterThan(1)
    })
})
