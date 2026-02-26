"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shuffle, Play, Pause, RotateCcw, SkipForward, SkipBack } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { useAnimationPlayer, type AnimationFrame } from "@/hooks/useAnimationPlayer"

type BarItem = {
    value: number
    state: "default" | "comparing" | "swapping" | "sorted" | "pivot"
}

type SortFrame = {
    bars: BarItem[]
    comparisons: number
    swaps: number
    description: string
}

type AlgorithmKey = "bubble" | "selection" | "insertion" | "quick" | "merge"

const ALGORITHM_NAMES: Record<AlgorithmKey, string> = {
    bubble: "Bubble Sort",
    selection: "Selection Sort",
    insertion: "Insertion Sort",
    quick: "Quick Sort",
    merge: "Merge Sort",
}

const ALGORITHM_COMPLEXITY: Record<AlgorithmKey, { best: string; average: string; worst: string; space: string }> = {
    bubble: { best: "O(n)", average: "O(n²)", worst: "O(n²)", space: "O(1)" },
    selection: { best: "O(n²)", average: "O(n²)", worst: "O(n²)", space: "O(1)" },
    insertion: { best: "O(n)", average: "O(n²)", worst: "O(n²)", space: "O(1)" },
    quick: { best: "O(n log n)", average: "O(n log n)", worst: "O(n²)", space: "O(log n)" },
    merge: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", space: "O(n)" },
}

// ── Frame generators ────────────────────────────────────────────────────────

function generateBubbleSortFrames(values: number[]): AnimationFrame<SortFrame>[] {
    const bars: BarItem[] = values.map((v) => ({ value: v, state: "default" }))
    const frames: AnimationFrame<SortFrame>[] = []
    let comparisons = 0, swaps = 0
    const arr = [...bars]

    const snap = (desc: string) =>
        frames.push({ snapshot: { bars: arr.map((b) => ({ ...b })), comparisons, swaps, description: desc }, description: desc })

    snap("Starting Bubble Sort")
    for (let i = 0; i < arr.length - 1; i++) {
        for (let j = 0; j < arr.length - i - 1; j++) {
            comparisons++
            arr.forEach((b, idx) => { b.state = idx === j || idx === j + 1 ? "comparing" : idx >= arr.length - i ? "sorted" : "default" })
            snap(`Comparing ${arr[j].value} and ${arr[j + 1].value}`)

            if (arr[j].value > arr[j + 1].value) {
                swaps++
                arr[j].state = "swapping"; arr[j + 1].state = "swapping"
                snap(`Swapping ${arr[j].value} and ${arr[j + 1].value}`);
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
                snap(`Swapped → ${arr[j].value} before ${arr[j + 1].value}`)
            }
        }
        arr[arr.length - 1 - i].state = "sorted"
    }
    arr[0].state = "sorted"
    snap("Bubble Sort complete!")
    return frames
}

function generateSelectionSortFrames(values: number[]): AnimationFrame<SortFrame>[] {
    const arr: BarItem[] = values.map((v) => ({ value: v, state: "default" }))
    const frames: AnimationFrame<SortFrame>[] = []
    let comparisons = 0, swaps = 0

    const snap = (desc: string) =>
        frames.push({ snapshot: { bars: arr.map((b) => ({ ...b })), comparisons, swaps, description: desc }, description: desc })

    snap("Starting Selection Sort")
    for (let i = 0; i < arr.length - 1; i++) {
        let minIdx = i
        arr.forEach((b, idx) => { b.state = idx < i ? "sorted" : idx === i ? "pivot" : "default" })
        snap(`Finding minimum in unsorted region starting at index ${i}`)

        for (let j = i + 1; j < arr.length; j++) {
            comparisons++
            arr[j].state = "comparing"
            snap(`Comparing ${arr[j].value} with current min ${arr[minIdx].value}`)
            if (arr[j].value < arr[minIdx].value) {
                if (minIdx !== i) arr[minIdx].state = "default"
                minIdx = j
                arr[minIdx].state = "pivot"
                snap(`New minimum found: ${arr[minIdx].value}`)
            } else {
                arr[j].state = "default"
            }
        }

        if (minIdx !== i) {
            swaps++
            arr[i].state = "swapping"; arr[minIdx].state = "swapping"
            snap(`Swapping min ${arr[minIdx].value} to position ${i}`);
            [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]]
        }
        arr[i].state = "sorted"
        snap(`Position ${i} sorted: ${arr[i].value}`)
    }
    arr[arr.length - 1].state = "sorted"
    snap("Selection Sort complete!")
    return frames
}

