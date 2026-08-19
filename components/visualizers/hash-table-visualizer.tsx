"use client"

import { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, RotateCcw, Sparkles } from "lucide-react"
import AnimationControls from "@/components/ui/animation-controls"
import CodePanel from "@/components/ui/code-panel"
import InlineAlert from "@/components/ui/inline-alert"
import VisualizerLayout from "@/components/visualizers/visualizer-layout"
import { useAnimationPlayer } from "@/hooks/useAnimationPlayer"
import { STATE_BOX, type VisualizerState } from "@/lib/visualizer-states"
import {
    buildDelete,
    buildInsert,
    buildSearch,
    entryCount,
    hashOf,
    loadFactor,
    makeTable,
    secondaryHash,
    STRATEGY_LABELS,
    type HashSlot,
    type HashSnapshot,
    type Strategy,
    DEFAULT_MULTIPLIER,
    MAX_TABLE_SIZE,
    MIN_TABLE_SIZE,
} from "@/lib/hashing"

/**
 * Shape the Pratyaksha widget bridge sends for HASH_TABLE — an array of chains.
 * Kept as the controlled input so src/bridge/registry.tsx keeps working; the
 * component converts it into the richer slot model for rendering.
 */
export type BucketEntry = { key: string; value: string; state?: string }

// Line indices match what lib/hashing.ts sets as `activeLine`.
const CHAINING_CODE = [
    "def insert(key, value):          # separate chaining",
    "    i = h(key)                   # home bucket",
    "    for entry in table[i]:",
    "        if entry.key == key:",
    "            entry.value = value  # update in place",
    "            return",
    "    table[i].append((key, value))",
]

const PROBING_CODE = [
    "def insert(key, value):          # open addressing",
    "    home = h(key)",
    "    for i in range(m):",
    "        j = probe(home, i)       # linear / quadratic / double",
    "        if table[j] is empty or tombstone:",
    "            table[j] = (key, value)",
    "            return",
    "        if table[j].key == key:",
    "            table[j].value = value",
    "            return",
    "    raise TableFull",
]

const STRATEGIES: Strategy[] = ["chaining", "linear", "quadratic", "double"]
const SAMPLE_KEYS = ["12", "22", "32", "7", "19"]
const DEFAULT_SIZE = 10

/** Bridge input -> slot model. Unknown states fall back to the neutral one. */
function fromBuckets(buckets: BucketEntry[][]): HashSlot[] {
    return buckets.map((chain) => ({
        entries: chain.map((e) => ({ key: e.key, value: e.value, state: "default" as VisualizerState })),
        state: "default" as VisualizerState,
        tombstone: false,
    }))
}

