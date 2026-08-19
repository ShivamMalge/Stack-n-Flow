"use client"

import { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Link2, RotateCcw, Search, Shuffle } from "lucide-react"
import AnimationControls from "@/components/ui/animation-controls"
import CodePanel from "@/components/ui/code-panel"
import InlineAlert from "@/components/ui/inline-alert"
import VisualizerLayout from "@/components/visualizers/visualizer-layout"
import { useAnimationPlayer } from "@/hooks/useAnimationPlayer"
import { useMobile } from "@/hooks/use-mobile"
import { STATE_BOX, STATE_SHAPE } from "@/lib/visualizer-states"
import {
    buildFind,
    buildUnion,
    layoutForest,
    makeSets,
    setCount,
    MAX_SET_SIZE,
    MIN_SET_SIZE,
    type DsuNodeState,
    type DsuSnapshot,
} from "@/lib/disjoint-set"

// Line indices match what lib/disjoint-set.ts sets as `activeLine`.
const FIND_CODE = [
    "def find(x):",
    "    while parent[x] != x:        # not a root yet",
    "        x = parent[x]            # walk up",
    "    compress(path, x)            # point the path at the root",
    "    return x",
]

const UNION_CODE = [
    "def union(a, b):",
    "    ra, rb = find(a), find(b)",
    "    if ra == rb: return          # already one set",
    "    if rank[ra] < rank[rb]: ra, rb = rb, ra",
    "    parent[rb] = ra              # shorter tree goes under",
    "    if rank[ra] == rank[rb]: rank[ra] += 1",
]

const DEFAULT_SIZE = 10

