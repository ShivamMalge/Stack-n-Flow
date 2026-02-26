"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Plus, Trash, Search } from "lucide-react"
import CodePanel from "@/components/ui/code-panel"

const INSERT_CODE = [
  "def insert_tail(value):",
  "    new_node = Node(value)",
  "    if not head:",
  "        head = new_node",
  "        new_node.next = head",
  "    else:",
  "        temp = head",
  "        while temp.next != head: temp = temp.next",
  "        temp.next = new_node",
  "        new_node.next = head"
]

const DELETE_CODE = [
  "def delete_node(value):",
  "    if not head: return",
  "    if head.value == value:",
  "        if head.next == head: head = None",
  "        else:",
  "            temp = head",
  "            while temp.next != head: temp = temp.next",
  "            temp.next = head.next",
  "            head = head.next",
  "        return",
  "    # Search and delete other nodes...",
  "    while cur.next != head and cur.next.value != value: ..."
]

const SEARCH_CODE = [
  "def search(value):",
  "    if not head: return False",
  "    temp = head",
  "    while True:",
  "        if temp.value == value: return True",
  "        temp = temp.next",
  "        if temp == head: break",
  "    return False"
]

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
  const [activeCode, setActiveCode] = useState<string[]>([])
  const [activeLine, setActiveLine] = useState<number | null>(null)

  const handleInsert = () => {
    if (!inputValue || animating) return

    const value = Number.parseInt(inputValue)
    setAnimating(true)
    setActiveCode(INSERT_CODE)
    setActiveLine(0)

    // Create a new node with the "isNew" flag for animation
    const newNode = { id: nextId, value, isNew: true }
    setNodes([...nodes, newNode])
    setNextId(nextId + 1)

    // After animation, remove the "isNew" flag
    setTimeout(() => {
      setNodes((nodes) => nodes.map((node) => (node.id === newNode.id ? { ...node, isNew: false } : node)))
      setAnimating(false)
      setActiveLine(null)
    }, 1000)

    setInputValue("")
  }

  const handleDelete = () => {
    if (!inputValue || animating || nodes.length === 0) return

    const value = Number.parseInt(inputValue)
    const nodeIndex = nodes.findIndex((node) => node.value === value)

    if (nodeIndex === -1) return

    setAnimating(true)
    setActiveCode(DELETE_CODE)
    setActiveLine(0)

    // Mark the node for deletion animation
    setNodes((nodes) => nodes.map((node, index) => (index === nodeIndex ? { ...node, isDeleting: true } : node)))

    // After animation, remove the node
    setTimeout(() => {
      setNodes((nodes) => nodes.filter((_, index) => index !== nodeIndex))
      setAnimating(false)
      setActiveLine(null)
    }, 1000)

    setInputValue("")
  }

  const handleSearch = () => {
    if (!inputValue || animating) return

    const value = Number.parseInt(inputValue)
    setAnimating(true)
    setSearchResult(null)
    setActiveCode(SEARCH_CODE)
    setActiveLine(0)

    // Reset all highlights
    setNodes((nodes) => nodes.map((node) => ({ ...node, highlighted: false })))

    // Animate search through each node
    let currentIndex = 0
    let found = false

    const searchInterval = setInterval(() => {
      if (currentIndex >= nodes.length) {
        clearInterval(searchInterval)
        setAnimating(false)
        setActiveLine(null)
        if (!found) {
          setSearchResult("Element not found")
        }
        return
      }

      setActiveLine(4)
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
          setActiveLine(null)
        }, 1000)
        return
      }

      currentIndex++

      // If we've reached the end without finding the value
      if (currentIndex >= nodes.length && !found) {
        clearInterval(searchInterval)
        setAnimating(false)
        setActiveLine(null)
        setSearchResult("Element not found")
      }
    }, 500)

    setInputValue("")
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Operations Panel - Top on Mobile, Left on Desktop */}
      <div className="order-1 md:col-start-1">
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
                  onKeyDown={(e) => e.key === "Enter" && (operation === "insert" ? handleInsert() : operation === "delete" ? handleDelete() : handleSearch())}
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
                className={`mt-4 p-2 rounded text-center ${searchResult === "Element found"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                  }`}
              >
                {searchResult}
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
            <CardDescription>Visual representation of the circular linked list</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Improved responsive circular linked list visualization */}
            <div className="flex items-center justify-center overflow-auto py-10 bg-muted/5 border-t min-h-[300px] md:h-[350px]">
              {nodes.length === 0 ? (
                <div className="text-muted-foreground text-sm">Empty circular linked list</div>
              ) : (
                <div className="relative w-full max-w-4xl mx-auto px-4">
                  <div className="flex flex-wrap items-center justify-center gap-y-12 gap-x-2">
                    {nodes.map((node, index) => (
                      <div key={node.id} className="flex items-center">
                        <div
                          className={`
                            flex flex-col items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full border-2 shadow-sm
                            transition-all duration-500 ease-in-out
                            ${node.highlighted ? "bg-yellow-100 dark:bg-yellow-900 border-yellow-500" : "bg-card border-primary"}
                            ${node.isNew ? "scale-110 border-green-500" : ""}
                            ${node.isDeleting ? "scale-75 opacity-50 border-red-500" : ""}
                          `}
                        >
                          <div className="text-base md:text-lg font-bold">{node.value}</div>
                          <div className="text-[10px] text-muted-foreground">id: {node.id}</div>
                        </div>

                        {index < nodes.length - 1 && (
                          <div className="flex items-center px-1">
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Improved Circular connection */}
                  {nodes.length > 1 && (
                    <div className="mt-8 flex flex-col items-center">
                      <div className="flex items-center w-full justify-between max-w-md mx-auto relative px-8">
                        <div className="absolute left-4 -top-8 bottom-0 flex flex-col items-center">
                          <div className="h-4 w-0.5 border-l border-dashed border-primary/40"></div>
                          <div className="w-full border-b border-dashed border-primary/40 rounded-bl-xl grow min-h-[1rem]"></div>
                        </div>

                        <div className="grow border-t border-dashed border-primary/40 mx-4 mt-4"></div>

                        <div className="absolute right-4 -top-8 bottom-0 flex flex-col items-center">
                          <div className="h-4 w-0.5 border-l border-dashed border-primary/40"></div>
                          <div className="w-full border-b border-dashed border-primary/40 rounded-br-xl grow min-h-[1rem]"></div>
                        </div>

                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
                          <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-1">Back to head</span>
                          <ArrowRight className="h-3 w-3 text-primary/60 transform -rotate-90 animate-bounce" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Code Panel - Third on Mobile, Left on Desktop */}
      <div className="order-3 md:col-start-1 h-[280px]">
        <CodePanel
          code={activeCode}
          activeLine={activeLine}
          title={activeCode === INSERT_CODE ? "Insertion Algorithm" : activeCode === SEARCH_CODE ? "Search Algorithm" : "Deletion Algorithm"}
        />
      </div>

      {/* Learning Panel - Last on Mobile, Left on Desktop */}
      <div className="order-4 md:col-start-1">
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
    </div>
  )
}

