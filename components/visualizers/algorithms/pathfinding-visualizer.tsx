"use client"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AnimationControls from "@/components/ui/animation-controls"
import { useAnimationPlayer, type AnimationFrame } from "@/hooks/useAnimationPlayer"

// ── Types ──────────────────────────────────────────────────────────────────

type CellType = "empty" | "wall" | "start" | "end"
type CellState = "unvisited" | "open" | "closed" | "path" | "current"

type Cell = {
    row: number; col: number
    type: CellType; state: CellState
    dist: number; f: number; g: number; h: number
    parent: [number, number] | null
}

type GridFrame = {
    grid: Cell[][]
    stepDescription: string
}

const ROWS = 15; const COLS = 25

function createGrid(): Cell[][] {
    return Array.from({ length: ROWS }, (_, r) =>
        Array.from({ length: COLS }, (_, c) => ({
            row: r, col: c, type: "empty" as CellType, state: "unvisited" as CellState,
            dist: Infinity, f: Infinity, g: Infinity, h: 0, parent: null,
        }))
    )
}

function cloneGrid(g: Cell[][]): Cell[][] {
    return g.map((row) => row.map((cell) => ({ ...cell })))
}

function manhattanH(r: number, c: number, er: number, ec: number) {
    return Math.abs(r - er) + Math.abs(c - ec)
}

const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const

function generateDijkstra(grid: Cell[][], startR: number, startC: number, endR: number, endC: number): AnimationFrame<GridFrame>[] {
    const frames: AnimationFrame<GridFrame>[] = []
    const g = cloneGrid(grid)

    g[startR][startC].dist = 0
    g[startR][startC].type = "start"
    g[endR][endC].type = "end"

    const visited = new Set<string>()
    const pq: [number, number, number][] = [[0, startR, startC]] // [dist, row, col]

    frames.push({ snapshot: { grid: cloneGrid(g), stepDescription: `Dijkstra: Start at (${startR},${startC}), End at (${endR},${endC})` }, description: "Initialize" })

    while (pq.length > 0) {
        pq.sort((a, b) => a[0] - b[0])
        const [d, r, c] = pq.shift()!
        const key = `${r},${c}`
        if (visited.has(key)) continue
        visited.add(key)

        if (g[r][c].type !== "start" && g[r][c].type !== "end") g[r][c].state = "current"
        frames.push({ snapshot: { grid: cloneGrid(g), stepDescription: `Visiting (${r},${c}) dist=${d}` }, description: `Visit (${r},${c})` })

        if (r === endR && c === endC) break

        if (g[r][c].type !== "start") g[r][c].state = "closed"

        for (const [dr, dc] of DIRS) {
            const nr = r + dr; const nc = c + dc
            if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue
            if (g[nr][nc].type === "wall" || visited.has(`${nr},${nc}`)) continue
            const nd = d + 1
            if (nd < g[nr][nc].dist) {
                g[nr][nc].dist = nd
                g[nr][nc].parent = [r, c]
                if (g[nr][nc].type !== "end") g[nr][nc].state = "open"
                pq.push([nd, nr, nc])
            }
        }
    }

    // Trace path
    if (g[endR][endC].parent) {
        let traceR = endR; let traceC = endC
        while (true) {
            if (g[traceR][traceC].type !== "start" && g[traceR][traceC].type !== "end") g[traceR][traceC].state = "path"
            const p: [number, number] | null = g[traceR][traceC].parent
            if (!p) break
            traceR = p[0]; traceC = p[1]
        }
        const pathLen = g[endR][endC].dist
        frames.push({ snapshot: { grid: cloneGrid(g), stepDescription: `Path found! Length = ${pathLen} steps` }, description: `Done! Path = ${pathLen} steps` })
    } else {
        frames.push({ snapshot: { grid: cloneGrid(g), stepDescription: "No path found!" }, description: "No path" })
    }

    return frames
}