function generateInsertionSortFrames(values: number[]): AnimationFrame<SortFrame>[] {
    const arr: BarItem[] = values.map((v) => ({ value: v, state: "default" }))
    const frames: AnimationFrame<SortFrame>[] = []
    let comparisons = 0, swaps = 0

    const snap = (desc: string) =>
        frames.push({ snapshot: { bars: arr.map((b) => ({ ...b })), comparisons, swaps, description: desc }, description: desc })

    snap("Starting Insertion Sort")
    arr[0].state = "sorted"
    for (let i = 1; i < arr.length; i++) {
        const key = arr[i].value
        arr[i].state = "comparing"
        snap(`Inserting ${key} into sorted portion`)
        let j = i - 1
        while (j >= 0 && arr[j].value > key) {
            comparisons++; swaps++
            arr[j + 1] = { ...arr[j], state: "swapping" }
            arr[j].state = "swapping"
            snap(`Shifting ${arr[j].value} right`);
            [arr[j], arr[j + 1]] = [arr[j + 1], { ...arr[j], state: "sorted" }]
            j--
        }
        arr[j + 1] = { value: key, state: "sorted" }
        snap(`Placed ${key} at position ${j + 1}`)
    }
    arr.forEach((b) => { b.state = "sorted" })
    snap("Insertion Sort complete!")
    return frames
}

function generateQuickSortFrames(values: number[]): AnimationFrame<SortFrame>[] {
    const arr: BarItem[] = values.map((v) => ({ value: v, state: "default" }))
    const frames: AnimationFrame<SortFrame>[] = []
    let comparisons = 0, swaps = 0

    const snap = (desc: string) =>
        frames.push({ snapshot: { bars: arr.map((b) => ({ ...b })), comparisons, swaps, description: desc }, description: desc })

    snap("Starting Quick Sort")

    const partition = (low: number, high: number): number => {
        const pivot = arr[high].value
        arr[high].state = "pivot"
        snap(`Pivot: ${pivot} at index ${high}`)
        let i = low - 1
        for (let j = low; j < high; j++) {
            comparisons++
            arr[j].state = "comparing"
            snap(`Comparing ${arr[j].value} with pivot ${pivot}`)
            if (arr[j].value <= pivot) {
                i++
                if (i !== j) {
                    swaps++; arr[i].state = "swapping"; arr[j].state = "swapping"
                    snap(`Swapping ${arr[i].value} and ${arr[j].value}`);
                    [arr[i], arr[j]] = [arr[j], arr[i]]
                    arr[i].state = "default"; arr[j].state = "default"
                } else { arr[j].state = "default" }
            } else { arr[j].state = "default" }
        }
        swaps++
        arr[high].state = "default"; arr[i + 1].state = "swapping"
        snap(`Placing pivot ${pivot} at index ${i + 1}`);
        [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]]
        arr[i + 1].state = "sorted"
        snap(`Pivot ${pivot} is at its sorted position`)
        return i + 1
    }

    const quickSort = (low: number, high: number) => {
        if (low < high) {
            const pi = partition(low, high)
            quickSort(low, pi - 1)
            quickSort(pi + 1, high)
        } else if (low === high) { arr[low].state = "sorted" }
    }

    quickSort(0, arr.length - 1)
    arr.forEach((b) => { b.state = "sorted" })
    snap("Quick Sort complete!")
    return frames
}

