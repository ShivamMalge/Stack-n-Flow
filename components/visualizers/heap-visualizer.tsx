"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, ZoomIn, ZoomOut, MoveHorizontal } from "lucide-react"
import AnimationControls from "@/components/ui/animation-controls"
import { useAnimationPlayer, type AnimationFrame } from "@/hooks/useAnimationPlayer"

// ── Types ──────────────────────────────────────────────────────────────────

type NodeState = "default" | "comparing" | "swapping" | "inserted" | "deleted" | "heapified"

type HeapFrame = {
    heap: number[]
    states: NodeState[]
    stepDescription: string
}

// ── Heap helpers ────────────────────────────────────────────────────────────

function parentIdx(i: number) { return Math.floor((i - 1) / 2) }
function leftIdx(i: number) { return 2 * i + 1 }
function rightIdx(i: number) { return 2 * i + 2 }

function generateInsert(heap: number[], value: number, isMin: boolean): AnimationFrame<HeapFrame>[] {
    const h = [...heap]
    const frames: AnimationFrame<HeapFrame>[] = []
    const neutral = () => h.map(() => "default" as NodeState)

    h.push(value)
    const insertedIdx = h.length - 1
    const st = neutral(); st[insertedIdx] = "inserted"
    frames.push({ snapshot: { heap: [...h], states: [...st], stepDescription: `Insert ${value} at index ${insertedIdx}` }, description: `Insert ${value}` })

    let i = insertedIdx
    while (i > 0) {
        const p = parentIdx(i)
        const s = neutral(); s[i] = "comparing"; s[p] = "comparing"
        const cmp = isMin ? h[i] < h[p] : h[i] > h[p]
        frames.push({ snapshot: { heap: [...h], states: [...s], stepDescription: `Compare ${h[i]} with parent ${h[p]}` }, description: `Compare ${h[i]} vs parent ${h[p]}` })
        if (cmp) {
            const sw = neutral(); sw[i] = "swapping"; sw[p] = "swapping"
            frames.push({ snapshot: { heap: [...h], states: [...sw], stepDescription: `Swap ${h[i]} ↔ ${h[p]}` }, description: `Swap ${h[i]} ↔ ${h[p]}` });
            [h[i], h[p]] = [h[p], h[i]]
            i = p
        } else {
            break
        }
    }
    const done = neutral(); if (i >= 0) done[i] = "heapified"
    frames.push({ snapshot: { heap: [...h], states: [...done], stepDescription: `${value} is in correct position. Heap property satisfied.` }, description: "Done" })
    return frames
}

function generateDeleteRoot(heap: number[], isMin: boolean): AnimationFrame<HeapFrame>[] {
    if (heap.length === 0) return []
    const h = [...heap]
    const frames: AnimationFrame<HeapFrame>[] = []
    const neutral = () => h.map(() => "default" as NodeState)

    const s0 = neutral(); s0[0] = "deleted"
    frames.push({ snapshot: { heap: [...h], states: [...s0], stepDescription: `Remove root (${h[0]}) — the ${isMin ? "minimum" : "maximum"}` }, description: `Remove root ${h[0]}` })

    h[0] = h[h.length - 1]
    h.pop()
    if (h.length === 0) {
        frames.push({ snapshot: { heap: [], states: [], stepDescription: "Heap is now empty" }, description: "Empty" })
        return frames
    }
    const s1 = neutral(); s1[0] = "inserted"
    frames.push({ snapshot: { heap: [...h], states: [...s1], stepDescription: `Move last element (${h[0]}) to root` }, description: `Last → root` })

    let i = 0
    while (true) {
        const l = leftIdx(i); const r = rightIdx(i)
        let target = i
        if (l < h.length && (isMin ? h[l] < h[target] : h[l] > h[target])) target = l
        if (r < h.length && (isMin ? h[r] < h[target] : h[r] > h[target])) target = r

        const sc = neutral(); sc[i] = "comparing"
        if (l < h.length) sc[l] = "comparing"
        if (r < h.length) sc[r] = "comparing"
        frames.push({ snapshot: { heap: [...h], states: [...sc], stepDescription: `Heapify down: compare ${h[i]} with children` }, description: "Heapify down" })

        if (target !== i) {
            const sw = neutral(); sw[i] = "swapping"; sw[target] = "swapping"
            frames.push({ snapshot: { heap: [...h], states: [...sw], stepDescription: `Swap ${h[i]} ↔ ${h[target]}` }, description: `Swap ${h[i]} ↔ ${h[target]}` });
            [h[i], h[target]] = [h[target], h[i]]
            i = target
        } else {
            break
        }
    }
    const done = neutral()
    frames.push({ snapshot: { heap: [...h], states: [...done], stepDescription: "Heap property restored!" }, description: "Done" })
    return frames
}