function generateAStar(grid: Cell[][], startR: number, startC: number, endR: number, endC: number): AnimationFrame<GridFrame>[] {
    const frames: AnimationFrame<GridFrame>[] = []
    const g = cloneGrid(grid)

    g[startR][startC].type = "start"; g[endR][endC].type = "end"
    g[startR][startC].g = 0
    g[startR][startC].h = manhattanH(startR, startC, endR, endC)
    g[startR][startC].f = g[startR][startC].h

    const open = new Set<string>([`${startR},${startC}`])
    const closed = new Set<string>()

    frames.push({ snapshot: { grid: cloneGrid(g), stepDescription: `A*: Start (${startR},${startC}), End (${endR},${endC}), Heuristic = Manhattan` }, description: "Initialize" })

    while (open.size > 0) {
        // Find lowest f in open
        let bestKey = ""; let bestF = Infinity
        for (const k of open) {
            const [r, c] = k.split(",").map(Number)
            if (g[r][c].f < bestF) { bestF = g[r][c].f; bestKey = k }
        }
        const [r, c] = bestKey.split(",").map(Number)
        open.delete(bestKey); closed.add(bestKey)

        if (g[r][c].type !== "start" && g[r][c].type !== "end") g[r][c].state = "current"
        frames.push({ snapshot: { grid: cloneGrid(g), stepDescription: `Visiting (${r},${c}) f=${g[r][c].f.toFixed(0)} g=${g[r][c].g} h=${g[r][c].h}` }, description: `Visit (${r},${c})` })

        if (r === endR && c === endC) break

        if (g[r][c].type !== "start") g[r][c].state = "closed"

        for (const [dr, dc] of DIRS) {
            const nr = r + dr; const nc = c + dc
            if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue
            if (g[nr][nc].type === "wall" || closed.has(`${nr},${nc}`)) continue
            const ng = g[r][c].g + 1
            const nh = manhattanH(nr, nc, endR, endC)
            const nf = ng + nh
            const nk = `${nr},${nc}`
            if (!open.has(nk) || nf < g[nr][nc].f) {
                g[nr][nc].g = ng; g[nr][nc].h = nh; g[nr][nc].f = nf
                g[nr][nc].parent = [r, c]
                if (g[nr][nc].type !== "end") g[nr][nc].state = "open"
                open.add(nk)
            }
        }
    }

    if (g[endR][endC].parent) {
        let traceR = endR; let traceC = endC
        while (true) {
            if (g[traceR][traceC].type !== "start" && g[traceR][traceC].type !== "end") g[traceR][traceC].state = "path"
            const p: [number, number] | null = g[traceR][traceC].parent
            if (!p) break
            traceR = p[0]; traceC = p[1]
        }
        const pathLen = g[endR][endC].g
        frames.push({ snapshot: { grid: cloneGrid(g), stepDescription: `Path found! Length = ${pathLen} steps (A* explored fewer nodes than Dijkstra)` }, description: `Done! Path = ${pathLen}` })
    } else {
        frames.push({ snapshot: { grid: cloneGrid(g), stepDescription: "No path found!" }, description: "No path" })
    }

    return frames
}

// ── Cell colors ─────────────────────────────────────────────────────────────

function cellClass(cell: Cell) {
    if (cell.type === "wall") return "bg-foreground/80"
    if (cell.type === "start") return "bg-green-500"
    if (cell.type === "end") return "bg-red-500"
    switch (cell.state) {
        case "current": return "bg-yellow-400 dark:bg-yellow-500"
        case "open": return "bg-blue-300 dark:bg-blue-600"
        case "closed": return "bg-blue-100 dark:bg-blue-900/60"
        case "path": return "bg-yellow-300 dark:bg-yellow-400"
        default: return "bg-muted/30 hover:bg-muted/60"
    }
}

// ── Main Component ──────────────────────────────────────────────────────────

type DrawMode = "wall" | "start" | "end" | "erase"
type Algorithm = "dijkstra" | "astar"

