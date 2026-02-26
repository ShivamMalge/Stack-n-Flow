"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AnimationControls from "@/components/ui/animation-controls"
import { useAnimationPlayer, type AnimationFrame } from "@/hooks/useAnimationPlayer"

// ── Fibonacci DP ────────────────────────────────────────────────────────────

type FibFrame = { table: (number | null)[]; current: number; stepDescription: string }

function generateFibonacci(n: number): AnimationFrame<FibFrame>[] {
    const frames: AnimationFrame<FibFrame>[] = []
    const table: (number | null)[] = Array(n + 1).fill(null)

    frames.push({ snapshot: { table: [...table], current: -1, stepDescription: `Initialize DP table for F(${n})` }, description: "Init" })

    table[0] = 0
    frames.push({ snapshot: { table: [...table], current: 0, stepDescription: "Base case: F(0) = 0" }, description: "F(0)=0" })

    if (n >= 1) {
        table[1] = 1
        frames.push({ snapshot: { table: [...table], current: 1, stepDescription: "Base case: F(1) = 1" }, description: "F(1)=1" })
    }

    for (let i = 2; i <= n; i++) {
        table[i] = table[i - 1]! + table[i - 2]!
        frames.push({
            snapshot: { table: [...table], current: i, stepDescription: `F(${i}) = F(${i - 1}) + F(${i - 2}) = ${table[i - 1]} + ${table[i - 2]} = ${table[i]}` },
            description: `F(${i})=${table[i]}`
        })
    }
    frames.push({ snapshot: { table: [...table], current: n, stepDescription: `Done! F(${n}) = ${table[n]}` }, description: `Result: ${table[n]}` })
    return frames
}

// ── 0/1 Knapsack DP ─────────────────────────────────────────────────────────

type KnapsackItem = { weight: number; value: number }
type KnapsackFrame = {
    dp: number[][]
    currentRow: number; currentCol: number
    stepDescription: string
    items: KnapsackItem[]; capacity: number
}

function generateKnapsack(items: KnapsackItem[], capacity: number): AnimationFrame<KnapsackFrame>[] {
    const frames: AnimationFrame<KnapsackFrame>[] = []
    const n = items.length
    const dp: number[][] = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(0))

    frames.push({ snapshot: { dp: dp.map((r) => [...r]), currentRow: 0, currentCol: 0, stepDescription: "Initialize DP table (all zeros = base case: 0 items)", items, capacity }, description: "Init" })

    for (let i = 1; i <= n; i++) {
        const { weight: w, value: v } = items[i - 1]
        for (let c = 0; c <= capacity; c++) {
            if (w <= c) {
                dp[i][c] = Math.max(dp[i - 1][c], v + dp[i - 1][c - w])
                frames.push({
                    snapshot: { dp: dp.map((r) => [...r]), currentRow: i, currentCol: c, stepDescription: `Item ${i} (w=${w}, v=${v}), cap=${c}: max(skip=${dp[i - 1][c]}, take=${v}+${dp[i - 1][c - w]}=${v + dp[i - 1][c - w]}) = ${dp[i][c]}`, items, capacity },
                    description: `dp[${i}][${c}]=${dp[i][c]}`
                })
            } else {
                dp[i][c] = dp[i - 1][c]
                frames.push({
                    snapshot: { dp: dp.map((r) => [...r]), currentRow: i, currentCol: c, stepDescription: `Item ${i} (w=${w}, v=${v}), cap=${c}: can't take (w > cap), skip → dp[${i}][${c}]=${dp[i][c]}`, items, capacity },
                    description: `dp[${i}][${c}]=${dp[i][c]}`
                })
            }
        }
    }

    // Trace back selected items
    const selected: number[] = []
    let c = capacity
    for (let i = n; i > 0; i--) {
        if (dp[i][c] !== dp[i - 1][c]) { selected.push(i - 1); c -= items[i - 1].weight }
    }

    frames.push({
        snapshot: { dp: dp.map((r) => [...r]), currentRow: n, currentCol: capacity, stepDescription: `Max value = ${dp[n][capacity]}. Selected items: ${selected.map((i) => `Item ${i + 1}`).join(", ")}`, items, capacity },
        description: `Result: ${dp[n][capacity]}`
    })
    return frames
}

