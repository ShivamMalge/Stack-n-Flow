"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shuffle } from "lucide-react"
import AnimationControls from "@/components/ui/animation-controls"
import { useAnimationPlayer, type AnimationFrame } from "@/hooks/useAnimationPlayer"
import CodePanel from "@/components/ui/code-panel"

const HEAP_SORT_CODE = [
    "function heapSort(arr):",
    "  buildMaxHeap(arr)",
    "  for i from n-1 down to 1:",
    "    swap(arr[0], arr[i])",
    "    heapifyDown(arr, 0, i)"
]

const HEAPIFY_CODE = [
    "function heapifyDown(arr, i, size):",
    "  largest = i, l = 2i+1, r = 2i+2",
    "  if (l < size && arr[l] > arr[largest]) largest = l",
    "  if (r < size && arr[r] > arr[largest]) largest = r",
    "  if (largest != i):",
    "    swap(arr[i], arr[largest])",
    "    heapifyDown(arr, largest, size)"
]

type BarState = "default" | "heap" | "comparing" | "swapping" | "sorted" | "root"

type HSSFrame = {
    bars: { value: number; state: BarState }[]
    phase: "build" | "extract"
    heapSize: number
    activeLine: number | null
    code: string[]
}

function frame(
    bars: { value: number; state: BarState }[],
    phase: "build" | "extract",
    heapSize: number,
    desc: string,
    activeLine: number | null,
    code: string[]
): AnimationFrame<HSSFrame> {
    return { snapshot: { bars: bars.map((b) => ({ ...b })), phase, heapSize, activeLine, code }, description: desc }
}

function generateHeapSort(values: number[]): AnimationFrame<HSSFrame>[] {
    const arr = values.map((v) => ({ value: v, state: "default" as BarState }))
    const frames: AnimationFrame<HSSFrame>[] = []
    const n = arr.length

    const neutral = (hs: number) => arr.forEach((b, i) => { b.state = i < hs ? "heap" : "sorted" })

    // Phase 1: Build max-heap
    frames.push(frame(arr, "build", n, "Phase 1: Build Max-Heap from array", 1, HEAP_SORT_CODE))

    const heapifyDown = (i: number, hs: number, phase: "build" | "extract") => {
        const l = 2 * i + 1; const r = 2 * i + 2
        let largest = i
        if (l < hs && arr[l].value > arr[largest].value) largest = l
        if (r < hs && arr[r].value > arr[largest].value) largest = r

        neutral(hs)
        arr[i].state = "comparing"
        if (l < hs) arr[l].state = "comparing"
        if (r < hs) arr[r].state = "comparing"
        frames.push(frame(arr, phase, hs, `Heapify at index ${i}: compare ${arr[i].value} with children`, 1, HEAPIFY_CODE))

        if (largest !== i) {
            arr[i].state = "swapping"; arr[largest].state = "swapping"
            frames.push(frame(arr, phase, hs, `Swap ${arr[i].value} ↔ ${arr[largest].value}`, 5, HEAPIFY_CODE));
            [arr[i].value, arr[largest].value] = [arr[largest].value, arr[i].value]
            heapifyDown(largest, hs, phase)
        }
    }

    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        neutral(n)
        frames.push(frame(arr, "build", n, `Heapify subtree rooted at index ${i} (value ${arr[i].value})`, 1, HEAPIFY_CODE))
        heapifyDown(i, n, "build")
    }
    neutral(n)
    frames.push(frame(arr, "build", n, `Max-Heap built! Root (max) = ${arr[0].value}`, null, HEAP_SORT_CODE))

    // Phase 2: Extract max one by one
    frames.push(frame(arr, "extract", n, "Phase 2: Extract max element to end of array", 2, HEAP_SORT_CODE))
    for (let hs = n; hs > 1; hs--) {
        arr[0].state = "root"; arr[hs - 1].state = "swapping"
        frames.push(frame(arr, "extract", hs, `Swap root ${arr[0].value} ↔ last ${arr[hs - 1].value}`, 3, HEAP_SORT_CODE));
        [arr[0].value, arr[hs - 1].value] = [arr[hs - 1].value, arr[0].value]
        arr[hs - 1].state = "sorted"
        neutral(hs - 1); arr[hs - 1].state = "sorted"
        frames.push(frame(arr, "extract", hs - 1, `${arr[hs - 1].value} is sorted. Heapify remaining ${hs - 1} elements`, 4, HEAP_SORT_CODE))
        heapifyDown(0, hs - 1, "extract")
        neutral(hs - 1); arr[hs - 1].state = "sorted"
    }
    arr[0].state = "sorted"
    frames.push(frame(arr, "extract", 0, "Heap Sort complete! Array is fully sorted.", null, HEAP_SORT_CODE))
    return frames
}

const BAR_COLORS: Record<BarState, string> = {
    default: "bg-primary/50",
    heap: "bg-blue-400 dark:bg-blue-500",
    comparing: "bg-yellow-400 dark:bg-yellow-400",
    swapping: "bg-orange-400 dark:bg-orange-400",
    sorted: "bg-green-400 dark:bg-green-500",
    root: "bg-purple-500 dark:bg-purple-400",
}