// ── Node state colors ────────────────────────────────────────────────────────

const NODE_FILL: Record<NodeState, string> = {
    default: "#1f2937",        // dark card
    comparing: "#1e3a5f",      // dark blue
    swapping: "#3d2a00",       // dark amber
    inserted: "#14532d",       // dark green
    deleted: "#7f1d1d",        // dark red
    heapified: "#3b0764",      // dark purple
}
const NODE_STROKE: Record<NodeState, string> = {
    default: "#6366f1",
    comparing: "#3b82f6",
    swapping: "#f59e0b",
    inserted: "#22c55e",
    deleted: "#ef4444",
    heapified: "#a855f7",
}

// ── SVG Tree Renderer ────────────────────────────────────────────────────────

function HeapTreeSVG({
    heap, states, scale, pan,
}: {
    heap: number[]; states: NodeState[]; scale: number; pan: { x: number; y: number }
}) {
    const R = 24
    const xGap = 60
    const yGap = 76

    const positions: Array<{ x: number; y: number }> = []
    for (let i = 0; i < heap.length; i++) {
        const depth = Math.floor(Math.log2(i + 1))
        const nodesAtDepth = Math.pow(2, depth)
        const posInDepth = i - (nodesAtDepth - 1)
        const totalWidth = nodesAtDepth * xGap
        const x = (posInDepth + 0.5) * (totalWidth / nodesAtDepth) - totalWidth / 2
        const y = depth * yGap + R + 10
        positions.push({ x, y })
    }

    const maxDepth = heap.length > 0 ? Math.floor(Math.log2(heap.length)) : 0
    const maxWidth = Math.pow(2, maxDepth) * xGap
    const svgW = Math.max(300, maxWidth + 100)
    const svgH = (maxDepth + 1) * yGap + 60

    return (
        <svg
            width="100%"
            height="100%"
            viewBox={`${pan.x - svgW / 2 - 30} ${pan.y} ${svgW + 60} ${svgH}`}
            style={{
                transform: `scale(${scale})`,
                transformOrigin: "center top",
                transition: "transform 0.2s ease",
            }}
        >
            {/* Edges */}
            {heap.map((_, i) => {
                const l = leftIdx(i); const r = rightIdx(i)
                return (
                    <g key={`e-${i}`}>
                        {l < heap.length && (
                            <line x1={positions[i].x} y1={positions[i].y + R}
                                x2={positions[l].x} y2={positions[l].y - R}
                                stroke="#4b5563" strokeWidth="1.5" />
                        )}
                        {r < heap.length && (
                            <line x1={positions[i].x} y1={positions[i].y + R}
                                x2={positions[r].x} y2={positions[r].y - R}
                                stroke="#4b5563" strokeWidth="1.5" />
                        )}
                    </g>
                )
            })}
            {/* Nodes */}
            {heap.map((val, i) => {
                const st = states[i] ?? "default"
                return (
                    <g key={i}>
                        <circle cx={positions[i].x} cy={positions[i].y} r={R}
                            fill={NODE_FILL[st]} stroke={NODE_STROKE[st]} strokeWidth="2"
                            style={{ transition: "all 0.3s ease" }} />
                        <text x={positions[i].x} y={positions[i].y} textAnchor="middle" dominantBaseline="middle"
                            fill="white" fontSize="12" fontWeight="bold" className="select-none pointer-events-none">
                            {val}
                        </text>
                        <text x={positions[i].x} y={positions[i].y + R + 13} textAnchor="middle"
                            fill="#6b7280" fontSize="9" className="select-none pointer-events-none">
                            [{i}]
                        </text>
                    </g>
                )
            })}
        </svg>
    )
}

// ── Array View ───────────────────────────────────────────────────────────────

const ENTRY_BG: Record<NodeState, string> = {
    default: "bg-muted/50 border-border",
    comparing: "bg-blue-500/20 border-blue-500",
    swapping: "bg-yellow-500/20 border-yellow-500",
    inserted: "bg-green-500/20 border-green-500",
    deleted: "bg-red-500/20 border-red-500",
    heapified: "bg-purple-500/20 border-purple-500",
}

