"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

type GraphOperation =
  | "addVertex"
  | "addEdge"
  | "removeVertex"
  | "removeEdge"
  | "bfs"
  | "dfs"
  | "shortestPath"
  | "detectCycle"
  | "topologicalSort"
  | "connectedComponents"

interface Vertex {
  id: string
  label: string
}

interface Edge {
  from: string
  to: string
  weight?: number
}

export default function GraphOperations() {
  const [vertices, setVertices] = useState<Vertex[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [vertexId, setVertexId] = useState("")
  const [vertexLabel, setVertexLabel] = useState("")
  const [fromVertex, setFromVertex] = useState("")
  const [toVertex, setToVertex] = useState("")
  const [weight, setWeight] = useState("")
  const [startVertex, setStartVertex] = useState("")
  const [operation, setOperation] = useState<GraphOperation>("addVertex")
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [steps, setSteps] = useState<string[]>([])

  const getAdjacencyList = () => {
    const adjacencyList: Record<string, { id: string; weight?: number }[]> = {}

    // Initialize adjacency list for all vertices
    vertices.forEach((vertex) => {
      adjacencyList[vertex.id] = []
    })

    // Add edges to adjacency list
    edges.forEach((edge) => {
      if (adjacencyList[edge.from]) {
        adjacencyList[edge.from].push({
          id: edge.to,
          weight: edge.weight,
        })
      }

      // For undirected graph, add the reverse edge as well
      if (adjacencyList[edge.to]) {
        adjacencyList[edge.to].push({
          id: edge.from,
          weight: edge.weight,
        })
      }
    })

    return adjacencyList
  }

  const performOperation = () => {
    setError(null)
    setSuccess(null)
    setResult(null)
    setSteps([])

    try {
      switch (operation) {
        case "addVertex": {
          if (!vertexId) {
            setError("Please enter a vertex ID")
            return
          }

          if (vertices.some((v) => v.id === vertexId)) {
            setError(`Vertex with ID '${vertexId}' already exists`)
            return
          }

          const label = vertexLabel || vertexId
          const newVertices = [...vertices, { id: vertexId, label }]
          setVertices(newVertices)

          const newSteps = [`Adding vertex with ID: ${vertexId}, Label: ${label}`, `New vertex added successfully`]

          setSteps(newSteps)
          setResult({ vertices: newVertices })
          setVertexId("")
          setVertexLabel("")
          break
        }

        case "addEdge": {
          if (!fromVertex || !toVertex) {
            setError("Please select both source and destination vertices")
            return
          }

          if (!vertices.some((v) => v.id === fromVertex)) {
            setError(`Vertex with ID '${fromVertex}' does not exist`)
            return
          }

          if (!vertices.some((v) => v.id === toVertex)) {
            setError(`Vertex with ID '${toVertex}' does not exist`)
            return
          }

          if (edges.some((e) => e.from === fromVertex && e.to === toVertex)) {
            setError(`Edge from '${fromVertex}' to '${toVertex}' already exists`)
            return
          }

          const weightValue = weight ? Number(weight) : undefined
          if (weight && isNaN(weightValue!)) {
            setError("Weight must be a number")
            return
          }

          const newEdge: Edge = {
            from: fromVertex,
            to: toVertex,
            weight: weightValue,
          }

          const newEdges = [...edges, newEdge]
          setEdges(newEdges)

          const newSteps = [
            `Adding edge from '${fromVertex}' to '${toVertex}'${weightValue !== undefined ? ` with weight ${weightValue}` : ""}`,
            `New edge added successfully`,
          ]

          setSteps(newSteps)
          setResult({ edges: newEdges })
          setFromVertex("")
          setToVertex("")
          setWeight("")
          break
        }

        case "removeVertex": {
          if (!vertexId) {
            setError("Please enter a vertex ID to remove")
            return
          }

          if (!vertices.some((v) => v.id === vertexId)) {
            setError(`Vertex with ID '${vertexId}' does not exist`)
            return
          }

          const newVertices = vertices.filter((v) => v.id !== vertexId)
          const newEdges = edges.filter((e) => e.from !== vertexId && e.to !== vertexId)

          setVertices(newVertices)
          setEdges(newEdges)

          const newSteps = [
            `Removing vertex with ID: ${vertexId}`,
            `Removing all edges connected to vertex '${vertexId}'`,
            `Vertex and connected edges removed successfully`,
          ]

          setSteps(newSteps)
          setResult({ vertices: newVertices, edges: newEdges })
          setVertexId("")
          break
        }

        case "removeEdge": {
          if (!fromVertex || !toVertex) {
            setError("Please select both source and destination vertices")
            return
          }

          if (!edges.some((e) => e.from === fromVertex && e.to === toVertex)) {
            setError(`Edge from '${fromVertex}' to '${toVertex}' does not exist`)
            return
          }

          const newEdges = edges.filter((e) => !(e.from === fromVertex && e.to === toVertex))
          setEdges(newEdges)

          const newSteps = [`Removing edge from '${fromVertex}' to '${toVertex}'`, `Edge removed successfully`]

          setSteps(newSteps)
          setResult({ edges: newEdges })
          setFromVertex("")
          setToVertex("")
          break
        }

        case "bfs": {
          if (!startVertex) {
            setError("Please select a starting vertex")
            return
          }

          if (!vertices.some((v) => v.id === startVertex)) {
            setError(`Vertex with ID '${startVertex}' does not exist`)
            return
          }

          const adjacencyList = getAdjacencyList()
          const visited: Record<string, boolean> = {}
          const traversal: string[] = []
          const queue: string[] = [startVertex]
          const newSteps: string[] = [`Starting BFS from vertex '${startVertex}'`]

          visited[startVertex] = true

          while (queue.length > 0) {
            const current = queue.shift()!
            traversal.push(current)
            newSteps.push(`Visiting vertex '${current}'`)

            adjacencyList[current].forEach((neighbor) => {
              if (!visited[neighbor.id]) {
                visited[neighbor.id] = true
                queue.push(neighbor.id)
                newSteps.push(`Adding neighbor '${neighbor.id}' to queue`)
              }
            })

            newSteps.push(`Current queue: [${queue.join(", ")}]`)
          }

          setSteps(newSteps)
          setResult({ traversal })
          break
        }

        case "dfs": {
          if (!startVertex) {
            setError("Please select a starting vertex")
            return
          }

          if (!vertices.some((v) => v.id === startVertex)) {
            setError(`Vertex with ID '${startVertex}' does not exist`)
            return
          }

          const adjacencyList = getAdjacencyList()
          const visited: Record<string, boolean> = {}
          const traversal: string[] = []
          const newSteps: string[] = [`Starting DFS from vertex '${startVertex}'`]

          const dfs = (vertex: string) => {
            visited[vertex] = true
            traversal.push(vertex)
            newSteps.push(`Visiting vertex '${vertex}'`)

            adjacencyList[vertex].forEach((neighbor) => {
              if (!visited[neighbor.id]) {
                newSteps.push(`Exploring neighbor '${neighbor.id}'`)
                dfs(neighbor.id)
              }
            })
          }

          dfs(startVertex)

          setSteps(newSteps)
          setResult({ traversal })
          break
        }

        case "shortestPath": {
          if (!fromVertex || !toVertex) {
            setError("Please select both source and destination vertices")
            return
          }

          if (!vertices.some((v) => v.id === fromVertex)) {
            setError(`Vertex with ID '${fromVertex}' does not exist`)
            return
          }

          if (!vertices.some((v) => v.id === toVertex)) {
            setError(`Vertex with ID '${toVertex}' does not exist`)
            return
          }

          const adjacencyList = getAdjacencyList()
          const distances: Record<string, number> = {}
          const previous: Record<string, string | null> = {}
          const unvisited = new Set<string>()
          const newSteps: string[] = [`Finding shortest path from '${fromVertex}' to '${toVertex}'`]

          // Initialize distances
          vertices.forEach((vertex) => {
            distances[vertex.id] = Number.POSITIVE_INFINITY
            previous[vertex.id] = null
            unvisited.add(vertex.id)
          })

          distances[fromVertex] = 0

          while (unvisited.size > 0) {
            // Find vertex with minimum distance
            let current: string | null = null
            let minDistance = Number.POSITIVE_INFINITY

            unvisited.forEach((vertex) => {
              if (distances[vertex] < minDistance) {
                minDistance = distances[vertex]
                current = vertex
              }
            })

            if (current === null || distances[current] === Number.POSITIVE_INFINITY) {
              break
            }

            if (current === toVertex) {
              break
            }

            const currentVertex = current
            unvisited.delete(currentVertex)
            newSteps.push(`Processing vertex '${currentVertex}' with distance ${distances[currentVertex]}`)

            // Update distances to neighbors
            adjacencyList[currentVertex].forEach((neighbor) => {
              if (unvisited.has(neighbor.id)) {
                const weight = neighbor.weight || 1
                const distance = distances[currentVertex] + weight

                if (distance < distances[neighbor.id]) {
                  distances[neighbor.id] = distance
                  previous[neighbor.id] = currentVertex
                  newSteps.push(`Updated distance to '${neighbor.id}': ${distance}`)
                }
              }
            })
          }

          // Reconstruct path
          const path: string[] = []
          let current = toVertex

          if (previous[current] !== null || current === fromVertex) {
            while (current) {
              path.unshift(current)
              current = previous[current]!
            }
          }

          if (path.length === 0 || path[0] !== fromVertex) {
            newSteps.push(`No path exists from '${fromVertex}' to '${toVertex}'`)
            setSteps(newSteps)
            setResult({ path: null, distance: Number.POSITIVE_INFINITY })
          } else {
            newSteps.push(`Shortest path: ${path.join(" → ")}`)
            newSteps.push(`Total distance: ${distances[toVertex]}`)
            setSteps(newSteps)
            setResult({ path, distance: distances[toVertex] })
          }

          break
        }

        case "detectCycle": {
          const adjacencyList = getAdjacencyList()
          const visited: Record<string, boolean> = {}
          const recStack: Record<string, boolean> = {}
          let hasCycle = false
          const cycleVertices: string[] = []
          const newSteps: string[] = [`Detecting cycles in the graph`]

          const checkCycle = (vertex: string, path: string[] = []) => {
            if (!visited[vertex]) {
              visited[vertex] = true
              recStack[vertex] = true
              path.push(vertex)

              newSteps.push(`Visiting vertex '${vertex}'`)

              for (const neighbor of adjacencyList[vertex]) {
                if (!visited[neighbor.id]) {
                  if (checkCycle(neighbor.id, [...path])) {
                    return true
                  }
                } else if (recStack[neighbor.id]) {
                  // Found a cycle
                  hasCycle = true

                  // Find the start of the cycle
                  const cycleStart = path.indexOf(neighbor.id)
                  if (cycleStart !== -1) {
                    const cycle = path.slice(cycleStart)
                    cycle.push(neighbor.id)
                    cycleVertices.push(...cycle)
                    newSteps.push(`Found cycle: ${cycle.join(" → ")}`)
                  }

                  return true
                }
              }
            }

            recStack[vertex] = false
            return false
          }

          for (const vertex of vertices) {
            if (!visited[vertex.id]) {
              checkCycle(vertex.id)
            }
          }

          if (!hasCycle) {
            newSteps.push(`No cycles detected in the graph`)
          }

          setSteps(newSteps)
          setResult({ hasCycle, cycleVertices })
          break
        }

        case "topologicalSort": {
          const adjacencyList: Record<string, string[]> = {}

          // Initialize adjacency list for all vertices
          vertices.forEach((vertex) => {
            adjacencyList[vertex.id] = []
          })

          // Add edges to adjacency list (directed)
          edges.forEach((edge) => {
            if (adjacencyList[edge.from]) {
              adjacencyList[edge.from].push(edge.to)
            }
          })

          const visited: Record<string, boolean> = {}
          const stack: string[] = []
          const newSteps: string[] = [`Performing topological sort`]

          const topologicalSortUtil = (vertex: string) => {
            visited[vertex] = true
            newSteps.push(`Visiting vertex '${vertex}'`)

            for (const neighbor of adjacencyList[vertex]) {
              if (!visited[neighbor]) {
                topologicalSortUtil(neighbor)
              }
            }

            stack.unshift(vertex)
            newSteps.push(`Adding '${vertex}' to the beginning of result`)
          }

          // Check for cycles
          const tempVisited: Record<string, boolean> = {}
          const recStack: Record<string, boolean> = {}

          const checkCycle = (vertex: string): boolean => {
            if (!tempVisited[vertex]) {
              tempVisited[vertex] = true
              recStack[vertex] = true

              for (const neighbor of adjacencyList[vertex]) {
                if (!tempVisited[neighbor] && checkCycle(neighbor)) {
                  return true
                } else if (recStack[neighbor]) {
                  return true
                }
              }
            }

            recStack[vertex] = false
            return false
          }

          let hasCycle = false
          for (const vertex of vertices) {
            if (!tempVisited[vertex.id] && checkCycle(vertex.id)) {
              hasCycle = true
              break
            }
          }

          if (hasCycle) {
            newSteps.push(`Cannot perform topological sort: Graph contains a cycle`)
            setSteps(newSteps)
            setResult({ error: "Graph contains a cycle" })
            break
          }

          // Perform topological sort
          for (const vertex of vertices) {
            if (!visited[vertex.id]) {
              topologicalSortUtil(vertex.id)
            }
          }

          newSteps.push(`Topological sort result: ${stack.join(" → ")}`)
          setSteps(newSteps)
          setResult({ sort: stack })
          break
        }

        case "connectedComponents": {
          const adjacencyList = getAdjacencyList()
          const visited: Record<string, boolean> = {}
          const components: string[][] = []
          const newSteps: string[] = [`Finding connected components`]

          const dfs = (vertex: string, component: string[]) => {
            visited[vertex] = true
            component.push(vertex)

            for (const neighbor of adjacencyList[vertex]) {
              if (!visited[neighbor.id]) {
                dfs(neighbor.id, component)
              }
            }
          }

          for (const vertex of vertices) {
            if (!visited[vertex.id]) {
              const component: string[] = []
              dfs(vertex.id, component)
              components.push(component)
              newSteps.push(`Found component: ${component.join(", ")}`)
            }
          }

          newSteps.push(`Total connected components: ${components.length}`)
          setSteps(newSteps)
          setResult({ components, count: components.length })
          break
        }
      }

      setSuccess(`Operation '${operation}' performed successfully`)
    } catch (err) {
      setError(`Error performing operation: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Graph Operations</CardTitle>
          <CardDescription>Perform various operations on a graph</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="operation">Operation</Label>
              <Select value={operation} onValueChange={(value) => setOperation(value as GraphOperation)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select operation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="addVertex">Add Vertex</SelectItem>
                  <SelectItem value="addEdge">Add Edge</SelectItem>
                  <SelectItem value="removeVertex">Remove Vertex</SelectItem>
                  <SelectItem value="removeEdge">Remove Edge</SelectItem>
                  <SelectItem value="bfs">BFS Traversal</SelectItem>
                  <SelectItem value="dfs">DFS Traversal</SelectItem>
                  <SelectItem value="shortestPath">Shortest Path</SelectItem>
                  <SelectItem value="detectCycle">Detect Cycle</SelectItem>
                  <SelectItem value="topologicalSort">Topological Sort</SelectItem>
                  <SelectItem value="connectedComponents">Connected Components</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(operation === "addVertex" || operation === "removeVertex") && (
              <div>
                <Label htmlFor="vertexId">Vertex ID</Label>
                <Input
                  id="vertexId"
                  className="mt-1.5"
                  placeholder="e.g., A"
                  value={vertexId}
                  onChange={(e) => setVertexId(e.target.value)}
                />
              </div>
            )}

            {operation === "addVertex" && (
              <div>
                <Label htmlFor="vertexLabel">Vertex Label (optional)</Label>
                <Input
                  id="vertexLabel"
                  className="mt-1.5"
                  placeholder="e.g., City A"
                  value={vertexLabel}
                  onChange={(e) => setVertexLabel(e.target.value)}
                />
              </div>
            )}

            {(operation === "addEdge" || operation === "removeEdge" || operation === "shortestPath") && (
              <>
                <div>
                  <Label htmlFor="fromVertex">From Vertex</Label>
                  <Select value={fromVertex} onValueChange={setFromVertex}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select vertex" />
                    </SelectTrigger>
                    <SelectContent>
                      {vertices.map((vertex) => (
                        <SelectItem key={`from-${vertex.id}`} value={vertex.id}>
                          {vertex.label} ({vertex.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="toVertex">To Vertex</Label>
                  <Select value={toVertex} onValueChange={setToVertex}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select vertex" />
                    </SelectTrigger>
                    <SelectContent>
                      {vertices.map((vertex) => (
                        <SelectItem key={`to-${vertex.id}`} value={vertex.id}>
                          {vertex.label} ({vertex.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {operation === "addEdge" && (
              <div>
                <Label htmlFor="weight">Weight (optional)</Label>
                <Input
                  id="weight"
                  className="mt-1.5"
                  placeholder="e.g., 5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
            )}

            {(operation === "bfs" || operation === "dfs") && (
              <div>
                <Label htmlFor="startVertex">Start Vertex</Label>
                <Select value={startVertex} onValueChange={setStartVertex}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select vertex" />
                  </SelectTrigger>
                  <SelectContent>
                    {vertices.map((vertex) => (
                      <SelectItem key={`start-${vertex.id}`} value={vertex.id}>
                        {vertex.label} ({vertex.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button className="w-full" onClick={performOperation}>
              Perform Operation
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Graph Visualization</CardTitle>
          <CardDescription>View the current graph structure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Vertices:</h3>
              <div className="p-3 bg-muted rounded-md mt-2 overflow-x-auto">
                {vertices.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {vertices.map((vertex) => (
                      <li key={`vertex-${vertex.id}`}>
                        {vertex.id}: {vertex.label}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-muted-foreground">No vertices added yet</div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium">Edges:</h3>
              <div className="p-3 bg-muted rounded-md mt-2 overflow-x-auto">
                {edges.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {edges.map((edge, index) => (
                      <li key={`edge-${index}`}>
                        {edge.from} → {edge.to}
                        {edge.weight !== undefined ? ` (weight: ${edge.weight})` : ""}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-muted-foreground">No edges added yet</div>
                )}
              </div>
            </div>

            {result !== null && (
              <div>
                <h3 className="text-lg font-medium">Operation Result:</h3>
                <div className="p-3 bg-muted rounded-md mt-2 overflow-x-auto">
                  {operation === "bfs" || operation === "dfs"
                    ? `Traversal: ${result.traversal.join(" → ")}`
                    : operation === "shortestPath"
                      ? result.path
                        ? `Shortest path: ${result.path.join(" → ")}\nDistance: ${result.distance}`
                        : `No path exists between the selected vertices`
                      : operation === "detectCycle"
                        ? result.hasCycle
                          ? `Cycle detected in the graph`
                          : `No cycles detected in the graph`
                        : operation === "topologicalSort"
                          ? result.error
                            ? result.error
                            : `Topological sort: ${result.sort.join(" → ")}`
                          : operation === "connectedComponents"
                            ? `Found ${result.count} connected components`
                            : JSON.stringify(result)}
                </div>
              </div>
            )}

            {steps.length > 0 && (
              <div>
                <h3 className="text-lg font-medium">Steps:</h3>
                <div className="p-3 bg-muted rounded-md mt-2 max-h-60 overflow-y-auto">
                  <ol className="list-decimal list-inside space-y-1">
                    {steps.map((step, index) => (
                      <li key={`step-${index}`} className="text-sm">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