function generateMergeSortFrames(values: number[]): AnimationFrame<SortFrame>[] {
    const arr: BarItem[] = values.map((v) => ({ value: v, state: "default" }))
    const frames: AnimationFrame<SortFrame>[] = []
    let comparisons = 0, swaps = 0

    const snap = (desc: string) =>
        frames.push({ snapshot: { bars: arr.map((b) => ({ ...b })), comparisons, swaps, description: desc }, description: desc })

    snap("Starting Merge Sort")

    const merge = (start: number, mid: number, end: number) => {
        const left = arr.slice(start, mid + 1).map((b) => ({ ...b }))
        const right = arr.slice(mid + 1, end + 1).map((b) => ({ ...b }))
        let i = 0, j = 0, k = start

        arr.slice(start, end + 1).forEach((b) => { b.state = "comparing" })
        snap(`Merging [${left.map((b) => b.value).join(",")}] and [${right.map((b) => b.value).join(",")}]`)

        while (i < left.length && j < right.length) {
            comparisons++
            if (left[i].value <= right[j].value) {
                arr[k++] = { value: left[i++].value, state: "swapping" }
            } else { arr[k++] = { value: right[j++].value, state: "swapping" }; swaps++ }
            snap(`Merged so far: [${arr.slice(start, k).map((b) => b.value).join(",")}]`)
        }
        while (i < left.length) { arr[k++] = { value: left[i++].value, state: "swapping" }; snap("Copying remaining left") }
        while (j < right.length) { arr[k++] = { value: right[j++].value, state: "swapping" }; snap("Copying remaining right") }
        arr.slice(start, end + 1).forEach((b) => { b.state = "sorted" })
        snap(`Merged: [${arr.slice(start, end + 1).map((b) => b.value).join(",")}]`)
    }

    const mergeSort = (start: number, end: number) => {
        if (start < end) {
            const mid = Math.floor((start + end) / 2)
            mergeSort(start, mid)
            mergeSort(mid + 1, end)
            merge(start, mid, end)
        }
    }

    mergeSort(0, arr.length - 1)
    arr.forEach((b) => { b.state = "sorted" })
    snap("Merge Sort complete!")
    return frames
}

const GENERATORS: Record<AlgorithmKey, (values: number[]) => AnimationFrame<SortFrame>[]> = {
    bubble: generateBubbleSortFrames,
    selection: generateSelectionSortFrames,
    insertion: generateInsertionSortFrames,
    quick: generateQuickSortFrames,
    merge: generateMergeSortFrames,
}

// ── Bar Chart component ─────────────────────────────────────────────────────

function BarChart({ bars, label }: { bars: BarItem[]; label: string }) {
    const maxVal = Math.max(...bars.map((b) => b.value), 1)
    return (
        <div className="flex flex-col h-full">
            <p className="text-center text-xs font-semibold text-muted-foreground mb-1">{label}</p>
            <div className="flex items-end justify-center gap-0.5 h-[180px] flex-1">
                {bars.map((bar, idx) => {
                    const h = Math.max(4, Math.round((bar.value / maxVal) * 160))
                    const colors: Record<BarItem["state"], string> = {
                        default: "bg-primary/60",
                        comparing: "bg-blue-400 dark:bg-blue-500",
                        swapping: "bg-yellow-400 dark:bg-yellow-500",
                        sorted: "bg-green-400 dark:bg-green-500",
                        pivot: "bg-purple-500 dark:bg-purple-400",
                    }
                    return (
                        <div
                            key={idx}
                            style={{ height: `${h}px`, minWidth: `${Math.max(8, Math.floor(200 / bars.length))}px` }}
                            className={`rounded-t transition-all duration-150 ${colors[bar.state]}`}
                        />
                    )
                })}
            </div>
        </div>
    )
}

// ── Main component ──────────────────────────────────────────────────────────

const SPEED_LABELS = ["0.5×", "1×", "1.5×", "2×", "3×"]
const SPEED_VALUES = [1600, 800, 533, 400, 267]

