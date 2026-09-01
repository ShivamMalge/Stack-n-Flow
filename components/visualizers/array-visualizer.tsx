"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash, Search } from "lucide-react"
import CodePanel from "@/components/ui/code-panel"
import VisualizerLayout from "@/components/visualizers/visualizer-layout"
import ArrayRenderer from "@/components/visualizers/array/array-renderer"

const INSERT_CODE = [
  "def insert(value, index):",
  "    if index < 0 or index > size: return",
  "    for i in range(size, index, -1):",
  "        array[i] = array[i-1]",
  "    array[index] = value",
  "    size += 1"
]

const DELETE_CODE = [
  "def delete(index):",
  "    if index < 0 or index >= size: return",
  "    for i in range(index, size - 1):",
  "        array[i] = array[i+1]",
  "    size -= 1"
]

const SEARCH_CODE = [
  "def search(value):",
  "    for i in range(size):",
  "        if array[i] == value:",
  "            return i",
  "    return -1"
]

type ArrayItem = {
  id: number
  value: number
  highlighted?: boolean
  isNew?: boolean
  isDeleting?: boolean
}

export default function ArrayVisualizer({ 
  mini = false,
  controlledNodes,
}: { 
  mini?: boolean;
  controlledNodes?: ArrayItem[];
} = {}) {
  const [internalArray, setArray] = useState<ArrayItem[]>([])
  const array = controlledNodes || internalArray;
  const [inputValue, setInputValue] = useState("")
  const [indexValue, setIndexValue] = useState("")
  const [operation, setOperation] = useState("insert")
  const [animating, setAnimating] = useState(false)
  const [nextId, setNextId] = useState(1)
  const [searchResult, setSearchResult] = useState<string | null>(null)
  const [activeCode, setActiveCode] = useState<string[]>([])
  const [activeLine, setActiveLine] = useState<number | null>(null)

  // Timer registry so every pending animation step is cancelled on unmount
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([])

  // Mirror of the latest array so timer callbacks never read a stale snapshot
  const arrayRef = useRef<ArrayItem[]>(array)

  useEffect(() => {
    arrayRef.current = array
  }, [array])

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
    if (mini && array.length === 0) {
      setArray([
        { id: 101, value: 5 },
        { id: 102, value: 12 },
        { id: 103, value: 8 },
        { id: 104, value: 21 },
        { id: 105, value: 4 }
      ]);
    }
  }, [mini, array.length]);

  const handleInsert = () => {
    if (!inputValue || !indexValue || animating) return

    const value = Number.parseInt(inputValue)
    const index = Number.parseInt(indexValue)

    if (index < 0 || index > array.length) {
      setSearchResult("Invalid index")
      return
    }

    setAnimating(true)
    setSearchResult(null)
    setActiveCode(INSERT_CODE)
    setActiveLine(0)

    schedule(() => {
      setActiveLine(2)
      schedule(() => {
        setActiveLine(3)
        schedule(() => {
          setActiveLine(4)
          // Create a new item with the "isNew" flag for animation
          const newItem = { id: nextId, value, isNew: true }

          // Insert at the specified index
          const newArray = [...arrayRef.current]
          newArray.splice(index, 0, newItem)
          setArray(newArray)
          setNextId(nextId + 1)

          schedule(() => {
            setActiveLine(5)
            // After animation, remove the "isNew" flag
            schedule(() => {
              setArray((array) => array.map((item) => (item.id === newItem.id ? { ...item, isNew: false } : item)))
              setAnimating(false)
              setActiveLine(null)
            }, 500)
          }, 500)
        }, 500)
      }, 500)
    }, 500)

    setInputValue("")
    setIndexValue("")
  }

  const handleDelete = () => {
    if (!indexValue || animating || array.length === 0) return

    const index = Number.parseInt(indexValue)

    if (index < 0 || index >= array.length) {
      setSearchResult("Invalid index")
      return
    }

    setAnimating(true)
    setSearchResult(null)
    setActiveCode(DELETE_CODE)
    setActiveLine(0)

    schedule(() => {
      setActiveLine(2)
      schedule(() => {
        setActiveLine(3)
        // Mark the item for deletion animation
        setArray((array) => array.map((item, i) => (i === index ? { ...item, isDeleting: true } : item)))

        schedule(() => {
          setActiveLine(4)
          // After animation, remove the item
          schedule(() => {
            setArray((array) => array.filter((_, i) => i !== index))
            setAnimating(false)
            setActiveLine(null)
          }, 500)
        }, 500)
      }, 500)
    }, 500)

    setIndexValue("")
  }

  const handleSearch = () => {
    if (!inputValue || animating) return

    const value = Number.parseInt(inputValue)
    setAnimating(true)
    setSearchResult(null)
    setActiveCode(SEARCH_CODE)
    setActiveLine(0)

    // Reset all highlights
    setArray((array) => array.map((item) => ({ ...item, highlighted: false })))

    // Animate search through each item
    let currentIndex = 0
    let found = false

    const searchInterval = scheduleInterval(() => {
      setActiveLine(1)
      if (currentIndex >= arrayRef.current.length) {
        cancelInterval(searchInterval)
        setAnimating(false)
        if (!found) {
          setSearchResult("Element not found")
          setActiveLine(4)
          schedule(() => setActiveLine(null), 1000)
        }
        return
      }

      setArray((array) =>
        array.map((item, i) => ({
          ...item,
          highlighted: i === currentIndex,
        })),
      )

      setActiveLine(2)
      // Check if current item has the value we're looking for
      if (arrayRef.current[currentIndex]?.value === value) {
        found = true
        setSearchResult(`Element found at index ${currentIndex}`)
        setActiveLine(3)
        cancelInterval(searchInterval)
        schedule(() => {
          setArray((array) => array.map((item) => ({ ...item, highlighted: false })))
          setAnimating(false)
          setActiveLine(null)
        }, 1000)
        return
      }

      currentIndex++

      // If we've reached the end without finding the value
      if (currentIndex >= arrayRef.current.length && !found) {
        schedule(() => {
          setSearchResult("Element not found")
        }, 500)
      }
    }, 500)

    setInputValue("")
  }

  return (
    <VisualizerLayout
      mini={mini}
      controls={
        <Card>
          <CardHeader>
            <CardTitle>Array Operations</CardTitle>
            <CardDescription>Insert, delete, or search for values in the array</CardDescription>
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

              {operation === "insert" && (
                <div className="space-y-4 mt-4">
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Enter a value"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleInsert()}
                      disabled={animating}
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Enter index"
                      value={indexValue}
                      onChange={(e) => setIndexValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleInsert()}
                      disabled={animating}
                    />

                    <Button onClick={handleInsert} disabled={animating}>
                      <Plus className="mr-2 h-4 w-4" />
                      Insert
                    </Button>
                  </div>
                </div>
              )}

              {operation === "delete" && (
                <div className="space-y-4 mt-4">
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Enter index"
                      value={indexValue}
                      onChange={(e) => setIndexValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleDelete()}
                      disabled={animating}
                    />

                    <Button onClick={handleDelete} disabled={animating} variant="destructive">
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}

              {operation === "search" && (
                <div className="flex space-x-2 mt-4">
                  <Input
                    type="number"
                    placeholder="Enter a value"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    disabled={animating}
                  />

                  <Button onClick={handleSearch} disabled={animating} variant="secondary">
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                </div>
              )}
            </Tabs>

            {searchResult && (
              <div
                className={`mt-4 p-2 rounded text-center ${searchResult.includes("found at index")
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                  : searchResult === "Invalid index"
                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                  }`}
              >
                {searchResult}
              </div>
            )}
          </CardContent>
        </Card>
      }
      visualization={<ArrayRenderer items={array} mini={mini} />}
      code={
        <CodePanel
          code={activeCode}
          activeLine={activeLine}
          title={activeCode === INSERT_CODE ? "Insertion Algorithm" : activeCode === DELETE_CODE ? "Deletion Algorithm" : activeCode === SEARCH_CODE ? "Linear Search" : "Algorithm Pseudocode"}
        />
      }
      docs={
        <Card>
          <CardHeader>
            <CardTitle>Learning</CardTitle>
            <CardDescription>Understanding Arrays</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="mb-2">
              An <strong>Array</strong> is a linear data structure that stores elements of the same type in contiguous
              memory locations.
            </p>
            <p className="mb-2">
              <strong>Time Complexity:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access: O(1)</li>
              <li>Search: O(n) for linear search, O(log n) for binary search on sorted arrays</li>
              <li>Insertion: O(n) in worst case (need to shift elements)</li>
              <li>Deletion: O(n) in worst case (need to shift elements)</li>
            </ul>
            <p className="mt-2">
              <strong>Advantages:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Random access in constant time</li>
              <li>Good cache locality</li>
              <li>Memory efficient (no pointers needed)</li>
            </ul>
          </CardContent>
        </Card>
      }
    />
  )
}

