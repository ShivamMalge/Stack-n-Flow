"use client"

import type React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import AnimationControls from "@/components/ui/animation-controls"
import CodePanel from "@/components/ui/code-panel"
import HeapRenderer, { HeapArrayView, HeapLegend, type HeapNodeState } from "@/components/visualizers/heap/heap-renderer"
import { useAnimationPlayer, type AnimationFrame } from "@/hooks/useAnimationPlayer"

// ── Types ──────────────────────────────────────────────────────────────────

// The states are the renderer's, so the palettes it draws them with cannot
// go out of step with the frames built here.
type NodeState = HeapNodeState

type HeapFrame = {
    heap: number[]
    states: NodeState[]
    stepDescription: string
    activeLine: number | null
}

const INSERT_CODE = [
    "def insert(value):",
    "    heap.append(value)",
    "    i = len(heap) - 1",
    "    while i > 0:",
    "        p = (i - 1) // 2",
    "        if heap[i] satisfies property vs heap[p]:",
    "            heap[i], heap[p] = heap[p], heap[i]",
    "            i = p",
    "        else: break"
]

const DELETE_CODE = [
    "def delete_root():",
    "    if not heap: return",
    "    heap[0] = heap.pop()",
    "    i = 0",
    "    while True:",
    "        target = i",
    "        l, r = 2 * i + 1, 2 * i + 2",
    "        if l < size and h[l] better than h[target]: target = l",
    "        if r < size and h[r] better than h[target]: target = r",
    "        if target != i:",
    "            heap[i], heap[target] = heap[target], heap[i]",
    "            i = target",
    "        else: break"
]

// ── Heap helpers ────────────────────────────────────────────────────────────

function parentIdx(i: number) { return Math.floor((i - 1) / 2) }
function leftIdx(i: number) { return 2 * i + 1 }
function rightIdx(i: number) { return 2 * i + 2 }

function generateInsert(heap: number[], value: number, isMin: boolean): AnimationFrame<HeapFrame>[] {
    const h = [...heap]
    const frames: AnimationFrame<HeapFrame>[] = []
    const neutral = () => h.map(() => "default" as NodeState)

    // Start
    frames.push({ snapshot: { heap: [...h], states: neutral(), stepDescription: `Starting insertion of ${value}`, activeLine: 0 }, description: "Start" })

    h.push(value)
    const insertedIdx = h.length - 1
    const st = neutral(); st[insertedIdx] = "inserted"
    frames.push({ snapshot: { heap: [...h], states: [...st], stepDescription: `Insert ${value} at index ${insertedIdx} (last position)`, activeLine: 1 }, description: `Insert ${value}` })
    frames.push({ snapshot: { heap: [...h], states: [...st], stepDescription: `i = ${insertedIdx}`, activeLine: 2 }, description: "Init i" })

    let i = insertedIdx
    while (i > 0) {
        frames.push({ snapshot: { heap: [...h], states: neutral(), stepDescription: `Check if i > 0 (i = ${i})`, activeLine: 3 }, description: "Check loop" })
        const p = parentIdx(i)
        const s = neutral(); s[i] = "comparing"; s[p] = "comparing"
        frames.push({ snapshot: { heap: [...h], states: [...s], stepDescription: `p = floor((${i}-1)/2) = ${p}`, activeLine: 4 }, description: "Calc parent" })

        const cmp = isMin ? h[i] < h[p] : h[i] > h[p]
        frames.push({ snapshot: { heap: [...h], states: [...s], stepDescription: `Does ${h[i]} violate ${isMin ? "Min" : "Max"}-Heap property vs ${h[p]}?`, activeLine: 5 }, description: "Compare" })

        if (cmp) {
            const sw = neutral(); sw[i] = "swapping"; sw[p] = "swapping"
            frames.push({ snapshot: { heap: [...h], states: [...sw], stepDescription: `Yes! Swap ${h[i]} ↔ ${h[p]}`, activeLine: 6 }, description: "Swap" });
            [h[i], h[p]] = [h[p], h[i]]
            i = p
            frames.push({ snapshot: { heap: [...h], states: neutral(), stepDescription: `i = p = ${p}`, activeLine: 7 }, description: "Update i" })
        } else {
            frames.push({ snapshot: { heap: [...h], states: neutral(), stepDescription: `No. Position is correct.`, activeLine: 8 }, description: "Break" })
            break
        }
    }
    const done = neutral(); if (i >= 0 && i < h.length) done[i] = "heapified"
    frames.push({ snapshot: { heap: [...h], states: [...done], stepDescription: `Insertion of ${value} complete.`, activeLine: 9 }, description: "Done" })
    return frames
}

