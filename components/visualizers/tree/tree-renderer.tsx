"use client"

import type React from "react"
import { useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ZoomIn, ZoomOut, MoveHorizontal, MoveVertical } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { resolveState, STATE_SHAPE, STATE_LABEL, swatchFor, type VisualizerState } from "@/lib/visualizer-states"
import { computeTreeLayout } from "@/lib/tree-layout"

/**
 * Drawing for a binary tree, shared by the BST and the AVL tree.
 *
 * The two were separate copies of the same 130 lines — layout, edges, circles,
 * drag, zoom and pan — differing only in the node radius, the vertical gap and
 * whether a balance factor is printed inside each node. They had already drifted:
 * the AVL passed a fixed 65/90 gap where the BST halved its gaps on a phone.
 *
 * What this holds is *view* state, not structure state, which is why it survives
 * the trip into a notebook. Zoom, pan and drag change how you are looking at the
 * tree, not what the tree is, so they keep working when Python owns the data —
 * unlike the insert and delete controls, which stay behind in the controller.
 */

export type TreeRendererNode = {
    id: number
    // Widened from number: Python can send string labels.
    value: string | number
    left?: TreeRendererNode | null
    right?: TreeRendererNode | null
    highlighted?: boolean
    isNew?: boolean
    isDeleting?: boolean
    isRotating?: boolean
    /** AVL only; computed here when the caller does not supply it. */
    balanceFactor?: number
}

interface TreeRendererProps {
    root: TreeRendererNode | null
    /** "avl" prints balance factors inside the nodes and shows the state legend. */
    variant?: "bst" | "avl"
    searchResult?: string | null
    title?: string
    description?: string
    emptyLabel?: string
    /**
     * Suppresses drag while the controller is mid-animation, so a drag cannot
     * fight a transition for the same node.
     */
    interactionsDisabled?: boolean
}

const heightOf = (node: TreeRendererNode | null | undefined): number =>
    node ? 1 + Math.max(heightOf(node.left), heightOf(node.right)) : 0

const balanceOf = (node: TreeRendererNode): number =>
    node.balanceFactor ?? heightOf(node.left) - heightOf(node.right)

/** The states an AVL node can be drawn in, in the order the legend lists them. */
const AVL_LEGEND: { state: VisualizerState; label: string }[] = [
    { state: "default", label: "Balanced" },
    { state: "warning", label: STATE_LABEL.warning },
    { state: "swapping", label: "Rotating" },
    { state: "inserted", label: STATE_LABEL.inserted },
]

