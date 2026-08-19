"use client"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownToLine, ArrowUpToLine, Plus, RotateCcw, Shuffle } from "lucide-react"
import AnimationControls from "@/components/ui/animation-controls"
import CodePanel from "@/components/ui/code-panel"
import InlineAlert from "@/components/ui/inline-alert"
import VisualizerLayout from "@/components/visualizers/visualizer-layout"
import { useAnimationPlayer } from "@/hooks/useAnimationPlayer"
import { useMobile } from "@/hooks/use-mobile"
import { STATE_BOX, STATE_SHAPE } from "@/lib/visualizer-states"
import {
    buildExtract,
    buildInsert,
    isMinLevel,
    levelOf,
    maxIndex,
    minIndex,
    MODE_LABELS,
    type PQMode,
    type PQNode,
    type PQSnapshot,
    MAX_SIZE,
} from "@/lib/priority-queue"

// Line indices match the constants in lib/priority-queue.ts.
const SINGLE_INSERT = [
    "def insert(x):",
    "    a.append(x); i = len(a) - 1",
    "    while i > 0:",
    "        if better(a[i], a[parent(i)]):",
    "            swap(i, parent(i)); i = parent(i)",
    "        else: break",
]

const SINGLE_EXTRACT = [
    "def extract():",
    "    top = a[0]                      # the root is the answer",
    "    a[0] = a.pop()                  # last element to the root",
    "    sift_down(0)",
    "    return top",
]

const MINMAX_INSERT = [
    "def insert(x):                       # min-max heap",
    "    a.append(x); i = len(a) - 1",
    "    # every node sits on a min level or a max level",
    "    if wrong_side_of_parent(i):",
    "        swap(i, parent(i)); i = parent(i)",
    "    while has_grandparent(i) and beats(a[i], a[grandparent(i)]):",
    "        swap(i, grandparent(i)); i = grandparent(i)",
]

const MINMAX_EXTRACT = [
    "def extract_min():                   # extract_max mirrors this",
    "    top = a[0]                       # min is always the root",
    "    a[0] = a.pop()",
    "    # sift down, checking children AND grandchildren",
    "    if the displaced value broke its level: swap with its parent",
    "    m = best among children and grandchildren",
    "    if m beats a[i]: swap(i, m) and continue from m",
]

const MODES: PQMode[] = ["min", "max", "minmax"]

