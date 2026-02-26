"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Plus, Trash, Search } from "lucide-react"
import CodePanel from "@/components/ui/code-panel"

const INSERT_FRONT_CODE = [
  "def insert_front(value):",
  "    new_node = Node(value)",
  "    new_node.next = head",
  "    head = new_node",
  "    return"
]

const INSERT_REAR_CODE = [
  "def insert_rear(value):",
  "    new_node = Node(value)",
  "    if not head:",
  "        head = new_node",
  "        return",
  "    curr = head",
  "    while curr.next:",
  "        curr = curr.next",
  "    curr.next = new_node",
  "    return"
]

const DELETE_CODE = [
  "def delete(value):",
  "    if not head: return",
  "    if head.value == value:",
  "        head = head.next",
  "        return",
  "    curr = head",
  "    while curr.next and curr.next.value != value:",
  "        curr = curr.next",
  "    if curr.next:",
  "        curr.next = curr.next.next"
]

const SEARCH_CODE = [
  "def search(value):",
  "    curr = head",
  "    while curr:",
  "        if curr.value == value: return True",
  "        curr = curr.next",
  "    return False"
]

type Node = {
  id: number
  value: number
  highlighted?: boolean
  isNew?: boolean
  isDeleting?: boolean
}

export default function LinkedListVisualizer({ mini = false }: { mini?: boolean } = {}) {
  // Initialize with empty list
  const [nodes, setNodes] = useState<Node[]>([])
  const [inputValue, setInputValue] = useState("")
  // Add operation state and update the Tabs component
  const [operation, setOperation] = useState("insertFront")
  const [animating, setAnimating] = useState(false)
  const [nextId, setNextId] = useState(4)
  // Update the search function to show search results
  const [searchResult, setSearchResult] = useState<string | null>(null)
  const [activeCode, setActiveCode] = useState<string[]>([])
  const [activeLine, setActiveLine] = useState<number | null>(null)

  useEffect(() => {
    if (mini && nodes.length === 0) {
      setNodes([
        { id: 101, value: 12 },
        { id: 102, value: 99 },
        { id: 103, value: 37 }
      ]);
    }
  }, [mini, nodes.length]);

  // Add insertFront function
  const handleInsertFront = () => {
    if (!inputValue || animating) return

    const value = Number.parseInt(inputValue)
    setAnimating(true)
    setActiveCode(INSERT_FRONT_CODE)
    setActiveLine(0)

    setTimeout(() => {
      setActiveLine(1)
      setTimeout(() => {
        setActiveLine(2)
        // Create a new node with the "isNew" flag for animation
        const newNode = { id: nextId, value, isNew: true }
        setNodes([newNode, ...nodes])
        setNextId(nextId + 1)

        setTimeout(() => {
          setActiveLine(3)
          // After animation, remove the "isNew" flag
          setTimeout(() => {
            setNodes((nodes) => nodes.map((node) => (node.id === newNode.id ? { ...node, isNew: false } : node)))
            setAnimating(false)
            setActiveLine(null)
          }, 500)
        }, 500)
      }, 500)
    }, 500)

    setInputValue("")
  }

  const handleInsert = () => {
    if (!inputValue || animating) return

    const value = Number.parseInt(inputValue)
    setAnimating(true)
    setActiveCode(INSERT_REAR_CODE)
    setActiveLine(0)

    setTimeout(() => {
      setActiveLine(1)
      setTimeout(() => {
        if (nodes.length === 0) {
          setActiveLine(2)
          setTimeout(() => {
            setActiveLine(3)
            const newNode = { id: nextId, value, isNew: true }
            setNodes([newNode])
            setNextId(nextId + 1)
            setTimeout(() => {
              setNodes((nodes) => nodes.map((n) => (n.id === newNode.id ? { ...n, isNew: false } : n)))
              setAnimating(false)
              setActiveLine(null)
            }, 500)
          }, 500)
          return
        }

        setActiveLine(5)
        setTimeout(() => {
          setActiveLine(6)
          setTimeout(() => {
            setActiveLine(8)
            const newNode = { id: nextId, value, isNew: true }
            setNodes([...nodes, newNode])
            setNextId(nextId + 1)
            setTimeout(() => {
              setNodes((nodes) => nodes.map((n) => (n.id === newNode.id ? { ...n, isNew: false } : n)))
              setAnimating(false)
              setActiveLine(null)
            }, 500)
          }, 500)
        }, 500)
      }, 500)
    }, 500)

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

    setTimeout(() => {
      setActiveLine(2)
      if (nodeIndex === 0) {
        setActiveLine(3)
        setTimeout(() => {
          setNodes((nodes) => nodes.map((node, index) => (index === 0 ? { ...node, isDeleting: true } : node)))
          setTimeout(() => {
            setNodes((nodes) => nodes.slice(1))
            setAnimating(false)
            setActiveLine(null)
          }, 500)
        }, 500)
        return
      }

      setActiveLine(5)
      setTimeout(() => {
        setActiveLine(6)
        setTimeout(() => {
          setActiveLine(9)
          setNodes((nodes) => nodes.map((node, index) => (index === nodeIndex ? { ...node, isDeleting: true } : node)))
          setTimeout(() => {
            setNodes((nodes) => nodes.filter((_, index) => index !== nodeIndex))
            setAnimating(false)
            setActiveLine(null)
          }, 500)
        }, 500)
      }, 500)
    }, 500)

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

    setTimeout(() => {
      setActiveLine(1)
      const searchInterval = setInterval(() => {
        if (currentIndex >= nodes.length) {
          clearInterval(searchInterval)
          setAnimating(false)
          if (!found) {
            setSearchResult("Element not found")
            setActiveLine(5)
          }
          setTimeout(() => setActiveLine(null), 1000)
          return
        }

        setNodes((nodes) =>
          nodes.map((node, index) => ({
            ...node,
            highlighted: index === currentIndex,
          })),
        )

        setActiveLine(2)
        setTimeout(() => {
          setActiveLine(3)
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

          setActiveLine(4)
          currentIndex++
        }, 200)

      }, 800)
    }, 500)

    setInputValue("")
  }

  return (
    <div className={mini ? "flex flex-col w-full" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
      {/* Operations Panel - Top on Mobile, Left on Desktop */}
      {!mini && (
        <div className="order-1 md:col-start-1">
          <Card>
            <CardHeader>
              <CardTitle>Linked List Operations</CardTitle>
              <CardDescription>Insert, delete, or search for values in the linked list</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={operation} onValueChange={setOperation}>
                <div className="overflow-x-auto pb-2">
                  <TabsList className="inline-flex min-w-full md:grid md:grid-cols-4 mb-4">
                    <TabsTrigger value="insertFront" className="whitespace-nowrap text-xs md:text-sm">
                      Insert Front
                    </TabsTrigger>
                    <TabsTrigger value="insert" className="whitespace-nowrap text-xs md:text-sm">
                      Insert Rear
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
                    onKeyDown={(e) => e.key === "Enter" && (operation === "insertFront" ? handleInsertFront() : operation === "insert" ? handleInsert() : operation === "delete" ? handleDelete() : handleSearch())}
                    disabled={animating}
                  />

                  {operation === "insertFront" && (
                    <Button onClick={handleInsertFront} disabled={animating}>
                      <Plus className="mr-2 h-4 w-4" />
                      Insert
                    </Button>
                  )}

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
            </CardContent>
          </Card>
        </div>
      )}

      {/* Visualization Panel - Second on Mobile, Right on Desktop */}
      <div className={mini ? "w-full" : "order-2 md:col-start-2 md:row-span-3"}>
        <Card className="h-full border-0 md:border md:shadow-sm">
          {!mini && (
            <CardHeader>
              <CardTitle>Visualization</CardTitle>
              <CardDescription>Visual representation of the linked list</CardDescription>
            </CardHeader>
          )}
          <CardContent className={mini ? "p-0" : ""}>
            <div className="flex items-center justify-center overflow-auto py-8 bg-muted/5 border-t min-h-[250px] md:h-[300px]">
              {nodes.length === 0 ? (
                <div className="text-muted-foreground text-sm">Empty linked list</div>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-y-8 gap-x-2 px-4 max-w-full">
                  {nodes.map((node, index) => (
                    <div key={node.id} className="flex items-center">
                      <div
                        className={`
                          flex flex-col items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full border-2 
                          transition-all duration-500 ease-in-out shadow-sm
                          ${node.highlighted ? "bg-yellow-100 dark:bg-yellow-900 border-yellow-500" : "bg-card border-primary"}
                          ${node.isNew ? "scale-110 border-green-500" : ""}
                          ${node.isDeleting ? "scale-75 opacity-50 border-red-500" : ""}
                        `}
                      >
                        <div className="text-base md:text-lg font-bold">{node.value}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">id: {node.id}</div>
                      </div>

                      {index < nodes.length - 1 && (
                        <div className="flex items-center px-1">
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {!mini && searchResult && (
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

      {/* Live Code Panel - Third on Mobile, Left on Desktop */}
      {!mini && (
        <div className="order-3 md:col-start-1 h-[280px]">
          <CodePanel
            code={activeCode}
            activeLine={activeLine}
            title={
              activeCode === INSERT_FRONT_CODE ? "Insert Front" :
                activeCode === INSERT_REAR_CODE ? "Insert Rear" :
                  activeCode === DELETE_CODE ? "Delete Node" :
                    activeCode === SEARCH_CODE ? "Search Node" : "Algorithm Logic"
            }
          />
        </div>
      )}

      {/* Learning Panel - Last on Mobile, Left on Desktop */}
      {!mini && (
        <div className="order-4 md:col-start-1">
          <Card>
            <CardHeader>
              <CardTitle>Learning</CardTitle>
              <CardDescription>Understanding Linked Lists</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="mb-2">
                A <strong>Linked List</strong> is a linear data structure where elements are stored in nodes. Each node
                contains data and a reference to the next node.
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

