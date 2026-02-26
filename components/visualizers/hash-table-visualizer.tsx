"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Trash2 } from "lucide-react"
import AnimationControls from "@/components/ui/animation-controls"
import { useAnimationPlayer, type AnimationFrame } from "@/hooks/useAnimationPlayer"

// ── Types ──────────────────────────────────────────────────────────────────

const TABLE_SIZE = 10

type BucketEntry = { key: string; value: string; state: "default" | "active" | "found" | "collision" | "deleted" }

type HashFrame = {
    buckets: BucketEntry[][]
    probeSequence: number[]
    hashIndex: number
    stepDescription: string
    operation: "insert" | "search" | "delete" | "none"
}

function hashFn(key: string): number {
    let h = 0
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % TABLE_SIZE
    return h
}

function cloneBuckets(b: BucketEntry[][]): BucketEntry[][] {
    return b.map((bucket) => bucket.map((e) => ({ ...e })))
}

function resetStates(b: BucketEntry[][]): BucketEntry[][] {
    return b.map((bucket) => bucket.map((e) => ({ ...e, state: "default" })))
}

function generateInsert(buckets: BucketEntry[][], key: string, value: string): AnimationFrame<HashFrame>[] {
    const frames: AnimationFrame<HashFrame>[] = []
    const b = cloneBuckets(buckets)
    const hi = hashFn(key)

    frames.push({ snapshot: { buckets: cloneBuckets(b), probeSequence: [hi], hashIndex: hi, stepDescription: `hash("${key}") = ${hi} (sum of char codes mod ${TABLE_SIZE})`, operation: "insert" }, description: `hash = ${hi}` })

    // Check if key already exists (update)
    const existing = b[hi].findIndex((e) => e.key === key && e.state !== "deleted")
    if (existing !== -1) {
        b[hi][existing].state = "active"
        frames.push({ snapshot: { buckets: cloneBuckets(b), probeSequence: [hi], hashIndex: hi, stepDescription: `Key "${key}" already exists at bucket ${hi}. Updating value to "${value}".`, operation: "insert" }, description: "Update" })
        b[hi][existing].value = value; b[hi][existing].state = "found"
        frames.push({ snapshot: { buckets: cloneBuckets(b), probeSequence: [hi], hashIndex: hi, stepDescription: `Updated! Bucket ${hi}: "${key}" → "${value}"`, operation: "insert" }, description: "Done" })
        return frames
    }

    // Check for collision
    if (b[hi].length > 0) {
        b[hi].forEach((e) => { e.state = "collision" })
        frames.push({ snapshot: { buckets: cloneBuckets(b), probeSequence: [hi], hashIndex: hi, stepDescription: `Collision at bucket ${hi}! ${b[hi].length} entry(s) already there. Using chaining — append to linked list.`, operation: "insert" }, description: "Collision!" })
        b[hi].forEach((e) => { e.state = "default" })
    }

    b[hi].push({ key, value, state: "active" })
    frames.push({ snapshot: { buckets: cloneBuckets(b), probeSequence: [hi], hashIndex: hi, stepDescription: `Chained insertion: added "${key}"→"${value}" at bucket ${hi}`, operation: "insert" }, description: "Inserted" })

    b[hi][b[hi].length - 1].state = "default"
    frames.push({ snapshot: { buckets: cloneBuckets(b), probeSequence: [hi], hashIndex: hi, stepDescription: `Insert done. Bucket ${hi} now has ${b[hi].length} item(s).`, operation: "insert" }, description: "Done" })
    return frames
}

