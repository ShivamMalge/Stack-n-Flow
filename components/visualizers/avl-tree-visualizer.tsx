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
import CodePanel from "@/components/ui/code-panel"
import { useAnimationPlayer, type AnimationFrame } from "@/hooks/useAnimationPlayer"
import { computeTreeLayout } from "@/lib/tree-layout"

const SEARCH_CODE = [
  "def search(node, value):",
  "    if not node: return None",
  "    if node.value == value: return node",
  "    if value < node.value:",
  "        return search(node.left, value)",
  "    return search(node.right, value)"
]

const INSERT_CODE = [
  "def insert(node, value):",
  "    # 1. Standard BST Insert",
  "    if not node: return Node(value)",
  "    if value < node.value:",
  "        node.left = insert(node.left, value)",
  "    else: node.right = insert(node.right, value)",
  "    # 2. Update height",
  "    node.height = 1 + max(h(left), h(right))",
  "    # 3. Balance & Rotate",
  "    balance = get_balance(node)",
  "    if balance > 1 and value < node.left.value:",
  "        return right_rotate(node)",
  "    if balance < -1 and value > node.right.value:",
  "        return left_rotate(node)",
  "    # ... other cases (LR, RL)",
  "    return node"
]

type TreeNode = {
  id: number
  value: number
  height: number
  left: TreeNode | null
  right: TreeNode | null
  highlighted?: boolean
  isNew?: boolean
  isDeleting?: boolean
  isRotating?: boolean
  balanceFactor?: number
}

type AVLFrame = { root: TreeNode | null; traversalPath: number[]; searchResult: string | null; activeLine: number | null }

