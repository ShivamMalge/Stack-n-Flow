"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ZoomIn, ZoomOut, MoveHorizontal, MoveVertical } from "lucide-react"

/**
 * Drawing for a binary heap: the complete-tree view, and optionally the array
 * it is really stored in.
 *
 * Extracted so the web app and the notebook widget share one source. The heap
 * was the worst of the fourteen in a notebook — it mounted the whole component,
 * so Python users got the insert and delete inputs, the animation transport and
 * the step list, none of which can do anything when Python owns the heap.
 *
 * Zoom and pan stay here because they are view state: they change how you are
 * looking at the heap, not what the heap is.
 */

export type HeapNodeState =
    | "default"
    | "comparing"
    | "swapping"
    | "inserted"
    | "deleted"
    | "heapified"

const parentOf = (i: number) => Math.floor((i - 1) / 2)
const leftOf = (i: number) => 2 * i + 1
const rightOf = (i: number) => 2 * i + 2

/*
  Themed through CSS variables (see app/globals.css) so the nodes stay legible in
  both light and dark mode; these were once dark-only hex literals.

  Worth knowing before touching them: the heap carries three separate palettes —
  these variables for the svg, ENTRY_BG below for the array cells, and
  lib/visualizer-states for every other structure. They do not agree; comparing
  is a CSS variable here, blue in the array, and amber everywhere else.
*/
const NODE_FILL: Record<HeapNodeState, string> = {
    default: "hsl(var(--node-default-fill))",
    comparing: "hsl(var(--node-comparing-fill))",
    swapping: "hsl(var(--node-swapping-fill))",
    inserted: "hsl(var(--node-inserted-fill))",
    deleted: "hsl(var(--node-deleted-fill))",
    heapified: "hsl(var(--node-heapified-fill))",
}

const NODE_STROKE: Record<HeapNodeState, string> = {
    default: "hsl(var(--node-default-stroke))",
    comparing: "hsl(var(--node-comparing-stroke))",
    swapping: "hsl(var(--node-swapping-stroke))",
    inserted: "hsl(var(--node-inserted-stroke))",
    deleted: "hsl(var(--node-deleted-stroke))",
    heapified: "hsl(var(--node-heapified-stroke))",
}

const ENTRY_BG: Record<HeapNodeState, string> = {
    default: "bg-muted/50 border-border",
    comparing: "bg-blue-500/20 border-blue-500",
    swapping: "bg-yellow-500/20 border-yellow-500",
    inserted: "bg-green-500/20 border-green-500",
    deleted: "bg-red-500/20 border-red-500",
    heapified: "bg-purple-500/20 border-purple-500",
}

/** Labelled in the order a value passes through them. */
const LEGEND: [HeapNodeState, string][] = [
    ["comparing", "Comparing"],
    ["swapping", "Swapping"],
    ["inserted", "Inserted"],
    ["deleted", "Deleted"],
    ["heapified", "Heapified"],
]