function HeapArrayView({ heap, states }: { heap: number[]; states: NodeState[] }) {
    return (
        <div className="flex gap-1 flex-wrap justify-center">
            {heap.map((val, i) => (
                <div key={i} className={`flex flex-col items-center border rounded px-2 py-1 min-w-[36px] text-center transition-all duration-300 ${ENTRY_BG[states[i] ?? "default"]}`}>
                    <span className="text-xs font-bold">{val}</span>
                    <span className="text-[9px] text-muted-foreground">[{i}]</span>
                </div>
            ))}
        </div>
    )
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function HeapVisualizer() {
    const [heapType, setHeapType] = useState<"min" | "max">("min")
    const [heap, setHeap] = useState<number[]>([])
    const [states, setStates] = useState<NodeState[]>([])
    const [inputValue, setInputValue] = useState("")
    const [steps, setSteps] = useState<string[]>([])

    // Zoom / Pan state
    const [scale, setScale] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })

    const onFrameChange = useCallback((snap: HeapFrame) => {
        setHeap(snap.heap)
        setStates(snap.states)
    }, [])
    const player = useAnimationPlayer<HeapFrame>(onFrameChange)

    const handleInsert = () => {
        if (!inputValue || player.isPlaying) return
        const val = parseInt(inputValue)
        if (isNaN(val) || val < 1 || val > 999) return
        setInputValue("")
        const frames = generateInsert(heap, val, heapType === "min")
        const lastSnap = frames[frames.length - 1].snapshot
        setSteps(frames.map((f) => f.description))
        player.loadFrames(frames)
        setTimeout(() => player.play(), 50)
        setTimeout(() => { setHeap(lastSnap.heap); setStates(lastSnap.states.map(() => "default")) }, frames.length * player.speed + 200)
    }

    const handleDeleteRoot = () => {
        if (heap.length === 0 || player.isPlaying) return
        const frames = generateDeleteRoot(heap, heapType === "min")
        const lastSnap = frames[frames.length - 1].snapshot
        setSteps(frames.map((f) => f.description))
        player.loadFrames(frames)
        setTimeout(() => player.play(), 50)
        setTimeout(() => { setHeap(lastSnap.heap); setStates(lastSnap.states.map(() => "default")) }, frames.length * player.speed + 200)
    }

    const handleClear = () => {
        if (player.isPlaying) return
        player.clear(); setHeap([]); setStates([]); setSteps([])
        setScale(1); setPan({ x: 0, y: 0 })
    }

    const handleRandom = () => {
        if (player.isPlaying) return
        player.clear()
        const vals = Array.from({ length: 7 }, () => Math.floor(Math.random() * 50) + 1)
        const h: number[] = []
        const isMin = heapType === "min"
        for (const v of vals) {
            h.push(v)
            let i = h.length - 1
            while (i > 0 && (isMin ? h[i] < h[parentIdx(i)] : h[i] > h[parentIdx(i)])) {
                [h[i], h[parentIdx(i)]] = [h[parentIdx(i)], h[i]]
                i = parentIdx(i)
            }
        }
        setHeap(h); setStates(h.map(() => "default")); setSteps([])
    }

    const handleTypeChange = (t: "min" | "max") => {
        if (player.isPlaying) return
        setHeapType(t); setHeap([]); setStates([]); setSteps([]); player.clear()
        setScale(1); setPan({ x: 0, y: 0 })
    }

    const snap = player.currentSnapshot
    const displayHeap = snap ? snap.heap : heap
    const displayStates = snap ? snap.states : states
    const stepDesc = snap ? snap.stepDescription : ""
    const isMin = heapType === "min"

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* ── LEFT: Controls + Array + Info ── */}
            <div className="space-y-4">

                {/* Operations Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>{isMin ? "Min" : "Max"}-Heap Operations</CardTitle>
                        <CardDescription>Insert and delete-root with animated heapify</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Heap type toggle */}
                        <div className="flex gap-2">
                            <Button size="sm" variant={heapType === "min" ? "default" : "outline"} onClick={() => handleTypeChange("min")} className="flex-1">Min-Heap</Button>
                            <Button size="sm" variant={heapType === "max" ? "default" : "outline"} onClick={() => handleTypeChange("max")} className="flex-1">Max-Heap</Button>
                        </div>

                        {/* Insert */}
                        <div className="flex gap-2">
                            <Input type="number" placeholder="Value (1–999)" value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleInsert()}
                                disabled={player.isPlaying} min={1} max={999} />
                            <Button onClick={handleInsert} disabled={player.isPlaying || !inputValue}>
                                <Plus className="mr-2 h-4 w-4" /> Insert
                            </Button>
                        </div>

                        {/* Operations row */}
                        <div className="flex gap-2">
                            <Button onClick={handleDeleteRoot} disabled={player.isPlaying || displayHeap.length === 0} variant="destructive" className="flex-1">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete {isMin ? "Min" : "Max"}
                            </Button>
                            <Button onClick={handleRandom} disabled={player.isPlaying} variant="outline">Random</Button>
                            <Button onClick={handleClear} disabled={player.isPlaying} variant="ghost">Clear</Button>
                        </div>

                        {/* AnimationControls */}
                        {player.totalFrames > 0 && (
                            <AnimationControls
                                currentFrame={player.currentFrame} totalFrames={player.totalFrames}
                                isPlaying={player.isPlaying} isPaused={player.isPaused} isComplete={player.isComplete}
                                speed={player.speed}
                                onPlay={player.play} onPause={player.pause}
                                onStepForward={player.stepForward} onStepBackward={player.stepBackward}
                                onReset={player.reset} onSpeedChange={player.setSpeed} onFrameChange={player.goToFrame}
                            />
                        )}

                        {/* Step description */}
                        {stepDesc && (
                            <p className="text-sm text-center text-muted-foreground bg-muted/30 rounded-md p-2">{stepDesc}</p>
                        )}

                        {/* Steps panel */}
                        <div>
                            <h3 className="text-sm font-medium mb-1">Algorithm Steps:</h3>
                            <div className="bg-muted/30 rounded-md p-2 h-28 overflow-y-auto">
                                {steps.length > 0 ? (
                                    <ol className="pl-4 list-decimal space-y-0.5">
                                        {steps.map((s, i) => (
                                            <li key={i} className={`text-xs ${i <= player.currentFrame ? "text-foreground" : "text-muted-foreground"}`}>{s}</li>
                                        ))}
                                    </ol>
                                ) : (
                                    <p className="text-xs text-muted-foreground">Insert or delete a value to see steps</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Array Representation Card */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Array Representation</CardTitle>
                        <CardDescription>Heap stored as level-order array</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {displayHeap.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-2">Empty heap</p>
                        ) : (
                            <HeapArrayView heap={displayHeap} states={displayStates} />
                        )}
                        <p className="text-[10px] text-muted-foreground text-center">
                            parent(i) = ⌊(i−1)/2⌋ &nbsp;·&nbsp; left(i) = 2i+1 &nbsp;·&nbsp; right(i) = 2i+2
                        </p>
                    </CardContent>
                </Card>

                {/* Stats + Legend */}
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-[10px] text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
                            <div>Root: <span className="font-mono font-bold text-foreground">{displayHeap[0] ?? "—"}</span></div>
                            <div>Size: <span className="font-mono font-bold text-foreground">{displayHeap.length}</span></div>
                            <div>Insert: <span className="font-mono">O(log n)</span></div>
                            <div>Delete: <span className="font-mono">O(log n)</span></div>
                            <div>Build: <span className="font-mono">O(n)</span></div>
                            <div>Peek: <span className="font-mono">O(1)</span></div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[10px]">
                            {([
                                ["bg-blue-500/30 border-blue-500", "Comparing"],
                                ["bg-yellow-500/30 border-yellow-500", "Swapping"],
                                ["bg-green-500/30 border-green-500", "Inserted"],
                                ["bg-red-500/30 border-red-500", "Deleted"],
                                ["bg-purple-500/30 border-purple-500", "Heapified"],
                            ] as const).map(([cls, label]) => (
                                <div key={label} className="flex items-center gap-1.5">
                                    <div className={`w-3 h-3 rounded-sm border ${cls}`} />
                                    <span className="text-muted-foreground">{label}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── RIGHT: Tree Visualization with Zoom/Pan ── */}
            <Card className="h-full flex flex-col">
                <CardHeader className="pb-2">
                    <CardTitle>Tree View</CardTitle>
                    <CardDescription>Visual representation of the heap as a complete binary tree</CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
                    {/* Zoom / Pan controls */}
                    <div className="flex flex-wrap gap-2 px-4 pb-2">
                        <Button size="sm" variant="outline" onClick={() => setScale((s) => Math.min(s * 1.2, 4))}>
                            <ZoomIn className="h-4 w-4 mr-1" /> Zoom In
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setScale((s) => Math.max(s / 1.2, 0.2))}>
                            <ZoomOut className="h-4 w-4 mr-1" /> Zoom Out
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setPan((p) => ({ ...p, x: p.x - 40 }))}>
                            <MoveHorizontal className="h-4 w-4 mr-1" /> Pan Left
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setPan((p) => ({ ...p, x: p.x + 40 }))}>
                            <MoveHorizontal className="h-4 w-4 mr-1" /> Pan Right
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setScale(1); setPan({ x: 0, y: 0 }) }}>
                            Reset View
                        </Button>
                    </div>

                    {/* SVG canvas */}
                    <div className="relative flex-1 overflow-auto" style={{ minHeight: "480px", overscrollBehavior: "contain" }}>
                        <div className="absolute inset-0" style={{ minWidth: "600px", minHeight: "480px" }}>
                            {displayHeap.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                    Insert values to build the heap
                                </div>
                            ) : (
                                <HeapTreeSVG heap={displayHeap} states={displayStates} scale={scale} pan={pan} />
                            )}
                        </div>
                    </div>

                    <div className="px-4 py-2 text-xs text-center text-muted-foreground border-t">
                        Use zoom and pan controls to navigate. Each node shows its value and array index.
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
