"use client"

import type React from "react"
import { useMemo, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { resolveState, STATE_SHAPE, STATE_SWATCH } from "@/lib/visualizer-states"

/**
 * Drawing for a graph.
 *
 * Extracted so the web app and the notebook widget share one source. Dragging
 * lives here and works either way: it used to write straight back into the
 * controller's node list, so in a notebook — where Python owns that list —
 * grabbing a node did nothing at all. The positions a drag produces are a view
 * overlay now, the same shape the tree renderer uses.
 */

export type GraphRendererNode = {
    id: string
    label: string
    /** Typed loosely because Python's `Graph.add_node` takes x and y as `Any`. */
    x?: unknown
    y?: unknown
    highlighted?: boolean
    isNew?: boolean
    visited?: boolean
}

export type GraphRendererEdge = {
    id: string
    source: string
    target: string
    highlighted?: boolean
    isNew?: boolean
}

interface GraphRendererProps {
    nodes: GraphRendererNode[]
    edges: GraphRendererEdge[]
    /** Highlighted as the algorithm's start node. */
    selectedNode?: string | null
    /**
     * Omitted in a notebook, where picking a start node would only set state
     * Python is about to overwrite. Without it the nodes carry no click
     * affordance.
     */
    onNodeClick?: (nodeId: string) => void
    /** The narration for the frame currently on screen. */
    description?: string | null
    /** Suppresses drag while an animation is playing. */
    interactionsDisabled?: boolean
    mini?: boolean
    title?: string
    emptyLabel?: string
}

// The coordinate space the node positions are expressed in; the viewBox below
// must match.
export const CANVAS_WIDTH = 500
export const CANVAS_HEIGHT = 300
/** Radius of a drawn node; also the inset a drag is clamped to. */
export const NODE_RADIUS = 20

/** Keeps a coordinate inside the canvas so a node can never be lost. */
export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const usable = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value)

const LEGEND: [string, string][] = [
    // Swatches come from the shared map so the legend cannot drift from the
    // nodes it describes. `fill-card` was once used here — an SVG utility, which
    // does nothing to a div.
    [STATE_SWATCH.default, "Unvisited"],
    [STATE_SWATCH.comparing, "Current"],
    [STATE_SWATCH.visited, "Visited"],
    ["bg-card border-2 border-blue-500", "Start Node"],
]

