/**
 * Computes a crossing-free tree layout using the in-order position assignment algorithm.
 *
 * Each node's X is determined by its in-order traversal index (left < node < right),
 * and Y by its depth. This guarantees no line crossings.
 */

export type LayoutNode = {
    id: number
    left?: LayoutNode | null
    right?: LayoutNode | null
    [key: string]: unknown
}

export type LayoutPosition = { x: number; y: number }

/**
 * Recursively assign x (in-order index) and y (depth) to every node.
 * Returns a Map<nodeId, {x, y}>.
 */
export function computeTreeLayout(
    root: LayoutNode | null,
    xGap = 70,
    yGap = 80,
): Map<number, LayoutPosition> {
    const positions = new Map<number, LayoutPosition>()
    const counter = { n: 0 }

    function inOrder(node: LayoutNode | null, depth: number) {
        if (!node) return
        inOrder(node.left ?? null, depth + 1)
        positions.set(node.id, { x: counter.n * xGap, y: depth * yGap })
        counter.n++
        inOrder(node.right ?? null, depth + 1)
    }

    inOrder(root, 0)

    // Centre the tree horizontally around x=0
    if (counter.n > 0) {
        const minX = 0
        const maxX = (counter.n - 1) * xGap
        const shift = -(minX + maxX) / 2
        positions.forEach((pos, id) => {
            positions.set(id, { x: pos.x + shift, y: pos.y })
        })
    }

    return positions
}