export default function PriorityQueueVisualizer() {
    const isMobile = useMobile()
    const [mode, setMode] = useState<PQMode>("minmax")
    const [heap, setHeap] = useState<number[]>([])
    const [input, setInput] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [result, setResult] = useState<string | null>(null)
    const [lastOp, setLastOp] = useState<"insert" | "extract">("insert")

    const onFrameChange = useCallback((snap: PQSnapshot) => setHeap(snap.heap.map((n) => n.value)), [])
    const player = useAnimationPlayer<PQSnapshot>(onFrameChange)

    const snapshot = player.currentSnapshot
    const nodes: PQNode[] = snapshot?.heap ?? heap.map((value) => ({ value, state: "default" as const }))
    const comparisons = snapshot?.comparisons ?? 0
    const swaps = snapshot?.swaps ?? 0

    const run = (outcome: ReturnType<typeof buildInsert>, op: "insert" | "extract") => {
        if (outcome.error) {
            setError(outcome.error)
            return
        }
        setError(null)
        setLastOp(op)
        setResult(outcome.result)
        setHeap(outcome.heap)
        player.loadFrames(outcome.frames)
        setTimeout(() => player.play(), 50)
    }

    const reset = (nextMode = mode) => {
        player.clear()
        setMode(nextMode)
        setHeap([])
        setError(null)
        setResult(null)
    }

    const randomFill = () => {
        let current: number[] = []
        for (let i = 0; i < 10; i++) {
            const value = Math.floor(Math.random() * 99) + 1
            const outcome = buildInsert(current, value, mode)
            if (!outcome.error) current = outcome.heap
        }
        player.clear()
        setHeap(current)
        setError(null)
        setResult(null)
    }

    // Complete-binary-tree placement: a node's slot within its level is fixed
    // by its index, so nothing needs a layout pass.
    const depth = nodes.length > 0 ? levelOf(nodes.length - 1) : 0
    const NODE_R = isMobile ? 15 : 19
    const Y_GAP = isMobile ? 58 : 70
    const PAD = 30
    const svgW = Math.max(300, Math.min(2 ** depth, 16) * (isMobile ? 48 : 62) + PAD * 2)
    const svgH = (depth + 1) * Y_GAP + PAD * 2
    const positionOf = (i: number) => {
        const level = levelOf(i)
        const slot = i - (2 ** level - 1)
        const perLevel = 2 ** level
        return {
            x: PAD + ((slot + 0.5) / perLevel) * (svgW - PAD * 2),
            y: PAD + level * Y_GAP,
        }
    }

    const minAt = minIndex(nodes.map((n) => n.value), mode)
    const maxAt = maxIndex(nodes.map((n) => n.value), mode)

    return (
        <VisualizerLayout
            controls={
                <Card>
                    <CardHeader>
                        <CardTitle>Priority Queue</CardTitle>
                        <CardDescription>Insert, then take from whichever end the structure supports</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Structure</Label>
                            <div className="grid gap-1.5">
                                {MODES.map((option) => (
                                    <Button
                                        key={option}
                                        size="sm"
                                        variant={mode === option ? "default" : "outline"}
                                        onClick={() => reset(option)}
                                        disabled={player.isPlaying}
                                        className="justify-start text-xs"
                                    >
                                        {MODE_LABELS[option]}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Input
                                type="number"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && run(buildInsert(heap, Number(input), mode), "insert")}
                                placeholder="Priority, 1–999"
                                aria-label="Priority"
                                className="font-mono"
                                disabled={player.isPlaying}
                            />
                            <Button
                                onClick={() => run(buildInsert(heap, Number(input), mode), "insert")}
                                disabled={player.isPlaying}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Insert
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => run(buildExtract(heap, mode, "min"), "extract")}
                                disabled={player.isPlaying}
                            >
                                <ArrowDownToLine className="mr-2 h-4 w-4" />
                                Extract min
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => run(buildExtract(heap, mode, "max"), "extract")}
                                disabled={player.isPlaying}
                            >
                                <ArrowUpToLine className="mr-2 h-4 w-4" />
                                Extract max
                            </Button>
                        </div>

                        <InlineAlert message={error} />

                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={randomFill} disabled={player.isPlaying}>
                                <Shuffle className="mr-2 h-4 w-4" />
                                Random 10
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => reset()} disabled={player.isPlaying}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Clear
                            </Button>
                        </div>

                        <div className="border-t pt-4">
                            <AnimationControls
                                currentFrame={player.currentFrame}
                                totalFrames={player.totalFrames}
                                isPlaying={player.isPlaying}
                                isPaused={player.isPaused}
                                isComplete={player.isComplete}
                                speed={player.speed}
                                onPlay={player.play}
                                onPause={player.pause}
                                onStepForward={player.stepForward}
                                onStepBackward={player.stepBackward}
                                onReset={player.reset}
                                onSpeedChange={player.setSpeed}
                                onFrameChange={player.goToFrame}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-2 border-t pt-4 text-center">
                            {[
                                ["Size", `${nodes.length}`],
                                ["Comparisons", `${comparisons}`],
                                ["Swaps", `${swaps}`],
                            ].map(([label, shown]) => (
                                <div key={label}>
                                    <p className="font-mono text-lg font-bold">{shown}</p>
                                    <p className="text-xs text-muted-foreground">{label}</p>
                                </div>
                            ))}
                        </div>

                        {result && (
                            <div className="rounded-md border bg-muted/30 p-3">
                                <p className="font-mono text-sm font-bold break-all">{result}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            }
            visualization={
                <Card className="flex flex-col h-full">
                    <CardHeader className="shrink-0">
                        <CardTitle>Visualization</CardTitle>
                        <CardDescription>
                            {MODE_LABELS[mode]}
                            {nodes.length > 0 && mode === "minmax" &&
                                ` · min ${nodes[minAt]?.value} at the root, max ${nodes[maxAt]?.value} at index ${maxAt}`}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-col flex-1 min-h-0 gap-4 border-t pt-4 pb-4 bg-muted/5">
                        <div className="flex flex-1 min-h-[220px] max-h-[48vh] overflow-auto">
                            {nodes.length === 0 ? (
                                <p className="m-auto text-sm text-muted-foreground">Insert a value to begin.</p>
                            ) : (
                                <svg
                                    width={svgW}
                                    height={svgH}
                                    viewBox={`0 0 ${svgW} ${svgH}`}
                                    className="m-auto shrink-0 max-w-none"
                                >
                                    {/* Level bands, so the alternation is visible rather than
                                        something to infer from the index. */}
                                    {mode === "minmax" && Array.from({ length: depth + 1 }, (_, level) => (
                                        <g key={`band-${level}`}>
                                            <rect
                                                x={0}
                                                y={PAD + level * Y_GAP - NODE_R - 6}
                                                width={svgW}
                                                height={NODE_R * 2 + 12}
                                                className={level % 2 === 0 ? "fill-sky-500/5" : "fill-orange-500/5"}
                                            />
                                            <text
                                                x={6}
                                                y={PAD + level * Y_GAP}
                                                dominantBaseline="middle"
                                                className="text-[9px] font-bold fill-muted-foreground select-none"
                                            >
                                                {level % 2 === 0 ? "MIN" : "MAX"}
                                            </text>
                                        </g>
                                    ))}

                                    {nodes.map((_, i) => {
                                        if (i === 0) return null
                                        const from = positionOf(i)
                                        const to = positionOf(Math.floor((i - 1) / 2))
                                        return (
                                            <line
                                                key={`edge-${i}`}
                                                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                                                className="stroke-muted-foreground transition-all duration-300"
                                                strokeOpacity="0.4"
                                                strokeWidth="2"
                                            />
                                        )
                                    })}

                                    {nodes.map((node, i) => {
                                        const { x, y } = positionOf(i)
                                        return (
                                            <g key={i}>
                                                <circle
                                                    cx={x} cy={y} r={NODE_R}
                                                    className={`stroke-[2] transition-all duration-300 ${STATE_SHAPE[node.state]}`}
                                                />
                                                <text
                                                    x={x} y={y}
                                                    textAnchor="middle" dominantBaseline="middle"
                                                    className={`${isMobile ? "text-[10px]" : "text-xs"} font-bold fill-current pointer-events-none select-none`}
                                                >
                                                    {node.value}
                                                </text>
                                                <text
                                                    x={x} y={y + NODE_R + 9}
                                                    textAnchor="middle"
                                                    className="text-[9px] fill-muted-foreground pointer-events-none select-none"
                                                >
                                                    [{i}]{mode === "minmax" ? (isMinLevel(i) ? " min" : " max") : ""}
                                                </text>
                                            </g>
                                        )
                                    })}
                                </svg>
                            )}
                        </div>

                        <div className="shrink-0 space-y-1 overflow-x-auto">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Array representation
                            </p>
                            <div className="flex gap-1">
                                {nodes.map((node, i) => (
                                    <div key={i} className="flex flex-col items-center">
                                        <div
                                            className={`flex h-8 w-9 items-center justify-center rounded border-2 font-mono text-xs font-bold transition-all duration-300 ${STATE_BOX[node.state]}`}
                                        >
                                            {node.value}
                                        </div>
                                        <span className="mt-0.5 font-mono text-[10px] text-muted-foreground">{i}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {player.currentDescription && (
                            <p className="shrink-0 rounded-md border bg-muted/30 px-3 py-2 text-center text-xs md:text-sm font-medium text-primary">
                                {player.currentDescription}
                            </p>
                        )}
                    </CardContent>
                </Card>
            }
            code={
                <CodePanel
                    code={
                        mode === "minmax"
                            ? (lastOp === "insert" ? MINMAX_INSERT : MINMAX_EXTRACT)
                            : (lastOp === "insert" ? SINGLE_INSERT : SINGLE_EXTRACT)
                    }
                    activeLine={snapshot?.activeLine ?? null}
                    title={`${MODE_LABELS[mode]} — ${lastOp}`}
                />
            }
            docs={
                <Card>
                    <CardHeader>
                        <CardTitle>Learning</CardTitle>
                        <CardDescription>One end, or both</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <p>
                            A <strong>priority queue</strong> is an ADT, not a structure: insert an element with
                            a priority, and take out the one with the highest priority. A heap is the usual
                            implementation because both cost O(log n).
                        </p>
                        <p>
                            A min-heap gives you the smallest in O(1) and the largest only by scanning all n
                            elements. A max-heap is the mirror. Try it — asking a min-heap for the maximum here
                            refuses and says why.
                        </p>
                        <div>
                            <p className="mb-1 font-medium">The min-max heap</p>
                            <p className="text-muted-foreground">
                                A <strong>double-ended</strong> priority queue gives both ends in O(log n). The
                                min-max heap does it by alternating levels: the root is on a min level, its
                                children on a max level, their children on a min level again. A node on a min
                                level is the smallest of its whole subtree; a node on a max level is the largest.
                            </p>
                        </div>
                        <p>
                            Two consequences fall straight out. The <strong>minimum is always the root</strong>,
                            and the <strong>maximum is always one of the root&apos;s two children</strong> — there
                            is nowhere else it could be. Both are therefore O(1) to find.
                        </p>
                        <p>
                            The cost is in the movement. Inserting compares against the <em>grandparent</em>, two
                            levels up, because that is the nearest ancestor of the same kind — and it may need a
                            single swap with the parent first, if the new value landed on the wrong kind of level.
                            Sifting down has to consider children <em>and</em> grandchildren for the same reason.
                        </p>
                        <p className="text-muted-foreground">
                            Fill it with ten random values and drain from alternating ends: the levels reshuffle
                            after every removal, and both ends stay correct throughout.
                        </p>
                    </CardContent>
                </Card>
            }
        />
    )
}
