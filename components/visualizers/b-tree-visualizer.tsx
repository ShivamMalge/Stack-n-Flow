"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, ZoomIn, ZoomOut, MoveHorizontal } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import CodePanel from "@/components/ui/code-panel"

const SEARCH_CODE = [
  "function search(node, key):",
  "  int i = 0",
  "  while i < node.keys.length and key > node.keys[i]: i++",
  "  if i < node.keys.length and key == node.keys[i]: return node",
  "  if node.isLeaf: return null",
  "  return search(node.children[i], key)"
]

const INSERT_CODE = [
  "function insert(key):",
  "  if root is full:",
  "    newRoot = Node(isLeaf=false)",
  "    newRoot.children.push(root)",
  "    splitChild(newRoot, 0, root)",
  "    insertNonFull(newRoot, key)",
  "  else: insertNonFull(root, key)",
  "",
  "function insertNonFull(node, key):",
  "  if node.isLeaf:",
  "    // Find position and insert key",
  "    while i >= 0 and node.keys[i] > key: ...",
  "    node.keys.insert(i + 1, key)",
  "  else:",
  "    // Recurse to correct child",
  "    if child is full: splitChild(node, i, child)",
  "    insertNonFull(child, key)"
]

// B-Tree node
type BTreeNode = {
  id: number
  keys: number[]
  children: BTreeNode[]
  isLeaf: boolean
  highlighted?: boolean
  isNew?: boolean
  isDeleting?: boolean
  isSplitting?: boolean
  activeLine?: number | null
}