export default function PathfindingVisualizer() {
    const [grid, setGrid] = useState<Cell[][]>(createGrid)
    const [displayGrid, setDisplayGrid] = useState<Cell[][]>(createGrid)
    const [drawMode, setDrawMode] = useState<DrawMode>("wall")
    const [algorithm, setAlgorithm] = useState<Algorithm>("dijkstra")
    const [start, setStart] = useState<[number, number] | null>(null)
    const [end, setEnd] = useState<[number, number] | null>(null)
    const [steps, setSteps] = useState<string[]>([])
    const isDrawing = useRef(false)

    const onFrameChange = useCallback((snap: GridFrame) => {
        setDisplayGrid(snap.grid)
    }, [])
    const player = useAnimationPlayer<GridFrame>(onFrameChange)

    const applyCell = (g: Cell[][], r: number, c: number, mode: DrawMode) => {
        const ng = cloneGrid(g)
        if (mode === "wall") { if (ng[r][c].type === "empty") ng[r][c].type = "wall" }
        else if (mode === "erase") { ng[r][c].type = "empty"; ng[r][c].state = "unvisited" }
        else if (mode === "start") {
            // Clear previous start
            ng.forEach((row) => row.forEach((c2) => { if (c2.type === "start") c2.type = "empty" }))
            ng[r][c].type = "start"
            setStart([r, c])
        } else if (mode === "end") {
            ng.forEach((row) => row.forEach((c2) => { if (c2.type === "end") c2.type = "empty" }))
            ng[r][c].type = "end"
            setEnd([r, c])
        }
        return ng
    }

    const handleCellMouseDown = (r: number, c: number) => {
        if (player.isPlaying) return
        isDrawing.current = true
        const ng = applyCell(grid, r, c, drawMode)
        setGrid(ng); setDisplayGrid(ng)
    }
    const handleCellMouseEnter = (r: number, c: number) => {
        if (!isDrawing.current || player.isPlaying) return
        if (drawMode === "start" || drawMode === "end") return
        const ng = applyCell(grid, r, c, drawMode)
        setGrid(ng); setDisplayGrid(ng)
    }
    const handleMouseUp = () => { isDrawing.current = false }

    const handleRun = () => {
        if (!start || !end) return
        const frames = algorithm === "dijkstra"
            ? generateDijkstra(grid, start[0], start[1], end[0], end[1])
            : generateAStar(grid, start[0], start[1], end[0], end[1])
        setSteps(frames.map((f) => f.description))
        player.loadFrames(frames)
        setTimeout(() => player.play(), 50)
    }

    const handleClear = () => {
        if (player.isPlaying) return
        const ng = createGrid()
        setGrid(ng); setDisplayGrid(ng)
        setStart(null); setEnd(null)
        setSteps([]); player.clear()
    }

    const handleClearPath = () => {
        if (player.isPlaying) return
        const ng = cloneGrid(grid)
        ng.forEach((row) => row.forEach((c) => { if (c.type === "empty") c.state = "unvisited" }))
        setGrid(ng); setDisplayGrid(ng)
        setSteps([]); player.clear()
    }

    const handleGenerateMaze = () => {
        if (player.isPlaying) return
        const ng = createGrid()
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (Math.random() < 0.28) ng[r][c].type = "wall"
            }
        }
        setGrid(ng); setDisplayGrid(ng)
        setStart(null); setEnd(null)
        setSteps([]); player.clear()
    }

    const gToShow = player.currentSnapshot?.grid ?? displayGrid
    const stepDesc = player.currentSnapshot?.stepDescription ?? ""

    return (
        <div className="space-y-4">
            {/* Algorithm + Draw Controls */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>🗺️ Pathfinding Visualizer</CardTitle>
                    <CardDescription>Draw walls, place start/end, then run Dijkstra or A*</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2 items-center">
                        {/* Algorithm */}
                        <div className="flex gap-1">
                            {(["dijkstra", "astar"] as Algorithm[]).map((a) => (
                                <Button key={a} size="sm" variant={algorithm === a ? "default" : "outline"}
                                    onClick={() => setAlgorithm(a)} disabled={player.isPlaying}>
                                    {a === "dijkstra" ? "Dijkstra" : "A*"}
                                </Button>
                            ))}
                        </div>

                        {/* Draw modes */}
                        <div className="flex gap-1 ml-2">
                            {(["wall", "start", "end", "erase"] as DrawMode[]).map((m) => (
                                <Button key={m} size="sm"
                                    variant={drawMode === m ? "secondary" : "outline"}
                                    onClick={() => setDrawMode(m)}
                                    className={m === "start" ? "text-green-500" : m === "end" ? "text-red-500" : ""}>
                                    {m === "wall" ? "🧱 Wall" : m === "start" ? "🟢 Start" : m === "end" ? "🔴 End" : "✏️ Erase"}
                                </Button>
                            ))}
                        </div>

                        <Button size="sm" onClick={handleGenerateMaze} disabled={player.isPlaying} variant="outline">🎲 Random Maze</Button>
                        <Button size="sm" onClick={handleClearPath} disabled={player.isPlaying} variant="outline">Clear Path</Button>
                        <Button size="sm" onClick={handleClear} disabled={player.isPlaying} variant="ghost">Reset</Button>
                    </div>

                    <div className="flex gap-2 items-center">
                        <Button onClick={handleRun} disabled={!start || !end || player.isPlaying} className="flex-1">
                            {algorithm === "dijkstra" ? "Run Dijkstra" : "Run A*"}
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
                    </div>

                    {stepDesc && <p className="text-xs text-center text-muted-foreground bg-muted/30 p-2 rounded-md">{stepDesc}</p>}
                    {!start && <p className="text-xs text-muted-foreground text-center">Select "Start" mode and click a cell to place the start node</p>}
                    {start && !end && <p className="text-xs text-muted-foreground text-center">Select "End" mode and click a cell to place the end node</p>}
                </CardContent>
            </Card>

            {/* Grid */}
            <Card>
                <CardContent className="pt-4">
                    <div
                        className="inline-grid border border-border rounded overflow-hidden select-none cursor-crosshair"
                        style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, display: "grid" }}
                        onMouseLeave={handleMouseUp}
                        onMouseUp={handleMouseUp}
                    >
                        {gToShow.map((row) =>
                            row.map((cell) => (
                                <div
                                    key={`${cell.row}-${cell.col}`}
                                    className={`w-5 h-5 border-[0.5px] border-border/30 transition-colors duration-75 ${cellClass(cell)}`}
                                    onMouseDown={() => handleCellMouseDown(cell.row, cell.col)}
                                    onMouseEnter={() => handleCellMouseEnter(cell.row, cell.col)}
                                />
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Legend + Steps side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Legend</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            {([["bg-green-500", "Start"], ["bg-red-500", "End"], ["bg-foreground/80", "Wall"], ["bg-yellow-400 dark:bg-yellow-500", "Current"], ["bg-blue-300 dark:bg-blue-600", "Open (frontier)"], ["bg-blue-100 dark:bg-blue-900/60", "Closed (visited)"], ["bg-yellow-300 dark:bg-yellow-400", "Shortest Path"]] as const).map(([cls, label]) => (
                                <div key={label} className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded-sm ${cls} border border-border/50`} />
                                    <span className="text-muted-foreground">{label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 text-[10px] text-muted-foreground space-y-1">
                            <p><strong>Dijkstra:</strong> guarantees shortest path, explores all directions uniformly</p>
                            <p><strong>A*:</strong> uses Manhattan heuristic to guide search toward goal, faster in practice</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Algorithm Steps</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-40 overflow-y-auto">
                            {steps.length > 0 ? (
                                <div className="space-y-0.5">
                                    {steps.map((s, i) => (
                                        <div key={i} className={`text-xs flex gap-1.5 ${i <= player.currentFrame ? "text-foreground" : "text-muted-foreground"}`}>
                                            <span className="shrink-0 font-mono">{i + 1}.</span>
                                            <span>{s}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground">Run an algorithm to see steps</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