export default function AVLTreeVisualizer() {
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
  const [rotationInfo, setRotationInfo] = useState<string | null>(null)
  const [steps, setSteps] = useState<string[]>([])
  const [activeCode, setActiveCode] = useState<string[]>([])
  const [activeLine, setActiveLine] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const isMobile = useMobile()

  const onFrameChange = useCallback((snap: AVLFrame) => {
    setRoot(snap.root)
    setTraversalPath(snap.traversalPath)
    setSearchResult(snap.searchResult)
    setActiveLine(snap.activeLine)
  }, [])
  const player = useAnimationPlayer<AVLFrame>(onFrameChange)

  // Initialize with an empty tree
  useEffect(() => {
    setRoot(null)
    setNextId(1)
  }, [])

  // Helper functions for AVL tree operations
  const getHeight = (node: TreeNode | null): number => {
    if (node === null) return 0
    return node.height
  }

  const getBalanceFactor = (node: TreeNode | null): number => {
    if (node === null) return 0
    return getHeight(node.left) - getHeight(node.right)
  }

  const rightRotate = (y: TreeNode): TreeNode => {
    const x = y.left!
    const T2 = x.right

    // Perform rotation
    x.right = y
    y.left = T2

    // Update heights
    y.height = Math.max(getHeight(y.left), getHeight(y.right)) + 1
    x.height = Math.max(getHeight(x.left), getHeight(x.right)) + 1

    // Mark nodes as rotating for animation
    x.isRotating = true
    y.isRotating = true

    // Return new root
    return x
  }

  const leftRotate = (x: TreeNode): TreeNode => {
    const y = x.right!
    const T2 = y.left

    // Perform rotation
    y.left = x
    x.right = T2

    // Update heights
    x.height = Math.max(getHeight(x.left), getHeight(x.right)) + 1
    y.height = Math.max(getHeight(y.left), getHeight(y.right)) + 1

    // Mark nodes as rotating for animation
    x.isRotating = true
    y.isRotating = true

    // Return new root
    return y
  }

  const insertNode = (
    node: TreeNode | null,
    value: number,
    newId: number,
  ): { node: TreeNode | null; rotationType: string | null } => {
    // 1. Perform standard BST insertion
    if (node === null) {
      return {
        node: { id: newId, value, height: 1, left: null, right: null, isNew: true },
        rotationType: null,
      }
    }

    let rotationType: string | null = null

    if (value < node.value) {
      const result = insertNode(node.left, value, newId)
      node.left = result.node
      rotationType = result.rotationType
    } else if (value > node.value) {
      const result = insertNode(node.right, value, newId)
      node.right = result.node
      rotationType = result.rotationType
    } else {
      // Duplicate value, do nothing
      return { node, rotationType: null }
    }

    // 2. Update height of this ancestor node
    node.height = Math.max(getHeight(node.left), getHeight(node.right)) + 1

    // 3. Get the balance factor to check if this node became unbalanced
    const balance = getBalanceFactor(node)
    node.balanceFactor = balance

    // 4. If unbalanced, there are 4 cases

    // Left Left Case
    if (balance > 1 && node.left && value < node.left.value) {
      rotationType = "Right Rotation (LL case)"
      return { node: rightRotate(node), rotationType }
    }

    // Right Right Case
    if (balance < -1 && node.right && value > node.right.value) {
      rotationType = "Left Rotation (RR case)"
      return { node: leftRotate(node), rotationType }
    }

    // Left Right Case
    if (balance > 1 && node.left && value > node.left.value) {
      node.left = leftRotate(node.left)
      rotationType = "Left-Right Rotation (LR case)"
      return { node: rightRotate(node), rotationType }
    }

    // Right Left Case
    if (balance < -1 && node.right && value < node.right.value) {
      node.right = rightRotate(node.right)
      rotationType = "Right-Left Rotation (RL case)"
      return { node: leftRotate(node), rotationType }
    }

    // Return the unchanged node
    return { node, rotationType }
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
    setRotationInfo(null)
    setActiveCode(INSERT_CODE)
    setActiveLine(0)

    // Create a deep copy of the tree and insert the new node
    const newRoot = root ? JSON.parse(JSON.stringify(root)) : null

    setTimeout(() => {
      setActiveLine(2)
      const result = insertNode(newRoot, value, nextId)
      const updatedRoot = result.node

      setTimeout(() => {
        setActiveLine(7)
        if (result.rotationType) {
          setRotationInfo(result.rotationType)
          setActiveLine(10)
        } else {
          setActiveLine(15)
        }

        setRoot(updatedRoot)
        setNextId(nextId + 1)

        // After animation, remove the animation flags
        setTimeout(() => {
          const removeAnimationFlags = (node: TreeNode | null): TreeNode | null => {
            if (node === null) return null

            return {
              ...node,
              isNew: false,
              isRotating: false,
              left: removeAnimationFlags(node.left),
              right: removeAnimationFlags(node.right),
            }
          }

          setRoot(removeAnimationFlags(updatedRoot))
          setAnimating(false)
          setActiveLine(null)
        }, 1000)
      }, 500)
    }, 500)

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

    const frames: AnimationFrame<AVLFrame>[] = []
    const allSteps: string[] = [`AVL Search for ${value}`]
    const searchPath: number[] = []
    let cur: TreeNode | null = JSON.parse(JSON.stringify(root))
    let found = false
    setActiveCode(SEARCH_CODE)

    frames.push({ snapshot: { root: resetH(JSON.parse(JSON.stringify(root))), traversalPath: [], searchResult: null, activeLine: 0 }, description: `Searching for ${value}` })

    while (cur) {
      searchPath.push(cur.value)
      frames.push({ snapshot: { root: setH(JSON.parse(JSON.stringify(root)), [...searchPath]), traversalPath: [...searchPath], searchResult: null, activeLine: 2 }, description: `At ${cur.value}?` })
      if (cur.value === value) {
        found = true
        allSteps.push(`✓ Found ${value}!`)
        frames.push({ snapshot: { root: setH(JSON.parse(JSON.stringify(root)), [...searchPath]), traversalPath: [...searchPath], searchResult: "Element found!", activeLine: 2 }, description: `Found ${value}` })
        break
      }
      const dir = value < cur.value ? "left" : "right"
      allSteps.push(`${cur.value}: go ${dir}`)
      frames.push({ snapshot: { root: setH(JSON.parse(JSON.stringify(root)), [...searchPath]), traversalPath: [...searchPath], searchResult: null, activeLine: value < cur.value ? 4 : 5 }, description: `At ${cur.value} → go ${dir}` })
      cur = value < cur.value ? cur.left : cur.right
    }
    if (!found) {
      allSteps.push(`✗ ${value} not found`)
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
    if (traversalType === "inorder") inOrder(root)
    else if (traversalType === "preorder") preOrder(root)
    else postOrder(root)

    const resetH = (node: TreeNode | null): TreeNode | null =>
      node ? { ...node, highlighted: false, left: resetH(node.left), right: resetH(node.right) } : null
    const highlightOne = (node: TreeNode | null, val: number): TreeNode | null =>
      node ? { ...node, highlighted: node.value === val, left: highlightOne(node.left, val), right: highlightOne(node.right, val) } : null

    const frames: AnimationFrame<AVLFrame>[] = []
    const allSteps: string[] = [`${traversalType} traversal of AVL Tree`]
    const rootCopy = JSON.parse(JSON.stringify(root)) as TreeNode

    frames.push({ snapshot: { root: resetH(rootCopy), traversalPath: [], searchResult: null, activeLine: 0 }, description: `Starting ${traversalType} traversal` })
    for (let i = 0; i < path.length; i++) {
      allSteps.push(`Visit ${path[i]}`)
      frames.push({ snapshot: { root: highlightOne(JSON.parse(JSON.stringify(rootCopy)), path[i]), traversalPath: path.slice(0, i + 1), searchResult: null, activeLine: null }, description: `Visiting ${path[i]} (${i + 1}/${path.length})` })
    }
    frames.push({ snapshot: { root: resetH(JSON.parse(JSON.stringify(rootCopy))), traversalPath: path, searchResult: null, activeLine: null }, description: `Done: ${path.join(" → ")}` })
    setSteps(allSteps)
    player.loadFrames(frames)
    setTimeout(() => player.play(), 50)
  }

  // ── Tree Layout (crossing-free in-order assignment) ──────────────────────
  const NODE_R = isMobile ? 14 : 18
  const treeLayout = useMemo(() => computeTreeLayout(root as never, 65, 90), [root])
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
    const balanceFactor = node.balanceFactor !== undefined ? node.balanceFactor : getBalanceFactor(node)

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
            ${node.isDeleting ? "fill-red-200 stroke-red-500 dark:fill-red-900" : ""}
            ${node.isRotating ? "fill-blue-200 stroke-blue-500 dark:fill-blue-900" : ""}
            ${Math.abs(balanceFactor) > 1 ? "fill-orange-200 stroke-orange-500 dark:fill-orange-900" : ""}`}
          onMouseDown={(e) => handleNodeDrag(e, node.id, drawX, drawY)}
          onTouchStart={(e) => handleNodeTouchStart(e, node.id, drawX, drawY)}
        />
        <text x={drawX} y={drawY - 3} textAnchor="middle" dominantBaseline="middle"
          className="text-xs font-medium fill-current pointer-events-none select-none">{node.value}</text>
        <text x={drawX} y={drawY + 7} textAnchor="middle" dominantBaseline="middle"
          className={`text-[9px] fill-current pointer-events-none ${Math.abs(balanceFactor) > 1 ? "font-bold" : ""}`}>{balanceFactor}</text>
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
      {/* Operations Panel - Top on Mobile, Left on Desktop */}
      <div className="order-1 md:col-start-1">
        <Card>
          <CardHeader>
            <CardTitle>AVL Tree Operations</CardTitle>
            <CardDescription>Insert, search, or traverse the self-balancing AVL tree</CardDescription>
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

              <div className="flex space-x-2 mt-4">
                <Input
                  type="number"
                  placeholder="Enter a value"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (operation === "insert" ? handleInsert() : handleSearch())}
                  disabled={animating}
                />

                {operation === "insert" && (
                  <Button onClick={handleInsert} disabled={animating}>
                    <Plus className="mr-2 h-4 w-4" />
                    Insert
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

            {rotationInfo && (
              <div className="mt-4 p-2 rounded text-center bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                {rotationInfo}
              </div>
            )}

            <div className="mt-6 border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Tree Traversal</h4>
              <div className="flex space-x-2 items-center">
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={traversalType}
                  onChange={(e) => setTraversalType(e.target.value)}
                  disabled={animating}
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
                    onReset={() => { player.reset(); setRoot((r) => { const rst = (n: TreeNode | null): TreeNode | null => n ? { ...n, highlighted: false, left: rst(n.left), right: rst(n.right) } : null; return rst(r) }); setTraversalPath([]); setSearchResult(null); setActiveLine(null) }}
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
      </div>

      {/* Visualization Panel - Second on Mobile, Right on Desktop */}
      <div className="order-2 md:col-start-2 md:row-span-3">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Visualization</CardTitle>
            <CardDescription>
              Visual representation of the AVL tree (numbers inside nodes show balance factors)
            </CardDescription>
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

            <div className="flex flex-wrap justify-center mt-4 gap-3 text-[10px] md:text-xs px-6 border-t pt-4">
              <div className="flex items-center bg-background px-2 py-0.5 rounded border">
                <div className="w-2.5 h-2.5 bg-card border border-primary rounded-full mr-1.5"></div>
                <span>Balanced</span>
              </div>
              <div className="flex items-center bg-background px-2 py-0.5 rounded border">
                <div className="w-2.5 h-2.5 bg-orange-200 border border-orange-500 rounded-full mr-1.5"></div>
                <span>Unbalanced</span>
              </div>
              <div className="flex items-center bg-background px-2 py-0.5 rounded border">
                <div className="w-2.5 h-2.5 bg-blue-200 border border-blue-500 rounded-full mr-1.5"></div>
                <span>Rotating</span>
              </div>
              <div className="flex items-center bg-background px-2 py-0.5 rounded border">
                <div className="w-2.5 h-2.5 bg-green-200 border border-green-500 rounded-full mr-1.5"></div>
                <span>New</span>
              </div>
            </div>

            <div className="px-6 py-3 text-[10px] md:text-xs text-center text-muted-foreground bg-muted/5 mt-2">
              Drag nodes to reposition. Balance factors shown inside nodes.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Code Panel - Third on Mobile, Left on Desktop */}
      <div className="order-3 md:col-start-1 h-[280px]">
        <CodePanel
          code={activeCode}
          activeLine={activeLine}
          title={activeCode === INSERT_CODE ? "Insertion Algorithm" : activeCode === SEARCH_CODE ? "Search Algorithm" : "AVL Algorithm"}
        />
      </div>

      {/* Learning Panel - Last on Mobile, Left on Desktop */}
      <div className="order-4 md:col-start-1">
        <Card>
          <CardHeader>
            <CardTitle>Learning</CardTitle>
            <CardDescription>Understanding AVL Trees</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="mb-2">
              An <strong>AVL Tree</strong> is a self-balancing binary search tree where the difference between heights
              of left and right subtrees cannot be more than one for all nodes.
            </p>
            <p className="mb-2">
              <strong>Balance Factor</strong> = Height of left subtree - Height of right subtree
            </p>
            <p className="mb-2">
              <strong>Rotations:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Left Rotation: Used when right subtree becomes higher</li>
              <li>Right Rotation: Used when left subtree becomes higher</li>
              <li>Left-Right Rotation: Left rotation on child followed by right rotation on parent</li>
              <li>Right-Left Rotation: Right rotation on child followed by left rotation on parent</li>
            </ul>
            <p className="mt-2">
              <strong>Time Complexity:</strong> All operations (search, insert, delete) take O(log n) time in both
              average and worst cases.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

