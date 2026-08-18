"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { resolveState, STATE_BOX } from "@/lib/visualizer-states"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Plus, Trash, Search } from "lucide-react"
import CodePanel from "@/components/ui/code-panel"
import VisualizerLayout from "@/components/visualizers/visualizer-layout"

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

export default function LinkedListVisualizer({ 
  mini = false,
  controlledNodes,
}: { 
  mini?: boolean;
  controlledNodes?: Node[];
} = {}) {
  // Initialize with empty list
  const [internalNodes, setNodes] = useState<Node[]>([])
  const nodes = controlledNodes || internalNodes;
  const [inputValue, setInputValue] = useState("")
  // Add operation state and update the Tabs component
  const [operation, setOperation] = useState("insertFront")
  const [animating, setAnimating] = useState(false)
  const [nextId, setNextId] = useState(4)
  // Update the search function to show search results
  const [searchResult, setSearchResult] = useState<string | null>(null)
  const [activeCode, setActiveCode] = useState<string[]>([])
  const [activeLine, setActiveLine] = useState<number | null>(null)

  // Timer registry so every pending animation step is cancelled on unmount
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([])

  // Mirror of the latest nodes so timer callbacks never read a stale snapshot
  const nodesRef = useRef<Node[]>(nodes)

  useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timersRef.current.push(id)
    return id
  }, [])

  const scheduleInterval = useCallback((fn: () => void, ms: number): ReturnType<typeof setInterval> => {
    const id = setInterval(fn, ms)
    intervalsRef.current.push(id)
    return id
  }, [])

  const cancelInterval = useCallback((id: ReturnType<typeof setInterval>) => {
    clearInterval(id)
    intervalsRef.current = intervalsRef.current.filter((intervalId) => intervalId !== id)
  }, [])

  useEffect(
    () => () => {
      timersRef.current.forEach(clearTimeout)
      intervalsRef.current.forEach(clearInterval)
      timersRef.current = []
      intervalsRef.current = []
    },
    [],
  )

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

    schedule(() => {
      setActiveLine(1)
      schedule(() => {
        setActiveLine(2)
        // Create a new node with the "isNew" flag for animation
        const newNode = { id: nextId, value, isNew: true }
        setNodes([newNode, ...nodesRef.current])
        setNextId(nextId + 1)

        schedule(() => {
          setActiveLine(3)
          // After animation, remove the "isNew" flag
          schedule(() => {
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

    schedule(() => {
      setActiveLine(1)
      schedule(() => {
        if (nodesRef.current.length === 0) {
          setActiveLine(2)
          schedule(() => {
            setActiveLine(3)
            const newNode = { id: nextId, value, isNew: true }
            setNodes([newNode])
            setNextId(nextId + 1)
            schedule(() => {
              setNodes((nodes) => nodes.map((n) => (n.id === newNode.id ? { ...n, isNew: false } : n)))
              setAnimating(false)
              setActiveLine(null)
            }, 500)
          }, 500)
          return
        }

        setActiveLine(5)
        schedule(() => {
          setActiveLine(6)
          schedule(() => {
            setActiveLine(8)
            const newNode = { id: nextId, value, isNew: true }
            setNodes([...nodesRef.current, newNode])
            setNextId(nextId + 1)
            schedule(() => {
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

    schedule(() => {
      setActiveLine(2)
      if (nodeIndex === 0) {
        setActiveLine(3)
        schedule(() => {
          setNodes((nodes) => nodes.map((node, index) => (index === 0 ? { ...node, isDeleting: true } : node)))
          schedule(() => {
            setNodes((nodes) => nodes.slice(1))
            setAnimating(false)
            setActiveLine(null)
          }, 500)
        }, 500)
        return
      }

      setActiveLine(5)
      schedule(() => {
        setActiveLine(6)
        schedule(() => {
          setActiveLine(9)
          setNodes((nodes) => nodes.map((node, index) => (index === nodeIndex ? { ...node, isDeleting: true } : node)))
          schedule(() => {
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

    schedule(() => {
      setActiveLine(1)
      const searchInterval = scheduleInterval(() => {
        if (currentIndex >= nodesRef.current.length) {
          cancelInterval(searchInterval)
          setAnimating(false)
          if (!found) {
            setSearchResult("Element not found")
            setActiveLine(5)
          }
          schedule(() => setActiveLine(null), 1000)
          return
        }

        setNodes((nodes) =>
          nodes.map((node, index) => ({
            ...node,
            highlighted: index === currentIndex,
          })),
        )

        setActiveLine(2)
        schedule(() => {
          setActiveLine(3)
          // Check if current node has the value we're looking for
          if (nodesRef.current[currentIndex]?.value === value) {
            found = true
            setSearchResult("Element found")
            cancelInterval(searchInterval)
            schedule(() => {
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
    <VisualizerLayout
      mini={mini}
      controls={
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
      }
      visualization={
        <Card className="h-full border-0 md:border md:shadow-sm">
          {!mini && (
            <CardHeader>
              <CardTitle>Visualization</CardTitle>
              <CardDescription>Visual representation of the linked list</CardDescription>
            </CardHeader>
          )}
          <CardContent className={mini ? "p-0" : ""}>
            <div className="flex flex-1 justify-center overflow-auto py-8 bg-muted/5 border-t min-h-[250px] max-h-[60vh]">
              {nodes.length === 0 ? (
                <div className="m-auto text-muted-foreground text-sm">Empty linked list</div>
              ) : (
                <div className="m-auto flex flex-wrap items-center justify-center gap-y-8 gap-x-2 px-4 max-w-full">
                  {nodes.map((node, index) => (
                    <div key={node.id} className="flex items-center">
                      <div
                        className={`
                          flex flex-col items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full border-2 
                          transition-all duration-500 ease-in-out shadow-sm
                          ${STATE_BOX[resolveState({ removed: node.isDeleting, comparing: node.highlighted, inserted: node.isNew })]}
                          ${node.isNew ? "scale-110" : ""}
                          ${node.isDeleting ? "scale-75 opacity-50" : ""}
                        `}
                      >
                        <div className="text-base md:text-lg font-bold">{node.value}</div>
                        <div className="text-xs text-muted-foreground font-mono">id: {node.id}</div>
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
      }
      code={
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
      }
      docs={
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
      }
    />
  )
}

