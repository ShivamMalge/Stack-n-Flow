"use client"

import type React from "react"
import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"
import AnimationControls from "@/components/ui/animation-controls"
import { useAnimationPlayer, type AnimationFrame } from "@/hooks/useAnimationPlayer"
import CodePanel from "@/components/ui/code-panel"
import { resolveState, STATE_SHAPE, STATE_SWATCH } from "@/lib/visualizer-states"
import VisualizerLayout from "@/components/visualizers/visualizer-layout"

const BFS_CODE = [
  "def bfs(graph, start):",
  "    queue = [start]",
  "    visited = {start}",
  "    while queue:",
  "        u = queue.pop(0)",
  "        visit(u)",
  "        for v in graph.neighbors(u):",
  "            if v not in visited:",
  "                visited.add(v)",
  "                queue.append(v)"
]

const DFS_CODE = [
  "def dfs(graph, start):",
  "    stack = [start]",
  "    visited = {start}",
  "    while stack:",
  "        u = stack.pop()",
  "        visit(u)",
  "        for v in graph.neighbors(u):",
  "            if v not in visited:",
  "                visited.add(v)",
  "                stack.append(v)"
]

type GraphNode = {
  id: string
  label: string
  x: number
  y: number
  highlighted?: boolean
  isNew?: boolean
  visited?: boolean
}

type Edge = {
  id: string
  source: string
  target: string
  highlighted?: boolean
  isNew?: boolean
}

// Canvas dimensions the node coordinates below are expressed in; must match the
// <svg> viewBox further down.
const CANVAS_WIDTH = 500
const CANVAS_HEIGHT = 300
const NODE_MARGIN = 50
/** Radius of the rendered node circle; also the drag clamp inset. */
const NODE_RADIUS = 20

/** Keeps a dragged coordinate inside the canvas so a node can never be lost. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Starting graph, laid out to show a branch and a re-join. */
const SAMPLE_GRAPH: { nodes: GraphNode[]; edges: Edge[] } = {
  nodes: [
    { id: "A", label: "A", x: 100, y: 100 },
    { id: "B", label: "B", x: 250, y: 50 },
    { id: "C", label: "C", x: 250, y: 150 },
    { id: "D", label: "D", x: 400, y: 100 },
    { id: "E", label: "E", x: 400, y: 200 },
  ],
  edges: [
    { id: "A-B", source: "A", target: "B" },
    { id: "A-C", source: "A", target: "C" },
    { id: "B-D", source: "B", target: "D" },
    { id: "C-D", source: "C", target: "D" },
    { id: "C-E", source: "C", target: "E" },
  ],
}

/** Centre-to-centre spacing for placed nodes: the diameter plus breathing room. */
const NODE_SPACING = NODE_RADIUS * 2 + 16

/**
 * Places a new node on a lattice inside the canvas.
 *
 * Two earlier attempts failed: random coordinates let nodes land outside the
 * viewBox, and a single ellipse put successive golden-angle nodes ~26px apart on
 * its narrow side — an overlap for 40px nodes by the ninth addition. A spiral was
 * no better, because 500x300 simply cannot hold twenty 40px nodes on a curve.
 * A lattice can: it guarantees NODE_SPACING between neighbours and degrades by
 * wrapping rather than by piling up.
 */
function nextNodePosition(index: number): { x: number; y: number } {
  const columns = Math.max(1, Math.floor((CANVAS_WIDTH - NODE_RADIUS * 2) / NODE_SPACING) + 1)
  const rows = Math.max(1, Math.floor((CANVAS_HEIGHT - NODE_RADIUS * 2) / NODE_SPACING) + 1)

  // Wrap once every slot is used; the clamp keeps even that on canvas.
  const slot = index % (columns * rows)
  const column = slot % columns
  const row = Math.floor(slot / columns)

  const usedWidth = (columns - 1) * NODE_SPACING
  const usedHeight = (rows - 1) * NODE_SPACING

  return {
    x: clamp(
      (CANVAS_WIDTH - usedWidth) / 2 + column * NODE_SPACING,
      NODE_RADIUS,
      CANVAS_WIDTH - NODE_RADIUS
    ),
    y: clamp(
      (CANVAS_HEIGHT - usedHeight) / 2 + row * NODE_SPACING,
      NODE_RADIUS,
      CANVAS_HEIGHT - NODE_RADIUS
    ),
  }
}

