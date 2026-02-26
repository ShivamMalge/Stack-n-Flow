"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, ArrowRight, Plus, Trash, Search } from "lucide-react"
import CodePanel from "@/components/ui/code-panel"

const INSERT_FRONT_CODE = [
  "def insert_front(value):",
  "    new_node = Node(value)",
  "    if not head:",
  "        head = tail = new_node",
  "    else:",
  "        new_node.next = head",
  "        head.prev = new_node",
  "        head = new_node"
]

const INSERT_REAR_CODE = [
  "def insert_rear(value):",
  "    new_node = Node(value)",
  "    if not tail:",
  "        head = tail = new_node",
  "    else:",
  "        new_node.prev = tail",
  "        tail.next = new_node",
  "        tail = new_node"
]

const DELETE_FRONT_CODE = [
  "def delete_front():",
  "    if not head: return",
  "    if head == tail:",
  "        head = tail = None",
  "    else:",
  "        head = head.next",
  "        head.prev = None"
]

const DELETE_REAR_CODE = [
  "def delete_rear():",
  "    if not tail: return",
  "    if head == tail:",
  "        head = tail = None",
  "    else:",
  "        tail = tail.prev",
  "        tail.next = None"
]

const SEARCH_CODE = [
  "def search(value):",
  "    temp = head",
  "    while temp:",
  "        if temp.value == value: return True",
  "        temp = temp.next",
  "    return False"
]

type Node = {
  id: number
  value: number
  highlighted?: boolean
  isNew?: boolean
  isDeleting?: boolean
}