function generateDeleteRoot(heap: number[], isMin: boolean): AnimationFrame<HeapFrame>[] {
    if (heap.length === 0) return []
    const h = [...heap]
    const frames: AnimationFrame<HeapFrame>[] = []
    const neutral = () => h.map(() => "default" as NodeState)

    frames.push({ snapshot: { heap: [...h], states: neutral(), stepDescription: `Starting deleteRoot`, activeLine: 0 }, description: "Start" })

    const s0 = neutral(); s0[0] = "deleted"
    frames.push({ snapshot: { heap: [...h], states: [...s0], stepDescription: `Remove root (${h[0]})`, activeLine: 1 }, description: `Remove root` })

    h[0] = h[h.length - 1]
    h.pop()
    if (h.length === 0) {
        frames.push({ snapshot: { heap: [], states: [], stepDescription: "Heap is now empty", activeLine: 2 }, description: "Empty" })
        return frames
    }
    const s1 = neutral(); s1[0] = "inserted"
    frames.push({ snapshot: { heap: [...h], states: [...s1], stepDescription: `Move last element to root`, activeLine: 2 }, description: `Last → root` })
    frames.push({ snapshot: { heap: [...h], states: neutral(), stepDescription: `i = 0`, activeLine: 3 }, description: "Init i" })

    let i = 0
    while (true) {
        frames.push({ snapshot: { heap: [...h], states: neutral(), stepDescription: `Heapify down from i = ${i}`, activeLine: 4 }, description: "Loop" })
        let target = i
        frames.push({ snapshot: { heap: [...h], states: neutral(), stepDescription: `target = ${i}`, activeLine: 5 }, description: "Init target" })

        const l = leftIdx(i); const r = rightIdx(i)
        frames.push({ snapshot: { heap: [...h], states: neutral(), stepDescription: `l = ${l}, r = ${r}`, activeLine: 6 }, description: "Calc children" })

        if (l < h.length && (isMin ? h[l] < h[target] : h[l] > h[target])) {
            target = l
            frames.push({ snapshot: { heap: [...h], states: neutral(), stepDescription: `Left child ${h[l]} is ${isMin ? "smaller" : "larger"}. target = ${l}`, activeLine: 7 }, description: "Target left" })
        } else {
            frames.push({ snapshot: { heap: [...h], states: neutral(), stepDescription: `Left child doesn't exist or is fine.`, activeLine: 7 }, description: "Skip left" })
        }

        if (r < h.length && (isMin ? h[r] < h[target] : h[r] > h[target])) {
            target = r
            frames.push({ snapshot: { heap: [...h], states: neutral(), stepDescription: `Right child ${h[r]} is ${isMin ? "better" : "worse"}. target = ${r}`, activeLine: 8 }, description: "Target right" })
        } else {
            frames.push({ snapshot: { heap: [...h], states: neutral(), stepDescription: `Right child doesn't exist or is fine.`, activeLine: 8 }, description: "Skip right" })
        }

        frames.push({ snapshot: { heap: [...h], states: neutral(), stepDescription: `Is target (${target}) != i (${i})?`, activeLine: 9 }, description: "Check swap" })
        if (target !== i) {
            const sw = neutral(); sw[i] = "swapping"; sw[target] = "swapping"
            frames.push({ snapshot: { heap: [...h], states: [...sw], stepDescription: `Yes! Swap ${h[i]} ↔ ${h[target]}`, activeLine: 10 }, description: "Swap" });
            [h[i], h[target]] = [h[target], h[i]]
            i = target
            frames.push({ snapshot: { heap: [...h], states: neutral(), stepDescription: `i = ${target}`, activeLine: 11 }, description: "Update i" })
        } else {
            frames.push({ snapshot: { heap: [...h], states: neutral(), stepDescription: `No. Property satisfied.`, activeLine: 12 }, description: "Break" })
            break
        }
    }
    const done = neutral()
    frames.push({ snapshot: { heap: [...h], states: [...done], stepDescription: "Root deletion and heapify complete.", activeLine: null }, description: "Done" })
    return frames
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function HeapVisualizer({
    controlledHeap,
    controlledStates,
}: {
    controlledHeap?: number[];
    controlledStates?: NodeState[];
} = {}) {
    const [heapType, setHeapType] = useState<"min" | "max">("min")
    const [internalHeap, setHeap] = useState<number[]>([])
    const [internalStates, setStates] = useState<NodeState[]>([])
    const heap = controlledHeap !== undefined ? controlledHeap : internalHeap;
    const states = controlledStates !== undefined ? controlledStates : internalStates;
    const [inputValue, setInputValue] = useState("")
    const [steps, setSteps] = useState<string[]>([])

    /*
      Bumped when the heap is cleared or its type flipped, and passed as the
      renderer's `key`. Zoom and pan live in the renderer now, but starting a new
      heap should still start from a default view rather than wherever the last
      one was left panned to; remounting is the plainest way to say that.
    */
    const [viewGeneration, setViewGeneration] = useState(0)

    const onFrameChange = useCallback((snap: HeapFrame) => {
        setHeap(snap.heap)
        setStates(snap.states)
    }, [])
    const player = useAnimationPlayer<HeapFrame>(onFrameChange)

    // Final snapshot of the run currently loaded in the player. It is committed to
    // the base heap only once the player reports the run genuinely finished; a
    // wall-clock timer would fire regardless of the user pausing, stepping,
    // scrubbing or changing speed and clobber the display with the end state.
    const pendingFinalRef = useRef<HeapFrame | null>(null)

    useEffect(() => {
        if (!player.isComplete) return
        const final = pendingFinalRef.current
        if (!final) return
        pendingFinalRef.current = null   // commit once per run, never on re-render
        setHeap(final.heap)
        setStates(final.states.map(() => "default"))
    }, [player.isComplete])

    const handleInsert = () => {
        if (!inputValue || player.isPlaying) return
        const val = parseInt(inputValue)
        if (isNaN(val) || val < 1 || val > 999) return
        setInputValue("")
        const frames = generateInsert(heap, val, heapType === "min")
        pendingFinalRef.current = frames[frames.length - 1].snapshot
        setSteps(frames.map((f) => f.description))
        player.loadFrames(frames)
        setTimeout(() => player.play(), 50)
    }

    const handleDeleteRoot = () => {
        if (heap.length === 0 || player.isPlaying) return
        const frames = generateDeleteRoot(heap, heapType === "min")
        pendingFinalRef.current = frames[frames.length - 1].snapshot
        setSteps(frames.map((f) => f.description))
        player.loadFrames(frames)
        setTimeout(() => player.play(), 50)
    }

    const handleClear = () => {
        if (player.isPlaying) return
        pendingFinalRef.current = null
        player.clear(); setHeap([]); setStates([]); setSteps([])
        setViewGeneration((n) => n + 1)
    }

    const handleRandom = () => {
        if (player.isPlaying) return
        pendingFinalRef.current = null
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
        pendingFinalRef.current = null
        setHeapType(t); setHeap([]); setStates([]); setSteps([]); player.clear()
        setViewGeneration((n) => n + 1)
    }

    const snap = player.currentSnapshot
    const displayHeap = snap ? snap.heap : heap
    const displayStates = snap ? snap.states : states
    const stepDesc = snap ? snap.stepDescription : ""
    const isMin = heapType === "min"

    return (
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1.8fr] gap-6">

            {/* ── LEFT: Controls + Array + Info ── */}
            <div className="order-1 md:col-start-1 md:row-start-1 space-y-4">

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
                            <div className="bg-muted/30 rounded-md p-2 h-40 overflow-y-auto">
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
                        <p className="text-xs text-muted-foreground text-center">
                            parent(i) = ⌊(i−1)/2⌋ &nbsp;·&nbsp; left(i) = 2i+1 &nbsp;·&nbsp; right(i) = 2i+2
                        </p>
                    </CardContent>
                </Card>

                {/* Stats + Legend */}
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-xs text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
                            <div>Root: <span className="font-mono font-bold text-foreground">{displayHeap[0] ?? "—"}</span></div>
                            <div>Size: <span className="font-mono font-bold text-foreground">{displayHeap.length}</span></div>
                            <div>Insert: <span className="font-mono">O(log n)</span></div>
                            <div>Delete: <span className="font-mono">O(log n)</span></div>
                            <div>Build: <span className="font-mono">O(n)</span></div>
                            <div>Peek: <span className="font-mono">O(1)</span></div>
                        </div>
                        {/* Was hand-written here at /30 opacity while the cells it
                            describes are drawn at /20, from a separate list that
                            had to be kept in step by hand. */}
                        <HeapLegend />
                    </CardContent>
                </Card>
            </div>

            {/* ── RIGHT: Tree Visualization with the Code Panel directly under it ── */}
            {/* One row only: the column stretches to the left column's height and the
                tree card absorbs the slack, so neither side is left half empty. */}
            <div className="order-2 md:col-start-2 md:row-start-1 flex flex-col gap-6 h-full">
                {/* Tree Visualization Card */}
                {/* showArray is off: the left column already carries the
                    Array Representation card. A notebook has no left column,
                    so the renderer draws it there by default. */}
                <HeapRenderer key={viewGeneration} heap={displayHeap} states={displayStates} showArray={false} />

                {/* Code Panel Card */}
                <div className="h-[280px]">
                    <CodePanel
                        code={snap?.activeLine !== undefined ? (steps[0]?.includes("Insert") ? INSERT_CODE : DELETE_CODE) : []}
                        activeLine={snap?.activeLine ?? null}
                        title={snap ? (steps[0]?.includes("Insert") ? "Insertion Pseudocode" : "Deletion Pseudocode") : "Algorithm Pseudocode"}
                    />
                </div>
            </div>
        </div>
    )
}
