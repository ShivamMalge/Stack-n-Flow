"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

type TreeOperation =
  | "insert"
  | "delete"
  | "search"
  | "traverseInOrder"
  | "traversePreOrder"
  | "traversePostOrder"
  | "traverseLevelOrder"
  | "findHeight"
  | "findMin"
  | "findMax"
  | "isBalanced"

interface TreeNode {
  value: number
  left: TreeNode | null
  right: TreeNode | null
  id: number
}

export default function TreeOperations() {
  const [root, setRoot] = useState<TreeNode | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [operation, setOperation] = useState<TreeOperation>("insert")
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [steps, setSteps] = useState<string[]>([])
  const [nextId, setNextId] = useState(1)
  const [treeVisualization, setTreeVisualization] = useState<string>("")

  const createTreeNode = (value: number): TreeNode => {
    const id = nextId
    setNextId(nextId + 1)
    return { value, left: null, right: null, id }
  }

  const insertNode = (node: TreeNode | null, value: number, newSteps: string[] = []): TreeNode => {
    if (node === null) {
      newSteps.push(`Creating new node with value ${value}`)
      return createTreeNode(value)
    }

    if (value < node.value) {
      newSteps.push(`${value} < ${node.value}, going to left subtree`)
      node.left = insertNode(node.left, value, newSteps)
    } else if (value > node.value) {
      newSteps.push(`${value} > ${node.value}, going to right subtree`)
      node.right = insertNode(node.right, value, newSteps)
    } else {
      newSteps.push(`Value ${value} already exists in the tree`)
    }

    return node
  }

  const deleteNode = (node: TreeNode | null, value: number, newSteps: string[] = []): TreeNode | null => {
    if (node === null) {
      newSteps.push(`Value ${value} not found in the tree`)
      return null
    }

    if (value < node.value) {
      newSteps.push(`${value} < ${node.value}, going to left subtree`)
      node.left = deleteNode(node.left, value, newSteps)
    } else if (value > node.value) {
      newSteps.push(`${value} > ${node.value}, going to right subtree`)
      node.right = deleteNode(node.right, value, newSteps)
    } else {
      newSteps.push(`Found node with value ${value}`)

      // Case 1: Leaf node
      if (node.left === null && node.right === null) {
        newSteps.push(`Node is a leaf node, removing it`)
        return null
      }

      // Case 2: Node with only one child
      if (node.left === null) {
        newSteps.push(`Node has only right child, replacing with right child`)
        return node.right
      }

      if (node.right === null) {
        newSteps.push(`Node has only left child, replacing with left child`)
        return node.left
      }

      // Case 3: Node with two children
      newSteps.push(`Node has two children, finding successor`)

      // Find the inorder successor (smallest node in right subtree)
      let successor = node.right
      while (successor.left !== null) {
        successor = successor.left
      }

      newSteps.push(`Found successor with value ${successor.value}`)

      // Replace the node's value with the successor's value
      node.value = successor.value

      // Delete the successor
      newSteps.push(`Replacing node value with successor value ${successor.value}`)
      newSteps.push(`Now deleting the successor from the right subtree`)

      node.right = deleteNode(node.right, successor.value, newSteps)
    }

    return node
  }

  const searchNode = (node: TreeNode | null, value: number, newSteps: string[] = []): boolean => {
    if (node === null) {
      newSteps.push(`Node is null, value ${value} not found`)
      return false
    }

    if (value === node.value) {
      newSteps.push(`Found value ${value} at node`)
      return true
    }

    if (value < node.value) {
      newSteps.push(`${value} < ${node.value}, searching in left subtree`)
      return searchNode(node.left, value, newSteps)
    } else {
      newSteps.push(`${value} > ${node.value}, searching in right subtree`)
      return searchNode(node.right, value, newSteps)
    }
  }

  const traverseInOrder = (node: TreeNode | null, result: number[] = []): number[] => {
    if (node !== null) {
      traverseInOrder(node.left, result)
      result.push(node.value)
      traverseInOrder(node.right, result)
    }
    return result
  }

  const traversePreOrder = (node: TreeNode | null, result: number[] = []): number[] => {
    if (node !== null) {
      result.push(node.value)
      traversePreOrder(node.left, result)
      traversePreOrder(node.right, result)
    }
    return result
  }

  const traversePostOrder = (node: TreeNode | null, result: number[] = []): number[] => {
    if (node !== null) {
      traversePostOrder(node.left, result)
      traversePostOrder(node.right, result)
      result.push(node.value)
    }
    return result
  }

  const traverseLevelOrder = (root: TreeNode | null): number[] => {
    if (root === null) return []

    const result: number[] = []
    const queue: TreeNode[] = [root]

    while (queue.length > 0) {
      const node = queue.shift()!
      result.push(node.value)

      if (node.left) queue.push(node.left)
      if (node.right) queue.push(node.right)
    }

    return result
  }

  const findHeight = (node: TreeNode | null, newSteps: string[] = []): number => {
    if (node === null) {
      newSteps.push(`Node is null, height is -1`)
      return -1
    }

    const leftHeight = findHeight(node.left, newSteps)
    const rightHeight = findHeight(node.right, newSteps)

    const height = Math.max(leftHeight, rightHeight) + 1
    newSteps.push(`Height at node ${node.value}: max(${leftHeight}, ${rightHeight}) + 1 = ${height}`)

    return height
  }

  const findMin = (node: TreeNode | null, newSteps: string[] = []): number | null => {
    if (node === null) {
      newSteps.push(`Tree is empty, no minimum value`)
      return null
    }

    let current = node

    while (current.left !== null) {
      newSteps.push(`Current node: ${current.value}, going to left child`)
      current = current.left
    }

    newSteps.push(`Found minimum value: ${current.value}`)
    return current.value
  }

  const findMax = (node: TreeNode | null, newSteps: string[] = []): number | null => {
    if (node === null) {
      newSteps.push(`Tree is empty, no maximum value`)
      return null
    }

    let current = node

    while (current.right !== null) {
      newSteps.push(`Current node: ${current.value}, going to right child`)
      current = current.right
    }

    newSteps.push(`Found maximum value: ${current.value}`)
    return current.value
  }

  const checkBalanced = (node: TreeNode | null, newSteps: string[] = []): [boolean, number] => {
    if (node === null) {
      newSteps.push(`Node is null, height is -1, balanced: true`)
      return [true, -1]
    }

    const [leftBalanced, leftHeight] = checkBalanced(node.left, newSteps)
    if (!leftBalanced) {
      return [false, 0]
    }

    const [rightBalanced, rightHeight] = checkBalanced(node.right, newSteps)
    if (!rightBalanced) {
      return [false, 0]
    }

    const balanced = Math.abs(leftHeight - rightHeight) <= 1
    const height = Math.max(leftHeight, rightHeight) + 1

    newSteps.push(`At node ${node.value}: left height = ${leftHeight}, right height = ${rightHeight}`)
    newSteps.push(`Height difference: |${leftHeight} - ${rightHeight}| = ${Math.abs(leftHeight - rightHeight)}`)
    newSteps.push(`Node ${node.value} is ${balanced ? "balanced" : "not balanced"}`)

    return [balanced, height]
  }

  const visualizeTree = (root: TreeNode | null): string => {
    if (!root) return "Empty tree"

    const getTreeString = (node: TreeNode | null, prefix = "", isLeft = true): string => {
      if (!node) return ""

      let result = ""

      if (node.right) {
        result += getTreeString(node.right, `${prefix}${isLeft ? "│   " : "    "}`, false)
      }

      result += `${prefix}${isLeft ? "└── " : "┌── "}${node.value}\n`

      if (node.left) {
        result += getTreeString(node.left, `${prefix}${isLeft ? "    " : "│   "}`, true)
      }

      return result
    }

    return getTreeString(root, "", true)
  }

  const handleCreateTree = () => {
    setError(null)
    try {
      const values = inputValue.split(",").map((item) => {
        const num = Number(item.trim())
        if (isNaN(num)) throw new Error("Invalid number in tree")
        return num
      })

      if (values.length === 0) {
        setError("Please enter at least one value")
        return
      }

      let newRoot: TreeNode | null = null
      const newSteps: string[] = []

      for (const value of values) {
        if (newRoot === null) {
          newRoot = createTreeNode(value)
          newSteps.push(`Created root node with value ${value}`)
        } else {
          newRoot = insertNode(newRoot, value, newSteps)
        }
      }

      setRoot(newRoot)
      setTreeVisualization(visualizeTree(newRoot))
      setSteps(newSteps)
      setSuccess("Binary search tree created successfully")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError("Please enter valid numbers separated by commas")
    }
  }

  const performOperation = () => {
    setError(null)
    setSuccess(null)
    setResult(null)
    setSteps([])

    if (!root && operation !== "insert") {
      setError("Please create a tree first")
      return
    }

    try {
      const newSteps: string[] = []

      switch (operation) {
        case "insert": {
          if (!inputValue) {
            setError("Please enter a value to insert")
            return
          }

          const value = Number(inputValue)
          if (isNaN(value)) {
            setError("Please enter a valid number to insert")
            return
          }

          let newRoot: TreeNode

          if (root === null) {
            newRoot = createTreeNode(value)
            newSteps.push(`Created root node with value ${value}`)
          } else {
            newRoot = { ...root }
            insertNode(newRoot, value, newSteps)
          }

          setRoot(newRoot)
          setTreeVisualization(visualizeTree(newRoot))
          setResult({ inserted: value })
          break
        }

        case "delete": {
          if (!inputValue) {
            setError("Please enter a value to delete")
            return
          }

          const value = Number(inputValue)
          if (isNaN(value)) {
            setError("Please enter a valid number to delete")
            return
          }

          const newRoot = deleteNode({ ...root! }, value, newSteps)
          setRoot(newRoot)
          setTreeVisualization(visualizeTree(newRoot))
          setResult({ deleted: value })
          break
        }

        case "search": {
          if (!inputValue) {
            setError("Please enter a value to search for")
            return
          }

          const value = Number(inputValue)
          if (isNaN(value)) {
            setError("Please enter a valid number to search for")
            return
          }

          const found = searchNode(root, value, newSteps)
          setResult({ found, value })
          break
        }

        case "traverseInOrder": {
          const traversal = traverseInOrder(root)
          newSteps.push(`In-order traversal: ${traversal.join(", ")}`)
          setResult({ traversal })
          break
        }

        case "traversePreOrder": {
          const traversal = traversePreOrder(root)
          newSteps.push(`Pre-order traversal: ${traversal.join(", ")}`)
          setResult({ traversal })
          break
        }

        case "traversePostOrder": {
          const traversal = traversePostOrder(root)
          newSteps.push(`Post-order traversal: ${traversal.join(", ")}`)
          setResult({ traversal })
          break
        }

        case "traverseLevelOrder": {
          const traversal = traverseLevelOrder(root)
          newSteps.push(`Level-order traversal: ${traversal.join(", ")}`)
          setResult({ traversal })
          break
        }

        case "findHeight": {
          const height = findHeight(root, newSteps)
          setResult({ height })
          break
        }

        case "findMin": {
          const min = findMin(root, newSteps)
          setResult({ min })
          break
        }

        case "findMax": {
          const max = findMax(root, newSteps)
          setResult({ max })
          break
        }

        case "isBalanced": {
          const [balanced, height] = checkBalanced(root, newSteps)
          setResult({ balanced, height })
          break
        }
      }

      setSteps(newSteps)
      setSuccess(`Operation '${operation}' performed successfully`)
    } catch (err) {
      setError(`Error performing operation: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Tree Operations</CardTitle>
          <CardDescription>Perform various operations on a binary search tree</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tree">Create Binary Search Tree</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Input
                  id="tree"
                  placeholder="e.g., 10, 5, 15, 3, 7, 12, 18"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <Button onClick={handleCreateTree}>Create</Button>
              </div>
            </div>

            <div>
              <Label htmlFor="operation">Operation</Label>
              <Select value={operation} onValueChange={(value) => setOperation(value as TreeOperation)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select operation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="insert">Insert Node</SelectItem>
                  <SelectItem value="delete">Delete Node</SelectItem>
                  <SelectItem value="search">Search Value</SelectItem>
                  <SelectItem value="traverseInOrder">Traverse In-Order</SelectItem>
                  <SelectItem value="traversePreOrder">Traverse Pre-Order</SelectItem>
                  <SelectItem value="traversePostOrder">Traverse Post-Order</SelectItem>
                  <SelectItem value="traverseLevelOrder">Traverse Level-Order</SelectItem>
                  <SelectItem value="findHeight">Find Height</SelectItem>
                  <SelectItem value="findMin">Find Minimum</SelectItem>
                  <SelectItem value="findMax">Find Maximum</SelectItem>
                  <SelectItem value="isBalanced">Check if Balanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(operation === "insert" || operation === "delete" || operation === "search") && (
              <div>
                <Label htmlFor="value">
                  {operation === "insert"
                    ? "Value to insert"
                    : operation === "delete"
                      ? "Value to delete"
                      : "Value to search"}
                </Label>
                <Input
                  id="value"
                  className="mt-1.5"
                  placeholder="e.g., 5"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
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
          <CardTitle>Tree Visualization</CardTitle>
          <CardDescription>View the current tree structure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-md overflow-x-auto">
              <pre className="text-xs font-mono whitespace-pre">{treeVisualization || "No tree created yet"}</pre>
            </div>

            {result !== null && (
              <div>
                <h3 className="text-lg font-medium">Operation Result:</h3>
                <div className="p-3 bg-muted rounded-md mt-2 overflow-x-auto">
                  {operation === "insert"
                    ? `Inserted value: ${result.inserted}`
                    : operation === "delete"
                      ? `Deleted value: ${result.deleted}`
                      : operation === "search"
                        ? result.found
                          ? `Value ${result.value} found in the tree`
                          : `Value ${result.value} not found in the tree`
                        : operation === "traverseInOrder" ||
                            operation === "traversePreOrder" ||
                            operation === "traversePostOrder" ||
                            operation === "traverseLevelOrder"
                          ? `Traversal result: [${result.traversal.join(", ")}]`
                          : operation === "findHeight"
                            ? `Tree height: ${result.height}`
                            : operation === "findMin"
                              ? `Minimum value: ${result.min}`
                              : operation === "findMax"
                                ? `Maximum value: ${result.max}`
                                : operation === "isBalanced"
                                  ? `Tree is ${result.balanced ? "balanced" : "not balanced"}`
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