export default function DoublyLinkedListVisualizer() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [inputValue, setInputValue] = useState("")
  const [operation, setOperation] = useState("insertFront")
  const [animating, setAnimating] = useState(false)
  const [nextId, setNextId] = useState(1)
  const [searchResult, setSearchResult] = useState<string | null>(null)
  const [activeCode, setActiveCode] = useState<string[]>([])
  const [activeLine, setActiveLine] = useState<number | null>(null)

  const handleInsertFront = () => {
    if (!inputValue || animating) return

    const value = Number.parseInt(inputValue)
    setAnimating(true)
    setActiveCode(INSERT_FRONT_CODE)
    setActiveLine(0)

    // Create a new node with the "isNew" flag for animation
    const newNode = { id: nextId, value, isNew: true }
    setNodes([newNode, ...nodes])
    setNextId(nextId + 1)

    // After animation, remove the "isNew" flag
    setTimeout(() => {
      setNodes((nodes) => nodes.map((node) => (node.id === newNode.id ? { ...node, isNew: false } : node)))
      setAnimating(false)
      setActiveLine(null)
    }, 1000)

    setInputValue("")
  }

  const handleInsertRear = () => {
    if (!inputValue || animating) return

    const value = Number.parseInt(inputValue)
    setAnimating(true)
    setActiveCode(INSERT_REAR_CODE)
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

  const handleDeleteFront = () => {
    if (nodes.length === 0 || animating) return

    setAnimating(true)
    setActiveCode(DELETE_FRONT_CODE)
    setActiveLine(0)

    // Mark the first node for deletion animation
    setNodes((nodes) => nodes.map((node, index) => (index === 0 ? { ...node, isDeleting: true } : node)))

    // After animation, remove the node
    setTimeout(() => {
      setNodes((nodes) => nodes.slice(1))
      setAnimating(false)
      setActiveLine(null)
    }, 1000)
  }

  const handleDeleteRear = () => {
    if (nodes.length === 0 || animating) return

    setAnimating(true)
    setActiveCode(DELETE_REAR_CODE)
    setActiveLine(0)

    // Mark the last node for deletion animation
    setNodes((nodes) => nodes.map((node, index) => (index === nodes.length - 1 ? { ...node, isDeleting: true } : node)))

    // After animation, remove the node
    setTimeout(() => {
      setNodes((nodes) => nodes.slice(0, -1))
      setAnimating(false)
      setActiveLine(null)
    }, 1000)
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

      setActiveLine(3)
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
            <CardTitle>Doubly Linked List Operations</CardTitle>
            <CardDescription>Insert, delete, or search for values in the doubly linked list</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={operation} onValueChange={setOperation}>
              <div className="overflow-x-auto pb-2">
                <TabsList className="inline-flex min-w-full md:grid md:grid-cols-5 mb-4">
                  <TabsTrigger value="insertFront" className="whitespace-nowrap text-xs md:text-sm">
                    Insert Front
                  </TabsTrigger>
                  <TabsTrigger value="insertRear" className="whitespace-nowrap text-xs md:text-sm">
                    Insert Rear
                  </TabsTrigger>
                  <TabsTrigger value="deleteFront" className="whitespace-nowrap text-xs md:text-sm">
                    Delete Front
                  </TabsTrigger>
                  <TabsTrigger value="deleteRear" className="whitespace-nowrap text-xs md:text-sm">
                    Delete Rear
                  </TabsTrigger>
                  <TabsTrigger value="search" className="whitespace-nowrap text-xs md:text-sm">
                    Search
                  </TabsTrigger>
                </TabsList>
              </div>

              {(operation === "insertFront" || operation === "insertRear" || operation === "search") && (
                <div className="flex space-x-2 mt-4">
                  <Input
                    type="number"
                    placeholder="Enter a value"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (operation === "insertFront" ? handleInsertFront() : operation === "insertRear" ? handleInsertRear() : handleSearch())}
                    disabled={animating}
                  />

                  {operation === "insertFront" && (
                    <Button onClick={handleInsertFront} disabled={animating}>
                      <Plus className="mr-2 h-4 w-4" />
                      Insert Front
                    </Button>
                  )}

                  {operation === "insertRear" && (
                    <Button onClick={handleInsertRear} disabled={animating}>
                      <Plus className="mr-2 h-4 w-4" />
                      Insert Rear
                    </Button>
                  )}

                  {operation === "search" && (
                    <Button onClick={handleSearch} disabled={animating} variant="secondary">
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </Button>
                  )}
                </div>
              )}

              {operation === "deleteFront" && (
                <div className="mt-4">
                  <Button
                    onClick={handleDeleteFront}
                    disabled={animating || nodes.length === 0}
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete Front
                  </Button>
                </div>
              )}

              {operation === "deleteRear" && (
                <div className="mt-4">
                  <Button
                    onClick={handleDeleteRear}
                    disabled={animating || nodes.length === 0}
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete Rear
                  </Button>
                </div>
              )}
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
            <CardDescription>Visual representation of the doubly linked list</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Improved responsive doubly linked list visualization */}
            <div className="flex items-center justify-center overflow-auto py-10 bg-muted/5 border-t min-h-[300px] md:h-[350px]">
              {nodes.length === 0 ? (
                <div className="text-muted-foreground text-sm">Empty doubly linked list</div>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-y-10 gap-x-2 px-4 max-w-full">
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
                        <div className="flex items-center px-1 text-muted-foreground">
                          <ArrowLeft className="h-3 w-3" />
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  ))}
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
          title={
            activeCode === INSERT_FRONT_CODE ? "Insert Front Algorithm" :
              activeCode === INSERT_REAR_CODE ? "Insert Rear Algorithm" :
                activeCode === DELETE_FRONT_CODE ? "Delete Front Algorithm" :
                  activeCode === DELETE_REAR_CODE ? "Delete Rear Algorithm" :
                    activeCode === SEARCH_CODE ? "Search Algorithm" : "Doubly Linked List Algorithm"
          }
        />
      </div>

      {/* Learning Panel - Last on Mobile, Left on Desktop */}
      <div className="order-4 md:col-start-1">
        <Card>
          <CardHeader>
            <CardTitle>Learning</CardTitle>
            <CardDescription>Understanding Doubly Linked Lists</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="mb-2">
              A <strong>Doubly Linked List</strong> is a linked list where each node contains data and references to
              both the next and previous nodes.
            </p>
            <p className="mb-2">
              <strong>Time Complexity:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access: O(n)</li>
              <li>Search: O(n)</li>
              <li>Insertion at front/rear: O(1)</li>
              <li>Deletion at front/rear: O(1)</li>
            </ul>
            <p className="mt-2">
              <strong>Advantages over Singly Linked List:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Can be traversed in both directions</li>
              <li>Deletion of a node is more efficient</li>
              <li>Can quickly insert before a given node</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

