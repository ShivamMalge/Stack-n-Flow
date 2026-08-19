"use client"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDown, Minus, Plus, RotateCcw } from "lucide-react"
import AnimationControls from "@/components/ui/animation-controls"
import CodePanel from "@/components/ui/code-panel"
import InlineAlert from "@/components/ui/inline-alert"
import VisualizerLayout from "@/components/visualizers/visualizer-layout"
import { useAnimationPlayer } from "@/hooks/useAnimationPlayer"
import { STATE_BOX } from "@/lib/visualizer-states"
import {
    buildAppend,
    buildRemove,
    loadFactor,
    makeDynamic,
    MODE_LABELS,
    type DynCell,
    type DynMode,
    type DynSnapshot,
    type DynState,
    DEFAULT_CAPACITY,
    MAX_CAPACITY,
    MIN_CAPACITY,
} from "@/lib/dynamic-array"

// Line indices match what lib/dynamic-array.ts sets as `activeLine`.
const CODE = [
    "def append(value):",
    "    if size == capacity:",
    "        grow()                          # double, then copy",
    "    slots[(front + size) % capacity] = value",
    "    size += 1",
    "",
    "def grow():",
    "    bigger = new array(capacity * 2)",
    "    for i in range(size):               # logical order,",
    "        bigger[i] = slots[(front + i) % capacity]",
    "    slots, capacity, front = bigger, capacity * 2, 0",
]

const MODES: DynMode[] = ["array", "stack", "queue"]
const ADD_LABEL: Record<DynMode, string> = { array: "Append", stack: "Push", queue: "Enqueue" }
const REMOVE_LABEL: Record<DynMode, string> = { array: "Remove last", stack: "Pop", queue: "Dequeue" }

function Row({
    cells,
    front,
    size,
    mode,
    muted = false,
}: {
    cells: DynCell[]
    front: number
    size: number
    mode: DynMode
    muted?: boolean
}) {
    return (
        <div className={`flex flex-wrap gap-1 ${muted ? "opacity-50" : ""}`}>
            {cells.map((cell, index) => {
                const live =
                    mode === "queue"
                        ? size > 0 && (index - front + cells.length) % cells.length < size
                        : index < size
                const isFront = mode === "queue" && size > 0 && index === front
                const isRear = mode === "queue" && size > 0 && index === (front + size - 1) % cells.length
                return (
                    <div key={index} className="flex flex-col items-center">
                        <div className="h-3 text-[9px] font-semibold uppercase tracking-wide text-primary">
                            {isFront ? "front" : isRear ? "rear" : ""}
                        </div>
                        <div
                            className={`flex h-10 w-11 items-center justify-center rounded-md border-2 font-mono text-sm font-bold transition-all duration-300 ${STATE_BOX[cell.state]} ${!live && cell.state === "default" ? "border-dashed opacity-60" : ""}`}
                        >
                            {cell.value ?? <span className="text-muted-foreground">·</span>}
                        </div>
                        <span className="mt-0.5 font-mono text-[10px] text-muted-foreground">{index}</span>
                    </div>
                )
            })}
        </div>
    )
}