export function HeapTreeSVG({
    heap,
    states,
    scale,
    pan,
}: {
    heap: number[]
    states: HeapNodeState[]
    scale: number
    pan: { x: number; y: number }
}) {
    const R = 24
    const xGap = 60
    const yGap = 76

    const positions = heap.map((_, i) => {
        const depth = Math.floor(Math.log2(i + 1))
        const nodesAtDepth = Math.pow(2, depth)
        const posInDepth = i - (nodesAtDepth - 1)
        const totalWidth = nodesAtDepth * xGap
        return {
            x: (posInDepth + 0.5) * (totalWidth / nodesAtDepth) - totalWidth / 2,
            y: depth * yGap + R + 10,
        }
    })

    const maxDepth = heap.length > 0 ? Math.floor(Math.log2(heap.length)) : 0
    const maxWidth = Math.pow(2, maxDepth) * xGap
    const svgW = Math.max(300, maxWidth + 100)
    const svgH = (maxDepth + 1) * yGap + 60

    return (
        // `m-auto` centres the tree inside the scrolling plate while it fits and
        // lets it scroll from the true origin once it does not.
        <svg
            data-testid="heap-canvas"
            width="100%"
            height="100%"
            viewBox={`${pan.x - svgW / 2 - 30} ${pan.y} ${svgW + 60} ${svgH}`}
            style={{
                transform: `scale(${scale})`,
                transformOrigin: "center top",
                transition: "transform 0.2s ease",
            }}
            className="m-auto"
        >
            {heap.map((_, i) => {
                const l = leftOf(i)
                const r = rightOf(i)
                return (
                    <g key={`e-${i}`}>
                        {l < heap.length && (
                            <line
                                x1={positions[i].x}
                                y1={positions[i].y + R}
                                x2={positions[l].x}
                                y2={positions[l].y - R}
                                stroke="hsl(var(--node-edge))"
                                strokeWidth="1.5"
                            />
                        )}
                        {r < heap.length && (
                            <line
                                x1={positions[i].x}
                                y1={positions[i].y + R}
                                x2={positions[r].x}
                                y2={positions[r].y - R}
                                stroke="hsl(var(--node-edge))"
                                strokeWidth="1.5"
                            />
                        )}
                    </g>
                )
            })}

            {heap.map((value, i) => {
                const state = states[i] ?? "default"
                return (
                    <g key={i}>
                        <circle
                            cx={positions[i].x}
                            cy={positions[i].y}
                            r={R}
                            fill={NODE_FILL[state]}
                            stroke={NODE_STROKE[state]}
                            strokeWidth="2"
                            style={{ transition: "all 0.3s ease" }}
                        />
                        <text
                            x={positions[i].x}
                            y={positions[i].y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="hsl(var(--node-label))"
                            fontSize="12"
                            fontWeight="bold"
                            className="select-none pointer-events-none"
                        >
                            {value}
                        </text>
                        <text
                            x={positions[i].x}
                            y={positions[i].y + R + 13}
                            textAnchor="middle"
                            fill="hsl(var(--node-index-label))"
                            fontSize="9"
                            className="select-none pointer-events-none"
                        >
                            [{i}]
                        </text>
                    </g>
                )
            })}
        </svg>
    )
}

/** The array the heap is actually stored in, level by level. */
export function HeapArrayView({ heap, states }: { heap: number[]; states: HeapNodeState[] }) {
    return (
        <div className="flex gap-1 flex-wrap justify-center">
            {heap.map((value, i) => (
                <div
                    key={i}
                    className={`flex flex-col items-center border rounded px-2 py-1 min-w-[36px] text-center transition-all duration-300 ${ENTRY_BG[states[i] ?? "default"]}`}
                >
                    <span className="text-xs font-bold">{value}</span>
                    <span className="text-[9px] text-muted-foreground">[{i}]</span>
                </div>
            ))}
        </div>
    )
}

/** Swatches come from the same map the array cells use, so it cannot drift. */
export function HeapLegend() {
    return (
        <div className="flex flex-wrap gap-2 text-xs">
            {LEGEND.map(([state, label]) => (
                <div key={label} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-sm border ${ENTRY_BG[state]}`} />
                    <span className="text-muted-foreground">{label}</span>
                </div>
            ))}
        </div>
    )
}

interface HeapRendererProps {
    heap: number[]
    states?: HeapNodeState[]
    /**
     * The web page keeps its own Array Representation card in the left column,
     * so it turns this off. A notebook has no left column and would otherwise
     * never see the storage the whole structure is about.
     */
    showArray?: boolean
    title?: string
    description?: string
    emptyLabel?: string
}

export default function HeapRenderer({
    heap,
    states = [],
    showArray = true,
    title = "Tree View",
    description = "Visual representation as a complete binary tree",
    emptyLabel = "Insert values to build the heap",
}: HeapRendererProps) {
    const [scale, setScale] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })

    const viewButtons: { label: string; icon: React.ReactNode; onClick: () => void }[] = [
        { label: "Zoom In", icon: <ZoomIn className="h-4 w-4 mr-1" />, onClick: () => setScale((s) => Math.min(s * 1.2, 4)) },
        { label: "Zoom Out", icon: <ZoomOut className="h-4 w-4 mr-1" />, onClick: () => setScale((s) => Math.max(s / 1.2, 0.2)) },
        { label: "Pan Left", icon: <MoveHorizontal className="h-4 w-4 mr-1" />, onClick: () => setPan((p) => ({ ...p, x: p.x - 40 })) },
        { label: "Pan Right", icon: <MoveHorizontal className="h-4 w-4 mr-1" />, onClick: () => setPan((p) => ({ ...p, x: p.x + 40 })) },
        // pan.y was already in the viewBox but nothing ever set it.
        { label: "Pan Up", icon: <MoveVertical className="h-4 w-4 mr-1" />, onClick: () => setPan((p) => ({ ...p, y: p.y - 40 })) },
        { label: "Pan Down", icon: <MoveVertical className="h-4 w-4 mr-1" />, onClick: () => setPan((p) => ({ ...p, y: p.y + 40 })) },
    ]

    return (
        <Card className="flex-1 flex flex-col min-h-[400px]">
            <CardHeader className="pb-2">
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>

            <CardContent className="p-0 flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex flex-wrap gap-2 px-4 pb-2">
                    {viewButtons.map((button) => (
                        <Button key={button.label} size="sm" variant="outline" onClick={button.onClick}>
                            {button.icon} {button.label}
                        </Button>
                    ))}
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            setScale(1)
                            setPan({ x: 0, y: 0 })
                        }}
                    >
                        Reset View
                    </Button>
                </div>

                {/*
                    SVG canvas. The plate is the scroller itself: an
                    `absolute inset-0` child made this `overflow-auto` a dead
                    scroller, and centring a scrolling box with `items-center`
                    spilled the overflow both ways, so the leading half (the root
                    node first) could never be reached — scrollLeft cannot go
                    negative.
                */}
                <div
                    className="flex flex-1 min-h-[300px] max-h-[60vh] w-full overflow-auto border-t p-4"
                    style={{ overscrollBehavior: "contain" }}
                >
                    {heap.length === 0 ? (
                        <div className="m-auto text-muted-foreground text-sm text-center">{emptyLabel}</div>
                    ) : (
                        <HeapTreeSVG heap={heap} states={states} scale={scale} pan={pan} />
                    )}
                </div>

                {showArray && heap.length > 0 && (
                    <div className="space-y-2 border-t p-4">
                        <p className="text-center text-xs font-medium text-muted-foreground">
                            Stored as a level-order array
                        </p>
                        <HeapArrayView heap={heap} states={states} />
                        <p className="text-center text-xs text-muted-foreground">
                            parent(i) = ⌊(i−1)/2⌋ &nbsp;·&nbsp; left(i) = 2i+1 &nbsp;·&nbsp; right(i) = 2i+2
                        </p>
                        <div className="flex justify-center pt-1">
                            <HeapLegend />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export { parentOf, leftOf, rightOf }