type GraphFrame = {
  nodes: GraphNode[]
  edges: Edge[]
  traversalPath: string[]
  description: string
  activeLine: number | null
}

export default function GraphVisualizer({
  controlledNodes,
  controlledEdges,
}: {
  controlledNodes?: GraphNode[];
  controlledEdges?: Edge[];
} = {}) {
  const [internalNodes, setNodes] = useState<GraphNode[]>([])
  const [internalEdges, setEdges] = useState<Edge[]>([])
  const nodes = controlledNodes !== undefined ? controlledNodes : internalNodes;
  const edges = controlledEdges !== undefined ? controlledEdges : internalEdges;

  /*
    Every node is drawn from a finite pair of coordinates, even when it did not
    arrive with one.

    Pratyaksha's `Graph.add_node(label, x, y)` types both coordinates as `Any`,
    so a notebook can hand us None, a string, or nothing at all. That reached the
    svg as transform="translate(undefined, undefined)", which the browser rejects
    outright: the node and its edges vanished, with an error only visible in a
    console no notebook user opens. Falling back to a ring placement keeps the
    graph readable and leaves the node draggable.
  */
  const drawn = useMemo(() => {
    const usable = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value)
    const radius = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 2 - NODE_RADIUS * 2
    return nodes.map((node, index) => {
      if (usable(node.x) && usable(node.y)) return node
      const angle = (index / Math.max(nodes.length, 1)) * Math.PI * 2
      return {
        ...node,
        x: usable(node.x) ? node.x : CANVAS_WIDTH / 2 + radius * Math.cos(angle),
        y: usable(node.y) ? node.y : CANVAS_HEIGHT / 2 + radius * Math.sin(angle),
      }
    })
  }, [nodes])
  const [sourceNode, setSourceNode] = useState("")
  const [targetNode, setTargetNode] = useState("")
  const [nodeLabel, setNodeLabel] = useState("")
  const [operation, setOperation] = useState("addNode")
  const [isAdding, setIsAdding] = useState(false)
  const [traversalPath, setTraversalPath] = useState<string[]>([])
  const [traversalType, setTraversalType] = useState("bfs")
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [steps, setSteps] = useState<string[]>([])
  const [activeCode, setActiveCode] = useState<string[]>([])
  const [activeLine, setActiveLine] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const onFrameChange = useCallback((snap: GraphFrame) => {
    setNodes(snap.nodes)
    setEdges(snap.edges)
    setTraversalPath(snap.traversalPath)
    setActiveLine(snap.activeLine)
  }, [])

  const player = useAnimationPlayer<GraphFrame>(onFrameChange)

  useEffect(() => {
    setNodes(SAMPLE_GRAPH.nodes.map((node) => ({ ...node })))
    setEdges(SAMPLE_GRAPH.edges.map((edge) => ({ ...edge })))
  }, [])

  const handleAddNode = () => {
    if (!nodeLabel || isAdding || player.isPlaying) return
    setIsAdding(true)
    const { x, y } = nextNodePosition(nodes.length)
    const newNode: GraphNode = { id: nodeLabel, label: nodeLabel, x, y, isNew: true }
    setNodes((prev) => [...prev, newNode])
    setTimeout(() => {
      setNodes((prev) => prev.map((n) => n.id === newNode.id ? { ...n, isNew: false } : n))
      setIsAdding(false)
    }, 800)
    setNodeLabel("")
  }

  const handleAddEdge = () => {
    if (!sourceNode || !targetNode || isAdding || player.isPlaying) return
    const src = nodes.find((n) => n.id === sourceNode)
    const tgt = nodes.find((n) => n.id === targetNode)
    if (!src || !tgt) return
    if (edges.some((e) => (e.source === sourceNode && e.target === targetNode) || (e.source === targetNode && e.target === sourceNode))) return
    setIsAdding(true)
    const newEdge: Edge = { id: `${sourceNode}-${targetNode}`, source: sourceNode, target: targetNode, isNew: true }
    setEdges((prev) => [...prev, newEdge])
    setTimeout(() => {
      setEdges((prev) => prev.map((e) => e.id === newEdge.id ? { ...e, isNew: false } : e))
      setIsAdding(false)
    }, 800)
    setSourceNode(""); setTargetNode("")
  }

  const handleTraversal = () => {
    if (player.isPlaying || !selectedNode || nodes.length === 0) return

    // Build adjacency list from current nodes/edges
    const adjList: Record<string, string[]> = {}
    nodes.forEach((n) => { adjList[n.id] = [] })
    edges.forEach((e) => {
      adjList[e.source]?.push(e.target)
      adjList[e.target]?.push(e.source)
    })

    const frames: AnimationFrame<GraphFrame>[] = []
    const allSteps: string[] = []
    const cleanNodes = nodes.map((n) => ({ ...n, highlighted: false, visited: false }))
    const cleanEdges = edges.map((e) => ({ ...e, highlighted: false }))

    const snap = (ns: GraphNode[], es: Edge[], path: string[], desc: string, activeLine: number | null) =>
      frames.push({
        snapshot: {
          nodes: ns.map((n) => ({ ...n })),
          edges: es.map((e) => ({ ...e })),
          traversalPath: [...path],
          description: desc,
          activeLine: activeLine,
        },
        description: desc,
      })

    if (traversalType === "bfs") {
      allSteps.push(`BFS starting from node ${selectedNode}`)
      setActiveCode(BFS_CODE)
      const ns = cleanNodes.map((n) => ({ ...n }))
      const es = cleanEdges.map((e) => ({ ...e }))
      const visited: Set<string> = new Set([selectedNode])
      const queue = [selectedNode]
      const path: string[] = []

      snap(ns, es, path, `BFS: initializing queue with start node ${selectedNode}`, 1)

      while (queue.length > 0) {
        const current = queue.shift()!
        path.push(current)
        allSteps.push(`Visiting node ${current}`)

        ns.forEach((n) => {
          n.highlighted = n.id === current
          n.visited = visited.has(n.id)
        })
        snap(ns, es, path, `Visiting node ${current} (queue: [${queue.join(", ")}])`, 3)

        for (const neighbor of (adjList[current] || [])) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor)
            queue.push(neighbor)
            allSteps.push(`Discovered neighbor ${neighbor} from ${current}, added to queue`)

            es.forEach((e) => {
              if ((e.source === current && e.target === neighbor) || (e.source === neighbor && e.target === current)) {
                e.highlighted = true
              }
            })
            ns.forEach((n) => { if (n.id === neighbor) n.visited = true })
            snap(ns, es, path, `Discovered ${neighbor} from ${current}, added to queue`, 8)
          }
        }
      }

      ns.forEach((n) => { n.highlighted = false })
      snap(ns, es, path, `BFS complete! Order: ${path.join(" → ")}`, null)
      allSteps.push(`BFS complete! Order: ${path.join(" → ")}`)

    } else {
      // DFS — iterative using a stack so we can pre-compute frames
      allSteps.push(`DFS starting from node ${selectedNode}`)
      setActiveCode(DFS_CODE)
      const ns = cleanNodes.map((n) => ({ ...n }))
      const es = cleanEdges.map((e) => ({ ...e }))
      const visited: Set<string> = new Set()
      const stack = [selectedNode]
      const path: string[] = []

      snap(ns, es, path, `DFS: initializing stack with start node ${selectedNode}`, 1)

      while (stack.length > 0) {
        const current = stack.pop()!
        if (visited.has(current)) continue
        visited.add(current)
        path.push(current)
        allSteps.push(`Visiting node ${current}`)

        ns.forEach((n) => { n.highlighted = n.id === current; n.visited = visited.has(n.id) })
        snap(ns, es, path, `Visiting node ${current} (stack: [${stack.join(", ")}])`, 3)

        const neighbors = [...(adjList[current] || [])].reverse()
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            stack.push(neighbor)
            es.forEach((e) => {
              if ((e.source === current && e.target === neighbor) || (e.source === neighbor && e.target === current)) {
                e.highlighted = true
              }
            })
            allSteps.push(`Neighbor ${neighbor} pushed to stack`)
            snap(ns, es, path, `Neighbor ${neighbor} pushed to stack`, 8)
          }
        }
      }

      ns.forEach((n) => { n.highlighted = false })
      snap(ns, es, path, `DFS complete! Order: ${path.join(" → ")}`, null)
      allSteps.push(`DFS complete! Order: ${path.join(" → ")}`)
    }

    setSteps(allSteps)
    player.loadFrames(frames)
    setTimeout(() => player.play(), 50)
  }

  const handleNodeClick = (nodeId: string) => {
    if (player.isPlaying) return
    setSelectedNode(nodeId)
  }

  const handleNodeDrag = (event: React.MouseEvent, nodeId: string) => {
    if (player.isPlaying) return
    const startX = event.clientX, startY = event.clientY
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return
    const startNodeX = node.x, startNodeY = node.y

    // The svg is drawn in viewBox units but rendered at whatever width the column
    // allows, so client-space deltas have to be divided by that scale or the node
    // trails the cursor. Coordinates are then clamped to the canvas so a node can
    // never be dragged out of sight (there is no pan or view reset here).
    const renderedWidth = svgRef.current?.getBoundingClientRect().width ?? 0
    const scale = renderedWidth > 0 ? renderedWidth / CANVAS_WIDTH : 1

    const onMove = (e: MouseEvent) => {
      const dx = (e.clientX - startX) / scale, dy = (e.clientY - startY) / scale
      setNodes((prev) => prev.map((n) => n.id === nodeId ? {
        ...n,
        x: clamp(startNodeX + dx, NODE_RADIUS, CANVAS_WIDTH - NODE_RADIUS),
        y: clamp(startNodeY + dy, NODE_RADIUS, CANVAS_HEIGHT - NODE_RADIUS),
      } : n))
    }
    const onUp = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp) }
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
  }

  const visibleStep = player.currentFrame

  return (
    <VisualizerLayout
      controls={
        <Card>
          <CardHeader>
            <CardTitle>Graph Operations</CardTitle>
            <CardDescription>Add nodes, edges, and traverse the graph</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={operation} onValueChange={setOperation}>
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="addNode">Add Node</TabsTrigger>
                <TabsTrigger value="addEdge">Add Edge</TabsTrigger>
              </TabsList>

              {operation === "addNode" && (
                <div className="flex space-x-2 mt-4">
                  <Input
                    placeholder="Node Label (e.g., F)"
                    value={nodeLabel}
                    onChange={(e) => setNodeLabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddNode()}
                    disabled={isAdding || player.isPlaying}
                    maxLength={2}
                  />
                  <Button onClick={handleAddNode} disabled={isAdding || player.isPlaying}>
                    <Plus className="mr-2 h-4 w-4" /> Add
                  </Button>
                </div>
              )}

              {operation === "addEdge" && (
                <div className="space-y-4 mt-4">
                  <div className="flex space-x-2">
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={sourceNode} onChange={(e) => setSourceNode(e.target.value)}
                      disabled={isAdding || player.isPlaying}
                    >
                      <option value="">Source Node</option>
                      {nodes.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
                    </select>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={targetNode} onChange={(e) => setTargetNode(e.target.value)}
                      disabled={isAdding || player.isPlaying}
                    >
                      <option value="">Target Node</option>
                      {nodes.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
                    </select>
                  </div>
                  <Button onClick={handleAddEdge} disabled={isAdding || player.isPlaying} className="w-full">
                    <Plus className="mr-2 h-4 w-4" /> Add Edge
                  </Button>
                </div>
              )}
            </Tabs>

            <div className="mt-6 border-t pt-4 space-y-3">
              <h4 className="text-sm font-medium">Graph Traversal</h4>
              <div className="flex space-x-2 items-center">
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={traversalType} onChange={(e) => setTraversalType(e.target.value)}
                  disabled={player.isPlaying}
                >
                  <option value="bfs">Breadth-First Search (BFS)</option>
                  <option value="dfs">Depth-First Search (DFS)</option>
                </select>
                <Button onClick={handleTraversal} disabled={player.isPlaying || !selectedNode} variant="outline">
                  Traverse
                </Button>
              </div>

              {selectedNode && (
                <p className="text-sm"><span className="font-medium">Start node:</span> {selectedNode}</p>
              )}
              {!selectedNode && (
                <p className="text-xs text-muted-foreground">Click a node in the graph to select it as the start</p>
              )}

              {player.totalFrames > 0 && (
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
                  onReset={() => { player.reset(); setNodes((prev) => prev.map((n) => ({ ...n, highlighted: false, visited: false }))); setEdges((prev) => prev.map((e) => ({ ...e, highlighted: false }))); setTraversalPath([]); setActiveLine(null) }}
                  onSpeedChange={player.setSpeed}
                  onFrameChange={player.goToFrame}
                />
              )}

              {traversalPath.length > 0 && (
                <p className="text-sm font-medium">
                  Path: <span className="text-primary">{traversalPath.join(" → ")}</span>
                </p>
              )}
            </div>

            {/* Steps panel */}
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Algorithm Steps:</h3>
              <div className="bg-muted/30 rounded-md p-3 h-40 overflow-y-auto">
                {steps.length > 0 ? (
                  <ol className="space-y-1 pl-5 list-decimal">
                    {steps.map((step, i) => (
                      <li key={i} className={`text-sm transition-colors ${i <= visibleStep ? "text-foreground" : "text-muted-foreground"}`}>
                        {step}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    1. Click a node to select starting point
                    <br />2. Choose BFS or DFS
                    <br />3. Click Traverse and use the controls to step through
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      }
      visualization={
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Visualization</CardTitle>
            <CardDescription>Visual representation of the graph — drag nodes to reposition</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden flex flex-col">
            {/* No flex centring: centring a 500px svg inside a narrower scroll
                container hides the overflow on both sides where it cannot be
                scrolled to. `m-auto` centres it only when it already fits. */}
            <div className="flex min-h-[300px] py-4 bg-muted/5 border-t overflow-auto">
              <svg ref={svgRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`} className="m-auto shrink-0 max-w-none md:max-w-full">
                {edges.map((edge) => {
                  const src = drawn.find((n) => n.id === edge.source)
                  const tgt = drawn.find((n) => n.id === edge.target)
                  if (!src || !tgt) return null
                  return (
                    <line key={edge.id}
                      x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                      className={`stroke-current stroke-[2] transition-all duration-300
                        ${edge.highlighted ? "stroke-yellow-500 stroke-[3]" : "stroke-muted-foreground"}
                        ${edge.isNew ? "stroke-green-500 stroke-[3]" : ""}
                      `}
                    />
                  )
                })}
                {drawn.map((node) => (
                  <g key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onMouseDown={(e) => handleNodeDrag(e, node.id)}
                    onClick={() => handleNodeClick(node.id)}
                    className="cursor-pointer"
                  >
                    <circle r={NODE_RADIUS} className={`
                      transition-all duration-300 ease-in-out
                      ${node.isNew || node.id === selectedNode ? "" : "stroke-[2]"}
                      ${STATE_SHAPE[resolveState({
                        comparing: node.highlighted,
                        inserted: node.isNew,
                        visited: node.visited,
                      })]}
                      ${node.id === selectedNode ? "stroke-blue-500 stroke-[3]" : ""}
                    `} />
                    <text textAnchor="middle" dominantBaseline="middle" className="text-sm font-medium fill-current select-none pointer-events-none">
                      {node.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
            {/* Current frame description */}
            {player.currentDescription && (
              <p className="text-center text-xs md:text-sm font-medium text-primary mt-2 px-4 py-2 bg-muted/30 border-t">{player.currentDescription}</p>
            )}
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 p-4 text-xs md:text-xs border-t">
              {[
                // Swatches come from the shared map so the legend cannot drift
                // from the nodes it describes. "fill-card" here was a bug: that
                // is an SVG utility and did nothing to a div.
                [STATE_SWATCH.default, "Unvisited"],
                [STATE_SWATCH.comparing, "Current"],
                [STATE_SWATCH.visited, "Visited"],
                ["bg-card border-2 border-blue-500", "Start Node"],
              ].map(([cls, label]) => (
                <div key={label} className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-border bg-background">
                  <div className={`w-2.5 h-2.5 rounded-full ${cls}`} />
                  <span className="text-muted-foreground whitespace-nowrap">{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      }
      code={
        <CodePanel
          code={activeCode}
          activeLine={activeLine}
          title={activeCode === BFS_CODE ? "BFS Algorithm" : activeCode === DFS_CODE ? "DFS Algorithm" : "Graph Algorithm"}
        />
      }
    />
  )
}