export default function HashTableVisualizer({
    controlledBuckets,
}: {
    controlledBuckets?: BucketEntry[][]
} = {}) {
    const isControlled = controlledBuckets !== undefined

    const [size, setSize] = useState(DEFAULT_SIZE)
    const [strategy, setStrategy] = useState<Strategy>("chaining")
    const [multiplier, setMultiplier] = useState(DEFAULT_MULTIPLIER)
    const [slots, setSlots] = useState<HashSlot[]>(() => makeTable(DEFAULT_SIZE))
    const [operation, setOperation] = useState<"insert" | "search" | "delete">("insert")
    const [keyInput, setKeyInput] = useState("")
    const [valueInput, setValueInput] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [result, setResult] = useState<string | null>(null)

    const onFrameChange = useCallback((snap: HashSnapshot) => setSlots(snap.slots), [])
    const player = useAnimationPlayer<HashSnapshot>(onFrameChange)

    const options = { strategy, multiplier }
    const base = isControlled ? fromBuckets(controlledBuckets) : slots
    const view = player.currentSnapshot?.slots ?? base
    const probes = player.currentSnapshot?.probes ?? 0
    const home = player.currentSnapshot?.home ?? -1

    const preview = useMemo(
        () => (keyInput.trim() ? hashOf(keyInput.trim(), view.length, multiplier) : null),
        [keyInput, view.length, multiplier],
    )

    const reset = (nextSize = size) => {
        player.clear()
        setSlots(makeTable(nextSize))
        setError(null)
        setResult(null)
    }

    const run = () => {
        const key = keyInput.trim()
        const build =
            operation === "insert"
                ? () => buildInsert(base, key, valueInput.trim() || key, options)
                : operation === "search"
                    ? () => buildSearch(base, key, options)
                    : () => buildDelete(base, key, options)

        const outcome = build()
        if (outcome.error) {
            setError(outcome.error)
            return
        }
        setError(null)
        setResult(outcome.result)
        setSlots(outcome.slots)
        player.loadFrames(outcome.frames)
        setTimeout(() => player.play(), 50)
    }

    const loadSample = () => {
        let state = makeTable(size)
        for (const key of SAMPLE_KEYS) {
            const outcome = buildInsert(state, key, key, options)
            if (!outcome.error) state = outcome.slots
        }
        player.clear()
        setSlots(state)
        setError(null)
        setResult(null)
    }

    const changeStrategy = (next: string) => {
        setStrategy(next as Strategy)
        reset()
    }

    const changeSize = (raw: string) => {
        const n = Number(raw)
        if (!Number.isInteger(n) || n < MIN_TABLE_SIZE || n > MAX_TABLE_SIZE) return
        setSize(n)
        reset(n)
    }

    const isChaining = strategy === "chaining"
    const factor = loadFactor(view)

    const visualization = (
        <Card className="flex flex-col h-full">
            <CardHeader className="shrink-0">
                <CardTitle>Bucket Array</CardTitle>
                <CardDescription>
                    {isControlled
                        ? "Driven from the notebook"
                        : `${STRATEGY_LABELS[strategy]} · ${entryCount(view)} of ${view.length} slots used · load factor ${factor.toFixed(2)}`}
                </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col flex-1 min-h-0 gap-3 border-t pt-4 pb-4 bg-muted/5">
                {!isControlled && (
                    <p className="shrink-0 rounded-md border bg-muted/30 px-3 py-1.5 text-center font-mono text-xs">
                        {preview
                            ? preview.working
                            : `h(key) = key mod ${view.length} for numbers, polynomial base ${multiplier} otherwise`}
                        {!isChaining && preview && strategy === "double" &&
                            ` · step h₂ = ${secondaryHash(keyInput.trim(), view.length, multiplier)}`}
                    </p>
                )}

                <div className="flex-1 min-h-0 overflow-auto pr-1">
                    <ul className="space-y-1">
                        {view.map((slot, index) => (
                            <li key={index} className="flex items-center gap-2">
                                <span
                                    className={`w-9 shrink-0 text-right font-mono text-xs ${index === home ? "font-bold text-primary" : "text-muted-foreground"}`}
                                >
                                    [{index}]
                                </span>
                                <div
                                    className={`flex flex-1 min-w-0 items-center gap-1.5 rounded-md border-2 px-2 py-1 transition-all duration-300 ${STATE_BOX[slot.state]}`}
                                >
                                    {slot.entries.length === 0 ? (
                                        <span className="font-mono text-xs text-muted-foreground">
                                            {slot.tombstone ? "⌫ tombstone" : "∅"}
                                        </span>
                                    ) : (
                                        slot.entries.map((entry, ei) => (
                                            <span
                                                key={`${entry.key}-${ei}`}
                                                className={`flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-xs transition-all duration-300 ${STATE_BOX[entry.state]}`}
                                            >
                                                <strong>{entry.key}</strong>
                                                <span className="text-muted-foreground">:</span>
                                                {entry.value}
                                            </span>
                                        ))
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {player.currentDescription && (
                    <p className="shrink-0 rounded-md border bg-muted/30 px-3 py-2 text-center text-xs md:text-sm font-medium text-primary">
                        {player.currentDescription}
                    </p>
                )}

                <div className="shrink-0 flex flex-wrap justify-center gap-x-4 gap-y-2 border-t pt-3 text-xs">
                    {([
                        ["default", "Free"],
                        ["comparing", "Probing"],
                        ["inserted", "Placed"],
                        ["warning", "Collision"],
                        ["removed", "Deleted"],
                    ] as const).map(([state, label]) => (
                        <div
                            key={label}
                            className="flex items-center gap-1.5 rounded border border-border bg-background px-2 py-0.5"
                        >
                            <div className={`h-2.5 w-2.5 rounded-sm border ${STATE_BOX[state]}`} />
                            <span className="whitespace-nowrap text-muted-foreground">{label}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )

    // The notebook bridge renders the table alone, with no controls to drive it.
    if (isControlled) return <VisualizerLayout mini visualization={visualization} />

    return (
        <VisualizerLayout
            controls={
                <Card>
                    <CardHeader>
                        <CardTitle>Hash Table Operations</CardTitle>
                        <CardDescription>Insert, search or delete, and watch the collisions resolve</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Collision resolution</Label>
                            <div className="grid grid-cols-2 gap-1.5">
                                {STRATEGIES.map((option) => (
                                    <Button
                                        key={option}
                                        size="sm"
                                        variant={strategy === option ? "default" : "outline"}
                                        onClick={() => changeStrategy(option)}
                                        disabled={player.isPlaying}
                                        className="text-xs"
                                    >
                                        {STRATEGY_LABELS[option]}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="ht-size">Table size (m)</Label>
                                <Input
                                    id="ht-size"
                                    type="number"
                                    min={MIN_TABLE_SIZE}
                                    max={MAX_TABLE_SIZE}
                                    value={size}
                                    onChange={(e) => changeSize(e.target.value)}
                                    disabled={player.isPlaying}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="ht-mult">Hash base</Label>
                                <Input
                                    id="ht-mult"
                                    type="number"
                                    min={2}
                                    max={97}
                                    value={multiplier}
                                    onChange={(e) => {
                                        const n = Number(e.target.value)
                                        if (Number.isInteger(n) && n >= 2 && n <= 97) setMultiplier(n)
                                    }}
                                    disabled={player.isPlaying}
                                />
                            </div>
                        </div>

                        <Tabs value={operation} onValueChange={(v) => setOperation(v as typeof operation)}>
                            <TabsList className="grid grid-cols-3 w-full">
                                <TabsTrigger value="insert">Insert</TabsTrigger>
                                <TabsTrigger value="search">Search</TabsTrigger>
                                <TabsTrigger value="delete">Delete</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="flex gap-2">
                            <Input
                                value={keyInput}
                                onChange={(e) => setKeyInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && run()}
                                placeholder="Key, e.g. 12"
                                aria-label="Key"
                                className="font-mono"
                                disabled={player.isPlaying}
                            />
                            {operation === "insert" && (
                                <Input
                                    value={valueInput}
                                    onChange={(e) => setValueInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && run()}
                                    placeholder="Value"
                                    aria-label="Value"
                                    className="font-mono"
                                    disabled={player.isPlaying}
                                />
                            )}
                            <Button onClick={run} disabled={player.isPlaying}>
                                <Play className="mr-2 h-4 w-4" />
                                Run
                            </Button>
                        </div>

                        <InlineAlert message={error} />

                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={loadSample} disabled={player.isPlaying}>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Sample keys
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
                                ["Entries", `${entryCount(view)}`],
                                ["Load factor", factor.toFixed(2)],
                                ["Probes", `${probes}`],
                            ].map(([label, value]) => (
                                <div key={label}>
                                    <p className="font-mono text-lg font-bold">{value}</p>
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
            visualization={visualization}
            code={
                <CodePanel
                    code={isChaining ? CHAINING_CODE : PROBING_CODE}
                    activeLine={player.currentSnapshot?.activeLine ?? null}
                    title={STRATEGY_LABELS[strategy]}
                />
            }
            docs={
                <Card>
                    <CardHeader>
                        <CardTitle>Learning</CardTitle>
                        <CardDescription>Static hashing and collisions</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <p>
                            A hash function maps a key to a slot. Two keys landing in the same slot is a{" "}
                            <strong>collision</strong>, and it is not an edge case — with m slots you can expect
                            one after roughly √m insertions.
                        </p>
                        <div>
                            <p className="mb-1 font-medium">The four strategies</p>
                            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                                <li>
                                    <strong>Separate chaining</strong> — each slot holds a list. Load factor can
                                    exceed 1, and deletion just unlinks.
                                </li>
                                <li>
                                    <strong>Linear probing</strong> — try h+1, h+2, … Simple, but occupied runs
                                    merge into longer ones, called primary clustering.
                                </li>
                                <li>
                                    <strong>Quadratic probing</strong> — try h+1², h+2², … It breaks up clusters,
                                    but the sequence does not reach every slot, so an insert can fail while the
                                    table still has room. Try it: size 10, insert 0, 10, 20, 30, 40, 50, then 60.
                                </li>
                                <li>
                                    <strong>Double hashing</strong> — step by a second hash of the key, so two
                                    keys that collide rarely follow the same path.
                                </li>
                            </ul>
                        </div>
                        <p>
                            <strong>Deletion is the subtle one.</strong> Under open addressing you cannot simply
                            empty a slot: any key placed by probing <em>through</em> it would become unreachable.
                            The slot is marked with a tombstone instead — occupied for searching, free for
                            inserting.
                        </p>
                        <p>
                            <strong>Complexity:</strong> O(1) average for all three operations, O(n) worst case
                            when every key collides. The load factor is what keeps you away from the worst case.
                        </p>
                    </CardContent>
                </Card>
            }
        />
    )
}
