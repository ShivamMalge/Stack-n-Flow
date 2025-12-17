"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Plus, Trash, Search } from "lucide-react"

type Node = {
  id: number
  value: number
  highlighted?: boolean
  isNew?: boolean
  isDeleting?: boolean
}

export default function CircularLinkedListVisualizer() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [inputValue, setInputValue] = useState("")
  const [operation, setOperation] = useState("insert")
  const [animating, setAnimating] = useState(false)
  const [nextId, setNextId] = useState(1)
  const [searchResult, setSearchResult] = useState<string | null>(null)

  const handleInsert = () => {
    if (!inputValue || animating) return

    const value = Number.parseInt(inputValue)
    setAnimating(true)

    // Create a new node with the "isNew" flag for animation
    const newNode = { id: nextId, value, isNew: true }
    setNodes([...nodes, newNode])
    setNextId(nextId + 1)

    // After animation, remove the "isNew" flag
    setTimeout(() => {
      setNodes((nodes) => nodes.map((node) => (node.id === newNode.id ? { ...node, isNew: false } : node)))
      setAnimating(false)
    }, 1000)

    setInputValue("")
  }

  const handleDelete = () => {
    if (!inputValue || animating || nodes.length === 0) return

    const value = Number.parseInt(inputValue)
    const nodeIndex = nodes.findIndex((node) => node.value === value)

    if (nodeIndex === -1) return

    setAnimating(true)

    // Mark the node for deletion animation
    setNodes((nodes) => nodes.map((node, index) => (index === nodeIndex ? { ...node, isDeleting: true } : node)))

    // After animation, remove the node
    setTimeout(() => {
      setNodes((nodes) => nodes.filter((_, index) => index !== nodeIndex))
      setAnimating(false)
    }, 1000)

    setInputValue("")
  }

  const handleSearch = () => {
    if (!inputValue || animating) return

    const value = Number.parseInt(inputValue)
    setAnimating(true)
    setSearchResult(null)

    // Reset all highlights
    setNodes((nodes) => nodes.map((node) => ({ ...node, highlighted: false })))

    // Animate search through each node
    let currentIndex = 0
    let found = false

    const searchInterval = setInterval(() => {
      if (currentIndex >= nodes.length) {
        clearInterval(searchInterval)
        setAnimating(false)
        if (!found) {
          setSearchResult("Element not found")
        }
        return
      }

      setNodes((nodes) =>
        nodes.map((node, index) => ({
          ...node,
          highlighted: index === currentIndex,
        })),
      )

      // Check if current node has the value we're looking for
      if (nodes[currentIndex].value === value) {
        found = true
        setSearchResult("Element found")
        clearInterval(searchInterval)
        setTimeout(() => {
          setNodes((nodes) => nodes.map((node) => ({ ...node, highlighted: false })))
          setAnimating(false)
        }, 1000)
        return
      }

      currentIndex++

      // If we've reached the end without finding the value
      if (currentIndex >= nodes.length && !found) {
        setTimeout(() => {
          setSearchResult("Element not found")
        }, 500)
      }
    }, 500)

    setInputValue("")
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Operations Panel */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Circular Linked List Operations</CardTitle>
            <CardDescription>Insert, delete, or search for values in the circular linked list</CardDescription>
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

            {searchResult && (
              <div
                className={`mt-4 p-2 rounded text-center ${
                  searchResult === "Element found"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                }`}
              >
                {searchResult}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learning</CardTitle>
            <CardDescription>Understanding Circular Linked Lists</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="mb-2">
              A <strong>Circular Linked List</strong> is a linked list where the last node points back to the first
              node, forming a circle.
            </p>
            <p className="mb-2">
              <strong>Time Complexity:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access: O(n)</li>
              <li>Search: O(n)</li>
              <li>Insertion: O(1) if position is known, O(n) otherwise</li>
              <li>Deletion: O(1) if position is known, O(n) otherwise</li>
            </ul>
            <p className="mt-2">
              <strong>Advantages:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Any node can be a starting point</li>
              <li>Useful for applications that require repetitive traversal</li>
              <li>No need to maintain null pointers</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Visualization Panel */}
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Visualization</CardTitle>
          <CardDescription>Visual representation of the circular linked list</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Add horizontal scrolling to the circular linked list visualization */}
          <div className="flex items-center justify-center overflow-x-auto py-12 h-[300px]">
            {nodes.length === 0 ? (
              <div className="text-muted-foreground">Empty circular linked list</div>
            ) : (
              <div className="relative" style={{ minWidth: Math.max(300, nodes.length * 80) + "px" }}>
                <div className="flex items-center">
                  {nodes.map((node, index) => (
                    <div key={node.id} className="flex items-center">
                      <div
                        className={`
                          flex flex-col items-center justify-center w-16 h-16 rounded-full border-2 
                          transition-all duration-500 ease-in-out
                          ${node.highlighted ? "bg-yellow-100 dark:bg-yellow-900 border-yellow-500" : "bg-card border-primary"}
                          ${node.isNew ? "scale-110 border-green-500" : ""}
                          ${node.isDeleting ? "scale-75 opacity-50 border-red-500" : ""}
                        `}
                      >
                        <div className="text-lg font-bold">{node.value}</div>
                        <div className="text-xs text-muted-foreground">id: {node.id}</div>
                      </div>

                      {index < nodes.length - 1 && <ArrowRight className="mx-2 text-muted-foreground" />}
                    </div>
                  ))}
                </div>

                {/* Circular connection */}
                {nodes.length > 0 && (
                  <div className="absolute -bottom-8 left-0 right-0 flex justify-center">
                    <div className="flex items-center">
                      <ArrowRight className="h-5 w-5 text-muted-foreground transform rotate-90" />
                      <div className="w-[calc(100%-2rem)] border-b border-dashed border-muted-foreground mx-2"></div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground transform -rotate-90" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