function generateSearch(buckets: BucketEntry[][], key: string): AnimationFrame<HashFrame>[] {
    const frames: AnimationFrame<HashFrame>[] = []
    const b = cloneBuckets(buckets)
    const hi = hashFn(key)

    frames.push({ snapshot: { buckets: cloneBuckets(b), probeSequence: [hi], hashIndex: hi, stepDescription: `hash("${key}") = ${hi}. Looking in bucket ${hi}...`, operation: "search" }, description: `hash = ${hi}` })

    if (b[hi].length === 0) {
        frames.push({ snapshot: { buckets: cloneBuckets(b), probeSequence: [hi], hashIndex: hi, stepDescription: `Bucket ${hi} is empty. Key "${key}" not found.`, operation: "search" }, description: "Not found" })
        return frames
    }

    for (let i = 0; i < b[hi].length; i++) {
        b[hi][i].state = "active"
        frames.push({ snapshot: { buckets: cloneBuckets(b), probeSequence: [hi], hashIndex: hi, stepDescription: `Checking: "${b[hi][i].key}" === "${key}"?`, operation: "search" }, description: `Check ${b[hi][i].key}` })
        if (b[hi][i].key === key) {
            b[hi][i].state = "found"
            frames.push({ snapshot: { buckets: cloneBuckets(b), probeSequence: [hi], hashIndex: hi, stepDescription: `Found! "${key}" → "${b[hi][i].value}"`, operation: "search" }, description: `Found: ${b[hi][i].value}` })
            return frames
        }
        b[hi][i].state = "default"
    }

    frames.push({ snapshot: { buckets: cloneBuckets(b), probeSequence: [hi], hashIndex: hi, stepDescription: `Key "${key}" not in bucket ${hi}. Not found.`, operation: "search" }, description: "Not found" })
    return frames
}

function generateDelete(buckets: BucketEntry[][], key: string): AnimationFrame<HashFrame>[] {
    const frames: AnimationFrame<HashFrame>[] = []
    const b = cloneBuckets(buckets)
    const hi = hashFn(key)

    frames.push({ snapshot: { buckets: cloneBuckets(b), probeSequence: [hi], hashIndex: hi, stepDescription: `hash("${key}") = ${hi}. Looking for key to delete...`, operation: "delete" }, description: `hash = ${hi}` })

    const idx = b[hi].findIndex((e) => e.key === key)
    if (idx === -1) {
        frames.push({ snapshot: { buckets: cloneBuckets(b), probeSequence: [hi], hashIndex: hi, stepDescription: `Key "${key}" not found in bucket ${hi}. Nothing to delete.`, operation: "delete" }, description: "Not found" })
        return frames
    }

    b[hi][idx].state = "active"
    frames.push({ snapshot: { buckets: cloneBuckets(b), probeSequence: [hi], hashIndex: hi, stepDescription: `Found "${key}" in bucket ${hi}. Removing...`, operation: "delete" }, description: "Removing" })
    b[hi][idx].state = "deleted"
    frames.push({ snapshot: { buckets: cloneBuckets(b), probeSequence: [hi], hashIndex: hi, stepDescription: `Deleted "${key}" from bucket ${hi}.`, operation: "delete" }, description: "Deleted" })
    b[hi].splice(idx, 1)
    frames.push({ snapshot: { buckets: cloneBuckets(b), probeSequence: [hi], hashIndex: hi, stepDescription: `Done. Bucket ${hi} now has ${b[hi].length} item(s).`, operation: "delete" }, description: "Done" })
    return frames
}

// ── Main Component ──────────────────────────────────────────────────────────

const ENTRY_BG: Record<BucketEntry["state"], string> = {
    default: "bg-muted/30 border-border",
    active: "bg-yellow-500/20 border-yellow-500",
    found: "bg-green-500/20 border-green-500",
    collision: "bg-orange-500/20 border-orange-500",
    deleted: "bg-red-500/20 border-red-500 opacity-60 line-through",
}