export default function SortingComparison() {
    const [algoA, setAlgoA] = useState<AlgorithmKey>("bubble")
    const [algoB, setAlgoB] = useState<AlgorithmKey>("merge")
    const [values, setValues] = useState<number[]>([])
    const [speedIdx, setSpeedIdx] = useState(1) // default 1×

    const [barsA, setBarsA] = useState<BarItem[]>([])
    const [statsA, setStatsA] = useState({ comparisons: 0, swaps: 0 })
    const [barsB, setBarsB] = useState<BarItem[]>([])
    const [statsB, setStatsB] = useState({ comparisons: 0, swaps: 0 })

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

    const generateRandom = () => {
        if (playerA.isPlaying || playerB.isPlaying) return
        const count = 16
        const newVals = Array.from({ length: count }, () => Math.floor(Math.random() * 90) + 10)
        setValues(newVals)
        setBarsA(newVals.map((v) => ({ value: v, state: "default" })))
        setBarsB(newVals.map((v) => ({ value: v, state: "default" })))
        setStatsA({ comparisons: 0, swaps: 0 })
        setStatsB({ comparisons: 0, swaps: 0 })
        playerA.clear(); playerB.clear()
    }

    const handleStart = () => {
        if (!values.length) return
        const speed = SPEED_VALUES[speedIdx]
        const framesA = GENERATORS[algoA](values)
        const framesB = GENERATORS[algoB](values)
        playerA.setSpeed(speed); playerB.setSpeed(speed)
        playerA.loadFrames(framesA); playerB.loadFrames(framesB)
        playerA.play(); playerB.play()
    }

    const handlePause = () => { playerA.pause(); playerB.pause() }
    const handleResume = () => { playerA.play(); playerB.play() }
    const handleReset = () => {
        playerA.reset(); playerB.reset()
        setBarsA(values.map((v) => ({ value: v, state: "default" })))
        setBarsB(values.map((v) => ({ value: v, state: "default" })))
        setStatsA({ comparisons: 0, swaps: 0 })
        setStatsB({ comparisons: 0, swaps: 0 })
    }
    const handleStepForward = () => { playerA.stepForward(); playerB.stepForward() }
    const handleStepBackward = () => { playerA.stepBackward(); playerB.stepBackward() }

    const handleSpeedChange = (idx: number) => {
        setSpeedIdx(idx)
        const speed = SPEED_VALUES[idx]
        playerA.setSpeed(speed); playerB.setSpeed(speed)
    }

    const isPlaying = playerA.isPlaying || playerB.isPlaying
    const isComplete = playerA.isComplete && playerB.isComplete
    const hasFrames = playerA.totalFrames > 0
    const progressA = playerA.totalFrames > 0 ? Math.round(((playerA.currentFrame + 1) / playerA.totalFrames) * 100) : 0
    const progressB = playerB.totalFrames > 0 ? Math.round(((playerB.currentFrame + 1) / playerB.totalFrames) * 100) : 0

    return (
        <div className="space-y-6">
            {/* Controls Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Side-by-Side Sorting Comparison</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Algorithm selectors */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Algorithm A</p>
                            <Select value={algoA} onValueChange={(v) => setAlgoA(v as AlgorithmKey)} disabled={isPlaying}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(ALGORITHM_NAMES).map(([key, name]) => (
                                        <SelectItem key={key} value={key}>{name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Algorithm B</p>
                            <Select value={algoB} onValueChange={(v) => setAlgoB(v as AlgorithmKey)} disabled={isPlaying}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(ALGORITHM_NAMES).map(([key, name]) => (
                                        <SelectItem key={key} value={key}>{name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={generateRandom} disabled={isPlaying}>
                            <Shuffle className="mr-2 h-4 w-4" />
                            Generate Random Array
                        </Button>
                        <Button onClick={handleStart} disabled={isPlaying || !values.length}>
                            <Play className="mr-2 h-4 w-4" />
                            Start Comparison
                        </Button>
                        {isPlaying && (
                            <Button variant="outline" onClick={handlePause}>
                                <Pause className="mr-2 h-4 w-4" />
                                Pause
                            </Button>
                        )}
                        {!isPlaying && hasFrames && !isComplete && (
                            <Button variant="outline" onClick={handleResume}>
                                <Play className="mr-2 h-4 w-4" />
                                Resume
                            </Button>
                        )}
                        <Button variant="outline" onClick={handleStepBackward} disabled={isPlaying || !hasFrames}>
                            <SkipBack className="mr-2 h-4 w-4" />
                            Step Back
                        </Button>
                        <Button variant="outline" onClick={handleStepForward} disabled={isPlaying || !hasFrames}>
                            <SkipForward className="mr-2 h-4 w-4" />
                            Step Forward
                        </Button>
                        <Button variant="outline" onClick={handleReset} disabled={isPlaying || !hasFrames}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset
                        </Button>
                    </div>

                    {/* Speed control */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Speed</span>
                            <span>{SPEED_LABELS[speedIdx]}</span>
                        </div>
                        <Slider value={[speedIdx]} min={0} max={4} step={1} onValueChange={([v]) => handleSpeedChange(v)} disabled={isPlaying} />
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                            {SPEED_LABELS.map((l) => <span key={l}>{l}</span>)}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Visualizations */}
            {values.length === 0 ? (
                <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-xl text-muted-foreground">
                    Click &quot;Generate Random Array&quot; to start comparing algorithms
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {/* Algorithm A Panel */}
                    <Card className="overflow-hidden">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">{ALGORITHM_NAMES[algoA]}</CardTitle>
                                {isComplete && <span className="text-xs text-green-500 font-medium">✓ Done</span>}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <BarChart bars={barsA} label="" />
                            {/* Progress bar */}
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full transition-all duration-200" style={{ width: `${progressA}%` }} />
                            </div>
                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-2 text-center">
                                <div className="bg-muted/40 rounded-md p-2">
                                    <div className="text-lg font-bold">{statsA.comparisons}</div>
                                    <div className="text-[10px] text-muted-foreground">Comparisons</div>
                                </div>
                                <div className="bg-muted/40 rounded-md p-2">
                                    <div className="text-lg font-bold">{statsA.swaps}</div>
                                    <div className="text-[10px] text-muted-foreground">Swaps</div>
                                </div>
                            </div>
                            {/* Complexity */}
                            <div className="text-[10px] text-muted-foreground space-y-0.5 border-t pt-2">
                                <div>Best: <span className="font-mono">{ALGORITHM_COMPLEXITY[algoA].best}</span></div>
                                <div>Avg: <span className="font-mono">{ALGORITHM_COMPLEXITY[algoA].average}</span></div>
                                <div>Worst: <span className="font-mono">{ALGORITHM_COMPLEXITY[algoA].worst}</span></div>
                                <div>Space: <span className="font-mono">{ALGORITHM_COMPLEXITY[algoA].space}</span></div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Algorithm B Panel */}
                    <Card className="overflow-hidden">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">{ALGORITHM_NAMES[algoB]}</CardTitle>
                                {isComplete && <span className="text-xs text-green-500 font-medium">✓ Done</span>}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <BarChart bars={barsB} label="" />
                            {/* Progress bar */}
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full transition-all duration-200" style={{ width: `${progressB}%` }} />
                            </div>
                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-2 text-center">
                                <div className="bg-muted/40 rounded-md p-2">
                                    <div className="text-lg font-bold">{statsB.comparisons}</div>
                                    <div className="text-[10px] text-muted-foreground">Comparisons</div>
                                </div>
                                <div className="bg-muted/40 rounded-md p-2">
                                    <div className="text-lg font-bold">{statsB.swaps}</div>
                                    <div className="text-[10px] text-muted-foreground">Swaps</div>
                                </div>
                            </div>
                            {/* Complexity */}
                            <div className="text-[10px] text-muted-foreground space-y-0.5 border-t pt-2">
                                <div>Best: <span className="font-mono">{ALGORITHM_COMPLEXITY[algoB].best}</span></div>
                                <div>Avg: <span className="font-mono">{ALGORITHM_COMPLEXITY[algoB].average}</span></div>
                                <div>Worst: <span className="font-mono">{ALGORITHM_COMPLEXITY[algoB].worst}</span></div>
                                <div>Space: <span className="font-mono">{ALGORITHM_COMPLEXITY[algoB].space}</span></div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-4 justify-center text-xs">
                {[
                    { color: "bg-primary/60", label: "Unsorted" },
                    { color: "bg-blue-400", label: "Comparing" },
                    { color: "bg-yellow-400", label: "Swapping" },
                    { color: "bg-purple-500", label: "Pivot" },
                    { color: "bg-green-400", label: "Sorted" },
                ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1.5">
                        <div className={`w-3 h-3 rounded-sm ${color}`} />
                        <span className="text-muted-foreground">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
