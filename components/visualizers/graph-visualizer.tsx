"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"

type Node = {
  id: string
  label: string
  x: number
  y: number
  highlighted?: boolean
  isNew?: boolean
}

type Edge = {
  id: string
  source: string
  target: string
  highlighted?: boolean
  isNew?: boolean
}

export default function GraphVisualizer() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [sourceNode, setSourceNode] = useState("")
  const [targetNode, setTargetNode] = useState("")
  const [nodeLabel, setNodeLabel] = useState("")
  const [operation, setOperation] = useState("addNode")
  const [animating, setAnimating] = useState(false)
  const [traversalPath, setTraversalPath] = useState<string[]>([])
  const [traversalType, setTraversalType] = useState("bfs")
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Initialize with a sample graph
  useEffect(() => {
    const sampleNodes: Node[] = [
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
    if (!nodeLabel || animating) return

    setAnimating(true)

    // Generate random position within the visible area
    const x = Math.random() * 300 + 100
    const y = Math.random() * 150 + 50

    const newNode: Node = {
      id: nodeLabel,
      label: nodeLabel,
      x,
      y,
      isNew: true,
    }

    setNodes([...nodes, newNode])

    // After animation, remove the "isNew" flag
    setTimeout(() => {
      setNodes((nodes) => nodes.map((node) => (node.id === newNode.id ? { ...node, isNew: false } : node)))
      setAnimating(false)
    }, 1000)

    setNodeLabel("")
  }

  const handleAddEdge = () => {
    if (!sourceNode || !targetNode || animating) return

    // Check if nodes exist
    const source = nodes.find((node) => node.id === sourceNode)
    const target = nodes.find((node) => node.id === targetNode)

    if (!source || !target) return

    // Check if edge already exists
    const edgeExists = edges.some(
      (edge) =>
        (edge.source === sourceNode && edge.target === targetNode) ||
        (edge.source === targetNode && edge.target === sourceNode),
    )

    if (edgeExists) return

    setAnimating(true)

    const newEdge: Edge = {
      id: `${sourceNode}-${targetNode}`,
      source: sourceNode,
      target: targetNode,
      isNew: true,
    }

    setEdges([...edges, newEdge])

    // After animation, remove the "isNew" flag
    setTimeout(() => {
      setEdges((edges) => edges.map((edge) => (edge.id === newEdge.id ? { ...edge, isNew: false } : edge)))
      setAnimating(false)
    }, 1000)

    setSourceNode("")
    setTargetNode("")
  }

  const handleTraversal = () => {
    if (animating || !selectedNode) return

    setAnimating(true)
    setTraversalPath([])

    // Reset all highlights
    setNodes((nodes) => nodes.map((node) => ({ ...node, highlighted: false })))
    setEdges((edges) => edges.map((edge) => ({ ...edge, highlighted: false })))

    // Create adjacency list
    const adjacencyList: Record<string, string[]> = {}

    nodes.forEach((node) => {
      adjacencyList[node.id] = []
    })

    edges.forEach((edge) => {
      adjacencyList[edge.source].push(edge.target)
      adjacencyList[edge.target].push(edge.source) // For undirected graph
    })

    // BFS traversal
    const bfs = () => {
      const visited: Record<string, boolean> = {}
      const queue: string[] = [selectedNode]
      const path: string[] = []

      visited[selectedNode] = true

      const interval = setInterval(() => {
        if (queue.length === 0) {
          clearInterval(interval)
          setTimeout(() => {
            setNodes((nodes) => nodes.map((node) => ({ ...node, highlighted: false })))
            setEdges((edges) => edges.map((edge) => ({ ...edge, highlighted: false })))
            setAnimating(false)
          }, 1500)
          return
        }

        const current = queue.shift()!
        path.push(current)
        setTraversalPath([...path])

        // Highlight current node
        setNodes((nodes) => nodes.map((node) => (node.id === current ? { ...node, highlighted: true } : node)))

        // Process neighbors
        for (const neighbor of adjacencyList[current]) {
          if (!visited[neighbor]) {
            visited[neighbor] = true
            queue.push(neighbor)

            // Highlight edge
            setEdges((edges) =>
              edges.map((edge) =>
                (edge.source === current && edge.target === neighbor) ||
                (edge.source === neighbor && edge.target === current)
                  ? { ...edge, highlighted: true }
                  : edge,
              ),
            )
          }
        }
      }, 1000)
    }

    // DFS traversal
    const dfs = () => {
      const visited: Record<string, boolean> = {}
      const path: string[] = []

      const dfsRecursive = (node: string) => {
        visited[node] = true
        path.push(node)
        setTraversalPath([...path])

        // Highlight current node
        setNodes((nodes) => nodes.map((n) => (n.id === node ? { ...n, highlighted: true } : n)))

        for (const neighbor of adjacencyList[node]) {
          if (!visited[neighbor]) {
            // Highlight edge
            setEdges((edges) =>
              edges.map((edge) =>
                (edge.source === node && edge.target === neighbor) || (edge.source === neighbor && edge.target === node)
                  ? { ...edge, highlighted: true }
                  : edge,
              ),
            )

            setTimeout(() => dfsRecursive(neighbor), 1000)
            return
          }
        }

        // If we've visited all nodes or reached a leaf
        if (path.length === nodes.length) {
          setTimeout(() => {
            setNodes((nodes) => nodes.map((node) => ({ ...node, highlighted: false })))
            setEdges((edges) => edges.map((edge) => ({ ...edge, highlighted: false })))
            setAnimating(false)
          }, 1500)
        }
      }

      dfsRecursive(selectedNode)
    }

    if (traversalType === "bfs") {
      bfs()
    } else {
      dfs()
    }
  }

  const handleNodeClick = (nodeId: string) => {
    if (animating) return
    setSelectedNode(nodeId)
  }

  const handleNodeDrag = (event: React.MouseEvent, nodeId: string) => {
    if (animating) return

    const startX = event.clientX
    const startY = event.clientY

    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return

    const startNodeX = node.x
    const startNodeY = node.y

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startX
      const dy = e.clientY - startY

      setNodes((nodes) => nodes.map((n) => (n.id === nodeId ? { ...n, x: startNodeX + dx, y: startNodeY + dy } : n)))
    }

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Operations Panel */}
      <div className="space-y-6">
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
                    disabled={animating}
                    maxLength={2}
                  />

                  <Button onClick={handleAddNode} disabled={animating}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>
              )}

              {operation === "addEdge" && (
                <div className="space-y-4 mt-4">
                  <div className="flex space-x-2">
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={sourceNode}
                      onChange={(e) => setSourceNode(e.target.value)}
                      disabled={animating}
                    >
                      <option value="">Source Node</option>
                      {nodes.map((node) => (
                        <option key={node.id} value={node.id}>
                          {node.label}
                        </option>
                      ))}
                    </select>

                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={targetNode}
                      onChange={(e) => setTargetNode(e.target.value)}
                      disabled={animating}
                    >
                      <option value="">Target Node</option>
                      {nodes.map((node) => (
                        <option key={node.id} value={node.id}>
                          {node.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button onClick={handleAddEdge} disabled={animating} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Edge
                  </Button>
                </div>
              )}
            </Tabs>

            <div className="mt-6 border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Graph Traversal</h4>
              <div className="flex space-x-2 items-center">
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={traversalType}
                  onChange={(e) => setTraversalType(e.target.value)}
                  disabled={animating}
                >
                  <option value="bfs">Breadth-First Search</option>
                  <option value="dfs">Depth-First Search</option>
                </select>

                <Button onClick={handleTraversal} disabled={animating || !selectedNode} variant="outline">
                  Traverse
                </Button>
              </div>

              {selectedNode && (
                <div className="mt-2 text-sm">
                  <span className="font-medium">Starting from:</span> {selectedNode}
                </div>
              )}

              {traversalPath.length > 0 && (
                <div className="mt-2 text-sm">
                  <span className="font-medium">Path:</span> {traversalPath.join(" → ")}
                </div>
              )}

              {!selectedNode && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Click on a node in the graph to select it as the starting point
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visualization Panel */}
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Visualization</CardTitle>
          <CardDescription>Visual representation of the graph</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4 overflow-auto h-[350px]">
            <svg ref={svgRef} width="500" height="300" viewBox="0 0 500 300" className="max-w-full">
              {/* Render edges */}
              {edges.map((edge) => {
                const source = nodes.find((n) => n.id === edge.source)
                const target = nodes.find((n) => n.id === edge.target)

                if (!source || !target) return null

                return (
                  <line
                    key={edge.id}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    className={`
                      stroke-current stroke-[2] transition-all duration-500
                      ${edge.highlighted ? "stroke-yellow-500 stroke-[3]" : "stroke-muted-foreground"}
                      ${edge.isNew ? "stroke-green-500 stroke-[3]" : ""}
                    `}
                  />
                )
              })}

              {/* Render nodes */}
              {nodes.map((node) => (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onMouseDown={(e) => handleNodeDrag(e, node.id)}
                  onClick={() => handleNodeClick(node.id)}
                  className="cursor-pointer"
                >
                  <circle
                    r={20}
                    className={`
                      transition-all duration-500 ease-in-out
                      ${node.highlighted ? "fill-yellow-200 stroke-yellow-500 dark:fill-yellow-900" : "fill-card stroke-primary"}
                      ${node.isNew ? "stroke-green-500 stroke-[3]" : "stroke-[2]"}
                      ${node.id === selectedNode ? "stroke-blue-500 stroke-[3]" : ""}
                    `}
                  />
                  <text textAnchor="middle" dominantBaseline="middle" className="text-sm font-medium fill-current">
                    {node.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <div className="text-xs text-center text-muted-foreground mt-2">
            Drag nodes to reposition them. Click a node to select it for traversal.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

