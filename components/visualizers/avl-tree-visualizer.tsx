"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, ZoomIn, ZoomOut, MoveHorizontal } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import AnimationControls from "@/components/ui/animation-controls"
import { useAnimationPlayer, type AnimationFrame } from "@/hooks/useAnimationPlayer"

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

type AVLFrame = { root: TreeNode | null; traversalPath: number[]; searchResult: string | null }

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
  const svgRef = useRef<SVGSVGElement>(null)
  const isMobile = useMobile()

  const onFrameChange = useCallback((snap: AVLFrame) => {
    setRoot(snap.root)
    setTraversalPath(snap.traversalPath)
    setSearchResult(snap.searchResult)
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

    // Create a deep copy of the tree and insert the new node
    const newRoot = root ? JSON.parse(JSON.stringify(root)) : null
    const result = insertNode(newRoot, value, nextId)
    const updatedRoot = result.node

    if (result.rotationType) {
      setRotationInfo(result.rotationType)
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

    const frames: AnimationFrame<AVLFrame>[] = []
    const allSteps: string[] = [`AVL Search for ${value}`]
    const searchPath: number[] = []
    let cur: TreeNode | null = JSON.parse(JSON.stringify(root))
    let found = false

    frames.push({ snapshot: { root: resetH(JSON.parse(JSON.stringify(root))), traversalPath: [], searchResult: null }, description: `Searching for ${value}` })

    while (cur) {
      searchPath.push(cur.value)
      if (cur.value === value) {
        found = true
        allSteps.push(`✓ Found ${value}!`)
        frames.push({ snapshot: { root: setH(JSON.parse(JSON.stringify(root)), [...searchPath]), traversalPath: [...searchPath], searchResult: "Element found!" }, description: `Found ${value}` })
        break
      }
      const dir = value < cur.value ? "left" : "right"
      allSteps.push(`${cur.value}: go ${dir}`)
      frames.push({ snapshot: { root: setH(JSON.parse(JSON.stringify(root)), [...searchPath]), traversalPath: [...searchPath], searchResult: null }, description: `At ${cur.value} → go ${dir}` })
      cur = value < cur.value ? cur.left : cur.right
    }
    if (!found) {
      allSteps.push(`✗ ${value} not found`)
      frames.push({ snapshot: { root: resetH(JSON.parse(JSON.stringify(root))), traversalPath: [], searchResult: "Element not found" }, description: `${value} not found` })
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

    frames.push({ snapshot: { root: resetH(rootCopy), traversalPath: [], searchResult: null }, description: `Starting ${traversalType} traversal` })
    for (let i = 0; i < path.length; i++) {
      allSteps.push(`Visit ${path[i]}`)
      frames.push({ snapshot: { root: highlightOne(JSON.parse(JSON.stringify(rootCopy)), path[i]), traversalPath: path.slice(0, i + 1), searchResult: null }, description: `Visiting ${path[i]} (${i + 1}/${path.length})` })
    }
    frames.push({ snapshot: { root: resetH(JSON.parse(JSON.stringify(rootCopy))), traversalPath: path, searchResult: null }, description: `Done: ${path.join(" → ")}` })
    setSteps(allSteps)
    player.loadFrames(frames)
    setTimeout(() => player.play(), 50)
  }

  // Calculate tree dimensions
  const getTreeDimensions = (node: TreeNode | null, level = 0, position = 0): { width: number; height: number } => {
    if (!node) return { width: 0, height: 0 }

    const leftDimensions = getTreeDimensions(node.left, level + 1, position - 1)
    const rightDimensions = getTreeDimensions(node.right, level + 1, position + 1)

    const width = Math.max(Math.abs(position) * 50 + 30, leftDimensions.width, rightDimensions.width) // Reduced from 60/40
    const height = (level + 1) * 70 // Reduced from 80

    return { width, height }
  }

  const treeDimensions = root ? getTreeDimensions(root) : { width: 0, height: 0 }
  const viewBoxWidth = Math.max(300, treeDimensions.width * 2)
  const viewBoxHeight = Math.max(200, treeDimensions.height + 40)

  // Add node dragging functionality
  const [nodePositions, setNodePositions] = useState<Record<number, { x: number; y: number }>>({})

  // Update the renderTree function to better utilize space and add dragging functionality
  const renderTree = (node: TreeNode | null, x: number, y: number, level: number) => {
    if (!node) return null

    // Adjust spacing based on tree size and device - REDUCED NODE SIZE
    const nodeSize = isMobile ? 24 : 32 // Reduced from 30/40
    const horizontalSpacing = isMobile ? Math.max(25, 100 / (level + 1)) : Math.max(50, 180 / (level + 0.5)) // Reduced spacing
    const verticalSpacing = isMobile ? 50 : 70 // Reduced from 60/80

    // Calculate balance factor for display
    const balanceFactor = node.balanceFactor !== undefined ? node.balanceFactor : getBalanceFactor(node)

    // Use custom position if available
    const customPos = nodePositions[node.id]
    const nodeX = customPos ? customPos.x : x
    const nodeY = customPos ? customPos.y : y

    return (
      <g key={node.id}>
        {/* Draw lines to children */}
        {node.left && (
          <line
            key={`line-left-${node.id}`}
            x1={nodeX}
            y1={nodeY + nodeSize / 2}
            x2={nodePositions[node.left.id]?.x || nodeX - horizontalSpacing}
            y2={nodePositions[node.left.id]?.y || nodeY + verticalSpacing - nodeSize / 2}
            stroke="currentColor"
            strokeOpacity="0.3"
            strokeWidth="1.5" // Reduced from 2
          />
        )}

        {node.right && (
          <line
            key={`line-right-${node.id}`}
            x1={nodeX}
            y1={nodeY + nodeSize / 2}
            x2={nodePositions[node.right.id]?.x || nodeX + horizontalSpacing}
            y2={nodePositions[node.right.id]?.y || nodeY + verticalSpacing - nodeSize / 2}
            stroke="currentColor"
            strokeOpacity="0.3"
            strokeWidth="1.5" // Reduced from 2
          />
        )}

        {/* Draw the node */}
        <circle
          cx={nodeX}
          cy={nodeY}
          r={nodeSize / 2}
          className={`
    transition-all duration-500 ease-in-out cursor-grab active:cursor-grabbing
    ${node.highlighted ? "fill-yellow-200 stroke-yellow-500 dark:fill-yellow-900" : "fill-card stroke-primary"}
    ${node.isNew ? "stroke-green-500 stroke-[2]" : "stroke-[1.5]"}  /* Reduced stroke width */
    ${node.isDeleting ? "fill-red-200 stroke-red-500 dark:fill-red-900" : ""}
    ${node.isRotating ? "fill-blue-200 stroke-blue-500 dark:fill-blue-900" : ""}
    ${Math.abs(balanceFactor) > 1 ? "fill-orange-200 stroke-orange-500 dark:fill-orange-900" : ""}
  `}
          onMouseDown={(e) => handleNodeDrag(e, node.id, nodeX, nodeY)}
          onTouchStart={(e) => handleNodeTouchStart(e, node.id, nodeX, nodeY)}
        />

        <text
          x={nodeX}
          y={nodeY - 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className={`text-${isMobile ? "xs" : "xs"} font-medium fill-current pointer-events-none`} // Reduced text size
        >
          {node.value}
        </text>

        {/* Display balance factor */}
        <text
          x={nodeX}
          y={nodeY + 8} // Adjusted position
          textAnchor="middle"
          dominantBaseline="middle"
          className={`text-[10px] fill-current pointer-events-none ${Math.abs(balanceFactor) > 1 ? "font-bold" : ""}`} // Reduced text size
        >
          {balanceFactor}
        </text>

        {/* Render children */}
        {node.left && renderTree(node.left, nodeX - horizontalSpacing, nodeY + verticalSpacing, level + 1)}
        {node.right && renderTree(node.right, nodeX + horizontalSpacing, nodeY + verticalSpacing, level + 1)}
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
                    onReset={() => { player.reset(); setRoot((r) => { const rst = (n: TreeNode | null): TreeNode | null => n ? { ...n, highlighted: false, left: rst(n.left), right: rst(n.right) } : null; return rst(r) }); setTraversalPath([]); setSearchResult(null) }}
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

      {/* Visualization Panel */}
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

          <div className="relative w-full h-[450px] overflow-auto" style={{ overscrollBehavior: "contain" }}>
            <div className="absolute inset-0 min-w-full min-h-full" style={{ minWidth: "800px", minHeight: "600px" }}>
              {root ? (
                <svg
                  ref={svgRef}
                  width="100%"
                  height="100%"
                  viewBox={`${-viewBoxWidth / 2 + pan.x} ${-20 + pan.y} ${viewBoxWidth} ${viewBoxHeight}`}
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: "center",
                    transition: "transform 0.2s ease",
                    touchAction: "none",
                  }}
                  className="max-w-none"
                >
                  <g>{renderTree(root, 0, 0, 1)}</g>
                </svg>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">Empty tree</div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-center mt-4 space-x-2 text-xs px-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-card border border-primary rounded-full mr-1"></div>
              <span>Balanced</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-200 border border-orange-500 rounded-full mr-1"></div>
              <span>Unbalanced</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-200 border border-blue-500 rounded-full mr-1"></div>
              <span>Rotating</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-200 border border-green-500 rounded-full mr-1"></div>
              <span>New</span>
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