export default function HashTableVisualizer() {
    const [buckets, setBuckets] = useState<BucketEntry[][]>(Array.from({ length: TABLE_SIZE }, () => []))
    const [keyInput, setKeyInput] = useState("")
    const [valueInput, setValueInput] = useState("")
    const [searchKey, setSearchKey] = useState("")
    const [operation, setOperation] = useState<"insert" | "search" | "delete">("insert")
    const [steps, setSteps] = useState<string[]>([])
    const [highlightIndex, setHighlightIndex] = useState(-1)

    const onFrameChange = useCallback((snap: HashFrame) => {
        setBuckets(snap.buckets)
        setHighlightIndex(snap.hashIndex)
    }, [])
    const player = useAnimationPlayer<HashFrame>(onFrameChange)

    const currentBuckets = player.currentSnapshot?.buckets ?? buckets
    const stepDesc = player.currentSnapshot?.stepDescription ?? ""
    const hl = player.currentSnapshot?.hashIndex ?? highlightIndex

    const handleInsert = () => {
        if (!keyInput || player.isPlaying) return
        const frames = generateInsert(buckets, keyInput.trim(), valueInput.trim() || keyInput.trim())
        // After animation completes, update base state
        const lastSnap = frames[frames.length - 1].snapshot
        setSteps(frames.map((f) => f.description))
        player.loadFrames(frames)
        setTimeout(() => player.play(), 50)
        // Apply final state after animation
        setTimeout(() => {
            setBuckets(resetStates(lastSnap.buckets))
        }, frames.length * player.speed + 200)
        setKeyInput(""); setValueInput("")
    }

    const handleSearch = () => {
        if (!searchKey || player.isPlaying) return
        const frames = generateSearch(buckets, searchKey.trim())
        setSteps(frames.map((f) => f.description))
        player.loadFrames(frames)
        setTimeout(() => player.play(), 50)
    }

    const handleDelete = () => {
        if (!searchKey || player.isPlaying) return
        const frames = generateDelete(buckets, searchKey.trim())
        const lastSnap = frames[frames.length - 1].snapshot
        setSteps(frames.map((f) => f.description))
        player.loadFrames(frames)
        setTimeout(() => player.play(), 50)
        setTimeout(() => { setBuckets(resetStates(lastSnap.buckets)) }, frames.length * player.speed + 200)
    }

    const handleClear = () => {
        if (player.isPlaying) return
        setBuckets(Array.from({ length: TABLE_SIZE }, () => []))
        setSteps([]); player.clear(); setHighlightIndex(-1)
    }

    const loadSample = () => {
        if (player.isPlaying) return
        const pairs = [["apple", "fruit"], ["banana", "fruit"], ["car", "vehicle"], ["dog", "animal"], ["cat", "animal"]]
        const b: BucketEntry[][] = Array.from({ length: TABLE_SIZE }, () => [])
        for (const [k, v] of pairs) {
            const hi = hashFn(k)
            b[hi] = [...b[hi], { key: k, value: v, state: "default" }]
        }
        setBuckets(b); setSteps([]); player.clear()
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Controls */}
            <Card>
                <CardHeader>
                    <CardTitle>Hash Table (Chaining)</CardTitle>
                    <CardDescription>Hash function: sum of char codes mod {TABLE_SIZE}. Collisions handled via linked-list chaining.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Operation tabs */}
                    <div className="flex gap-1">
                        {(["insert", "search", "delete"] as const).map((op) => (
                            <Button key={op} size="sm" variant={operation === op ? "default" : "outline"}
                                onClick={() => setOperation(op)} disabled={player.isPlaying} className="flex-1 capitalize">
                                {op}
                            </Button>
                        ))}
                    </div>

                    {operation === "insert" && (
                        <div className="space-y-2">
                            <Input placeholder="Key" value={keyInput} onChange={(e) => setKeyInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleInsert()} disabled={player.isPlaying} />
                            <Input placeholder="Value (optional, defaults to key)" value={valueInput} onChange={(e) => setValueInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleInsert()} disabled={player.isPlaying} />
                            <Button onClick={handleInsert} disabled={player.isPlaying || !keyInput} className="w-full">
                                <Plus className="mr-2 h-4 w-4" /> Insert
                            </Button>
                        </div>
                    )}

                    {(operation === "search" || operation === "delete") && (
                        <div className="space-y-2">
                            <Input placeholder="Key to search/delete" value={searchKey} onChange={(e) => setSearchKey(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && (operation === "search" ? handleSearch() : handleDelete())}
                                disabled={player.isPlaying} />
                            <Button onClick={operation === "search" ? handleSearch : handleDelete}
                                disabled={player.isPlaying || !searchKey} className="w-full"
                                variant={operation === "delete" ? "destructive" : "default"}>
                                {operation === "search" ? <><Search className="mr-2 h-4 w-4" /> Search</> : <><Trash2 className="mr-2 h-4 w-4" /> Delete</>}
                            </Button>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button onClick={loadSample} disabled={player.isPlaying} variant="outline" className="flex-1">Load Sample</Button>
                        <Button onClick={handleClear} disabled={player.isPlaying} variant="ghost">Clear</Button>
                    </div>

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

                    {stepDesc && <p className="text-sm text-center bg-muted/30 p-2 rounded-md text-muted-foreground">{stepDesc}</p>}

                    {/* Steps */}
                    <div>
                        <h3 className="text-sm font-medium mb-1">Algorithm Steps:</h3>
                        <div className="bg-muted/30 rounded-md p-2 h-28 overflow-y-auto">
                            {steps.length > 0 ? (
                                <ol className="pl-4 list-decimal space-y-0.5">
                                    {steps.map((s, i) => (
                                        <li key={i} className={`text-xs ${i <= player.currentFrame ? "text-foreground" : "text-muted-foreground"}`}>{s}</li>
                                    ))}
                                </ol>
                            ) : <p className="text-xs text-muted-foreground">Perform an operation to see steps</p>}
                        </div>
                    </div>

                    {/* Complexity */}
                    <div className="text-[10px] text-muted-foreground border-t pt-2 grid grid-cols-2 gap-x-4">
                        <div>Insert: <span className="font-mono">O(1) avg</span></div>
                        <div>Search: <span className="font-mono">O(1) avg</span></div>
                        <div>Delete: <span className="font-mono">O(1) avg</span></div>
                        <div>Space: <span className="font-mono">O(n)</span></div>
                        <div className="col-span-2 mt-1">Worst case (all collisions): <span className="font-mono">O(n)</span></div>
                    </div>
                </CardContent>
            </Card>

            {/* Hash Table visualization */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Bucket Array (size {TABLE_SIZE})</CardTitle>
                    <CardDescription>Each row = one bucket. Chained entries shown inline.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-1">
                        {currentBuckets.map((bucket, i) => (
                            <div key={i}
                                className={`flex items-center gap-2 p-1.5 rounded-md transition-all duration-300 ${i === hl ? "ring-2 ring-blue-500 bg-blue-500/10" : ""}`}>
                                {/* Index */}
                                <div className="w-8 text-right">
                                    <span className="text-[10px] font-mono font-bold text-muted-foreground">[{i}]</span>
                                </div>
                                {/* Bucket cell */}
                                <div className="w-8 h-7 border border-border bg-muted/20 rounded flex items-center justify-center">
                                    <span className="text-[10px] text-muted-foreground">{bucket.length === 0 ? "∅" : "→"}</span>
                                </div>
                                {/* Entries */}
                                <div className="flex gap-1 flex-wrap">
                                    {bucket.map((entry, j) => (
                                        <div key={j}
                                            className={`flex items-center gap-1 border rounded px-2 py-0.5 text-xs transition-all duration-200 ${ENTRY_BG[entry.state]}`}>
                                            <span className="font-medium">{entry.key}</span>
                                            <span className="text-muted-foreground">→</span>
                                            <span>{entry.value}</span>
                                            {j < bucket.length - 1 && <span className="ml-1 text-muted-foreground">→</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-2 mt-3 text-[10px]">
                        {([["bg-yellow-500/30 border-yellow-500", "Active"], ["bg-green-500/30 border-green-500", "Found"], ["bg-orange-500/30 border-orange-500", "Collision"], ["bg-red-500/30 border-red-500", "Deleted"]] as const).map(([cls, lbl]) => (
                            <div key={lbl} className="flex items-center gap-1.5">
                                <div className={`w-3 h-3 rounded-sm border ${cls}`} />
                                <span className="text-muted-foreground">{lbl}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