export default function DynamicArrayVisualizer() {
    const [mode, setMode] = useState<DynMode>("array")
    const [capacity, setCapacity] = useState(DEFAULT_CAPACITY)
    const [state, setState] = useState<DynState>(() => makeDynamic(DEFAULT_CAPACITY))
    const [value, setValue] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [result, setResult] = useState<string | null>(null)

    const onFrameChange = useCallback((snap: DynSnapshot) => {
        setState((prev) => ({
            ...prev,
            slots: snap.cells.map((c) => c.value),
            size: snap.size,
            front: snap.front,
            copies: snap.copies,
            grows: snap.grows,
        }))
    }, [])
    const player = useAnimationPlayer<DynSnapshot>(onFrameChange)

    const snapshot = player.currentSnapshot
    const cells: DynCell[] = snapshot?.cells ?? state.slots.map((v) => ({ value: v, state: "default" as const }))
    const oldCells = snapshot?.oldCells ?? null
    const size = snapshot?.size ?? state.size
    const front = snapshot?.front ?? state.front
    const copies = snapshot?.copies ?? state.copies
    const grows = snapshot?.grows ?? state.grows
    const cap = cells.length

    const run = (outcome: ReturnType<typeof buildAppend>) => {
        if (outcome.error) {
            setError(outcome.error)
            return
        }
        setError(null)
        setResult(outcome.result)
        setState(outcome.state)
        player.loadFrames(outcome.frames)
        setTimeout(() => player.play(), 50)
    }

    const reset = (nextCapacity = capacity, nextMode = mode) => {
        player.clear()
        setState(makeDynamic(nextCapacity))
        setMode(nextMode)
        setError(null)
        setResult(null)
    }

    const fillToGrow = () => {
        // Enough appends to force at least one reallocation, so the copy is
        // one click away rather than something to set up by hand.
        let current = makeDynamic(capacity)
        for (let i = 0; i < capacity; i++) {
            current = buildAppend(current, String(i + 1), mode).state
        }
        player.clear()
        setState(current)
        setError(null)
        setResult(`Filled to ${capacity}/${capacity} — the next ${ADD_LABEL[mode].toLowerCase()} must grow.`)
    }

    return (
        <VisualizerLayout
            controls={
                <Card>
                    <CardHeader>
                        <CardTitle>Dynamic Array</CardTitle>
                        <CardDescription>Watch capacity double and the elements copy across</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Used as</Label>
                            <div className="grid gap-1.5">
                                {MODES.map((option) => (
                                    <Button
                                        key={option}
                                        size="sm"
                                        variant={mode === option ? "default" : "outline"}
                                        onClick={() => reset(capacity, option)}
                                        disabled={player.isPlaying}
                                        className="justify-start text-xs"
                                    >
                                        {MODE_LABELS[option]}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="dyn-cap">Initial capacity</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="dyn-cap"
                                    type="number"
                                    min={MIN_CAPACITY}
                                    max={MAX_CAPACITY}
                                    value={capacity}
                                    onChange={(e) => {
                                        const n = Number(e.target.value)
                                        if (Number.isInteger(n) && n >= MIN_CAPACITY && n <= MAX_CAPACITY) {
                                            setCapacity(n)
                                            reset(n)
                                        }
                                    }}
                                    disabled={player.isPlaying}
                                />
                                <Button variant="outline" onClick={() => reset()} disabled={player.isPlaying}>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reset
                                </Button>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Input
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && run(buildAppend(state, value, mode))}
                                placeholder="Value"
                                aria-label="Value"
                                className="font-mono"
                                disabled={player.isPlaying}
                            />
                            <Button onClick={() => run(buildAppend(state, value, mode))} disabled={player.isPlaying}>
                                <Plus className="mr-2 h-4 w-4" />
                                {ADD_LABEL[mode]}
                            </Button>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => run(buildRemove(state, mode))}
                                disabled={player.isPlaying}
                            >
                                <Minus className="mr-2 h-4 w-4" />
                                {REMOVE_LABEL[mode]}
                            </Button>
                            <Button variant="secondary" size="sm" onClick={fillToGrow} disabled={player.isPlaying}>
                                Fill to full
                            </Button>
                        </div>

                        <InlineAlert message={error} />

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

                        <div className="grid grid-cols-4 gap-2 border-t pt-4 text-center">
                            {[
                                ["Size", `${size}`],
                                ["Capacity", `${cap}`],
                                ["Grows", `${grows}`],
                                ["Copies", `${copies}`],
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
                        <CardTitle>Storage</CardTitle>
                        <CardDescription>
                            {MODE_LABELS[mode]} · {size}/{cap} used, load factor {loadFactor({ ...state, slots: cells.map((c) => c.value), size }).toFixed(2)}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-col flex-1 min-h-0 gap-4 border-t pt-4 pb-4 bg-muted/5 overflow-auto">
                        {oldCells && (
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Old array — being copied from
                                </p>
                                <Row cells={oldCells} front={front} size={oldCells.length} mode={mode} muted />
                                <div className="flex justify-center py-1">
                                    <ArrowDown className="h-4 w-4 text-primary" />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {oldCells ? "New array — twice the capacity" : "Storage"}
                            </p>
                            <Row cells={cells} front={front} size={size} mode={mode} />
                        </div>

                        {player.currentDescription && (
                            <p className="shrink-0 rounded-md border bg-muted/30 px-3 py-2 text-center text-xs md:text-sm font-medium text-primary">
                                {player.currentDescription}
                            </p>
                        )}

                        <div className="shrink-0 mt-auto flex flex-wrap justify-center gap-x-4 gap-y-2 border-t pt-3 text-xs">
                            {([
                                ["default", "Free"],
                                ["inserted", "Written"],
                                ["visited", "Copied from"],
                                ["removed", "Removed"],
                            ] as const).map(([state_, label]) => (
                                <div
                                    key={label}
                                    className="flex items-center gap-1.5 rounded border border-border bg-background px-2 py-0.5"
                                >
                                    <div className={`h-2.5 w-2.5 rounded-sm border ${STATE_BOX[state_]}`} />
                                    <span className="whitespace-nowrap text-muted-foreground">{label}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            }
            code={
                <CodePanel
                    code={CODE}
                    activeLine={snapshot?.activeLine ?? null}
                    title={MODE_LABELS[mode]}
                />
            }
            docs={
                <Card>
                    <CardHeader>
                        <CardTitle>Learning</CardTitle>
                        <CardDescription>Why capacity is not size</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <p>
                            An array in memory has a fixed length. A <strong>dynamic</strong> array fakes growth:
                            it keeps a larger block than it needs, tracks <code className="font-mono">size</code>{" "}
                            separately from <code className="font-mono">capacity</code>, and when the two meet it
                            allocates a bigger block and copies everything across.
                        </p>
                        <p>
                            That copy is O(n), so a single append can be slow. But doubling means it happens
                            rarely: n appends cost fewer than 2n copies in total, which is O(1){" "}
                            <strong>amortised</strong>. Watch the copy counter — fill to full a few times and it
                            stays under twice the size.
                        </p>
                        <p>
                            Growing by a <em>constant</em> instead of doubling would make it O(n²) overall. The
                            factor has to be multiplicative.
                        </p>
                        <div>
                            <p className="mb-1 font-medium">The three uses differ at the edges</p>
                            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                                <li>
                                    A <strong>stack</strong> pushes and pops at the tail, so its copy is a
                                    straight run.
                                </li>
                                <li>
                                    A <strong>circular queue</strong> moves <code className="font-mono">front</code>{" "}
                                    forward on every dequeue and wraps past the end. Once it has wrapped, the copy
                                    must go in <em>logical</em> order — copying physically would carry the split
                                    into the new array and leave a hole. Dequeue twice, enqueue twice, then grow,
                                    and watch it unwrap.
                                </li>
                            </ul>
                        </div>
                        <p>
                            Removing never shrinks the storage here. Real implementations often halve when size
                            drops below a quarter of capacity — not at half, or a sequence of adds and removes
                            straddling the boundary would reallocate on every operation.
                        </p>
                    </CardContent>
                </Card>
            }
        />
    )
}
