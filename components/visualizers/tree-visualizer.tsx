"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search } from "lucide-react"
import { MAX_INPUT_MESSAGE, parseBoundedInt } from "@/lib/constants"
import InlineAlert from "@/components/ui/inline-alert"
import VisualizerLayout from "@/components/visualizers/visualizer-layout"
import TreeRenderer from "@/components/visualizers/tree/tree-renderer"
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
                      onKeyDown={(e) => e.key === "Enter" && (operation === "insert" ? handleInsert() : handleSearch())}
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
        <TreeRenderer root={root} searchResult={searchResult} interactionsDisabled={animating} />
      }
    />
  )
}

