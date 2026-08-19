"use client"

import { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Eraser, Play, Sparkles } from "lucide-react"
import AnimationControls from "@/components/ui/animation-controls"
import CodePanel from "@/components/ui/code-panel"
import InlineAlert from "@/components/ui/inline-alert"
import VisualizerLayout from "@/components/visualizers/visualizer-layout"
import { useAnimationPlayer } from "@/hooks/useAnimationPlayer"
import { SPEED_PRESETS } from "@/lib/constants"
import { STATE_BOX } from "@/lib/visualizer-states"
import { FAST_TRANSPOSE, SIMPLE_TRANSPOSE } from "@/lib/templates/sparse-matrix"
import {
    buildTranspose,
    makeMatrix,
    rowChains,
    storageComparison,
    toTriples,
    type SparseSnapshot,
    type TransposeMethod,
    type TripleCell,
    MAX_DIMENSION,
    MIN_DIMENSION,
} from "@/lib/sparse-matrix"

/** The worked example this topic is usually taught with. */
const SAMPLE = [
    [15, 0, 0, 22, 0, -15],
    [0, 11, 3, 0, 0, 0],
    [0, 0, 0, -6, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [91, 0, 0, 0, 0, 0],
    [0, 0, 28, 0, 0, 0],
]

function TripleTable({ rows, title, empty }: { rows: TripleCell[]; title: string; empty: string }) {
    return (
        <div className="min-w-0 flex-1">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
            {rows.length === 0 ? (
                <p className="text-xs text-muted-foreground">{empty}</p>
            ) : (
                <div className="overflow-auto max-h-56">
                    <table className="w-full font-mono text-xs">
                        <thead className="sticky top-0 bg-card">
                            <tr className="text-muted-foreground">
                                <th className="px-1 py-0.5 text-left font-medium">#</th>
                                <th className="px-1 py-0.5 text-right font-medium">row</th>
                                <th className="px-1 py-0.5 text-right font-medium">col</th>
                                <th className="px-1 py-0.5 text-right font-medium">value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((t, i) => (
                                <tr key={i} className={`transition-all duration-300 ${STATE_BOX[t.state]} border-b border-border/40`}>
                                    <td className="px-1 py-0.5 text-muted-foreground">{i}</td>
                                    <td className="px-1 py-0.5 text-right">{t.row}</td>
                                    <td className="px-1 py-0.5 text-right">{t.col}</td>
                                    <td className="px-1 py-0.5 text-right font-bold">{t.value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default function SparseMatrixVisualizer() {
    const [matrix, setMatrix] = useState<number[][]>(() => SAMPLE.map((r) => [...r]))
    const [fillValue, setFillValue] = useState("7")
    const [method, setMethod] = useState<TransposeMethod>("simple")
    const [view, setView] = useState<"triples" | "linked">("triples")
    const [error, setError] = useState<string | null>(null)

    const onFrameChange = useCallback(() => { }, [])
    const player = useAnimationPlayer<SparseSnapshot>(onFrameChange)

    const rows = matrix.length
    const cols = matrix[0]?.length ?? 0
    const triples = useMemo(() => toTriples(matrix), [matrix])
    const storage = storageComparison(rows, cols, triples.length)

    const snapshot = player.currentSnapshot
    const sourceCells: TripleCell[] = snapshot?.triples ?? triples.map((t) => ({ ...t, state: "default" as const }))
    const resultCells: TripleCell[] = snapshot?.result ?? []
    const inspections = snapshot?.inspections ?? 0

    const resize = (nextRows: number, nextCols: number) => {
        player.clear()
        setError(null)
        setMatrix(makeMatrix(nextRows, nextCols))
    }

    const toggleCell = (r: number, c: number) => {
        if (player.isPlaying) return
        player.clear()
        setError(null)
        const value = Number(fillValue)
        setMatrix((prev) =>
            prev.map((row, ri) =>
                ri === r ? row.map((cell, ci) => (ci === c ? (cell !== 0 ? 0 : Number.isFinite(value) ? value : 1) : cell)) : row,
            ),
        )
    }

    const run = () => {
        const outcome = buildTranspose(triples, cols, method)
        if (outcome.error) {
            setError(outcome.error)
            return
        }
        setError(null)
        player.loadFrames(outcome.frames)
        // The simple method emits a frame per inspection — that is the lesson —
        // but 6 columns over 8 terms is 64 frames, which is nearly a minute at
        // the default 800ms. Long runs start faster; the speed slider still
        // overrides, and the step controls are unaffected.
        const fast = SPEED_PRESETS[SPEED_PRESETS.length - 1].value
        player.setSpeed(outcome.frames.length > 30 ? fast : SPEED_PRESETS[1].value)
        setTimeout(() => player.play(), 50)
    }

    const chains = useMemo(() => rowChains(triples, rows), [triples, rows])

    return (
        <VisualizerLayout
            controls={
                <Card>
                    <CardHeader>
                        <CardTitle>Sparse Matrix</CardTitle>
                        <CardDescription>Click a cell to set or clear it, then transpose</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="sm-rows">Rows</Label>
                                <Input
                                    id="sm-rows" type="number" min={MIN_DIMENSION} max={MAX_DIMENSION} value={rows}
                                    onChange={(e) => {
                                        const n = Number(e.target.value)
                                        if (Number.isInteger(n) && n >= MIN_DIMENSION && n <= MAX_DIMENSION) resize(n, cols)
                                    }}
                                    disabled={player.isPlaying}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="sm-cols">Columns</Label>
                                <Input
                                    id="sm-cols" type="number" min={MIN_DIMENSION} max={MAX_DIMENSION} value={cols}
                                    onChange={(e) => {
                                        const n = Number(e.target.value)
                                        if (Number.isInteger(n) && n >= MIN_DIMENSION && n <= MAX_DIMENSION) resize(rows, n)
                                    }}
                                    disabled={player.isPlaying}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="sm-fill">Fill with</Label>
                                <Input
                                    id="sm-fill" type="number" value={fillValue}
                                    onChange={(e) => setFillValue(e.target.value)}
                                    disabled={player.isPlaying}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" disabled={player.isPlaying}
                                onClick={() => { player.clear(); setError(null); setMatrix(SAMPLE.map((r) => [...r])) }}>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Sample
                            </Button>
                            <Button variant="outline" size="sm" disabled={player.isPlaying}
                                onClick={() => resize(rows, cols)}>
                                <Eraser className="mr-2 h-4 w-4" />
                                Clear
                            </Button>
                        </div>

                        <div className="space-y-1.5 border-t pt-4">
                            <Label>Transpose method</Label>
                            <Tabs value={method} onValueChange={(v) => { setMethod(v as TransposeMethod); player.clear() }}>
                                <TabsList className="grid grid-cols-2 w-full">
                                    <TabsTrigger value="simple">Simple</TabsTrigger>
                                    <TabsTrigger value="fast">Fast</TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <Button className="w-full" onClick={run} disabled={player.isPlaying}>
                                <Play className="mr-2 h-4 w-4" />
                                Transpose
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
                                ["Terms", `${triples.length}`],
                                ["Dense", `${storage.dense}`],
                                ["Triples", `${storage.sparse}`],
                                ["Inspects", `${inspections}`],
                            ].map(([label, shown]) => (
                                <div key={label}>
                                    <p className="font-mono text-lg font-bold">{shown}</p>
                                    <p className="text-xs text-muted-foreground">{label}</p>
                                </div>
                            ))}
                        </div>

                        <p className={`text-xs ${storage.worthwhile ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                            {storage.worthwhile
                                ? `${storage.sparse} words against ${storage.dense} — the sparse form is winning.`
                                : `${storage.sparse} words against ${storage.dense} — too dense for triples to pay off.`}
                        </p>
                    </CardContent>
                </Card>
            }
            visualization={
                <Card className="flex flex-col h-full">
                    <CardHeader className="shrink-0">
                        <CardTitle>Representation</CardTitle>
                        <CardDescription>
                            {rows}x{cols} with {triples.length} non-zero term{triples.length === 1 ? "" : "s"}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-col flex-1 min-h-0 gap-4 border-t pt-4 pb-4 bg-muted/5 overflow-auto">
                        <div className="flex justify-center">
                            <table className="border-collapse">
                                <tbody>
                                    {matrix.map((row, r) => (
                                        <tr key={r}>
                                            {row.map((cell, c) => {
                                                const active = snapshot?.scanCol === c
                                                return (
                                                    <td key={c} className="p-0.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleCell(r, c)}
                                                            aria-label={`Row ${r} column ${c}, value ${cell}`}
                                                            className={`flex h-9 w-9 items-center justify-center rounded border-2 font-mono text-xs font-bold transition-all duration-300 ${cell !== 0 ? STATE_BOX.inserted : active ? STATE_BOX.comparing : "border-dashed border-border text-muted-foreground"}`}
                                                        >
                                                            {cell}
                                                        </button>
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)} className="shrink-0">
                            <TabsList className="grid grid-cols-2 w-full max-w-xs mx-auto">
                                <TabsTrigger value="triples">Triple form</TabsTrigger>
                                <TabsTrigger value="linked">Linked lists</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {view === "triples" ? (
                            <>
                                {snapshot?.rowTerms && (
                                    <div className="space-y-1 text-xs">
                                        {([["row_terms", snapshot.rowTerms], ["starting_pos", snapshot.startingPos ?? []]] as const).map(
                                            ([label, values]) => (
                                                <div key={label} className="flex items-center gap-2">
                                                    <span className="w-20 shrink-0 font-mono text-muted-foreground">{label}</span>
                                                    <div className="flex gap-1">
                                                        {values.map((v, i) => (
                                                            <span key={i} className="flex h-6 w-7 items-center justify-center rounded border font-mono">
                                                                {v}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                                <div className="flex gap-4">
                                    <TripleTable rows={sourceCells} title="Triples" empty="No non-zero terms." />
                                    <TripleTable rows={resultCells} title="Transposed" empty="Run a transpose." />
                                </div>
                            </>
                        ) : (
                            <div className="space-y-1.5">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    One chain per row, each node holding a column and a value
                                </p>
                                {chains.map((chain, r) => (
                                    <div key={r} className="flex items-center gap-1.5 text-xs">
                                        <span className="flex h-7 w-12 shrink-0 items-center justify-center rounded border-2 border-primary/50 font-mono font-bold">
                                            R{r}
                                        </span>
                                        {chain.length === 0 ? (
                                            <span className="font-mono text-muted-foreground">→ null</span>
                                        ) : (
                                            chain.map((t) => (
                                                <div key={t.col} className="flex items-center gap-1">
                                                    <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                                                    <span className={`flex h-7 items-center gap-1 rounded border-2 px-1.5 font-mono ${STATE_BOX.inserted}`}>
                                                        <span className="text-[10px] text-muted-foreground">c{t.col}</span>
                                                        <strong>{t.value}</strong>
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

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
                    template={method === "fast" ? FAST_TRANSPOSE : SIMPLE_TRANSPOSE}
                    activeStep={snapshot?.activeLine ?? null}
                />
            }
            docs={
                <Card>
                    <CardHeader>
                        <CardTitle>Learning</CardTitle>
                        <CardDescription>Storing what is mostly zero</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <p>
                            A matrix whose entries are mostly zero wastes almost all of its storage. The{" "}
                            <strong>triple representation</strong> keeps only the non-zero terms, each as
                            (row, column, value), plus a header holding the dimensions and the term count.
                        </p>
                        <p>
                            That costs three words per term against the dense form&apos;s one, so triples only
                            pay off below roughly a third density. The counters show the crossover — fill in
                            enough cells and the sparse form stops winning.
                        </p>
                        <div>
                            <p className="mb-1 font-medium">Why transpose has two algorithms</p>
                            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                                <li>
                                    The <strong>simple</strong> method sweeps all the terms once per column, so
                                    the terms come out in the right order. That is O(columns x terms) — for a
                                    matrix that is not very sparse, worse than transposing the dense matrix.
                                </li>
                                <li>
                                    The <strong>fast</strong> method counts the terms in each column first, turns
                                    those counts into starting positions with a running total, then places every
                                    term in a single pass. O(columns + terms).
                                </li>
                            </ul>
                        </div>
                        <p>
                            Run both on the sample: 8 terms and 6 columns cost 48 inspections the simple way and
                            16 the fast way, for the same answer.
                        </p>
                        <p>
                            The <strong>linked representation</strong> stores a chain per row instead of one flat
                            array. It costs more per term in pointers, but a term can be inserted or removed
                            without shifting everything after it.
                        </p>
                    </CardContent>
                </Card>
            }
        />
    )
}
