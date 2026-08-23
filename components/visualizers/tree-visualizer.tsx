"use client"

import type React from "react"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, ZoomIn, ZoomOut, MoveHorizontal, MoveVertical } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { MAX_INPUT_MESSAGE, parseBoundedInt } from "@/lib/constants"
import { resolveState, STATE_SHAPE } from "@/lib/visualizer-states"
import { computeTreeLayout } from "@/lib/tree-layout"
import InlineAlert from "@/components/ui/inline-alert"
import VisualizerLayout from "@/components/visualizers/visualizer-layout"
import CodePanel from "@/components/ui/code-panel"
import { IN_ORDER, TRAVERSALS } from "@/lib/templates/algorithms"

type TreeNode = {
  id: number
  value: number
  left: TreeNode | null
  right: TreeNode | null
  highlighted?: boolean
  isNew?: boolean
  isDeleting?: boolean
}

export default function TreeVisualizer({
  controlledRoot,
}: {
  controlledRoot?: TreeNode | null;
} = {}) {
  const [internalRoot, setRoot] = useState<TreeNode | null>(null)
  const root = controlledRoot !== undefined ? controlledRoot : internalRoot;
  const [inputValue, setInputValue] = useState("")
  const [operation, setOperation] = useState("insert")
  const [animating, setAnimating] = useState(false)
  const [nextId, setNextId] = useState(1)
  const [traversalPath, setTraversalPath] = useState<number[]>([])
  const [traversalType, setTraversalType] = useState("inorder")
  /**
   * Line of the traversal the animation is on. Each tick lands on a node, and
   * landing on a node *is* the visit, so step 2 is what a tick means; the
   * descents either side of it happen between ticks.
   */
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const [searchResult, setSearchResult] = useState<string | null>(null)
  const [inputError, setInputError] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement>(null)
  const isMobile = useMobile()

  // Registry of every animation timer. This component renders inside a tab, so it
  // can be unmounted mid-animation; without this, pending callbacks keep firing
  // and call setState on an unmounted component (leaving `animating` stuck true).
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([])

  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout)
    intervalsRef.current.forEach(clearInterval)
  }, [])

  // Mirror of the live tree so timer callbacks read the current value instead of
  // the one captured in the closure at click time.
  const rootRef = useRef(root)
  useEffect(() => {
    rootRef.current = root
  }, [root])

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
    setInputError(null)

    if (!inputValue || animating) return

    const value = parseBoundedInt(inputValue)

    // Reject empty, non-numeric, and out-of-range input
    if (value === null) {
      setInputError(MAX_INPUT_MESSAGE)
      return
    }

    setAnimating(true)

    // Create a deep copy of the tree and insert the new node
    const currentRoot = rootRef.current
    const newRoot = currentRoot ? structuredClone(currentRoot) : null
    const updatedRoot = insertNode(newRoot, value, nextId)
    setRoot(updatedRoot)
    setNextId(nextId + 1)

    // After animation, remove the "isNew" flag
    timersRef.current.push(setTimeout(() => {
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
    }, 1000))

    setInputValue("")
  }

  const handleSearch = () => {
    if (!inputValue || animating) return

    const value = Number.parseInt(inputValue)
    setAnimating(true)
    setSearchResult(null)

    // Reset all highlights
    const resetHighlights = (node: TreeNode | null): TreeNode | null => {
      if (node === null) return null

      return {
        ...node,
        highlighted: false,
        left: resetHighlights(node.left),
        right: resetHighlights(node.right),
      }
    }

    setRoot(resetHighlights(structuredClone(rootRef.current)))

    // Animate search through the tree
    const searchPath: number[] = []
    let currentNode = rootRef.current
    let found = false

    const searchInterval = setInterval(() => {
      if (!currentNode) {
        clearInterval(searchInterval)
        setAnimating(false)
        if (!found) {
          setSearchResult("Element not found")
        }
        return
      }

      searchPath.push(currentNode.value)

      const highlightNode = (node: TreeNode | null, path: number[]): TreeNode | null => {
        if (node === null) return null

        return {
          ...node,
          highlighted: path.includes(node.value),
          left: highlightNode(node.left, path),
          right: highlightNode(node.right, path),
        }
      }

      setRoot(highlightNode(structuredClone(rootRef.current), searchPath))

      if (currentNode.value === value) {
        found = true
        setSearchResult("Element found")
        clearInterval(searchInterval)
        timersRef.current.push(setTimeout(() => {
          setRoot(resetHighlights(structuredClone(rootRef.current)))
          setAnimating(false)
        }, 1500))
        return
      }

      if (value < currentNode.value) {
        currentNode = currentNode.left
      } else {
        currentNode = currentNode.right
      }

      if (!currentNode) {
        clearInterval(searchInterval)
        timersRef.current.push(setTimeout(() => {
          setRoot(resetHighlights(structuredClone(rootRef.current)))
          setAnimating(false)
          if (!found) {
            setSearchResult("Element not found")
          }
        }, 1000))
      }
    }, 500)

    intervalsRef.current.push(searchInterval)

    setInputValue("")
  }

  const handleTraversal = () => {
    if (animating || !root) return

    setAnimating(true)
    setTraversalPath([])

    // Reset all highlights
    const resetHighlights = (node: TreeNode | null): TreeNode | null => {
      if (node === null) return null

      return {
        ...node,
        highlighted: false,
        left: resetHighlights(node.left),
        right: resetHighlights(node.right),
      }
    }

    const currentRoot = rootRef.current
    setRoot(resetHighlights(structuredClone(currentRoot)))

    // Get traversal path based on selected type
    const path: number[] = []

    const inOrderTraversal = (node: TreeNode | null) => {
      if (node === null) return
      inOrderTraversal(node.left)
      path.push(node.value)
      inOrderTraversal(node.right)
    }

    const preOrderTraversal = (node: TreeNode | null) => {
      if (node === null) return
      path.push(node.value)
      preOrderTraversal(node.left)
      preOrderTraversal(node.right)
    }

    const postOrderTraversal = (node: TreeNode | null) => {
      if (node === null) return
      postOrderTraversal(node.left)
      postOrderTraversal(node.right)
      path.push(node.value)
    }

    if (traversalType === "inorder") {
      inOrderTraversal(currentRoot)
    } else if (traversalType === "preorder") {
      preOrderTraversal(currentRoot)
    } else {
      postOrderTraversal(currentRoot)
    }

    // Animate traversal
    let index = 0

    const traversalInterval = setInterval(() => {
      if (index >= path.length) {
        clearInterval(traversalInterval)
        timersRef.current.push(setTimeout(() => {
          setRoot(resetHighlights(structuredClone(rootRef.current)))
          setAnimating(false)
          setActiveStep(null)
        }, 1000))
        return
      }

      setActiveStep(2)

      setTraversalPath(path.slice(0, index + 1))

      const highlightNode = (node: TreeNode | null, value: number): TreeNode | null => {
        if (node === null) return null

        return {
          ...node,
          highlighted: node.value === value,
          left: highlightNode(node.left, value),
          right: highlightNode(node.right, value),
        }
      }

      setRoot(highlightNode(structuredClone(rootRef.current), path[index]))

      index++
    }, 800)

    intervalsRef.current.push(traversalInterval)
  }

  /*
    Node positions come from the shared in-order layout, the same one the BST,
    AVL and binary-tree visualizers use.

    They previously came from a recursive renderer whose horizontal step was
    `max(60, 200 / (level + 0.5))` — a step that never falls below 60, so a
    left-leaning tree reached x = -273 — while the viewBox was sized by a
    *different* model (`|position| * 60 + 40`) that only ever reported 220.
    Everything past +/-220 was clipped, and because the scroller's scrollWidth
    equalled its clientWidth there was nothing to scroll to: those nodes were
    unreachable. Deriving the viewBox from the real extents cannot drift.
  */
  const NODE_R = isMobile ? 15 : 20
  const treeLayout = useMemo(
    () => computeTreeLayout(root as never, isMobile ? 44 : 65, isMobile ? 60 : 80),
    [root, isMobile],
  )

  const svgPadding = 30
  const layoutPositions = Array.from(treeLayout.values())
  const minX = layoutPositions.length ? Math.min(...layoutPositions.map((pos) => pos.x)) : 0
  const maxX = layoutPositions.length ? Math.max(...layoutPositions.map((pos) => pos.x)) : 0
  const maxY = layoutPositions.length ? Math.max(...layoutPositions.map((pos) => pos.y)) : 0
  const svgW = Math.max(300, maxX - minX + svgPadding * 2)
  const svgH = Math.max(200, maxY + svgPadding * 2)

  // Update the renderTree function to better utilize space and add dragging functionality
  const renderTree = (node: TreeNode | null): React.ReactNode => {
    if (!node) return null
    const pos = treeLayout.get(node.id)
    if (!pos) return null

    const defaultX = pos.x - minX + svgPadding
    const defaultY = pos.y + svgPadding
    // A dragged node wins over its computed slot. The renderer used to ignore
    // `nodePositions` entirely, so "drag nodes to reposition" did nothing.
    const drawX = nodePositions[node.id]?.x ?? defaultX
    const drawY = nodePositions[node.id]?.y ?? defaultY

    const childCoords = (child: TreeNode) => {
      if (nodePositions[child.id]) return nodePositions[child.id]
      const cp = treeLayout.get(child.id)
      return cp ? { x: cp.x - minX + svgPadding, y: cp.y + svgPadding } : null
    }

    return (
      <g key={node.id}>
        {([node.left, node.right] as (TreeNode | null | undefined)[]).map((child) => {
          if (!child) return null
          const cc = childCoords(child)
          if (!cc) return null
          return (
            <line
              key={`edge-${node.id}-${child.id}`}
              x1={drawX}
              y1={drawY}
              x2={cc.x}
              y2={cc.y}
              stroke="currentColor"
              strokeOpacity="0.3"
              strokeWidth="2"
            />
          )
        })}

        <circle
          cx={drawX}
          cy={drawY}
          r={NODE_R}
          className={`
          transition-all duration-500 ease-in-out cursor-move
          ${node.isNew ? "" : "stroke-[2]"}
          ${STATE_SHAPE[resolveState({
            removed: node.isDeleting,
            comparing: node.highlighted,
            inserted: node.isNew,
          })]}
        `}
          onMouseDown={(e) => handleNodeDrag(e, node.id, drawX, drawY)}
          onTouchStart={(e) => handleNodeTouchStart(e, node.id, drawX, drawY)}
        />

        <text
          x={drawX}
          y={drawY}
          textAnchor="middle"
          dominantBaseline="middle"
          className={`${isMobile ? "text-xs" : "text-sm"} font-medium fill-current pointer-events-none`}
        >
          {node.value}
        </text>

        {renderTree(node.left)}
        {renderTree(node.right)}
      </g>
    )
  }

  // Add node dragging functionality
  const [nodePositions, setNodePositions] = useState<Record<number, { x: number; y: number }>>({})

  const handleNodeDrag = (event: React.MouseEvent, nodeId: number, initialX: number, initialY: number) => {
    if (animating) return

    event.preventDefault()

    const startX = event.clientX
    const startY = event.clientY

    // Initialize position if not already set
    if (!nodePositions[nodeId]) {
      setNodePositions((prev) => ({
        ...prev,
        [nodeId]: { x: initialX, y: initialY },
      }))
    }

    const currentX = nodePositions[nodeId]?.x || initialX
    const currentY = nodePositions[nodeId]?.y || initialY

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

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  // Also add touch event support for mobile devices
  const handleNodeTouchStart = (event: React.TouchEvent, nodeId: number, initialX: number, initialY: number) => {
    if (animating) return

    event.preventDefault()

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

  // pan.y was already interpolated into the viewBox but nothing ever set it,
  // so vertical clipping had no control at all.
  const handlePanUp = () => {
    setPan((prevPan) => ({ ...prevPan, y: prevPan.y - 20 }))
  }

  const handlePanDown = () => {
    setPan((prevPan) => ({ ...prevPan, y: prevPan.y + 20 }))
  }

  const handleReset = () => {
    setScale(1)
    setPan({ x: 0, y: 0 })
  }

  return (
    <VisualizerLayout
      controls={
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Binary Search Tree Operations</CardTitle>
              <CardDescription>Insert, search, or traverse the binary search tree</CardDescription>
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
                    <Input
                      type="number"
                      placeholder="Enter a value"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      disabled={animating}
                    />

                    <Button onClick={handleInsert} disabled={animating}>
                      <Plus className="mr-2 h-4 w-4" />
                      Insert
                    </Button>
                  </div>
                )}

                <InlineAlert message={inputError} className="mt-2" />

                {operation === "search" && (
                  <div className="flex space-x-2 mt-4">
                    <Input
                      type="number"
                      placeholder="Enter a value"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      disabled={animating}
                    />

                    <Button onClick={handleSearch} disabled={animating} variant="secondary">
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </Button>
                  </div>
                )}
              </Tabs>

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

                  <Button onClick={handleTraversal} disabled={animating || !root} variant="outline">
                    Traverse
                  </Button>
                </div>

                {traversalPath.length > 0 && (
                  <div className="mt-2 text-sm overflow-x-auto">
                    <span className="font-medium">Path:</span> {traversalPath.join(" → ")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      }
      code={
        <CodePanel
          template={TRAVERSALS[traversalType] ?? IN_ORDER}
          activeStep={activeStep}
        />
      }
      visualization={
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle>Visualization</CardTitle>
            <CardDescription>Visual representation of the binary search tree</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 min-h-0">
            {searchResult && <div className="mb-4 text-sm text-muted-foreground">{searchResult}</div>}

            <div className="flex flex-wrap gap-2 mb-2">
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
              <Button size="sm" variant="outline" onClick={handlePanUp}>
                <MoveVertical className="h-4 w-4 mr-1" /> Pan Up
              </Button>
              <Button size="sm" variant="outline" onClick={handlePanDown}>
                <MoveVertical className="h-4 w-4 mr-1" /> Pan Down
              </Button>
              <Button size="sm" variant="outline" onClick={handleReset}>
                Reset View
              </Button>
            </div>

            {/*
              The plate is the scroller itself: the old `absolute inset-0` child
              made the outer `overflow-auto` a dead scroller, and centring a
              scrolling box with `items-center` spilled the overflow both ways, so
              the leading half (the root node first) could never be reached
              because scrollLeft/scrollTop cannot go negative. `m-auto` on the svg
              centres it while it fits and scrolls from the true origin once it
              does not.
            */}
            <div className="flex flex-1 min-h-[300px] max-h-[60vh] w-full overflow-auto border-t p-4" style={{ overscrollBehavior: "contain" }}>
              {root ? (
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
                  className="m-auto max-w-none"
                >
                  <g>{renderTree(root)}</g>
                </svg>
              ) : (
                <div className="m-auto text-muted-foreground text-sm">Empty tree</div>
              )}
            </div>

            <div className="px-6 py-3 text-xs md:text-xs text-center text-muted-foreground bg-muted/5 border-t">
              Drag nodes to reposition. Use zoom/pan controls to navigate larger trees.
            </div>
          </CardContent>
        </Card>
      }
    />
  )
}