export default function HeapSortVisualizer() {
    const [bars, setBars] = useState<{ value: number; state: BarState }[]>([])
    const [phase, setPhase] = useState<"build" | "extract" | null>(null)
    const [heapSize, setHeapSize] = useState(0)
    const [inputVal, setInputVal] = useState("")
    const [values, setValues] = useState<number[]>([])
    const [steps, setSteps] = useState<string[]>([])
    const [activeCode, setActiveCode] = useState<string[]>([])
    const [activeLine, setActiveLine] = useState<number | null>(null)

    const onFrameChange = useCallback((snap: HSSFrame) => {
        setBars(snap.bars)
        setPhase(snap.phase)
        setHeapSize(snap.heapSize)
        setActiveLine(snap.activeLine)
        setActiveCode(snap.code)
    }, [])
    const player = useAnimationPlayer<HSSFrame>(onFrameChange)

    const handleAdd = () => {
        const n = parseInt(inputVal)
        if (isNaN(n) || n < 1 || n > 500) return
        if (values.length >= 20) return
        const nv = [...values, n]
        setValues(nv)
        setBars(nv.map((v) => ({ value: v, state: "default" })))
        setInputVal("")
        player.clear()
    }

    const handleRandom = () => {
        if (player.isPlaying) return
        const nv = Array.from({ length: 12 }, () => Math.floor(Math.random() * 90) + 10)
        setValues(nv)
        setBars(nv.map((v) => ({ value: v, state: "default" })))
        player.clear()
        setSteps([])
    }

    const handleSort = () => {
        if (values.length < 2) return
        const frames = generateHeapSort(values)
        setSteps(frames.map((f) => f.description))
        player.loadFrames(frames)
        setTimeout(() => player.play(), 50)
    }

    const displayBars = player.currentSnapshot?.bars ?? bars
    const maxVal = displayBars.length ? Math.max(...displayBars.map((b) => b.value)) : 1

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Controls */}
            <Card>
                <CardHeader>
                    <CardTitle>Heap Sort</CardTitle>
                    <CardDescription>Build a max-heap, then extract elements one by one</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input type="number" placeholder="Add value (1–500)" value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                            disabled={player.isPlaying} min={1} max={500} />
                        <Button onClick={handleAdd} disabled={player.isPlaying || !inputVal || values.length >= 20}>Add</Button>
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={handleRandom} disabled={player.isPlaying} variant="outline" className="flex-1">
                            <Shuffle className="mr-2 h-4 w-4" /> Random
                        </Button>
                        <Button onClick={() => { setValues([]); setBars([]); setSteps([]); player.clear() }} disabled={player.isPlaying} variant="ghost">Clear</Button>
                    </div>

                    <Button onClick={handleSort} disabled={player.isPlaying || values.length < 2} className="w-full">
                        Sort with Heap Sort
                    </Button>

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

                    {player.currentSnapshot && (
                        <p className="text-sm text-center bg-muted/30 rounded-md p-2 text-muted-foreground">
                            {player.currentDescription}
                        </p>
                    )}

                    {/* Phase badge */}
                    {phase && (
                        <div className="flex gap-2 justify-center">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${phase === "build" ? "bg-blue-500/20 text-blue-600 dark:text-blue-300" : "bg-green-500/20 text-green-600 dark:text-green-300"}`}>
                                {phase === "build" ? "🏗 Build Heap Phase" : "📤 Extract Phase"}
                            </span>
                            {heapSize > 0 && <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">Heap size: {heapSize}</span>}
                        </div>
                    )}

                    {/* Steps */}
                    <div>
                        <h3 className="text-sm font-medium mb-1">Algorithm Steps:</h3>
                        <div className="bg-muted/30 rounded-md p-2 h-36 overflow-y-auto">
                            {steps.length > 0 ? (
                                <ol className="pl-4 list-decimal space-y-0.5">
                                    {steps.map((s, i) => (
                                        <li key={i} className={`text-xs ${i <= player.currentFrame ? "text-foreground" : "text-muted-foreground"}`}>{s}</li>
                                    ))}
                                </ol>
                            ) : (
                                <p className="text-xs text-muted-foreground">Click Sort to see steps</p>
                            )}
                        </div>
                    </div>

                    {/* Complexity */}
                    <div className="text-[10px] text-muted-foreground border-t pt-2 grid grid-cols-2 gap-x-4">
                        <div>Best: <span className="font-mono">O(n log n)</span></div>
                        <div>Space: <span className="font-mono">O(1)</span></div>
                        <div>Avg: <span className="font-mono">O(n log n)</span></div>
                        <div>Worst: <span className="font-mono">O(n log n)</span></div>
                    </div>
                </CardContent>
            </Card>

            {/* Visualization */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Visualization</CardTitle>
                    <CardDescription>Bar chart — colors show heap position vs sorted</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-end justify-center gap-[2px] h-[160px] md:h-[220px] w-full px-1">
                        {displayBars.map((bar, idx) => {
                            const h = Math.max(4, Math.round((bar.value / maxVal) * (displayBars.length > 15 ? 140 : 200)))
                            return (
                                <div key={idx} title={String(bar.value)}
                                    style={{
                                        height: `${h}px`,
                                        flex: "1 1 0%",
                                        maxWidth: displayBars.length > 20 ? "12px" : "24px",
                                        minWidth: "2px"
                                    }}
                                    className={`rounded-t transition-all duration-150 ${BAR_COLORS[bar.state]}`} />
                            )
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-3 justify-center text-[10px]">
                        {([["bg-blue-400", "In Heap"], ["bg-yellow-400", "Comparing"], ["bg-orange-400", "Swapping"], ["bg-purple-500", "Root (Max)"], ["bg-green-400", "Sorted"]] as const).map(([c, l]) => (
                            <div key={l} className="flex items-center gap-1.5">
                                <div className={`w-3 h-3 rounded-sm ${c}`} />
                                <span className="text-muted-foreground">{l}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Live Code Panel */}
            <div className="h-[280px]">
                <CodePanel
                    code={activeCode}
                    activeLine={activeLine}
                    title={activeCode === HEAPIFY_CODE ? "Heapify Algorithm" : "Heap Sort Algorithm"}
                />
            </div>
        </div>
    )
}