export default function DisjointSetVisualizer() {
    const isMobile = useMobile()
    const [size, setSize] = useState(DEFAULT_SIZE)
    const [nodes, setNodes] = useState<DsuNodeState[]>(() => makeSets(DEFAULT_SIZE))
    const [findValue, setFindValue] = useState("0")
    const [unionA, setUnionA] = useState("0")
    const [unionB, setUnionB] = useState("1")
    const [pathCompression, setPathCompression] = useState(true)
    const [unionByRank, setUnionByRank] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [mode, setMode] = useState<"find" | "union">("union")
    const [result, setResult] = useState<string | null>(null)

    const onFrameChange = useCallback((snap: DsuSnapshot) => setNodes(snap.nodes), [])
    const player = useAnimationPlayer<DsuSnapshot>(onFrameChange)

    const options = { pathCompression, unionByRank }
    const view = player.currentSnapshot?.nodes ?? nodes

    const layout = useMemo(() => layoutForest(view), [view])
    const NODE_R = isMobile ? 15 : 19
    const X_GAP = isMobile ? 44 : 58
    const Y_GAP = isMobile ? 58 : 72
    const PAD = 26
    // Roots carry a rank label above them, which was clipped by the top edge
    // when the vertical padding matched the horizontal.
    const PAD_TOP = 38
    const svgW = Math.max(280, (layout.width + 1) * X_GAP + PAD * 2)
    const svgH = (layout.depth + 1) * Y_GAP + PAD_TOP + PAD

    /** Run a builder, keep its end state, and play the frames. */
    const run = (build: () => ReturnType<typeof buildFind>, which: "find" | "union") => {
        const outcome = build()
        if (outcome.error) {
            setError(outcome.error)
            return
        }
        setError(null)
        setMode(which)
        setResult(outcome.result)
        setNodes(outcome.nodes)
        player.loadFrames(outcome.frames)
        setTimeout(() => player.play(), 50)
    }

    const handleFind = () => run(() => buildFind(nodes, Number(findValue), options), "find")
    const handleUnion = () =>
        run(() => buildUnion(nodes, Number(unionA), Number(unionB), options), "union")

    const handleReset = (n = size) => {
        player.clear()
        setNodes(makeSets(n))
        setError(null)
        setResult(null)
    }

    const handleResize = (raw: string) => {
        const n = Number(raw)
        if (!Number.isInteger(n) || n < MIN_SET_SIZE || n > MAX_SET_SIZE) return
        setSize(n)
        handleReset(n)
    }

    /** A few random unions, so the forest has something to look at. */
    const handleScatter = () => {
        let state = makeSets(size)
        const pairs = Math.max(2, Math.floor(size / 2))
        for (let i = 0; i < pairs; i++) {
            const a = Math.floor(Math.random() * size)
            const b = Math.floor(Math.random() * size)
            if (a !== b) state = buildUnion(state, a, b, options).nodes
        }
        player.clear()
        setNodes(state)
        setError(null)
        setResult(null)
    }

    const remaining = setCount(view)

    return (
        <VisualizerLayout
            controls={
                <Card>
                    <CardHeader>
                        <CardTitle>Disjoint Set Operations</CardTitle>
                        <CardDescription>Union-find over {size} elements, 0 to {size - 1}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="dsu-size">Elements</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="dsu-size"
                                    type="number"
                                    min={MIN_SET_SIZE}
                                    max={MAX_SET_SIZE}
                                    value={size}
                                    onChange={(e) => handleResize(e.target.value)}
                                    disabled={player.isPlaying}
                                />
                                <Button variant="outline" onClick={() => handleReset()} disabled={player.isPlaying}>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reset
                                </Button>
                                <Button variant="secondary" onClick={handleScatter} disabled={player.isPlaying}>
                                    <Shuffle className="mr-2 h-4 w-4" />
                                    Scatter
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-1.5 border-t pt-4">
                            <Label htmlFor="dsu-union-a">Union</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="dsu-union-a"
                                    type="number"
                                    value={unionA}
                                    onChange={(e) => setUnionA(e.target.value)}
                                    disabled={player.isPlaying}
                                    aria-label="First element to union"
                                />
                                <span className="text-muted-foreground">+</span>
                                <Input
                                    type="number"
                                    value={unionB}
                                    onChange={(e) => setUnionB(e.target.value)}
                                    disabled={player.isPlaying}
                                    aria-label="Second element to union"
                                />
                                <Button onClick={handleUnion} disabled={player.isPlaying}>
                                    <Link2 className="mr-2 h-4 w-4" />
                                    Union
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="dsu-find">Find</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="dsu-find"
                                    type="number"
                                    value={findValue}
                                    onChange={(e) => setFindValue(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleFind()}
                                    disabled={player.isPlaying}
                                />
                                <Button variant="secondary" onClick={handleFind} disabled={player.isPlaying}>
                                    <Search className="mr-2 h-4 w-4" />
                                    Find
                                </Button>
                            </div>
                        </div>

                        <InlineAlert message={error} />

                        {/*
                            Toggles, not assumptions. Turning both off and
                            unioning 1+0, 2+1, 3+2 ... builds a path instead of a
                            tree, which is the argument for having them.
                        */}
                        <div className="space-y-2 border-t pt-4">
                            <p className="text-xs font-medium text-muted-foreground">Optimisations</p>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={unionByRank}
                                    onChange={(e) => setUnionByRank(e.target.checked)}
                                    className="h-4 w-4 accent-primary"
                                />
                                Union by rank
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={pathCompression}
                                    onChange={(e) => setPathCompression(e.target.checked)}
                                    className="h-4 w-4 accent-primary"
                                />
                                Path compression
                            </label>
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

                        {result && (
                            <div className="rounded-md border bg-muted/30 p-3">
                                <p className="font-mono text-sm font-bold">{result}</p>
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
                            {remaining} disjoint set{remaining === 1 ? "" : "s"}. Each tree is one set; its root
                            is the representative.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-col flex-1 min-h-0 gap-4 border-t pt-4 pb-4 bg-muted/5">
                        {/* The forest. Sized from the layout's real extents so
                            no node can land outside the drawing area. */}
                        <div className="flex flex-1 min-h-[240px] max-h-[52vh] w-full overflow-auto">
                            <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} className="m-auto max-w-none">
                                {view.map((node) => {
                                    if (node.parent === node.id) return null
                                    const from = layout.positions.get(node.id)
                                    const to = layout.positions.get(node.parent)
                                    if (!from || !to) return null
                                    return (
                                        <line
                                            key={`edge-${node.id}`}
                                            x1={from.x * X_GAP + PAD}
                                            y1={from.y * Y_GAP + PAD_TOP}
                                            x2={to.x * X_GAP + PAD}
                                            y2={to.y * Y_GAP + PAD_TOP}
                                            className="stroke-muted-foreground transition-all duration-300"
                                            strokeOpacity="0.4"
                                            strokeWidth="2"
                                        />
                                    )
                                })}
                                {view.map((node) => {
                                    const pos = layout.positions.get(node.id)
                                    if (!pos) return null
                                    const cx = pos.x * X_GAP + PAD
                                    const cy = pos.y * Y_GAP + PAD_TOP
                                    const isRoot = node.parent === node.id
                                    return (
                                        <g key={node.id}>
                                            <circle
                                                cx={cx}
                                                cy={cy}
                                                r={NODE_R}
                                                className={`stroke-[2] transition-all duration-300 ${STATE_SHAPE[node.state]}`}
                                            />
                                            <text
                                                x={cx}
                                                y={cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                className={`${isMobile ? "text-xs" : "text-sm"} font-bold fill-current pointer-events-none select-none`}
                                            >
                                                {node.id}
                                            </text>
                                            {isRoot && (
                                                <text
                                                    x={cx}
                                                    y={cy - NODE_R - 6}
                                                    textAnchor="middle"
                                                    className="text-[10px] font-medium fill-muted-foreground pointer-events-none select-none"
                                                >
                                                    r{node.rank}
                                                </text>
                                            )}
                                        </g>
                                    )
                                })}
                            </svg>
                        </div>

                        {/* The array is the representation the syllabus names,
                            so it is shown beside the forest it encodes. */}
                        <div className="shrink-0 space-y-1 overflow-x-auto">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                parent[]
                            </p>
                            <div className="flex gap-1">
                                {view.map((node) => (
                                    <div key={node.id} className="flex flex-col items-center">
                                        <div
                                            className={`flex h-8 w-8 items-center justify-center rounded border-2 font-mono text-xs font-bold transition-all duration-300 ${STATE_BOX[node.state]}`}
                                        >
                                            {node.parent}
                                        </div>
                                        <span className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                                            {node.id}
                                        </span>
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
                    code={mode === "find" ? FIND_CODE : UNION_CODE}
                    activeLine={player.currentSnapshot?.activeLine ?? null}
                    title={mode === "find" ? "Find" : "Union"}
                />
            }
            docs={
                <Card>
                    <CardHeader>
                        <CardTitle>Learning</CardTitle>
                        <CardDescription>Representing disjoint sets</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <p>
                            A <strong>disjoint-set</strong> structure keeps a collection of sets that never
                            overlap, and answers one question: are these two elements in the same set? Each
                            set is a tree, and the root is its <em>representative</em>.
                        </p>
                        <p>
                            The representation is just <code className="font-mono">parent[]</code> — the
                            array below the forest. A root stores itself, so{" "}
                            <code className="font-mono">parent[x] == x</code> is the test for one.
                        </p>
                        <div>
                            <p className="mb-1 font-medium">The two optimisations</p>
                            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                                <li>
                                    <strong>Union by rank</strong> hangs the shorter tree under the taller,
                                    so a merge never deepens the tall one.
                                </li>
                                <li>
                                    <strong>Path compression</strong> re-points everything on a find path
                                    straight at the root, so the next find is one hop.
                                </li>
                            </ul>
                        </div>
                        <p>
                            Turn both off and union <code className="font-mono">1+0</code>,{" "}
                            <code className="font-mono">2+1</code>, <code className="font-mono">3+2</code>{" "}
                            in turn: the tree degenerates into a path and every find walks the whole thing.
                            That worst case is why the optimisations exist. Turn them on and the same
                            sequence stays one level deep.
                        </p>
                        <p>
                            <strong>Complexity:</strong> with both, m operations on n elements cost
                            O(m·α(n)), where α is the inverse Ackermann function — below 5 for any n that
                            fits in this universe, so effectively constant per operation.
                        </p>
                        <p className="text-muted-foreground">
                            Kruskal&apos;s minimum spanning tree algorithm is the classic use: it needs
                            exactly this to tell whether adding an edge would close a cycle.
                        </p>
                    </CardContent>
                </Card>
            }
        />
    )
}
