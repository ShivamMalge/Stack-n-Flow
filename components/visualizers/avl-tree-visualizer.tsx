"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search } from "lucide-react"
import AnimationControls from "@/components/ui/animation-controls"
import CodePanel from "@/components/ui/code-panel"
import { useAnimationPlayer, type AnimationFrame } from "@/hooks/useAnimationPlayer"
import { MAX_INPUT_MESSAGE, parseBoundedInt } from "@/lib/constants"
import InlineAlert from "@/components/ui/inline-alert"
import VisualizerLayout from "@/components/visualizers/visualizer-layout"
import TreeRenderer from "@/components/visualizers/tree/tree-renderer"

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

export default function AVLTreeVisualizer({
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
  const [searchResult, setSearchResult] = useState<string | null>(null)
  const [inputError, setInputError] = useState<string | null>(null)
  const [rotationInfo, setRotationInfo] = useState<string | null>(null)
  const [steps, setSteps] = useState<string[]>([])
  const [activeCode, setActiveCode] = useState<string[]>([])
  const [activeLine, setActiveLine] = useState<number | null>(null)

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
    setInputError(null)

    if (!inputValue || animating) return

    const value = parseBoundedInt(inputValue)

    // Reject empty, non-numeric, and out-of-range input
    if (value === null) {
      setInputError(MAX_INPUT_MESSAGE)
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

  return (
    <VisualizerLayout
      controls={
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

              <InlineAlert message={inputError} className="mt-2" />
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
                <h3 className="text-sm font-medium mb-1">Algorithm Steps:</h3>
                <div className="bg-muted/30 rounded-md p-2 h-40 overflow-y-auto">
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
      }
      visualization={
        <TreeRenderer
          root={root}
          variant="avl"
          searchResult={searchResult}
          interactionsDisabled={animating}
        />
      }
      code={
        <CodePanel
          code={activeCode}
          activeLine={activeLine}
          title={activeCode === INSERT_CODE ? "Insertion Algorithm" : activeCode === SEARCH_CODE ? "Search Algorithm" : "AVL Algorithm"}
        />
      }
      docs={
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
      }
    />
  )
}

