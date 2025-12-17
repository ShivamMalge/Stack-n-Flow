"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, ZoomIn, ZoomOut, MoveHorizontal, Trash } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"

type TreeNode = {
  id: number
  value: number
  left: TreeNode | null
  right: TreeNode | null
  highlighted?: boolean
  isNew?: boolean
  isDeleting?: boolean
}

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
  const svgRef = useRef<SVGSVGElement>(null)
  const isMobile = useMobile()

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
      setInputValue("")
      return
    }

    setRoot(highlightedRoot)

    // After highlighting, delete the node
    setTimeout(() => {
      const updatedRoot = deleteNode(JSON.parse(JSON.stringify(root)), value)
      setRoot(updatedRoot)
      setSearchResult("Node deleted")

      setTimeout(() => {
        setAnimating(false)
      }, 1000)
    }, 1500)

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

    setRoot(resetHighlights(JSON.parse(JSON.stringify(root))))

    // Animate search through the tree
    const searchPath: number[] = []
    let currentNode = root
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

      setRoot(highlightNode(JSON.parse(JSON.stringify(root)), searchPath))

      if (currentNode.value === value) {
        found = true
        setSearchResult("Element found")
        clearInterval(searchInterval)
        setTimeout(() => {
          setRoot(resetHighlights(JSON.parse(JSON.stringify(root))))
          setAnimating(false)
        }, 1500)
        return
      }

      if (value < currentNode.value) {
        currentNode = currentNode.left
      } else {
        currentNode = currentNode.right
      }

      if (!currentNode) {
        clearInterval(searchInterval)
        setTimeout(() => {
          setRoot(resetHighlights(JSON.parse(JSON.stringify(root))))
          setAnimating(false)
          if (!found) {
            setSearchResult("Element not found")
          }
        }, 1000)
      }
    }, 500)

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

    setRoot(resetHighlights(JSON.parse(JSON.stringify(root))))

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
      inOrderTraversal(root)
    } else if (traversalType === "preorder") {
      preOrderTraversal(root)
    } else {
      postOrderTraversal(root)
    }

    // Animate traversal
    let index = 0

    const traversalInterval = setInterval(() => {
      if (index >= path.length) {
        clearInterval(traversalInterval)
        setTimeout(() => {
          setRoot(resetHighlights(JSON.parse(JSON.stringify(root))))
          setAnimating(false)
        }, 1000)
        return
      }

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

      setRoot(highlightNode(JSON.parse(JSON.stringify(root)), path[index]))

      index++
    }, 800)
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
  `}
          onMouseDown={(e) => handleNodeDrag(e, node.id, nodeX, nodeY)}
          onTouchStart={(e) => handleNodeTouchStart(e, node.id, nodeX, nodeY)}
        />

        <text
          x={nodeX}
          y={nodeY}
          textAnchor="middle"
          dominantBaseline="middle"
          className={`text-${isMobile ? "xs" : "xs"} font-medium fill-current pointer-events-none`} // Reduced text size
        >
          {node.value}
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

