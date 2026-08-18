import { describe, it, expect } from "vitest"
import { computeTreeLayout, type LayoutNode } from "@/lib/tree-layout"

/** Build a node with an auto id so tests read as tree shapes. */
let nextId = 0
function n(value: number, left?: LayoutNode, right?: LayoutNode): LayoutNode {
    return { id: nextId++, value, left: left ?? null, right: right ?? null }
}

function extents(map: Map<number, { x: number; y: number }>) {
    const xs = [...map.values()].map((p) => p.x)
    const ys = [...map.values()].map((p) => p.y)
    return { minX: Math.min(...xs), maxX: Math.max(...xs), maxY: Math.max(...ys) }
}

describe("computeTreeLayout", () => {
    it("places one node at the origin", () => {
        const map = computeTreeLayout(n(1))
        expect([...map.values()]).toEqual([{ x: 0, y: 0 }])
    })

    it("returns nothing for an empty tree", () => {
        expect(computeTreeLayout(null).size).toBe(0)
    })

    it("gives every node a distinct x, so none can be hidden behind another", () => {
        const tree = n(50, n(30, n(20, n(10)), n(40)), n(70, n(60), n(80)))
        const map = computeTreeLayout(tree, 65, 80)
        const xs = [...map.values()].map((p) => p.x)
        expect(new Set(xs).size).toBe(xs.length)
    })

    it("spaces nodes by exactly xGap in in-order sequence", () => {
        const tree = n(2, n(1), n(3))
        const map = computeTreeLayout(tree, 65, 80)
        const xs = [...map.values()].map((p) => p.x).sort((a, b) => a - b)
        expect(xs).toEqual([-65, 0, 65])
    })

    it("sets y from depth alone, so every level is a clean row", () => {
        const tree = n(2, n(1, n(0)), n(3))
        const map = computeTreeLayout(tree, 65, 80)
        expect([...new Set([...map.values()].map((p) => p.y))].sort((a, b) => a - b))
            .toEqual([0, 80, 160])
    })

    it("centres the tree on x=0", () => {
        const tree = n(2, n(1), n(3))
        const { minX, maxX } = extents(computeTreeLayout(tree, 65, 80))
        expect(minX + maxX).toBe(0)
    })

    it("keeps total width at (nodes - 1) * xGap, which is what sizes the viewBox", () => {
        // The visualizers derive svgW from these extents. When tree-visualizer
        // instead estimated width with a *different* spacing model than its
        // renderer used, nodes landed outside the viewBox and were clipped with
        // no way to scroll to them.
        const deep = n(5, n(4, n(3, n(2, n(1)))))
        const map = computeTreeLayout(deep, 65, 80)
        const { minX, maxX } = extents(map)
        expect(maxX - minX).toBe((map.size - 1) * 65)
    })

    it("bounds a left-leaning chain within the width its own extents report", () => {
        // The exact shape that used to escape: every insert descends left.
        let chain = n(1)
        for (let i = 2; i <= 9; i++) chain = n(i, chain)
        const map = computeTreeLayout(chain, 65, 80)
        const { minX, maxX } = extents(map)
        const svgW = maxX - minX + 60
        for (const pos of map.values()) {
            const drawX = pos.x - minX + 30
            expect(drawX).toBeGreaterThanOrEqual(0)
            expect(drawX).toBeLessThanOrEqual(svgW)
        }
    })

    it("honours custom gaps", () => {
        const tree = n(2, n(1), n(3))
        const map = computeTreeLayout(tree, 44, 60)
        const { minX, maxX, maxY } = extents(map)
        expect(maxX - minX).toBe(88)
        expect(maxY).toBe(60)
    })
})
