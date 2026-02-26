"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, ZoomIn, ZoomOut, MoveHorizontal, Trash } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import AnimationControls from "@/components/ui/animation-controls"
import CodePanel from "@/components/ui/code-panel"
import { useAnimationPlayer, type AnimationFrame } from "@/hooks/useAnimationPlayer"
import { computeTreeLayout } from "@/lib/tree-layout"

const SEARCH_CODE = [
  "function search(node, value):",
  "  if node == null: return null",
  "  if node.value == value: return node",
  "  if value < node.value:",
  "    return search(node.left, value)",
  "  return search(node.right, value)"
]

const INSERT_CODE = [
  "function insert(node, value):",
  "  if node == null:",
  "    return new Node(value)",
  "  if value < node.value:",
  "    node.left = insert(node.left, value)",
  "  else:",
  "    node.right = insert(node.right, value)",
  "  return node"
]

const DELETE_CODE = [
  "function delete(node, value):",
  "  if node == null: return null",
  "  if value < node.value:",
  "    node.left = delete(node.left, value)",
  "  else if value > node.value:",
  "    node.right = delete(node.right, value)",
  "  else:",
  "    if node.left == null: return node.right",
  "    if node.right == null: return node.left",
  "    node.value = findMin(node.right).value",
  "    node.right = delete(node.right, node.value)",
  "  return node"
]

type TreeNode = {
  id: number
  value: number
  left: TreeNode | null
  right: TreeNode | null
  highlighted?: boolean
  isNew?: boolean
  isDeleting?: boolean
}

type TreeFrame = { root: TreeNode | null; traversalPath: number[]; searchResult: string | null; activeLine: number | null }

