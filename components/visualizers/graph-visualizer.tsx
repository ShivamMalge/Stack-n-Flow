"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"
import AnimationControls from "@/components/ui/animation-controls"
import { useAnimationPlayer, type AnimationFrame } from "@/hooks/useAnimationPlayer"
import CodePanel from "@/components/ui/code-panel"

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

type GraphFrame = {
  nodes: GraphNode[]
  edges: Edge[]
  traversalPath: string[]
  description: string
  activeLine: number | null
}

export default function GraphVisualizer() {
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
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
    const sampleNodes: GraphNode[] = [
      { id: "A", label: "A", x: 100, y: 100 },
      { id: "B", label: "B", x: 250, y: 50 },
      { id: "C", label: "C", x: 250, y: 150 },
      { id: "D", label: "D", x: 400, y: 100 },
      { id: "E", label: "E", x: 400, y: 200 },
    ]
    const sampleEdges: Edge[] = [
      { id: "A-B", source: "A", target: "B" },
      { id: "A-C", source: "A", target: "C" },
      { id: "B-D", source: "B", target: "D" },
      { id: "C-D", source: "C", target: "D" },
      { id: "C-E", source: "C", target: "E" },
    ]
    setNodes(sampleNodes)
    setEdges(sampleEdges)
  }, [])

  const handleAddNode = () => {
    if (!nodeLabel || isAdding || player.isPlaying) return
    setIsAdding(true)
    const x = Math.random() * 300 + 100
    const y = Math.random() * 150 + 50
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

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - startX, dy = e.clientY - startY
      setNodes((prev) => prev.map((n) => n.id === nodeId ? { ...n, x: startNodeX + dx, y: startNodeY + dy } : n))
    }
    const onUp = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp) }
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
  }

  const visibleStep = player.currentFrame

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Operations Panel - Top on Mobile, Left on Desktop */}
      <div className="order-1 md:col-start-1">
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
              <div className="bg-muted/30 rounded-md p-3 h-[160px] overflow-y-auto">
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
      </div>

      {/* Visualization Panel - Second on Mobile, Right on Desktop */}
      <div className="order-2 md:col-start-2 md:row-span-3">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Visualization</CardTitle>
            <CardDescription>Visual representation of the graph — drag nodes to reposition</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden flex flex-col">
            <div className="flex items-center justify-center min-h-[300px] md:h-[400px] py-4 bg-muted/5 border-t overflow-auto">
              <svg ref={svgRef} width="500" height="300" viewBox="0 0 500 300" className="max-w-none md:max-w-full">
                {edges.map((edge) => {
                  const src = nodes.find((n) => n.id === edge.source)
                  const tgt = nodes.find((n) => n.id === edge.target)
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
                {nodes.map((node) => (
                  <g key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onMouseDown={(e) => handleNodeDrag(e, node.id)}
                    onClick={() => handleNodeClick(node.id)}
                    className="cursor-pointer"
                  >
                    <circle r={20} className={`
                      transition-all duration-300 ease-in-out
                      ${node.highlighted ? "fill-yellow-200 stroke-yellow-500 dark:fill-yellow-900" : ""}
                      ${node.visited && !node.highlighted ? "fill-green-100 stroke-green-500 dark:fill-green-900" : ""}
                      ${!node.highlighted && !node.visited ? "fill-card stroke-primary" : ""}
                      ${node.isNew ? "stroke-green-500 stroke-[3]" : "stroke-[2]"}
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
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 p-4 text-[10px] md:text-xs border-t">
              {[
                ["fill-card border border-primary", "Unvisited"],
                ["bg-yellow-200 dark:bg-yellow-900 border border-yellow-500", "Current"],
                ["bg-green-100 dark:bg-green-900 border border-green-500", "Visited"],
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
      </div>

      {/* Live Code Panel - Third on Mobile, Left on Desktop */}
      <div className="order-3 md:col-start-1 h-[280px]">
        <CodePanel
          code={activeCode}
          activeLine={activeLine}
          title={activeCode === BFS_CODE ? "BFS Algorithm" : activeCode === DFS_CODE ? "DFS Algorithm" : "Graph Algorithm"}
        />
      </div>
    </div>
  )
}