// ── Main Component ──────────────────────────────────────────────────────────

type DPMode = "fibonacci" | "knapsack"

export default function DPVisualizer() {
    const [mode, setMode] = useState<DPMode>("fibonacci")

    // Fibonacci state
    const [fibN, setFibN] = useState("8")
    const [fibTable, setFibTable] = useState<(number | null)[]>([])
    const [fibCurrent, setFibCurrent] = useState(-1)
    const [fibSteps, setFibSteps] = useState<string[]>([])

    // Knapsack state
    const [ksItems, setKsItems] = useState<KnapsackItem[]>([
        { weight: 2, value: 6 }, { weight: 3, value: 10 }, { weight: 4, value: 12 },
    ])
    const [ksCapacity, setKsCapacity] = useState("5")
    const [ksDp, setKsDp] = useState<number[][]>([])
    const [ksCurrentRow, setKsCurrentRow] = useState(-1)
    const [ksCurrentCol, setKsCurrentCol] = useState(-1)
    const [ksSteps, setKsSteps] = useState<string[]>([])
    const [ksWeightInput, setKsWeightInput] = useState("")
    const [ksValueInput, setKsValueInput] = useState("")

    const onFibFrame = useCallback((snap: FibFrame) => {
        setFibTable(snap.table)
        setFibCurrent(snap.current)
    }, [])
    const onKsFrame = useCallback((snap: KnapsackFrame) => {
        setKsDp(snap.dp)
        setKsCurrentRow(snap.currentRow)
        setKsCurrentCol(snap.currentCol)
    }, [])

    const fibPlayer = useAnimationPlayer<FibFrame>(onFibFrame)
    const ksPlayer = useAnimationPlayer<KnapsackFrame>(onKsFrame)

    const handleRunFib = () => {
        const n = parseInt(fibN)
        if (isNaN(n) || n < 0 || n > 20) return
        const frames = generateFibonacci(n)
        setFibSteps(frames.map((f) => f.description))
        fibPlayer.loadFrames(frames)
        setTimeout(() => fibPlayer.play(), 50)
    }

    const handleRunKnapsack = () => {
        const cap = parseInt(ksCapacity)
        if (isNaN(cap) || cap < 1 || cap > 15 || ksItems.length === 0) return
        const frames = generateKnapsack(ksItems, cap)
        setKsSteps(frames.map((f) => f.description))
        ksPlayer.loadFrames(frames)
        setTimeout(() => ksPlayer.play(), 50)
    }

    const handleAddKsItem = () => {
        const w = parseInt(ksWeightInput); const v = parseInt(ksValueInput)
        if (isNaN(w) || isNaN(v) || w < 1 || v < 1 || ksItems.length >= 8) return
        setKsItems([...ksItems, { weight: w, value: v }])
        setKsWeightInput(""); setKsValueInput("")
        ksPlayer.clear(); setKsSteps([])
    }

    // Display state
    const fibSnap = fibPlayer.currentSnapshot
    const displayFibTable = fibSnap ? fibSnap.table : fibTable
    const displayFibCurrent = fibSnap ? fibSnap.current : fibCurrent
    const fibDesc = fibSnap?.stepDescription ?? ""

    const ksSnap = ksPlayer.currentSnapshot
    const displayKsDp = ksSnap ? ksSnap.dp : ksDp
    const displayKsRow = ksSnap ? ksSnap.currentRow : ksCurrentRow
    const displayKsCol = ksSnap ? ksSnap.currentCol : ksCurrentCol
    const ksDesc = ksSnap?.stepDescription ?? ""

    return (
        <div className="space-y-4">
            {/* Mode toggle */}
            <div className="flex gap-2">
                {(["fibonacci", "knapsack"] as DPMode[]).map((m) => (
                    <Button key={m} variant={mode === m ? "default" : "outline"} onClick={() => setMode(m)}>
                        {m === "fibonacci" ? "🔢 Fibonacci" : "🎒 0/1 Knapsack"}
                    </Button>
                ))}
            </div>

            {mode === "fibonacci" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Fibonacci — Dynamic Programming</CardTitle>
                            <CardDescription>Bottom-up DP: fill table from F(0) to F(n)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input type="number" placeholder="n (0–20)" value={fibN} onChange={(e) => setFibN(e.target.value)}
                                    disabled={fibPlayer.isPlaying} min={0} max={20} />
                                <Button onClick={handleRunFib} disabled={fibPlayer.isPlaying}>Compute F(n)</Button>
                            </div>
                            {fibPlayer.totalFrames > 0 && (
                                <AnimationControls
                                    currentFrame={fibPlayer.currentFrame} totalFrames={fibPlayer.totalFrames}
                                    isPlaying={fibPlayer.isPlaying} isPaused={fibPlayer.isPaused} isComplete={fibPlayer.isComplete}
                                    speed={fibPlayer.speed}
                                    onPlay={fibPlayer.play} onPause={fibPlayer.pause}
                                    onStepForward={fibPlayer.stepForward} onStepBackward={fibPlayer.stepBackward}
                                    onReset={fibPlayer.reset} onSpeedChange={fibPlayer.setSpeed} onFrameChange={fibPlayer.goToFrame}
                                />
                            )}
                            {fibDesc && <p className="text-xs text-center bg-muted/30 p-2 rounded-md">{fibDesc}</p>}
                            <div>
                                <h3 className="text-sm font-medium mb-1">Steps:</h3>
                                <div className="bg-muted/30 rounded-md p-2 h-32 overflow-y-auto">
                                    {fibSteps.length > 0 ? (
                                        <ol className="pl-4 list-decimal space-y-0.5">
                                            {fibSteps.map((s, i) => (
                                                <li key={i} className={`text-xs ${i <= fibPlayer.currentFrame ? "text-foreground" : "text-muted-foreground"}`}>{s}</li>
                                            ))}
                                        </ol>
                                    ) : <p className="text-xs text-muted-foreground">Run to see steps</p>}
                                </div>
                            </div>
                            <div className="text-[10px] text-muted-foreground border-t pt-2">
                                <p>Time: <span className="font-mono">O(n)</span> · Space: <span className="font-mono">O(n)</span></p>
                                <p className="mt-1">Recurrence: F(n) = F(n-1) + F(n-2), F(0)=0, F(1)=1</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-base">DP Table Visualization</CardTitle></CardHeader>
                        <CardContent>
                            {displayFibTable.length === 0 ? (
                                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Run to see DP table</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <div className="flex gap-1">
                                        {displayFibTable.map((val, i) => (
                                            <div key={i} className={`flex flex-col items-center border rounded-md p-2 min-w-[44px] transition-all duration-300 ${i === displayFibCurrent ? "bg-blue-500/20 border-blue-500" : val !== null ? "bg-muted/40" : "bg-muted/10 opacity-40"}`}>
                                                <span className="text-xs font-bold text-muted-foreground">F({i})</span>
                                                <span className="text-sm font-bold">{val !== null ? val : "?"}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {mode === "knapsack" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>0/1 Knapsack — Dynamic Programming</CardTitle>
                            <CardDescription>Fill dp[i][c] = max value using first i items with capacity c</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground">Items (weight, value):</p>
                                <div className="flex flex-wrap gap-1">
                                    {ksItems.map((item, i) => (
                                        <span key={i} className="text-xs border rounded px-2 py-0.5 bg-muted/30 flex items-center gap-1">
                                            #{i + 1}: w={item.weight}, v={item.value}
                                            <button className="text-muted-foreground hover:text-foreground ml-1"
                                                onClick={() => { setKsItems(ksItems.filter((_, j) => j !== i)); ksPlayer.clear(); setKsSteps([]) }}>×</button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Input type="number" placeholder="Weight" value={ksWeightInput} onChange={(e) => setKsWeightInput(e.target.value)} min={1} max={15} className="w-24" />
                                    <Input type="number" placeholder="Value" value={ksValueInput} onChange={(e) => setKsValueInput(e.target.value)} min={1} max={100} className="w-24" />
                                    <Button onClick={handleAddKsItem} disabled={ksPlayer.isPlaying || ksItems.length >= 8} variant="outline" size="sm">Add Item</Button>
                                </div>
                                <div className="flex gap-2">
                                    <Input type="number" placeholder="Capacity" value={ksCapacity} onChange={(e) => setKsCapacity(e.target.value)} min={1} max={15} className="w-32" />
                                    <Button onClick={handleRunKnapsack} disabled={ksPlayer.isPlaying || ksItems.length === 0}>Solve</Button>
                                </div>
                            </div>
                            {ksPlayer.totalFrames > 0 && (
                                <AnimationControls
                                    currentFrame={ksPlayer.currentFrame} totalFrames={ksPlayer.totalFrames}
                                    isPlaying={ksPlayer.isPlaying} isPaused={ksPlayer.isPaused} isComplete={ksPlayer.isComplete}
                                    speed={ksPlayer.speed}
                                    onPlay={ksPlayer.play} onPause={ksPlayer.pause}
                                    onStepForward={ksPlayer.stepForward} onStepBackward={ksPlayer.stepBackward}
                                    onReset={ksPlayer.reset} onSpeedChange={ksPlayer.setSpeed} onFrameChange={ksPlayer.goToFrame}
                                />
                            )}
                            {ksDesc && <p className="text-xs text-center bg-muted/30 p-2 rounded-md">{ksDesc}</p>}
                            <div>
                                <h3 className="text-sm font-medium mb-1">Steps:</h3>
                                <div className="bg-muted/30 rounded-md p-2 h-32 overflow-y-auto">
                                    {ksSteps.length > 0 ? (
                                        <ol className="pl-4 list-decimal space-y-0.5">
                                            {ksSteps.map((s, i) => (
                                                <li key={i} className={`text-xs ${i <= ksPlayer.currentFrame ? "text-foreground" : "text-muted-foreground"}`}>{s}</li>
                                            ))}
                                        </ol>
                                    ) : <p className="text-xs text-muted-foreground">Run solve to see steps</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-base">DP Table</CardTitle></CardHeader>
                        <CardContent>
                            {displayKsDp.length === 0 ? (
                                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Solve to see DP table</div>
                            ) : (
                                <div className="overflow-x-auto pb-4">
                                    <table className="text-[10px] md:text-xs border-collapse min-w-full">
                                        <thead>
                                            <tr>
                                                <th className="border border-border px-1 md:px-2 py-1 bg-muted/30">i\c</th>
                                                {Array.from({ length: displayKsDp[0].length }, (_, c) => (
                                                    <th key={c} className="border border-border px-1 md:px-2 py-1 bg-muted/20 font-mono">{c}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {displayKsDp.map((row, i) => (
                                                <tr key={i}>
                                                    <td className="border border-border px-1 md:px-2 py-1 bg-muted/20 font-mono font-bold">{i}</td>
                                                    {row.map((val, c) => (
                                                        <td key={c} className={`border border-border px-1 md:px-2 py-1 text-center transition-all duration-200 font-mono
                               ${i === displayKsRow && c === displayKsCol ? "bg-blue-500/30 text-blue-600 dark:text-blue-300 font-bold" :
                                                                i < displayKsRow || (i === displayKsRow && c < displayKsCol) ? "bg-muted/20" : "opacity-40"}`}>
                                                            {val}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