export default function BinarySearchTreeVisualizer() {
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
  const [activeCode, setActiveCode] = useState<string[]>([])
  const [activeLine, setActiveLine] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const isMobile = useMobile()

  const onFrameChange = useCallback((snap: TreeFrame) => {
    setRoot(snap.root)
    setTraversalPath(snap.traversalPath)
    setSearchResult(snap.searchResult)
    setActiveLine(snap.activeLine)
  }, [])
  const player = useAnimationPlayer<TreeFrame>(onFrameChange)

  // Initialize with an empty tree
  useEffect(() => {
    setRoot(null)
    setNextId(1)
  }, [])

  const insertNode = (node: TreeNode | null, value: number, newId: number): TreeNode => {
    if (node === null) {
      return { id: newId, value, left: null, right: null, isNew: true }
    }

    if (value < node.value) {
      node.left = insertNode(node.left, value, newId)
    } else if (value > node.value) {
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
    setActiveCode(INSERT_CODE)
    setActiveLine(0)

    setTimeout(() => {
      setActiveLine(1)
      // Create a deep copy of the tree and insert the new node
      const newRoot = root ? JSON.parse(JSON.stringify(root)) : null
      const updatedRoot = insertNode(newRoot, value, nextId)

      setTimeout(() => {
        if (!root) setActiveLine(2)
        else setActiveLine(value < root.value ? 4 : 6)

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
          setActiveLine(null)
        }, 1000)
      }, 500)
    }, 500)

    setInputValue("")
  }

  const findMinNode = (node: TreeNode): TreeNode => {
    let current = node
    while (current.left !== null) {
      current = current.left
    }
    return current
  }

  const deleteNode = (node: TreeNode | null, value: number): TreeNode | null => {
    if (node === null) return null

    if (value < node.value) {
      node.left = deleteNode(node.left, value)
    } else if (value > node.value) {
      node.right = deleteNode(node.right, value)
    } else {
      // Node with the value to be deleted found

      // Case 1: Leaf node (no children)
      if (node.left === null && node.right === null) {
        return null
      }

      // Case 2: Node with only one child
      if (node.left === null) {
        return node.right
      }

      if (node.right === null) {
        return node.left
      }

      // Case 3: Node with two children
      // Find the inorder successor (smallest node in right subtree)
      const successor = findMinNode(node.right)

      // Copy the successor's value to this node
      node.value = successor.value

      // Delete the successor
      node.right = deleteNode(node.right, successor.value)
    }

    return node
  }

  const handleDelete = () => {
    if (!inputValue || animating || !root) return

    const value = Number.parseInt(inputValue)
    setAnimating(true)
    setSearchResult(null)
    setActiveCode(DELETE_CODE)
    setActiveLine(0)

    // First, find the node to highlight it before deletion
    let nodeFound = false

    const findAndHighlightNode = (node: TreeNode | null, val: number): TreeNode | null => {
      if (node === null) return null

      if (val < node.value) {
        node.left = findAndHighlightNode(node.left, val)
      } else if (val > node.value) {
        node.right = findAndHighlightNode(node.right, val)
      } else {
        // Node found
        nodeFound = true
        return { ...node, highlighted: true, isDeleting: true }
      }

      return node
    }

    // Create a deep copy and highlight the node to delete
    const rootCopy = JSON.parse(JSON.stringify(root))
    const highlightedRoot = findAndHighlightNode(rootCopy, value)

    if (!nodeFound) {
      setSearchResult("Node not found")
      setAnimating(false)
      setActiveLine(1)
      setTimeout(() => setActiveLine(null), 1000)
      setInputValue("")
      return
    }

    setRoot(highlightedRoot)
    setActiveLine(value < root.value ? 2 : 4)

    // After highlighting, delete the node
    setTimeout(() => {
      setActiveLine(6)
      const updatedRoot = deleteNode(JSON.parse(JSON.stringify(root)), value)
      setRoot(updatedRoot)
      setSearchResult("Node deleted")

      setTimeout(() => {
        setAnimating(false)
        setActiveLine(null)
      }, 1000)
    }, 1500)

    setInputValue("")
  }

  const handleSearch = () => {
    if (!inputValue || animating || !root) return
    const value = Number.parseInt(inputValue)
    setInputValue("")

    const resetH = (node: TreeNode | null): TreeNode | null =>
      node ? { ...node, highlighted: false, left: resetH(node.left), right: resetH(node.right) } : null
    const setH = (node: TreeNode | null, ids: number[]): TreeNode | null =>
      node ? { ...node, highlighted: ids.includes(node.value), left: setH(node.left, ids), right: setH(node.right, ids) } : null

    const frames: AnimationFrame<TreeFrame>[] = []
    const allSteps: string[] = [`BST Search for value ${value}`]
    const searchPath: number[] = []
    let cur: TreeNode | null = JSON.parse(JSON.stringify(root))
    let found = false
    setActiveCode(SEARCH_CODE)

    frames.push({ snapshot: { root: resetH(JSON.parse(JSON.stringify(root))), traversalPath: [], searchResult: null, activeLine: 0 }, description: `Searching for ${value}` })

    while (cur) {
      searchPath.push(cur.value)
      frames.push({ snapshot: { root: setH(JSON.parse(JSON.stringify(root)), [...searchPath]), traversalPath: [...searchPath], searchResult: null, activeLine: 2 }, description: `Checking ${cur.value}` })
      if (cur.value === value) {
        found = true
        allSteps.push(`✓ Found ${value}!`)
        frames.push({ snapshot: { root: setH(JSON.parse(JSON.stringify(root)), [...searchPath]), traversalPath: [...searchPath], searchResult: "Element found!", activeLine: 2 }, description: `Found ${value} at node ${cur.value}` })
        break
      }
      const direction = value < cur.value ? "left" : "right"
      allSteps.push(`${cur.value}: go ${direction} (${value} ${value < cur.value ? "<" : ">"} ${cur.value})`)
      frames.push({ snapshot: { root: setH(JSON.parse(JSON.stringify(root)), [...searchPath]), traversalPath: [...searchPath], searchResult: null, activeLine: value < cur.value ? 4 : 5 }, description: `Visiting ${cur.value} → go ${direction}` })
      cur = value < cur.value ? cur.left : cur.right
    }

    if (!found) {
      allSteps.push(`✗ ${value} not found in tree`)
      frames.push({ snapshot: { root: resetH(JSON.parse(JSON.stringify(root))), traversalPath: [], searchResult: "Element not found", activeLine: 1 }, description: `${value} not found` })
    }

    setSteps(allSteps)
    player.loadFrames(frames)
    setTimeout(() => player.play(), 50)
  }

  const handleTraversal = () => {
    if (!root) return
    const path: number[] = []
    const inOrder = (n: TreeNode | null) => { if (!n) return; inOrder(n.left); path.push(n.value); inOrder(n.right) }
    const preOrder = (n: TreeNode | null) => { if (!n) return; path.push(n.value); preOrder(n.left); preOrder(n.right) }
    const postOrder = (n: TreeNode | null) => { if (!n) return; postOrder(n.left); postOrder(n.right); path.push(n.value) }
    const bfsOrder = (n: TreeNode | null) => { if (!n) return; const q = [n]; while (q.length) { const c = q.shift()!; path.push(c.value); if (c.left) q.push(c.left); if (c.right) q.push(c.right) } }
    if (traversalType === "inorder") inOrder(root)
    else if (traversalType === "preorder") preOrder(root)
    else if (traversalType === "postorder") postOrder(root)
    else bfsOrder(root)

    const resetH = (node: TreeNode | null): TreeNode | null =>
      node ? { ...node, highlighted: false, left: resetH(node.left), right: resetH(node.right) } : null
    const highlightOne = (node: TreeNode | null, val: number): TreeNode | null =>
      node ? { ...node, highlighted: node.value === val, left: highlightOne(node.left, val), right: highlightOne(node.right, val) } : null

    const frames: AnimationFrame<TreeFrame>[] = []
    const allSteps: string[] = [`${traversalType} traversal of BST`]
    const rootCopy = JSON.parse(JSON.stringify(root)) as TreeNode

    frames.push({ snapshot: { root: resetH(rootCopy), traversalPath: [], searchResult: null, activeLine: 0 }, description: `Starting ${traversalType} traversal` })
    for (let i = 0; i < path.length; i++) {
      allSteps.push(`Visit node ${path[i]}`)
      frames.push({ snapshot: { root: highlightOne(JSON.parse(JSON.stringify(rootCopy)), path[i]), traversalPath: path.slice(0, i + 1), searchResult: null, activeLine: null }, description: `Visiting ${path[i]} (${i + 1}/${path.length})` })
    }
    frames.push({ snapshot: { root: resetH(JSON.parse(JSON.stringify(rootCopy))), traversalPath: path, searchResult: null, activeLine: null }, description: `Traversal complete: ${path.join(" → ")}` })

    setSteps(allSteps)
    player.loadFrames(frames)
    setTimeout(() => player.play(), 50)
  }

  // ── Tree Layout (crossing-free in-order assignment) ──────────────────────
  const NODE_R = isMobile ? 14 : 18
  const treeLayout = useMemo(() => computeTreeLayout(root as never, 65, 80), [root])
  const [nodePositions, setNodePositions] = useState<Record<number, { x: number; y: number }>>({})

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
        {node.left && (() => { const c = getChildCoords(node.left!); return <line x1={drawX} y1={drawY + NODE_R} x2={c.x} y2={c.y - NODE_R} stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.5" /> })()}
        {node.right && (() => { const c = getChildCoords(node.right!); return <line x1={drawX} y1={drawY + NODE_R} x2={c.x} y2={c.y - NODE_R} stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.5" /> })()}
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

  // Add this function to handle touch events:
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

  // Replace the Visualization Panel section with this improved version
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Operations Panel */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Binary Search Tree Operations</CardTitle>
            <CardDescription>Insert, delete, search, or traverse the binary search tree</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={operation} onValueChange={setOperation}>
              <div className="overflow-x-auto pb-2">
                <TabsList className="inline-flex min-w-full md:grid md:grid-cols-3 mb-4">
                  <TabsTrigger value="insert" className="whitespace-nowrap text-xs md:text-sm">
                    Insert
                  </TabsTrigger>
                  <TabsTrigger value="delete" className="whitespace-nowrap text-xs md:text-sm">
                    Delete
                  </TabsTrigger>
                  <TabsTrigger value="search" className="whitespace-nowrap text-xs md:text-sm">
                    Search
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex space-x-2 mt-4">
                <Input
                  type="number"
                  placeholder="Enter a value"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={animating}
                />

                {operation === "insert" && (
                  <Button onClick={handleInsert} disabled={animating}>
                    <Plus className="mr-2 h-4 w-4" />
                    Insert
                  </Button>
                )}

                {operation === "delete" && (
                  <Button onClick={handleDelete} disabled={animating} variant="destructive">
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                )}

                {operation === "search" && (
                  <Button onClick={handleSearch} disabled={animating} variant="secondary">
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                )}
              </div>
            </Tabs>

            <div className="mt-6 border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Tree Traversal</h4>
              <div className="flex space-x-2 items-center">
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={traversalType}
                  onChange={(e) => setTraversalType(e.target.value)}
                  disabled={player.isPlaying}
                >
                  <option value="inorder">In-order</option>
                  <option value="preorder">Pre-order</option>
                  <option value="postorder">Post-order</option>
                </select>

                <Button onClick={handleTraversal} disabled={player.isPlaying || !root} variant="outline">
                  Traverse
                </Button>
              </div>

              {player.totalFrames > 0 && (
                <div className="mt-3">
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
                    onReset={() => { player.reset(); setRoot((r) => { const reset = (n: TreeNode | null): TreeNode | null => n ? { ...n, highlighted: false, left: reset(n.left), right: reset(n.right) } : null; return reset(r) }); setTraversalPath([]); setSearchResult(null) }}
                    onSpeedChange={player.setSpeed}
                    onFrameChange={player.goToFrame}
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
                    <p className="text-xs text-muted-foreground">Run a search or traversal to see steps</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Code Panel */}
        <div className="h-[280px]">
          <CodePanel
            code={activeCode}
            activeLine={activeLine}
            title={activeCode === INSERT_CODE ? "Insertion Algorithm" : activeCode === DELETE_CODE ? "Deletion Algorithm" : activeCode === SEARCH_CODE ? "Search Algorithm" : "BST Algorithm"}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Learning</CardTitle>
            <CardDescription>Understanding Binary Search Trees</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="mb-2">
              A <strong>Binary Search Tree (BST)</strong> is a binary tree where nodes are ordered: for each node, all
              elements in the left subtree are less than the node, and all elements in the right subtree are greater.
            </p>
            <p className="mb-2">
              <strong>Time Complexity:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Search: O(log n) average, O(n) worst case</li>
              <li>Insertion: O(log n) average, O(n) worst case</li>
              <li>Deletion: O(log n) average, O(n) worst case</li>
            </ul>
            <p className="mt-2">
              <strong>Applications:</strong> BSTs are used in many search applications where data is constantly being
              modified. They provide moderate access/search times and moderate insertion/deletion times.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visualization Panel */}
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Visualization</CardTitle>
          <CardDescription>Visual representation of the binary search tree</CardDescription>
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

          <div className="relative w-full h-[350px] md:h-[450px] overflow-auto border-t" style={{ overscrollBehavior: "contain" }}>
            <div className="absolute inset-0 flex items-center justify-center p-4">
              {root ? (
                <div className="w-full h-full flex items-center justify-center overflow-auto">
                  <svg
                    ref={svgRef}
                    width={svgW}
                    height={svgH}
                    viewBox={`0 0 ${svgW} ${svgH}`}
                    style={{
                      transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)`,
                      transformOrigin: "center",
                      transition: "transform 0.2s ease",
                      touchAction: "none",
                    }}
                    className="max-w-none"
                  >
                    <g>{renderTree(root)}</g>
                  </svg>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Empty tree</div>
              )}
            </div>
          </div>

          <div className="px-6 py-3 text-[10px] md:text-xs text-center text-muted-foreground bg-muted/5 border-t">
            Drag nodes to reposition. Use zoom/pan controls to navigate.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

