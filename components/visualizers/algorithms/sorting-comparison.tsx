"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shuffle, Play, Pause, RotateCcw, SkipForward, SkipBack, Plus, X } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { useAnimationPlayer, type AnimationFrame } from "@/hooks/useAnimationPlayer"

// ── Types ──────────────────────────────────────────────────────────────────

type BarState = "default" | "comparing" | "swapping" | "sorted" | "pivot"

type BarItem = {
    value: number
    state: BarState
}

type SortFrame = {
    bars: BarItem[]
    comparisons: number
    swaps: number
}

type AlgorithmKey = "bubble" | "selection" | "insertion" | "quick" | "merge"

const ALGORITHM_NAMES: Record<AlgorithmKey, string> = {
    bubble: "Bubble Sort",
    selection: "Selection Sort",
    insertion: "Insertion Sort",
    quick: "Quick Sort",
    merge: "Merge Sort",
}

const COMPLEXITY: Record<AlgorithmKey, { best: string; avg: string; worst: string; space: string }> = {
    bubble: { best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)" },
    selection: { best: "O(n²)", avg: "O(n²)", worst: "O(n²)", space: "O(1)" },
    insertion: { best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)" },
    quick: { best: "O(n log n)", avg: "O(n log n)", worst: "O(n²)", space: "O(log n)" },
    merge: { best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", space: "O(n)" },
}

// ── Frame generators ────────────────────────────────────────────────────────

function frame(bars: BarItem[], comparisons: number, swaps: number, desc: string): AnimationFrame<SortFrame> {
    return {
        snapshot: { bars: bars.map((b) => ({ ...b })), comparisons, swaps },
        description: desc,
    }
}

function clone(bars: BarItem[]): BarItem[] {
    return bars.map((b) => ({ ...b }))
}

function generateBubbleSort(values: number[]): AnimationFrame<SortFrame>[] {
    const arr: BarItem[] = values.map((v) => ({ value: v, state: "default" }))
    const frames: AnimationFrame<SortFrame>[] = []
    let cmp = 0, swp = 0

    frames.push(frame(arr, cmp, swp, "Starting Bubble Sort"))

    for (let i = 0; i < arr.length - 1; i++) {
        for (let j = 0; j < arr.length - i - 1; j++) {
            cmp++
            clone(arr).forEach((_, idx) => {
                arr[idx].state = idx === j || idx === j + 1 ? "comparing" : idx >= arr.length - i ? "sorted" : "default"
            })
            frames.push(frame(arr, cmp, swp, `Comparing arr[${j}]=${arr[j].value} and arr[${j + 1}]=${arr[j + 1].value}`))

            if (arr[j].value > arr[j + 1].value) {
                swp++
                arr[j].state = "swapping"; arr[j + 1].state = "swapping"
                frames.push(frame(arr, cmp, swp, `Swapping ${arr[j].value} ↔ ${arr[j + 1].value}`));
                [arr[j].value, arr[j + 1].value] = [arr[j + 1].value, arr[j].value]
                arr[j].state = "default"; arr[j + 1].state = "default"
                frames.push(frame(arr, cmp, swp, `Swapped → [${j}]=${arr[j].value}, [${j + 1}]=${arr[j + 1].value}`))
            }
        }
        arr[arr.length - 1 - i].state = "sorted"
    }
    arr[0].state = "sorted"
    frames.push(frame(arr, cmp, swp, `Bubble Sort complete! ${swp} swaps, ${cmp} comparisons`))
    return frames
}

function generateSelectionSort(values: number[]): AnimationFrame<SortFrame>[] {
    const arr: BarItem[] = values.map((v) => ({ value: v, state: "default" }))
    const frames: AnimationFrame<SortFrame>[] = []
    let cmp = 0, swp = 0

    frames.push(frame(arr, cmp, swp, "Starting Selection Sort"))

    for (let i = 0; i < arr.length - 1; i++) {
        let minIdx = i
        arr.forEach((b, idx) => { b.state = idx < i ? "sorted" : idx === i ? "pivot" : "default" })
        frames.push(frame(arr, cmp, swp, `Pass ${i + 1}: finding minimum from index ${i}`))

        for (let j = i + 1; j < arr.length; j++) {
            cmp++
            arr[j].state = "comparing"
            frames.push(frame(arr, cmp, swp, `Comparing ${arr[j].value} with current min ${arr[minIdx].value}`))
            if (arr[j].value < arr[minIdx].value) {
                if (minIdx !== i) arr[minIdx].state = "default"
                minIdx = j
                arr[minIdx].state = "pivot"
                frames.push(frame(arr, cmp, swp, `New min: ${arr[minIdx].value} at index ${minIdx}`))
            } else {
                arr[j].state = "default"
            }
        }

        if (minIdx !== i) {
            swp++
            arr[i].state = "swapping"; arr[minIdx].state = "swapping"
            frames.push(frame(arr, cmp, swp, `Swapping ${arr[i].value} ↔ ${arr[minIdx].value}`));
            [arr[i].value, arr[minIdx].value] = [arr[minIdx].value, arr[i].value]
        }
        arr[i].state = "sorted"
        arr.forEach((b, idx) => { if (idx !== i && b.state !== "sorted") b.state = "default" })
        frames.push(frame(arr, cmp, swp, `Position ${i} sorted: ${arr[i].value}`))
    }
    arr[arr.length - 1].state = "sorted"
    frames.push(frame(arr, cmp, swp, `Selection Sort complete! ${swp} swaps, ${cmp} comparisons`))
    return frames
}

function generateInsertionSort(values: number[]): AnimationFrame<SortFrame>[] {
    const arr: BarItem[] = values.map((v) => ({ value: v, state: "default" }))
    const frames: AnimationFrame<SortFrame>[] = []
    let cmp = 0, swp = 0

    arr[0].state = "sorted"
    frames.push(frame(arr, cmp, swp, "Starting Insertion Sort"))

    for (let i = 1; i < arr.length; i++) {
        const keyVal = arr[i].value
        arr[i].state = "comparing"
        frames.push(frame(arr, cmp, swp, `Inserting ${keyVal} into sorted portion`))
        let j = i - 1

        while (j >= 0 && arr[j].value > keyVal) {
            cmp++; swp++
            arr[j + 1].value = arr[j].value
            arr[j + 1].state = "swapping"
            arr[j].state = "swapping"
            frames.push(frame(arr, cmp, swp, `Shifting ${arr[j].value} right`))
            arr[j + 1].state = "sorted"
            arr[j].state = "default"
            j--
        }
        arr[j + 1].value = keyVal
        arr[j + 1].state = "sorted"
        frames.push(frame(arr, cmp, swp, `Placed ${keyVal} at index ${j + 1}`))
    }
    arr.forEach((b) => { b.state = "sorted" })
    frames.push(frame(arr, cmp, swp, `Insertion Sort complete! ${swp} swaps, ${cmp} comparisons`))
    return frames
}

function generateQuickSort(values: number[]): AnimationFrame<SortFrame>[] {
    const arr: BarItem[] = values.map((v) => ({ value: v, state: "default" }))
    const frames: AnimationFrame<SortFrame>[] = []
    let cmp = 0, swp = 0

    frames.push(frame(arr, cmp, swp, "Starting Quick Sort"))

    function partition(low: number, high: number): number {
        const pivotVal = arr[high].value
        arr[high].state = "pivot"
        frames.push(frame(arr, cmp, swp, `Pivot: ${pivotVal} at index ${high}`))
        let i = low - 1

        for (let j = low; j < high; j++) {
            cmp++
            arr[j].state = "comparing"
            frames.push(frame(arr, cmp, swp, `${arr[j].value} vs pivot ${pivotVal}`))
            if (arr[j].value <= pivotVal) {
                i++
                if (i !== j) {
                    swp++
                    arr[i].state = "swapping"; arr[j].state = "swapping"
                    frames.push(frame(arr, cmp, swp, `Swapping ${arr[i].value} ↔ ${arr[j].value}`));
                    [arr[i].value, arr[j].value] = [arr[j].value, arr[i].value]
                    arr[i].state = "default"; arr[j].state = "default"
                } else { arr[j].state = "default" }
            } else { arr[j].state = "default" }
        }

        swp++
        arr[high].state = "swapping"; arr[i + 1].state = "swapping"
        frames.push(frame(arr, cmp, swp, `Placing pivot ${pivotVal} at index ${i + 1}`));
        [arr[i + 1].value, arr[high].value] = [arr[high].value, arr[i + 1].value]
        arr[i + 1].state = "sorted"; arr[high].state = "default"
        frames.push(frame(arr, cmp, swp, `Pivot ${pivotVal} is sorted at index ${i + 1}`))
        return i + 1
    }

    function qs(low: number, high: number) {
        if (low < high) {
            const pi = partition(low, high)
            qs(low, pi - 1)
            qs(pi + 1, high)
        } else if (low === high && low >= 0) {
            arr[low].state = "sorted"
            frames.push(frame(arr, cmp, swp, `Single element ${arr[low].value} is sorted`))
        }
    }

    qs(0, arr.length - 1)
    arr.forEach((b) => { b.state = "sorted" })
    frames.push(frame(arr, cmp, swp, `Quick Sort complete! ${swp} swaps, ${cmp} comparisons`))
    return frames
}

function generateMergeSort(values: number[]): AnimationFrame<SortFrame>[] {
    const arr: BarItem[] = values.map((v) => ({ value: v, state: "default" }))
    const frames: AnimationFrame<SortFrame>[] = []
    let cmp = 0, swp = 0

    frames.push(frame(arr, cmp, swp, "Starting Merge Sort"))

    function merge(start: number, mid: number, end: number) {
        const left = arr.slice(start, mid + 1).map((b) => b.value)
        const right = arr.slice(mid + 1, end + 1).map((b) => b.value)

        arr.slice(start, end + 1).forEach((b) => { b.state = "comparing" })
        frames.push(frame(arr, cmp, swp, `Merging [${left.join(",")}] and [${right.join(",")}]`))

        let i = 0, j = 0, k = start
        while (i < left.length && j < right.length) {
            cmp++
            if (left[i] <= right[j]) {
                arr[k].value = left[i++]; arr[k].state = "swapping"
            } else {
                arr[k].value = right[j++]; arr[k].state = "swapping"; swp++
            }
            k++
            frames.push(frame(arr, cmp, swp, `Merged so far: [${arr.slice(start, k).map((b) => b.value).join(",")}]`))
        }
        while (i < left.length) { arr[k].value = left[i++]; arr[k].state = "swapping"; k++ }
        while (j < right.length) { arr[k].value = right[j++]; arr[k].state = "swapping"; k++ }

        arr.slice(start, end + 1).forEach((b) => { b.state = "sorted" })
        frames.push(frame(arr, cmp, swp, `Merged: [${arr.slice(start, end + 1).map((b) => b.value).join(",")}]`))
    }

    function ms(start: number, end: number) {
        if (start < end) {
            const mid = Math.floor((start + end) / 2)
            ms(start, mid)
            ms(mid + 1, end)
            merge(start, mid, end)
        }
    }

    ms(0, arr.length - 1)
    arr.forEach((b) => { b.state = "sorted" })
    frames.push(frame(arr, cmp, swp, `Merge Sort complete! ${swp} swaps, ${cmp} comparisons`))
    return frames
}

const GENERATORS: Record<AlgorithmKey, (v: number[]) => AnimationFrame<SortFrame>[]> = {
    bubble: generateBubbleSort,
    selection: generateSelectionSort,
    insertion: generateInsertionSort,
    quick: generateQuickSort,
    merge: generateMergeSort,
}

// ── Bar Chart ───────────────────────────────────────────────────────────────

const BAR_COLORS: Record<BarState, string> = {
    default: "bg-primary/60",
    comparing: "bg-blue-400 dark:bg-blue-500",
    swapping: "bg-yellow-400 dark:bg-yellow-500",
    sorted: "bg-green-400 dark:bg-green-500",
    pivot: "bg-purple-500 dark:bg-purple-400",
}

function BarChart({ bars }: { bars: BarItem[] }) {
    const maxVal = Math.max(...bars.map((b) => b.value), 1)
    return (
        <div className="flex items-end justify-center gap-[2px] h-[140px] md:h-[180px] w-full px-1">
            {bars.map((bar, idx) => {
                const h = Math.max(4, Math.round((bar.value / maxVal) * (bars.length > 15 ? 130 : 168)))
                return (
                    <div
                        key={idx}
                        title={String(bar.value)}
                        style={{
                            height: `${h}px`,
                            flex: "1 1 0%",
                            maxWidth: bars.length > 20 ? "12px" : "24px",
                            minWidth: "2px"
                        }}
                        className={`rounded-t transition-all duration-100 ${BAR_COLORS[bar.state]}`}
                    />
                )
            })}
        </div>
    )
}

// ── Speed presets ───────────────────────────────────────────────────────────

const SPEED_LABELS = ["0.5×", "1×", "2×", "3×", "5×"]
const SPEED_MS = [1600, 800, 400, 267, 160]

// ── Main Component ──────────────────────────────────────────────────────────

export default function SortingComparison() {
    const [algoA, setAlgoA] = useState<AlgorithmKey>("bubble")
    const [algoB, setAlgoB] = useState<AlgorithmKey>("merge")
    const [values, setValues] = useState<number[]>([])                // source array
    const [inputVal, setInputVal] = useState("")
    const [speedIdx, setSpeedIdx] = useState(1)

    const [barsA, setBarsA] = useState<BarItem[]>([])
    const [statsA, setStatsA] = useState({ comparisons: 0, swaps: 0 })
    const [barsB, setBarsB] = useState<BarItem[]>([])
    const [statsB, setStatsB] = useState({ comparisons: 0, swaps: 0 })
    const [descA, setDescA] = useState("")
    const [descB, setDescB] = useState("")
    const [stepsA, setStepsA] = useState<string[]>([])
    const [stepsB, setStepsB] = useState<string[]>([])
    const activeStepRefA = useRef<HTMLLIElement | null>(null)
    const activeStepRefB = useRef<HTMLLIElement | null>(null)

    const onFrameA = useCallback((snap: SortFrame) => {
        setBarsA(snap.bars)
        setStatsA({ comparisons: snap.comparisons, swaps: snap.swaps })
    }, [])
    const onFrameB = useCallback((snap: SortFrame) => {
        setBarsB(snap.bars)
        setStatsB({ comparisons: snap.comparisons, swaps: snap.swaps })
    }, [])

    const playerA = useAnimationPlayer<SortFrame>(onFrameA)
    const playerB = useAnimationPlayer<SortFrame>(onFrameB)

    // Auto-scroll active step into view (disabled on mobile)
    useEffect(() => {
        if (window.innerWidth > 768) {
            activeStepRefA.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
        }
    }, [playerA.currentFrame])

    useEffect(() => {
        if (window.innerWidth > 768) {
            activeStepRefB.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
        }
    }, [playerB.currentFrame])

    // Update descriptions from players
    const dA = playerA.currentDescription
    const dB = playerB.currentDescription
    if (dA !== descA) setDescA(dA)
    if (dB !== descB) setDescB(dB)

    const isPlaying = playerA.isPlaying || playerB.isPlaying
    const hasStarted = playerA.totalFrames > 0
    const isComplete = playerA.isComplete && playerB.isComplete

    // ── Array management ──────────────────────────────────────────────────────

    const syncBars = (vals: number[]) => {
        setBarsA(vals.map((v) => ({ value: v, state: "default" })))
        setBarsB(vals.map((v) => ({ value: v, state: "default" })))
        setStatsA({ comparisons: 0, swaps: 0 })
        setStatsB({ comparisons: 0, swaps: 0 })
        setDescA(""); setDescB("")
        setStepsA([]); setStepsB([])
        playerA.clear(); playerB.clear()
    }

    const handleAddValue = () => {
        const n = Number.parseInt(inputVal)
        if (!inputVal || isNaN(n) || n <= 0 || n > 999) return
        if (values.length >= 20) { alert("Maximum 20 elements allowed"); return }
        const newVals = [...values, n]
        setValues(newVals)
        syncBars(newVals)
        setInputVal("")
    }

    const handleRemoveValue = (idx: number) => {
        const newVals = values.filter((_, i) => i !== idx)
        setValues(newVals)
        syncBars(newVals)
    }

    const handleRandom = () => {
        if (isPlaying) return
        const count = 12
        const newVals = Array.from({ length: count }, () => Math.floor(Math.random() * 90) + 10)
        setValues(newVals)
        syncBars(newVals)
    }

    const handleClearInput = () => {
        if (isPlaying) return
        setValues([])
        syncBars([])
    }

    // ── Playback ──────────────────────────────────────────────────────────────

    const handleStart = () => {
        if (!values.length) return
        const speed = SPEED_MS[speedIdx]

        const framesA = GENERATORS[algoA](values)
        const framesB = GENERATORS[algoB](values)

        // Collect step descriptions for the steps panel
        setStepsA(framesA.map((f) => f.description))
        setStepsB(framesB.map((f) => f.description))

        playerA.setSpeed(speed)
        playerB.setSpeed(speed)
        playerA.loadFrames(framesA)
        playerB.loadFrames(framesB)

        // Small delay to ensure state is settled before playing
        setTimeout(() => {
            playerA.play()
            playerB.play()
        }, 50)
    }

    const handlePause = () => { playerA.pause(); playerB.pause() }
    const handleResume = () => { playerA.play(); playerB.play() }
    const handleStepForward = () => { playerA.stepForward(); playerB.stepForward() }
    const handleStepBackward = () => { playerA.stepBackward(); playerB.stepBackward() }
    const handleReset = () => {
        playerA.reset(); playerB.reset()
        syncBars(values)
    }

    const handleSpeedChange = (idx: number) => {
        setSpeedIdx(idx)
        playerA.setSpeed(SPEED_MS[idx])
        playerB.setSpeed(SPEED_MS[idx])
    }

    const progressA = playerA.totalFrames > 0 ? Math.round(((playerA.currentFrame + 1) / playerA.totalFrames) * 100) : 0
    const progressB = playerB.totalFrames > 0 ? Math.round(((playerB.currentFrame + 1) / playerB.totalFrames) * 100) : 0

    return (
        <div className="flex flex-col gap-4">
            {/* Top Controls - Always first */}
            <div className="order-1">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">⚡ Side-by-Side Sorting Comparison</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Algorithm selectors */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Algorithm A</p>
                                <Select value={algoA} onValueChange={(v) => setAlgoA(v as AlgorithmKey)} disabled={isPlaying}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(ALGORITHM_NAMES).map(([k, n]) => (
                                            <SelectItem key={k} value={k}>{n}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Algorithm B</p>
                                <Select value={algoB} onValueChange={(v) => setAlgoB(v as AlgorithmKey)} disabled={isPlaying}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(ALGORITHM_NAMES).map(([k, n]) => (
                                            <SelectItem key={k} value={k}>{n}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Custom array input */}
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Array Input</p>
                            <div className="flex flex-wrap gap-2">
                                <div className="flex-1 flex gap-2 min-w-[200px]">
                                    <Input
                                        type="number"
                                        placeholder="Add value (1–999)"
                                        value={inputVal}
                                        onChange={(e) => setInputVal(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAddValue()}
                                        disabled={isPlaying}
                                        className="flex-1"
                                        min={1} max={999}
                                    />
                                    <Button onClick={handleAddValue} disabled={isPlaying || !inputVal} size="icon" className="shrink-0">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <Button variant="outline" onClick={handleRandom} disabled={isPlaying} className="flex-1 sm:flex-initial">
                                        <Shuffle className="mr-2 h-4 w-4" />
                                        Random
                                    </Button>
                                    <Button variant="ghost" onClick={handleClearInput} disabled={isPlaying || !values.length} className="flex-1 sm:flex-initial">
                                        Clear
                                    </Button>
                                </div>
                            </div>

                            {/* Current values display */}
                            {values.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 p-2 bg-muted/30 rounded-md min-h-[36px]">
                                    {values.map((v, i) => (
                                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-card border rounded text-sm">
                                            {v}
                                            <button
                                                onClick={() => handleRemoveValue(i)}
                                                disabled={isPlaying}
                                                className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))}
                                    <span className="text-xs text-muted-foreground self-center ml-1">
                                        {values.length}/20 elements
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Playback controls */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                            <div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto">
                                {!isPlaying ? (
                                    <Button onClick={handleStart} disabled={!values.length || values.length < 2} className="w-full sm:w-auto">
                                        <Play className="mr-2 h-4 w-4" />
                                        {hasStarted && !isComplete ? "Restart" : "Start Comparison"}
                                    </Button>
                                ) : (
                                    <Button variant="outline" onClick={handlePause} className="w-full sm:w-auto">
                                        <Pause className="mr-2 h-4 w-4" />
                                        Pause
                                    </Button>
                                )}
                                {!isPlaying && hasStarted && !isComplete && (
                                    <Button variant="outline" onClick={handleResume} className="w-full sm:w-auto">
                                        <Play className="mr-2 h-4 w-4" />
                                        Resume
                                    </Button>
                                )}
                                <div className="flex gap-2">
                                    <Button variant="outline" size="icon" onClick={handleStepBackward} disabled={isPlaying || !hasStarted} title="Step Back" className="h-9 w-9">
                                        <SkipBack className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={handleStepForward} disabled={isPlaying || !hasStarted} title="Step Forward" className="h-9 w-9">
                                        <SkipForward className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={handleReset} disabled={isPlaying || !hasStarted} title="Reset" className="h-9 w-9">
                                        <RotateCcw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Speed control inline */}
                            <div className="flex items-center gap-4 w-full sm:w-auto sm:ml-auto bg-muted/30 p-2 rounded-lg">
                                <span className="text-xs text-muted-foreground whitespace-nowrap min-w-[70px]">Speed: {SPEED_LABELS[speedIdx]}</span>
                                <div className="flex-1 sm:w-32">
                                    <Slider value={[speedIdx]} min={0} max={SPEED_MS.length - 1} step={1}
                                        onValueChange={([v]) => handleSpeedChange(v)} disabled={isPlaying} />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Visualizations - Second on mobile, Right side on desktop */}
            <div className="order-2">
                {values.length < 2 ? (
                    <div className="flex items-center justify-center h-40 border-2 border-dashed rounded-xl text-muted-foreground text-sm">
                        {values.length === 0
                            ? 'Add at least 2 numbers above or click "Random" to generate an array'
                            : "Add at least one more number to start"}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Panel A */}
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base text-blue-500 dark:text-blue-400">{ALGORITHM_NAMES[algoA]}</CardTitle>
                                    {isComplete && <span className="text-xs text-green-500 font-bold">✓ Done</span>}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <BarChart bars={barsA.length ? barsA : values.map((v) => ({ value: v, state: "default" }))} />
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full transition-all duration-150" style={{ width: `${progressA}%` }} />
                                </div>
                                {descA && <p className="text-xs text-center text-muted-foreground min-h-[16px]">{descA}</p>}
                                <div className="grid grid-cols-2 gap-2 text-center">
                                    <div className="bg-muted/40 rounded-md p-2">
                                        <div className="text-xl font-bold tabular-nums">{statsA.comparisons}</div>
                                        <div className="text-[10px] text-muted-foreground">Comparisons</div>
                                    </div>
                                    <div className="bg-muted/40 rounded-md p-2">
                                        <div className="text-xl font-bold tabular-nums">{statsA.swaps}</div>
                                        <div className="text-[10px] text-muted-foreground">Swaps</div>
                                    </div>
                                </div>
                                <div className="text-[10px] text-muted-foreground grid grid-cols-2 gap-x-2 border-t pt-2">
                                    <div>Best: <span className="font-mono">{COMPLEXITY[algoA].best}</span></div>
                                    <div>Space: <span className="font-mono">{COMPLEXITY[algoA].space}</span></div>
                                    <div>Avg: <span className="font-mono">{COMPLEXITY[algoA].avg}</span></div>
                                    <div>Worst: <span className="font-mono">{COMPLEXITY[algoA].worst}</span></div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Panel B */}
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base text-purple-500 dark:text-purple-400">{ALGORITHM_NAMES[algoB]}</CardTitle>
                                    {isComplete && <span className="text-xs text-green-500 font-bold">✓ Done</span>}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <BarChart bars={barsB.length ? barsB : values.map((v) => ({ value: v, state: "default" }))} />
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-500 rounded-full transition-all duration-150" style={{ width: `${progressB}%` }} />
                                </div>
                                {descB && <p className="text-xs text-center text-muted-foreground min-h-[16px]">{descB}</p>}
                                <div className="grid grid-cols-2 gap-2 text-center">
                                    <div className="bg-muted/40 rounded-md p-2">
                                        <div className="text-xl font-bold tabular-nums">{statsB.comparisons}</div>
                                        <div className="text-[10px] text-muted-foreground">Comparisons</div>
                                    </div>
                                    <div className="bg-muted/40 rounded-md p-2">
                                        <div className="text-xl font-bold tabular-nums">{statsB.swaps}</div>
                                        <div className="text-[10px] text-muted-foreground">Swaps</div>
                                    </div>
                                </div>
                                <div className="text-[10px] text-muted-foreground grid grid-cols-2 gap-x-2 border-t pt-2">
                                    <div>Best: <span className="font-mono">{COMPLEXITY[algoB].best}</span></div>
                                    <div>Space: <span className="font-mono">{COMPLEXITY[algoB].space}</span></div>
                                    <div>Avg: <span className="font-mono">{COMPLEXITY[algoB].avg}</span></div>
                                    <div>Worst: <span className="font-mono">{COMPLEXITY[algoB].worst}</span></div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* Algorithm Steps Panels - Third on mobile */}
            <div className="order-3">
                {stepsA.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Steps A */}
                        <div className="rounded-lg border bg-card p-4 space-y-2">
                            <p className="text-sm font-semibold">
                                {ALGORITHM_NAMES[algoA]}
                                <span className="ml-2 text-xs font-normal text-muted-foreground">— Algorithm Steps</span>
                            </p>
                            <ol className="space-y-1 max-h-48 overflow-y-auto pr-1 text-xs" aria-label="Steps A">
                                {stepsA.map((step, i) => {
                                    const isActive = i === playerA.currentFrame
                                    const isPast = i < playerA.currentFrame
                                    return (
                                        <li
                                            key={i}
                                            ref={isActive ? activeStepRefA : null}
                                            className={`flex gap-2 items-start px-2 py-1 rounded transition-colors ${isActive
                                                ? "bg-blue-500/15 text-foreground font-medium"
                                                : isPast
                                                    ? "text-muted-foreground"
                                                    : "text-muted-foreground/50"
                                                }`}
                                        >
                                            <span className={`shrink-0 font-mono tabular-nums ${isActive ? "text-blue-500" : isPast ? "text-muted-foreground" : "text-muted-foreground/40"
                                                }`}>{i + 1}.</span>
                                            <span>{step}</span>
                                        </li>
                                    )
                                })}
                            </ol>
                        </div>

                        {/* Steps B */}
                        <div className="rounded-lg border bg-card p-4 space-y-2">
                            <p className="text-sm font-semibold">
                                {ALGORITHM_NAMES[algoB]}
                                <span className="ml-2 text-xs font-normal text-muted-foreground">— Algorithm Steps</span>
                            </p>
                            <ol className="space-y-1 max-h-48 overflow-y-auto pr-1 text-xs" aria-label="Steps B">
                                {stepsB.map((step, i) => {
                                    const isActive = i === playerB.currentFrame
                                    const isPast = i < playerB.currentFrame
                                    return (
                                        <li
                                            key={i}
                                            ref={isActive ? activeStepRefB : null}
                                            className={`flex gap-2 items-start px-2 py-1 rounded transition-colors ${isActive
                                                ? "bg-purple-500/15 text-foreground font-medium"
                                                : isPast
                                                    ? "text-muted-foreground"
                                                    : "text-muted-foreground/50"
                                                }`}
                                        >
                                            <span className={`shrink-0 font-mono tabular-nums ${isActive ? "text-purple-500" : isPast ? "text-muted-foreground" : "text-muted-foreground/40"
                                                }`}>{i + 1}.</span>
                                            <span>{step}</span>
                                        </li>
                                    )
                                })}
                            </ol>
                        </div>
                    </div>
                )}

            </div>

            {/* Legend - Last */}
            <div className="order-4 flex flex-wrap gap-4 justify-center text-xs">
                {([["bg-primary/60", "Unsorted"], ["bg-blue-400", "Comparing"], ["bg-yellow-400", "Swapping"], ["bg-purple-500", "Pivot"], ["bg-green-400", "Sorted"]] as const).map(([color, label]) => (
                    <div key={label} className="flex items-center gap-1.5">
                        <div className={`w-3 h-3 rounded-sm ${color}`} />
                        <span className="text-muted-foreground">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
