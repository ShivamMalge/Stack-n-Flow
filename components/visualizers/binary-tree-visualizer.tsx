"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, ZoomIn, ZoomOut, MoveHorizontal } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import AnimationControls from "@/components/ui/animation-controls"
import { useAnimationPlayer, type AnimationFrame } from "@/hooks/useAnimationPlayer"
import { computeTreeLayout } from "@/lib/tree-layout"

type TreeNode = {
  id: number
  value: number
  left: TreeNode | null
  right: TreeNode | null
  highlighted?: boolean
  isNew?: boolean
  isDeleting?: boolean
}

type BinaryTreeFrame = { root: TreeNode | null; traversalPath: number[]; searchResult: string | null }

export default function BinaryTreeVisualizer() {
  const [root, setRoot] = useState<TreeNode | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [operation, setOperation] = useState("insert")
  const [animating, setAnimating] = useState(false)
  const [nextId, setNextId] = useState(1)
  const [traversalPath, setTraversalPath] = useState<number[]>([])
  const [traversalType, setTraversalType] = useState("inorder")
  const [searchResult, setSearchResult] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [steps, setSteps] = useState<string[]>([])
  const svgRef = useRef<SVGSVGElement>(null)
  const isMobile = useMobile()

  const onFrameChange = useCallback((snap: BinaryTreeFrame) => {
    setRoot(snap.root)
    setTraversalPath(snap.traversalPath)
    setSearchResult(snap.searchResult)
  }, [])
  const player = useAnimationPlayer<BinaryTreeFrame>(onFrameChange)

  // Initialize with an empty tree
  useEffect(() => {
    setRoot(null)
    setNextId(1)
  }, [])

  // Function to insert a node at a random position in the binary tree
  const insertNode = (node: TreeNode | null, value: number, newId: number): TreeNode => {
    if (node === null) {
      return { id: newId, value, left: null, right: null, isNew: true }
    }

    // Randomly decide whether to go left or right
    if (Math.random() < 0.5) {
      node.left = insertNode(node.left, value, newId)
    } else {
      node.right = insertNode(node.right, value, newId)
    }

    return node
  }

  // Add validation to the handleInsert function
  const handleInsert = () => {
    if (!inputValue || animating) return

    const value = Number.parseInt(inputValue)

    // Add validation to limit value to 500
    if (value > 500) {
      alert("Please enter a value not greater than 500")
      return
    }

    setAnimating(true)

    // Create a deep copy of the tree and insert the new node
    const newRoot = root ? JSON.parse(JSON.stringify(root)) : null
    const updatedRoot = insertNode(newRoot, value, nextId)
    setRoot(updatedRoot)
    setNextId(nextId + 1)

    // After animation, remove the "isNew" flag
    setTimeout(() => {
      const removeNewFlag = (node: TreeNode | null): TreeNode | null => {
        if (node === null) return null

        return {
          ...node,
          isNew: false,
          left: removeNewFlag(node.left),
          right: removeNewFlag(node.right),
        }
      }

      setRoot(removeNewFlag(updatedRoot))
      setAnimating(false)
    }, 1000)

    setInputValue("")
  }

  const handleSearch = () => {
    if (!inputValue || animating || !root) return
    const value = Number.parseInt(inputValue)
    setInputValue("")

    const resetH = (n: TreeNode | null): TreeNode | null =>
      n ? { ...n, highlighted: false, left: resetH(n.left), right: resetH(n.right) } : null
    const setHForIds = (n: TreeNode | null, ids: Set<number>): TreeNode | null =>
      n ? { ...n, highlighted: ids.has(n.id), left: setHForIds(n.left, ids), right: setHForIds(n.right, ids) } : null

    // BFS to find the value — binary tree has no ordering, must check all nodes
    const frames: AnimationFrame<BinaryTreeFrame>[] = []
    const allSteps: string[] = [`Searching for ${value} via BFS`]
    const rootCopy = JSON.parse(JSON.stringify(root)) as TreeNode
    const queue: TreeNode[] = [rootCopy]
    const visited: number[] = []
    let found = false

    frames.push({ snapshot: { root: resetH(JSON.parse(JSON.stringify(rootCopy))), traversalPath: [], searchResult: null }, description: `BFS search for ${value}` })

    while (queue.length > 0) {
      const cur = queue.shift()!
      visited.push(cur.id)
      const visitedSet = new Set(visited)
      if (cur.value === value) {
        found = true
        allSteps.push(`✓ Found ${value} at node id=${cur.id}`)
        frames.push({ snapshot: { root: setHForIds(JSON.parse(JSON.stringify(rootCopy)), visitedSet), traversalPath: visited, searchResult: "Element found!" }, description: `Found ${value}!` })
        break
      }
      allSteps.push(`Checking node ${cur.value}`)
      frames.push({ snapshot: { root: setHForIds(JSON.parse(JSON.stringify(rootCopy)), visitedSet), traversalPath: [...visited], searchResult: null }, description: `Checking node ${cur.value}` })
      if (cur.left) queue.push(cur.left)
      if (cur.right) queue.push(cur.right)
    }
    if (!found) {
      allSteps.push(`✗ ${value} not in tree`)
      frames.push({ snapshot: { root: resetH(JSON.parse(JSON.stringify(rootCopy))), traversalPath: [], searchResult: "Element not found" }, description: `${value} not found` })
    }
    setSteps(allSteps)
    player.loadFrames(frames)
    setTimeout(() => player.play(), 50)
  }

  const countNodes = (node: TreeNode | null): number => {
    if (node === null) return 0
    return 1 + countNodes(node.left) + countNodes(node.right)
  }

  const handleTraversal = () => {
    if (!root) return
    const path: number[] = []
    const inOrder = (n: TreeNode | null) => { if (!n) return; inOrder(n.left); path.push(n.value); inOrder(n.right) }
    const preOrder = (n: TreeNode | null) => { if (!n) return; path.push(n.value); preOrder(n.left); preOrder(n.right) }
    const postOrder = (n: TreeNode | null) => { if (!n) return; postOrder(n.left); postOrder(n.right); path.push(n.value) }
    const levelOrder = (n: TreeNode | null) => { if (!n) return; const q = [n]; while (q.length) { const c = q.shift()!; path.push(c.value); if (c.left) q.push(c.left); if (c.right) q.push(c.right) } }
    if (traversalType === "inorder") inOrder(root)
    else if (traversalType === "preorder") preOrder(root)
    else if (traversalType === "postorder") postOrder(root)
    else levelOrder(root)

    const resetH = (n: TreeNode | null): TreeNode | null =>
      n ? { ...n, highlighted: false, left: resetH(n.left), right: resetH(n.right) } : null
    const highlightOne = (n: TreeNode | null, val: number): TreeNode | null =>
      n ? { ...n, highlighted: n.value === val, left: highlightOne(n.left, val), right: highlightOne(n.right, val) } : null

    const frames: AnimationFrame<BinaryTreeFrame>[] = []
    const allSteps: string[] = [`${traversalType} traversal`]
    const rootCopy = JSON.parse(JSON.stringify(root)) as TreeNode

    frames.push({ snapshot: { root: resetH(rootCopy), traversalPath: [], searchResult: null }, description: `Starting ${traversalType} traversal` })
    for (let i = 0; i < path.length; i++) {
      allSteps.push(`Visit node ${path[i]}`)
      frames.push({ snapshot: { root: highlightOne(JSON.parse(JSON.stringify(rootCopy)), path[i]), traversalPath: path.slice(0, i + 1), searchResult: null }, description: `Visiting ${path[i]} (${i + 1}/${path.length})` })
    }
    frames.push({ snapshot: { root: resetH(JSON.parse(JSON.stringify(rootCopy))), traversalPath: path, searchResult: null }, description: `Done: ${path.join(" → ")}` })
    setSteps(allSteps)
    player.loadFrames(frames)
    setTimeout(() => player.play(), 50)
  }

  // ── Tree Layout (crossing-free in-order assignment) ──────────────────────
  const NODE_R = isMobile ? 14 : 18
  const treeLayout = useMemo(() => computeTreeLayout(root as never, 60, 80), [root])
  const [nodePositions, setNodePositions] = useState<Record<number, { x: number; y: number }>>({})

  // SVG viewBox based on computed positions
  const svgPadding = 30
  const layoutPositions = Array.from(treeLayout.values())
  const minX = layoutPositions.length ? Math.min(...layoutPositions.map((p) => p.x)) : 0
  const maxX = layoutPositions.length ? Math.max(...layoutPositions.map((p) => p.x)) : 0
  const maxY = layoutPositions.length ? Math.max(...layoutPositions.map((p) => p.y)) : 0
  const svgW = Math.max(300, maxX - minX + svgPadding * 2)
  const svgH = Math.max(200, maxY + svgPadding * 2)

  const renderTree = (node: TreeNode | null): React.ReactNode => {
    if (!node) return null
    const pos = treeLayout.get(node.id)
    if (!pos) return null
    const nodeX = (nodePositions[node.id]?.x ?? (pos.x - minX + svgPadding))
    const nodeY = (nodePositions[node.id]?.y ?? (pos.y + svgPadding))
    const defaultX = pos.x - minX + svgPadding
    const defaultY = pos.y + svgPadding
    const drawX = nodePositions[node.id]?.x ?? defaultX
    const drawY = nodePositions[node.id]?.y ?? defaultY

    const getChildCoords = (child: TreeNode) => {
      if (nodePositions[child.id]) return nodePositions[child.id]
      const cp = treeLayout.get(child.id)
      return cp ? { x: cp.x - minX + svgPadding, y: cp.y + svgPadding } : { x: drawX, y: drawY }
    }

    return (
      <g key={node.id}>
        {node.left && (() => { const c = getChildCoords(node.left!); return <line x1={drawX} y1={drawY + NODE_R} x2={c.x} y2={c.y - NODE_R} stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.5" /> })()}
        {node.right && (() => { const c = getChildCoords(node.right!); return <line x1={drawX} y1={drawY + NODE_R} x2={c.x} y2={c.y - NODE_R} stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.5" /> })()}
        <circle cx={drawX} cy={drawY} r={NODE_R}
          className={`transition-all duration-300 ease-in-out cursor-grab active:cursor-grabbing stroke-[1.5]
            ${node.highlighted ? "fill-yellow-200 stroke-yellow-500 dark:fill-yellow-900" : "fill-card stroke-primary"}
            ${node.isNew ? "stroke-green-500 stroke-[2]" : ""}
            ${node.isDeleting ? "fill-red-200 stroke-red-500 dark:fill-red-900" : ""}`}
          onMouseDown={(e) => handleNodeDrag(e, node.id, drawX, drawY)}
          onTouchStart={(e) => handleNodeTouchStart(e, node.id, drawX, drawY)}
        />
        <text x={drawX} y={drawY} textAnchor="middle" dominantBaseline="middle"
          className="text-xs font-medium fill-current pointer-events-none select-none">
          {node.value}
        </text>
        {renderTree(node.left)}
        {renderTree(node.right)}
      </g>
    )
  }

  // Replace the handleNodeDrag function with this more robust version
  const handleNodeDrag = (
    event: React.MouseEvent | React.TouchEvent,
    nodeId: number,
    initialX: number,
    initialY: number,
  ) => {
    if (animating) return

    // Prevent default behaviors
    event.preventDefault()

    // Get starting position
    let startX: number, startY: number

    if ("touches" in event) {
      startX = event.touches[0].clientX
      startY = event.touches[0].clientY
    } else {
      startX = event.clientX
      startY = event.clientY
    }

    // Initialize position if not already set
    if (!nodePositions[nodeId]) {
      setNodePositions((prev) => ({
        ...prev,
        [nodeId]: { x: initialX, y: initialY },
      }))
    }

    const currentX = nodePositions[nodeId]?.x || initialX
    const currentY = nodePositions[nodeId]?.y || initialY

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - startX) / scale
      const dy = (e.clientY - startY) / scale

      setNodePositions((prev) => ({
        ...prev,
        [nodeId]: {
          x: currentX + dx,
          y: currentY + dy,
        },
      }))
    }

    // Touch move handler
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const dx = (e.touches[0].clientX - startX) / scale
        const dy = (e.touches[0].clientY - startY) / scale

        setNodePositions((prev) => ({
          ...prev,
          [nodeId]: {
            x: currentX + dx,
            y: currentY + dy,
          },
        }))
      }
    }

    // End handlers
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    const handleTouchEnd = () => {
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }

    // Add event listeners
    if ("touches" in event) {
      document.addEventListener("touchmove", handleTouchMove, { passive: false })
      document.addEventListener("touchend", handleTouchEnd)
    } else {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }
  }

  const handleNodeTouchStart = (event: React.TouchEvent, nodeId: number, initialX: number, initialY: number) => {
    if (animating) return

    // Prevent default behaviors
    event.preventDefault()

    // Get starting position
    const startX = event.touches[0].clientX
    const startY = event.touches[0].clientY

    // Initialize position if not already set
    if (!nodePositions[nodeId]) {
      setNodePositions((prev) => ({
        ...prev,
        [nodeId]: { x: initialX, y: initialY },
      }))
    }

    const currentX = nodePositions[nodeId]?.x || initialX
    const currentY = nodePositions[nodeId]?.y || initialY

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault() // Prevent scrolling

      const dx = (e.touches[0].clientX - startX) / scale
      const dy = (e.touches[0].clientY - startY) / scale

      setNodePositions((prev) => ({
        ...prev,
        [nodeId]: {
          x: currentX + dx,
          y: currentY + dy,
        },
      }))
    }

    const handleTouchEnd = () => {
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }

    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    document.addEventListener("touchend", handleTouchEnd)
  }

  const handleZoomIn = () => {
    setScale((prevScale) => prevScale * 1.1)
  }

  const handleZoomOut = () => {
    setScale((prevScale) => prevScale / 1.1)
  }

  const handlePanLeft = () => {
    setPan((prevPan) => ({ ...prevPan, x: prevPan.x - 20 }))
  }

  const handlePanRight = () => {
    setPan((prevPan) => ({ ...prevPan, x: prevPan.x + 20 }))
  }

  const handleReset = () => {
    setScale(1)
    setPan({ x: 0, y: 0 })
  }

  // Replace the Visualization Panel section with this improved version
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Operations Panel */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Binary Tree Operations</CardTitle>
            <CardDescription>Insert, search, or traverse the binary tree</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={operation} onValueChange={setOperation}>
              <div className="overflow-x-auto pb-2">
                <TabsList className="inline-flex min-w-full md:grid md:grid-cols-2 mb-4">
                  <TabsTrigger value="insert" className="whitespace-nowrap text-xs md:text-sm">
                    Insert
                  </TabsTrigger>
                  <TabsTrigger value="search" className="whitespace-nowrap text-xs md:text-sm">
                    Search
                  </TabsTrigger>
                </TabsList>
              </div>

              {operation === "insert" && (
                <div className="flex space-x-2 mt-4">
                  <Input type="number" placeholder="Enter a value" value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleInsert()}
                    disabled={animating || player.isPlaying}
                  />
                  <Button onClick={handleInsert} disabled={animating || player.isPlaying}>
                    <Plus className="mr-2 h-4 w-4" /> Insert
                  </Button>
                </div>
              )}

              {operation === "search" && (
                <div className="flex space-x-2 mt-4">
                  <Input type="number" placeholder="Enter a value" value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    disabled={animating || player.isPlaying}
                  />
                  <Button onClick={handleSearch} disabled={animating || player.isPlaying} variant="secondary">
                    <Search className="mr-2 h-4 w-4" /> Search
                  </Button>
                </div>
              )}
            </Tabs>

            <div className="mt-6 border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Tree Traversal</h4>
              <div className="flex space-x-2 items-center">
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={traversalType} onChange={(e) => setTraversalType(e.target.value)}
                  disabled={player.isPlaying}
                >
                  <option value="inorder">In-order</option>
                  <option value="preorder">Pre-order</option>
                  <option value="postorder">Post-order</option>
                  <option value="levelorder">Level-order</option>
                </select>

                <Button onClick={handleTraversal} disabled={player.isPlaying || !root} variant="outline">
                  Traverse
                </Button>
              </div>

              {player.totalFrames > 0 && (
                <div className="mt-3">
                  <AnimationControls
                    currentFrame={player.currentFrame} totalFrames={player.totalFrames}
                    isPlaying={player.isPlaying} isPaused={player.isPaused} isComplete={player.isComplete}
                    speed={player.speed}
                    onPlay={player.play} onPause={player.pause}
                    onStepForward={player.stepForward} onStepBackward={player.stepBackward}
                    onReset={() => { player.reset(); setRoot((r) => { const rst = (n: TreeNode | null): TreeNode | null => n ? { ...n, highlighted: false, left: rst(n.left), right: rst(n.right) } : null; return rst(r) }); setTraversalPath([]); setSearchResult(null) }}
                    onSpeedChange={player.setSpeed} onFrameChange={player.goToFrame}
                  />
                </div>
              )}

              {traversalPath.length > 0 && (
                <div className="mt-2 text-sm overflow-x-auto">
                  <span className="font-medium">Path:</span> {traversalPath.join(" → ")}
                </div>
              )}

              <div className="mt-4">
                <h3 className="text-sm font-medium mb-1">Steps:</h3>
                <div className="bg-muted/30 rounded-md p-2 h-28 overflow-y-auto">
                  {steps.length > 0 ? (
                    <ol className="pl-4 list-decimal space-y-0.5">
                      {steps.map((s, i) => (
                        <li key={i} className={`text-xs ${i <= player.currentFrame ? "text-foreground" : "text-muted-foreground"}`}>{s}</li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-xs text-muted-foreground">Search or traverse to see steps</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learning</CardTitle>
            <CardDescription>Understanding Binary Trees</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="mb-2">
              A <strong>Binary Tree</strong> is a tree data structure in which each node has at most two children,
              referred to as the left child and the right child.
            </p>
            <p className="mb-2">
              <strong>Properties:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Each node has at most two children</li>
              <li>The maximum number of nodes at level i is 2^i</li>
              <li>The maximum number of nodes in a binary tree of height h is 2^(h+1) - 1</li>
              <li>In a binary tree with n nodes, the minimum height is log₂(n)</li>
            </ul>
            <p className="mt-2">
              <strong>Applications:</strong> Binary trees are used in many applications including expression parsing,
              Huffman coding, and as a foundation for more complex tree structures like Binary Search Trees and Heaps.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visualization Panel */}
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Visualization</CardTitle>
          <CardDescription>Visual representation of the binary tree</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden">
          {searchResult && <div className="px-6 mb-4 text-sm text-muted-foreground">{searchResult}</div>}

          <div className="flex flex-wrap gap-2 mb-2 px-6">
            <Button size="sm" variant="outline" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4 mr-1" /> Zoom In
            </Button>
            <Button size="sm" variant="outline" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4 mr-1" /> Zoom Out
            </Button>
            <Button size="sm" variant="outline" onClick={handlePanLeft}>
              <MoveHorizontal className="h-4 w-4 mr-1" /> Pan Left
            </Button>
            <Button size="sm" variant="outline" onClick={handlePanRight}>
              <MoveHorizontal className="h-4 w-4 mr-1" /> Pan Right
            </Button>
            <Button size="sm" variant="outline" onClick={handleReset}>
              Reset View
            </Button>
          </div>

          <div className="relative w-full h-[450px] overflow-auto" style={{ overscrollBehavior: "contain" }}>
            <div className="absolute inset-0 min-w-full min-h-full" style={{ minWidth: "800px", minHeight: "600px" }}>
              {root ? (
                <svg
                  ref={svgRef}
                  width="100%"
                  height="100%"
                  viewBox={`${pan.x} ${pan.y} ${svgW} ${svgH}`}
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: "center",
                    transition: "transform 0.2s ease",
                    touchAction: "none",
                  }}
                  className="max-w-none"
                >
                  <g>{renderTree(root)}</g>
                </svg>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">Empty tree</div>
              )}
            </div>
          </div>

          <div className="px-6 py-3 text-xs text-center text-muted-foreground">
            Drag nodes to reposition them. Use zoom and pan controls to navigate larger trees.
            <br />
            Scroll horizontally and vertically to view the entire tree structure.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