export default function GraphRenderer({
    nodes,
    edges,
    selectedNode = null,
    onNodeClick,
    description = null,
    interactionsDisabled = false,
    mini = false,
    title = "Visualization",
    emptyLabel = "Empty graph",
}: GraphRendererProps) {
    const svgRef = useRef<SVGSVGElement>(null)
    const [dragged, setDragged] = useState<Record<string, { x: number; y: number }>>({})

    /*
      Every node is drawn from a finite pair of coordinates, even when it did not
      arrive with one.

      Python's `Graph.add_node(label, x, y)` types both as `Any`, so a notebook
      can hand us None, a string, or nothing. That reached the svg as
      transform="translate(undefined, undefined)", which the browser rejects
      outright: the node and its edges disappeared, and the only sign of it was a
      console error no notebook user is going to open. A ring placement keeps the
      graph readable and the node draggable.
    */
    const placed = useMemo(() => {
        const radius = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 2 - NODE_RADIUS * 2
        return nodes.map((node, index) => {
            const angle = (index / Math.max(nodes.length, 1)) * Math.PI * 2
            return {
                ...node,
                x: usable(node.x) ? node.x : CANVAS_WIDTH / 2 + radius * Math.cos(angle),
                y: usable(node.y) ? node.y : CANVAS_HEIGHT / 2 + radius * Math.sin(angle),
            }
        })
    }, [nodes])

    /** A dragged position wins over the one the node arrived with. */
    const drawn = placed.map((node) => ({ ...node, ...(dragged[node.id] ?? {}) }))

    const startDrag = (event: React.MouseEvent, nodeId: string) => {
        if (interactionsDisabled) return
        const node = drawn.find((n) => n.id === nodeId)
        if (!node) return

        const startX = event.clientX
        const startY = event.clientY
        const fromX = node.x
        const fromY = node.y

        /*
          The svg is drawn in viewBox units but rendered at whatever width the
          column allows, so a client-space delta has to be divided by that scale
          or the node trails the cursor. Positions are then clamped to the canvas
          — unlike the tree, this view has no pan or reset, so a node dragged off
          the edge would be gone for good.
        */
        const renderedWidth = svgRef.current?.getBoundingClientRect().width ?? 0
        const scale = renderedWidth > 0 ? renderedWidth / CANVAS_WIDTH : 1

        const move = (e: MouseEvent) => {
            setDragged((prev) => ({
                ...prev,
                [nodeId]: {
                    x: clamp(fromX + (e.clientX - startX) / scale, NODE_RADIUS, CANVAS_WIDTH - NODE_RADIUS),
                    y: clamp(fromY + (e.clientY - startY) / scale, NODE_RADIUS, CANVAS_HEIGHT - NODE_RADIUS),
                },
            }))
        }
        const up = () => {
            document.removeEventListener("mousemove", move)
            document.removeEventListener("mouseup", up)
        }
        document.addEventListener("mousemove", move)
        document.addEventListener("mouseup", up)
    }

    return (
        <Card className="h-full border-0 md:border">
            {!mini && (
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>Visual representation of the graph — drag nodes to reposition</CardDescription>
                </CardHeader>
            )}

            <CardContent className="p-0 overflow-hidden flex flex-col">
                {/* No flex centring: centring a 500px svg inside a narrower scroll
                    container hides the overflow on both sides where it cannot be
                    scrolled to. `m-auto` centres it only when it already fits. */}
                <div className="flex min-h-[300px] py-4 bg-muted/5 border-t overflow-auto">
                    {nodes.length === 0 ? (
                        <div className="m-auto text-muted-foreground text-sm">{emptyLabel}</div>
                    ) : (
                        <svg
                            ref={svgRef}
                            data-testid="graph-canvas"
                            width={CANVAS_WIDTH}
                            height={CANVAS_HEIGHT}
                            viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
                            className="m-auto shrink-0 max-w-none md:max-w-full"
                        >
                            {edges.map((edge) => {
                                const src = drawn.find((n) => n.id === edge.source)
                                const tgt = drawn.find((n) => n.id === edge.target)
                                if (!src || !tgt) return null
                                return (
                                    <line
                                        key={edge.id}
                                        x1={src.x}
                                        y1={src.y}
                                        x2={tgt.x}
                                        y2={tgt.y}
                                        className={`stroke-current stroke-[2] transition-all duration-300
                                            ${edge.highlighted ? "stroke-yellow-500 stroke-[3]" : "stroke-muted-foreground"}
                                            ${edge.isNew ? "stroke-green-500 stroke-[3]" : ""}
                                        `}
                                    />
                                )
                            })}

                            {drawn.map((node) => (
                                <g
                                    key={node.id}
                                    transform={`translate(${node.x}, ${node.y})`}
                                    onMouseDown={(e) => startDrag(e, node.id)}
                                    onClick={onNodeClick ? () => onNodeClick(node.id) : undefined}
                                    className={onNodeClick ? "cursor-pointer" : interactionsDisabled ? "" : "cursor-grab active:cursor-grabbing"}
                                >
                                    <circle
                                        r={NODE_RADIUS}
                                        className={`
                                            transition-all duration-300 ease-in-out
                                            ${node.isNew || node.id === selectedNode ? "" : "stroke-[2]"}
                                            ${STATE_SHAPE[resolveState({
                                            comparing: node.highlighted,
                                            inserted: node.isNew,
                                            visited: node.visited,
                                        })]}
                                            ${node.id === selectedNode ? "stroke-blue-500 stroke-[3]" : ""}
                                        `}
                                    />
                                    <text
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="text-sm font-medium fill-current select-none pointer-events-none"
                                    >
                                        {node.label}
                                    </text>
                                </g>
                            ))}
                        </svg>
                    )}
                </div>

                {description && (
                    <p className="text-center text-xs md:text-sm font-medium text-primary mt-2 px-4 py-2 bg-muted/30 border-t">
                        {description}
                    </p>
                )}

                <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 p-4 text-xs border-t">
                    {LEGEND.map(([cls, label]) => (
                        <div
                            key={label}
                            className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-border bg-background"
                        >
                            <div className={`w-2.5 h-2.5 rounded-full ${cls}`} />
                            <span className="text-muted-foreground whitespace-nowrap">{label}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