export default function BTreeVisualizer() {
  const [root, setRoot] = useState<BTreeNode | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [operation, setOperation] = useState("insert")
  const [animating, setAnimating] = useState(false)
  const [nextId, setNextId] = useState(1)
  const [searchResult, setSearchResult] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [treeOrder, setTreeOrder] = useState(3) // Default B-Tree order (minimum degree)
  const [operationInfo, setOperationInfo] = useState<string | null>(null)
  const [activeCode, setActiveCode] = useState<string[]>([])
  const [activeLine, setActiveLine] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const isMobile = useMobile()

  // Refs for animation cleanup
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  // Add node dragging functionality
  const [nodePositions, setNodePositions] = useState<Record<number, { x: number; y: number }>>({})
  const dragStateRef = useRef<{
    isDragging: boolean
    nodeId: number | null
    startX: number
    startY: number
    initialX: number
    initialY: number
  }>({
    isDragging: false,
    nodeId: null,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  })

  // Initialize with an empty tree
  useEffect(() => {
    setRoot(null)
    setNextId(1)

    return () => {
      isMountedRef.current = false
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }

      // Clean up event listeners
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [])

  // Create a new B-Tree node
  const createNode = (isLeaf: boolean): BTreeNode => {
    const newId = nextId
    setNextId((prevId) => prevId + 1)

    return {
      id: newId,
      keys: [],
      children: [],
      isLeaf,
      isNew: true,
    }
  }

  // Search for a key in the B-Tree
  const search = (node: BTreeNode | null, key: number): { node: BTreeNode | null; index: number } => {
    if (!node) return { node: null, index: -1 }

    // Find the first key greater than or equal to k
    let i = 0
    while (i < node.keys.length && key > node.keys[i]) {
      i++
    }

    // If the found key is equal to k, return this node and index
    if (i < node.keys.length && key === node.keys[i]) {
      return { node, index: i }
    }

    // If this is a leaf node, key is not present
    if (node.isLeaf) {
      return { node: null, index: -1 }
    }

    // Recur to the appropriate child
    return search(node.children[i], key)
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

    // Clean up any existing animation
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current)
    }

    setAnimating(true)
    setOperationInfo(null)
    setActiveCode(INSERT_CODE)
    setActiveLine(0)

    // Check if value already exists in the tree
    if (root) {
      const searchResult = search(root, value)
      if (searchResult.node !== null) {
        setOperationInfo(`Value ${value} already exists in the tree`)
        setAnimating(false)
        setInputValue("")
        return
      }
    }

    // Insert the new key
    try {
      const result = insert(value)
      setRoot(result.root)
      if (result.info) {
        setOperationInfo(result.info)
      }

      // After animation, remove the animation flags
      animationTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) return

        const removeAnimationFlags = (node: BTreeNode | null): BTreeNode | null => {
          if (node === null) return null

          return {
            ...node,
            isNew: false,
            isSplitting: false,
            highlighted: false,
            children: node.children.map((child) => removeAnimationFlags(child) as BTreeNode),
          }
        }

        setRoot((prevRoot) => (prevRoot ? removeAnimationFlags(prevRoot) : null))
        setAnimating(false)
        setActiveLine(null)
        animationTimeoutRef.current = null
      }, 1500)
    } catch (error) {
      console.error("Error inserting into B-Tree:", error)
      setOperationInfo("Error inserting value. Please try again.")
      setAnimating(false)
    }

    setInputValue("")
  }

  // Fix the insert function to properly handle B-Tree insertions
  const insert = (value: number): { root: BTreeNode; info: string | null } => {
    let info: string | null = null

    // If tree is empty
    if (!root) {
      const newRoot = createNode(true)
      newRoot.keys = [value]
      return { root: newRoot, info: "Created new root node" }
    }

    // If root is full, tree grows in height
    if (root.keys.length === 2 * treeOrder - 1) {
      const newRoot = createNode(false)

      // Make old root as child of new root
      newRoot.children = [JSON.parse(JSON.stringify(root))]

      // Split the old root and move one key to the new root
      splitChild(newRoot, 0, newRoot.children[0])
      info = "Root node split, tree height increased"

      // Insert the key into the appropriate child
      const i = newRoot.keys[0] > value ? 0 : 1
      insertNonFull(newRoot.children[i], value)

      return { root: newRoot, info }
    } else {
      // If root is not full, call insertNonFull for root
      const rootCopy = JSON.parse(JSON.stringify(root))
      insertNonFull(rootCopy, value)
      return { root: rootCopy, info: null }
    }
  }

  // Fix the insertNonFull function to properly handle insertions
  const insertNonFull = (node: BTreeNode, value: number) => {
    // Initialize index as index of rightmost element
    let i = node.keys.length - 1

    // If this is a leaf node
    if (node.isLeaf) {
      // Find the location of new key to be inserted
      // Move all greater keys to one place ahead
      while (i >= 0 && node.keys[i] > value) {
        node.keys[i + 1] = node.keys[i]
        i--
      }

      // Insert the new key at found location
      node.keys[i + 1] = value
      node.isNew = true
    } else {
      // Find the child which is going to have the new key
      while (i >= 0 && node.keys[i] > value) {
        i--
      }
      i++

      // See if the found child is full
      if (node.children[i].keys.length === 2 * treeOrder - 1) {
        // If the child is full, split it
        splitChild(node, i, node.children[i])

        // After split, the middle key of children[i] goes up and
        // children[i] is split into two. See which of the two
        // is going to have the new key
        if (node.keys[i] < value) {
          i++
        }
      }
      insertNonFull(node.children[i], value)
    }
  }

  // Fix the splitChild function to properly handle node splitting
  const splitChild = (parent: BTreeNode, index: number, child: BTreeNode) => {
    try {
      // Create a new node which is going to store (t-1) keys of child
      const newChild = createNode(child.isLeaf)

      // Mark the child as splitting for animation
      child.isSplitting = true

      // Get the middle key that will move up to the parent
      const middleKey = child.keys[treeOrder - 1]

      // Copy the last (t-1) keys of child to newChild
      newChild.keys = [...child.keys.slice(treeOrder)]

      // Copy the last t children of child to newChild if not a leaf
      if (!child.isLeaf) {
        newChild.children = [...child.children.slice(treeOrder)]
        child.children = child.children.slice(0, treeOrder)
      }

      // Reduce the number of keys in child
      child.keys = child.keys.slice(0, treeOrder - 1)

      // Insert the new child at the correct position
      parent.children.splice(index + 1, 0, newChild)

      // Insert the middle key into the parent at the correct position
      parent.keys.splice(index, 0, middleKey)
    } catch (error) {
      console.error("Error in splitChild:", error)
      throw error
    }
  }

  const handleSearch = () => {
    if (!inputValue || animating || !root) return

    const value = Number.parseInt(inputValue)

    // Clean up any existing animation
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current)
    }

    setAnimating(true)
    setSearchResult(null)
    setActiveCode(SEARCH_CODE)
    setActiveLine(0)

    // Reset all highlights
    const resetHighlights = (node: BTreeNode | null): BTreeNode | null => {
      if (node === null) return null

      return {
        ...node,
        highlighted: false,
        children: node.children.map((child) => resetHighlights(child) as BTreeNode),
      }
    }

    setRoot((prevRoot) => (prevRoot ? resetHighlights(JSON.parse(JSON.stringify(prevRoot))) : null))

    // Animate search through the tree
    const searchPath: BTreeNode[] = []

    const searchStep = (node: BTreeNode, key: number) => {
      if (!isMountedRef.current) return

      searchPath.push(node)

      // Highlight the current node
      const highlightNodes = (tree: BTreeNode | null, path: BTreeNode[]): BTreeNode | null => {
        if (tree === null) return null

        return {
          ...tree,
          highlighted: path.some((n) => n.id === tree.id),
          children: tree.children.map((child) => highlightNodes(child, path) as BTreeNode),
        }
      }

      setRoot((prevRoot) => (prevRoot ? highlightNodes(JSON.parse(JSON.stringify(prevRoot)), searchPath) : null))
      setActiveLine(1) // int i = 0

      animationTimeoutRef.current = setTimeout(() => {
        setActiveLine(2) // while i < keys...

        // Find the first key greater than or equal to k
        let i = 0
        while (i < node.keys.length && key > node.keys[i]) {
          i++
        }

        animationTimeoutRef.current = setTimeout(() => {
          setActiveLine(3) // if keys[i] == key

          // If the found key is equal to k, we found it
          if (i < node.keys.length && key === node.keys[i]) {
            setSearchResult(`Element found in node with keys: [${node.keys.join(", ")}]`)
            animationTimeoutRef.current = setTimeout(() => {
              if (!isMountedRef.current) return
              setRoot((prevRoot) => (prevRoot ? resetHighlights(JSON.parse(JSON.stringify(prevRoot))) : null))
              setAnimating(false)
              setActiveLine(null)
              animationTimeoutRef.current = null
            }, 1500)
            return
          }

          // If this is a leaf node, key is not present
          if (node.isLeaf) {
            setActiveLine(4)
            setSearchResult("Element not found")
            animationTimeoutRef.current = setTimeout(() => {
              if (!isMountedRef.current) return
              setRoot((prevRoot) => (prevRoot ? resetHighlights(JSON.parse(JSON.stringify(prevRoot))) : null))
              setAnimating(false)
              setActiveLine(null)
              animationTimeoutRef.current = null
            }, 1500)
            return
          }

          // Recur to the appropriate child
          setActiveLine(5) // return search(children[i])
          animationTimeoutRef.current = setTimeout(() => {
            if (!isMountedRef.current) return
            searchStep(node.children[i], key)
          }, 1000)
        }, 500)
      }, 500)
    }

    searchStep(root, value)
    setInputValue("")
  }

  // Calculate tree dimensions
  const getTreeDimensions = (node: BTreeNode | null, level = 0): { width: number; height: number } => {
    if (!node) return { width: 0, height: 0 }

    // Calculate width based on number of keys and children
    let width = node.keys.length * 50 // Reduced from 60

    // Calculate width of all children
    let childrenWidth = 0
    for (const child of node.children) {
      const childDimensions = getTreeDimensions(child, level + 1)
      childrenWidth += childDimensions.width
    }

    width = Math.max(width, childrenWidth)
    const height = (level + 1) * 80 // Reduced from 100

    return { width, height }
  }

  const treeDimensions = root ? getTreeDimensions(root) : { width: 0, height: 0 }
  const viewBoxWidth = Math.max(500, treeDimensions.width * 1.5)
  const viewBoxHeight = Math.max(300, treeDimensions.height + 40)

  // Update the renderTree function to better utilize space and add dragging functionality
  const renderTree = (node: BTreeNode | null, x: number, y: number, width: number, level: number) => {
    if (!node) return null

    // Calculate node dimensions - REDUCED SIZE
    const nodeHeight = 32 // Reduced from 40
    const nodeWidth = Math.max(node.keys.length * 32, 50) // Reduced from 40/60

    // Use custom position if available
    const customPos = nodePositions[node.id]
    const nodeX = customPos ? customPos.x : x
    const nodeY = customPos ? customPos.y : y

    // Calculate positions for children
    const childrenPositions: number[] = []
    let totalChildrenWidth = 0

    for (const child of node.children) {
      const childWidth = getTreeDimensions(child).width
      totalChildrenWidth += childWidth
      childrenPositions.push(childWidth)
    }

    // Adjust child positions based on parent position
    let currentX = nodeX - totalChildrenWidth / 2
    for (let i = 0; i < childrenPositions.length; i++) {
      const childWidth = childrenPositions[i]
      childrenPositions[i] = currentX + childWidth / 2
      currentX += childWidth
    }

    return (
      <g key={node.id}>
        {/* Draw lines to children */}
        {node.children.map((child, index) => {
          const childPos = nodePositions[child.id]
          const childX = childPos ? childPos.x : childrenPositions[index]
          const childY = childPos ? childPos.y : y + 70 // Reduced from 80

          return (
            <line
              key={`line-${node.id}-${child.id}-${index}`}
              x1={nodeX}
              y1={nodeY + nodeHeight / 2}
              x2={childX}
              y2={childY - nodeHeight / 2}
              stroke="currentColor"
              strokeOpacity="0.3"
              strokeWidth="1.5" // Reduced from 2
            />
          )
        })}

        {/* Draw the node */}
        <rect
          x={nodeX - nodeWidth / 2}
          y={nodeY - nodeHeight / 2}
          width={nodeWidth}
          height={nodeHeight}
          rx={5} // Reduced from 6
          className={`
          transition-all duration-500 ease-in-out cursor-grab active:cursor-grabbing
          ${node.highlighted ? "fill-yellow-200 stroke-yellow-500 dark:fill-yellow-900" : "fill-card stroke-primary"}
          ${node.isNew ? "stroke-green-500 stroke-[2]" : "stroke-[1.5]"}  /* Reduced stroke width */
          ${node.isDeleting ? "fill-red-200 stroke-red-500 dark:fill-red-900" : ""}
          ${node.isSplitting ? "fill-blue-200 stroke-blue-500 dark:fill-blue-900" : ""}
        `}
          onMouseDown={(e) => handleNodeDragStart(e, node.id, nodeX, nodeY)}
          onTouchStart={(e) => handleNodeDragStart(e, node.id, nodeX, nodeY)}
        />

        {/* Draw keys */}
        {node.keys.map((key, index) => (
          <g key={`key-${node.id}-${key}-${index}`}>
            {/* Draw separator lines between keys */}
            {index > 0 && (
              <line
                key={`separator-${node.id}-${index}`}
                x1={nodeX - nodeWidth / 2 + (nodeWidth / node.keys.length) * index}
                y1={nodeY - nodeHeight / 2}
                x2={nodeX - nodeWidth / 2 + (nodeWidth / node.keys.length) * index}
                y2={nodeY + nodeHeight / 2}
                stroke="currentColor"
                strokeOpacity="0.3"
                strokeWidth="1"
              />
            )}

            <text
              key={`text-${node.id}-${key}-${index}`}
              x={nodeX - nodeWidth / 2 + (nodeWidth / node.keys.length) * (index + 0.5)}
              y={nodeY}
              textAnchor="middle"
              dominantBaseline="middle"
              className={`text-xs font-medium fill-current pointer-events-none`} // Reduced text size
            >
              {key}
            </text>
          </g>
        ))}

        {/* Render children */}
        {node.children.map((child, index) => {
          const childPos = nodePositions[child.id]
          const childX = childPos ? childPos.x : childrenPositions[index]
          const childY = childPos ? childPos.y : y + 70 // Reduced from 80

          return renderTree(child, childX, childY, childrenPositions[index], level + 1)
        })}
      </g>
    )
  }

  // Improved drag handling with refs to avoid stale closures
  const handleNodeDragStart = (
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

    // Set drag state
    dragStateRef.current = {
      isDragging: true,
      nodeId,
      startX,
      startY,
      initialX: currentX,
      initialY: currentY,
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

  // Mouse move handler
  const handleMouseMove = (e: MouseEvent) => {
    if (!dragStateRef.current.isDragging) return

    const { nodeId, startX, startY, initialX, initialY } = dragStateRef.current
    const dx = (e.clientX - startX) / scale
    const dy = (e.clientY - startY) / scale

    setNodePositions((prev) => ({
      ...prev,
      [nodeId!]: {
        x: initialX + dx,
        y: initialY + dy,
      },
    }))
  }

  // Touch move handler
  const handleTouchMove = (e: TouchEvent) => {
    if (!dragStateRef.current.isDragging || e.touches.length === 0) return

    e.preventDefault() // Prevent scrolling while dragging

    const { nodeId, startX, startY, initialX, initialY } = dragStateRef.current
    const dx = (e.touches[0].clientX - startX) / scale
    const dy = (e.touches[0].clientY - startY) / scale

    setNodePositions((prev) => ({
      ...prev,
      [nodeId!]: {
        x: initialX + dx,
        y: initialY + dy,
      },
    }))
  }

  // End handlers
  const handleMouseUp = () => {
    dragStateRef.current.isDragging = false
    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("mouseup", handleMouseUp)
  }

  const handleTouchEnd = () => {
    dragStateRef.current.isDragging = false
    document.removeEventListener("touchmove", handleTouchMove)
    document.removeEventListener("touchend", handleTouchEnd)
  }

  // Define zoom and pan functions
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
    setNodePositions({})
  }

  // Replace the Visualization Panel section with this improved version
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Operations Panel - Top on Mobile, Left on Desktop */}
      <div className="order-1 md:col-start-1">
        <Card>
          <CardHeader>
            <CardTitle>B-Tree Operations</CardTitle>
            <CardDescription>Insert, search, or traverse the B-Tree</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">B-Tree Order (t)</label>
              <div className="flex space-x-2 items-center">
                <Input
                  type="number"
                  min="2"
                  max="5"
                  value={treeOrder}
                  onChange={(e) => setTreeOrder(Math.max(2, Math.min(5, Number.parseInt(e.target.value) || 2)))}
                  disabled={animating || root !== null}
                />
                <span className="text-xs text-muted-foreground">(Can only be changed for empty tree)</span>
              </div>
            </div>

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

            {operationInfo && (
              <div className="mt-4 p-2 rounded text-center bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                {operationInfo}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Visualization Panel - Second on Mobile, Right on Desktop */}
      <div className="order-2 md:col-start-2 md:row-span-3">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Visualization</CardTitle>
            <CardDescription>Visual representation of the B-Tree</CardDescription>
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
                      <g>{renderTree(root, 0, 40, viewBoxWidth, 1)}</g>
                    </svg>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Empty B-Tree (Order: {treeOrder})
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap justify-center mt-4 gap-3 text-[10px] md:text-xs px-6 border-t pt-4">
              <div className="flex items-center bg-background px-2 py-0.5 rounded border">
                <div className="w-2.5 h-2.5 bg-card border border-primary rounded-sm mr-1.5"></div>
                <span>Normal</span>
              </div>
              <div className="flex items-center bg-background px-2 py-0.5 rounded border">
                <div className="w-2.5 h-2.5 bg-yellow-200 border border-yellow-500 rounded-sm mr-1.5"></div>
                <span>Highlighted</span>
              </div>
              <div className="flex items-center bg-background px-2 py-0.5 rounded border">
                <div className="w-2.5 h-2.5 bg-blue-200 border border-blue-500 rounded-sm mr-1.5"></div>
                <span>Splitting</span>
              </div>
              <div className="flex items-center bg-background px-2 py-0.5 rounded border">
                <div className="w-2.5 h-2.5 bg-green-200 border border-green-500 rounded-sm mr-1.5"></div>
                <span>New</span>
              </div>
            </div>

            <div className="px-6 py-3 text-[10px] md:text-xs text-center text-muted-foreground bg-muted/5 mt-2 border-t">
              Drag nodes to reposition. Degree (t) defines max keys (2t-1).
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Code Panel - Third on Mobile, Left on Desktop */}
      <div className="order-3 md:col-start-1 h-[280px]">
        <CodePanel
          code={activeCode}
          activeLine={activeLine}
          title={activeCode === INSERT_CODE ? "Insertion Algorithm" : activeCode === SEARCH_CODE ? "Search Algorithm" : "B-Tree Algorithm"}
        />
      </div>

      {/* Learning Panel - Last on Mobile, Left on Desktop */}
      <div className="order-4 md:col-start-1">
        <Card>
          <CardHeader>
            <CardTitle>Learning</CardTitle>
            <CardDescription>Understanding B-Trees</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="mb-2">
              A <strong>B-Tree</strong> is a self-balancing tree data structure that maintains sorted data and allows
              for efficient insertion, deletion, and search operations.
            </p>
            <p className="mb-2">
              <strong>Properties:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>All leaf nodes are at the same level</li>
              <li>
                A B-Tree of order t has the following properties:
                <ul className="list-disc pl-5 mt-1">
                  <li>Every node has at most 2t-1 keys</li>
                  <li>Every node (except root) has at least t-1 keys</li>
                  <li>Every non-leaf node with k keys has k+1 children</li>
                </ul>
              </li>
              <li>All keys within a node are sorted</li>
            </ul>
            <p className="mt-2">
              <strong>Time Complexity:</strong> All operations (search, insert, delete) take O(log n) time.
            </p>
            <p className="mt-2">
              <strong>Applications:</strong> B-Trees are widely used in databases and file systems for efficient storage
              and retrieval of data.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