export default function TreeRenderer({
    root,
    variant = "bst",
    searchResult = null,
    title = "Visualization",
    description,
    emptyLabel = "Empty tree",
    interactionsDisabled = false,
}: TreeRendererProps) {
    const isMobile = useMobile()
    const isAvl = variant === "avl"

    const [scale, setScale] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [nodePositions, setNodePositions] = useState<Record<number, { x: number; y: number }>>({})
    const svgRef = useRef<SVGSVGElement>(null)

    const nodeRadius = isAvl ? (isMobile ? 14 : 18) : isMobile ? 15 : 20
    const xGap = isMobile ? 44 : 65
    // An AVL node prints two lines of text, so its rows need more clearance.
    const yGap = isMobile ? 60 : isAvl ? 90 : 80

    const treeLayout = useMemo(
        () => computeTreeLayout(root as never, xGap, yGap),
        [root, xGap, yGap],
    )

    /*
      The viewBox is derived from the layout's real extents.

      It used to be guessed from `|position| * 60 + 40`, capped at 220, while the
      layout ran out to -273. Everything past the cap was clipped, and because the
      scroller's scrollWidth equalled its clientWidth there was nothing to scroll
      to: those nodes could not be reached at all.
    */
    const svgPadding = 30
    const positions = Array.from(treeLayout.values())
    const minX = positions.length ? Math.min(...positions.map((p) => p.x)) : 0
    const maxX = positions.length ? Math.max(...positions.map((p) => p.x)) : 0
    const maxY = positions.length ? Math.max(...positions.map((p) => p.y)) : 0
    const svgW = Math.max(300, maxX - minX + svgPadding * 2)
    const svgH = Math.max(200, maxY + svgPadding * 2)

    const slotFor = (node: TreeRendererNode) => {
        const pos = treeLayout.get(node.id)
        return pos ? { x: pos.x - minX + svgPadding, y: pos.y + svgPadding } : null
    }

    /** A dragged node wins over its computed slot. */
    const drawnAt = (node: TreeRendererNode) => nodePositions[node.id] ?? slotFor(node)

    /**
     * Drag, for mouse and touch alike. Both events carry the same two numbers, so
     * the two near-identical handlers this replaces only ever differed in how they
     * reached them.
     */
    const startDrag = (
        event: React.MouseEvent | React.TouchEvent,
        nodeId: number,
        initialX: number,
        initialY: number,
    ) => {
        if (interactionsDisabled) return
        event.preventDefault()

        const touch = "touches" in event
        const point = (e: MouseEvent | TouchEvent) =>
            "touches" in e ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY }

        const start = touch
            ? { x: (event as React.TouchEvent).touches[0].clientX, y: (event as React.TouchEvent).touches[0].clientY }
            : { x: (event as React.MouseEvent).clientX, y: (event as React.MouseEvent).clientY }

        const from = nodePositions[nodeId] ?? { x: initialX, y: initialY }

        const move = (e: MouseEvent | TouchEvent) => {
            if (touch) e.preventDefault() // or the notebook page scrolls instead
            const now = point(e)
            // Divided by the scale, or a drag at 2x zoom moves the node twice as
            // far as the pointer.
            setNodePositions((prev) => ({
                ...prev,
                [nodeId]: { x: from.x + (now.x - start.x) / scale, y: from.y + (now.y - start.y) / scale },
            }))
        }

        const end = () => {
            document.removeEventListener(touch ? "touchmove" : "mousemove", move as EventListener)
            document.removeEventListener(touch ? "touchend" : "mouseup", end)
        }

        document.addEventListener(touch ? "touchmove" : "mousemove", move as EventListener, { passive: false })
        document.addEventListener(touch ? "touchend" : "mouseup", end)
    }

    const renderNode = (node: TreeRendererNode | null | undefined): React.ReactNode => {
        if (!node) return null
        const at = drawnAt(node)
        if (!at) return null

        const balance = isAvl ? balanceOf(node) : 0
        const unbalanced = isAvl && Math.abs(balance) > 1

        return (
            <g key={node.id}>
                {[node.left, node.right].map((child) => {
                    if (!child) return null
                    const childAt = drawnAt(child)
                    if (!childAt) return null
                    return (
                        <line
                            key={`edge-${node.id}-${child.id}`}
                            x1={at.x}
                            /*
                              Trimmed by the radius at both ends so the edge meets
                              the circles rather than running underneath them. The
                              BST used to draw centre to centre.
                            */
                            y1={at.y + nodeRadius}
                            x2={childAt.x}
                            y2={childAt.y - nodeRadius}
                            stroke="currentColor"
                            strokeOpacity="0.35"
                            strokeWidth="1.5"
                        />
                    )
                })}

                <circle
                    cx={at.x}
                    cy={at.y}
                    r={nodeRadius}
                    className={`
                        transition-all duration-300 ease-in-out stroke-[1.5]
                        ${interactionsDisabled ? "" : "cursor-grab active:cursor-grabbing"}
                        ${STATE_SHAPE[resolveState({
                        removed: node.isDeleting,
                        swapping: node.isRotating,
                        comparing: node.highlighted,
                        inserted: node.isNew,
                        warning: unbalanced,
                    })]}
                    `}
                    onMouseDown={(e) => startDrag(e, node.id, at.x, at.y)}
                    onTouchStart={(e) => startDrag(e, node.id, at.x, at.y)}
                />

                <text
                    x={at.x}
                    y={isAvl ? at.y - 3 : at.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`${isMobile ? "text-xs" : "text-sm"} font-medium fill-current pointer-events-none select-none`}
                >
                    {node.value}
                </text>

                {isAvl && (
                    <text
                        x={at.x}
                        y={at.y + 7}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className={`text-[9px] fill-current pointer-events-none select-none ${unbalanced ? "font-bold" : ""}`}
                    >
                        {balance}
                    </text>
                )}

                {renderNode(node.left)}
                {renderNode(node.right)}
            </g>
        )
    }

    const viewButtons: { label: string; icon: React.ReactNode; onClick: () => void }[] = [
        { label: "Zoom In", icon: <ZoomIn className="h-4 w-4 mr-1" />, onClick: () => setScale((s) => s * 1.1) },
        { label: "Zoom Out", icon: <ZoomOut className="h-4 w-4 mr-1" />, onClick: () => setScale((s) => s / 1.1) },
        { label: "Pan Left", icon: <MoveHorizontal className="h-4 w-4 mr-1" />, onClick: () => setPan((p) => ({ ...p, x: p.x - 20 })) },
        { label: "Pan Right", icon: <MoveHorizontal className="h-4 w-4 mr-1" />, onClick: () => setPan((p) => ({ ...p, x: p.x + 20 })) },
        // pan.y was interpolated into the transform but nothing ever set it, so
        // vertical clipping had no control at all.
        { label: "Pan Up", icon: <MoveVertical className="h-4 w-4 mr-1" />, onClick: () => setPan((p) => ({ ...p, y: p.y - 20 })) },
        { label: "Pan Down", icon: <MoveVertical className="h-4 w-4 mr-1" />, onClick: () => setPan((p) => ({ ...p, y: p.y + 20 })) },
    ]

    const resetView = () => {
        setScale(1)
        setPan({ x: 0, y: 0 })
        // Dragged nodes are part of the view too, so "Reset View" that left them
        // scattered was only resetting half of it.
        setNodePositions({})
    }

    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>
                    {description ??
                        (isAvl
                            ? "Visual representation of the AVL tree (numbers inside nodes show balance factors)"
                            : "Visual representation of the binary search tree")}
                </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col flex-1 min-h-0">
                {searchResult && <div className="mb-4 text-sm text-muted-foreground">{searchResult}</div>}

                <div className="flex flex-wrap gap-2 mb-2">
                    {viewButtons.map((button) => (
                        <Button key={button.label} size="sm" variant="outline" onClick={button.onClick}>
                            {button.icon} {button.label}
                        </Button>
                    ))}
                    <Button size="sm" variant="outline" onClick={resetView}>
                        Reset View
                    </Button>
                </div>

                {/*
                  The plate is the scroller itself: an `absolute inset-0` child
                  made the outer `overflow-auto` a dead scroller, and centring a
                  scrolling box with `items-center` spilled the overflow both ways,
                  so the leading half (the root first) could never be reached —
                  scrollLeft cannot go negative. `m-auto` on the svg centres it
                  while it fits and scrolls from the true origin once it does not.
                */}
                <div
                    className="flex flex-1 min-h-[300px] max-h-[60vh] w-full overflow-auto border-t p-4"
                    style={{ overscrollBehavior: "contain" }}
                >
                    {root ? (
                        <svg
                            ref={svgRef}
                            data-testid="tree-canvas"
                            width={svgW}
                            height={svgH}
                            viewBox={`0 0 ${svgW} ${svgH}`}
                            style={{
                                transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)`,
                                transformOrigin: "center",
                                transition: "transform 0.2s ease",
                                touchAction: "none",
                            }}
                            className="m-auto max-w-none"
                        >
                            <g>{renderNode(root)}</g>
                        </svg>
                    ) : (
                        <div className="m-auto text-muted-foreground text-sm">{emptyLabel}</div>
                    )}
                </div>

                {isAvl && (
                    <div className="flex flex-wrap justify-center mt-4 gap-3 text-xs px-6 border-t pt-4">
                        {AVL_LEGEND.map(({ state, label }) => (
                            <div key={label} className="flex items-center bg-background px-2 py-0.5 rounded border">
                                {/*
                                  Swatches come from the same table the nodes are
                                  drawn from. Hand-written ones had drifted: the
                                  legend showed a blue dot for "Rotating" and a
                                  green one for "New", neither of which any node
                                  has ever been.
                                */}
                                <div className={`w-2.5 h-2.5 rounded-full mr-1.5 ${swatchFor(state)}`} />
                                <span>{label}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="px-6 py-3 text-xs text-center text-muted-foreground bg-muted/5 border-t mt-2">
                    Drag nodes to reposition. Use zoom/pan controls to navigate larger trees.
                    {isAvl && " Balance factors are shown inside the nodes."}
                </div>
            </CardContent>
        </Card>
    )
}
