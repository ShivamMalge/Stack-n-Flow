"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash, Search } from "lucide-react"
import CodePanel from "@/components/ui/code-panel"

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

export default function ArrayVisualizer({ mini = false }: { mini?: boolean } = {}) {
  const [array, setArray] = useState<ArrayItem[]>([])
  const [inputValue, setInputValue] = useState("")
  const [indexValue, setIndexValue] = useState("")
  const [operation, setOperation] = useState("insert")
  const [animating, setAnimating] = useState(false)
  const [nextId, setNextId] = useState(1)
  const [searchResult, setSearchResult] = useState<string | null>(null)
  const [activeCode, setActiveCode] = useState<string[]>([])
  const [activeLine, setActiveLine] = useState<number | null>(null)

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

    setTimeout(() => {
      setActiveLine(2)
      setTimeout(() => {
        setActiveLine(3)
        setTimeout(() => {
          setActiveLine(4)
          // Create a new item with the "isNew" flag for animation
          const newItem = { id: nextId, value, isNew: true }

          // Insert at the specified index
          const newArray = [...array]
          newArray.splice(index, 0, newItem)
          setArray(newArray)
          setNextId(nextId + 1)

          setTimeout(() => {
            setActiveLine(5)
            // After animation, remove the "isNew" flag
            setTimeout(() => {
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

    setTimeout(() => {
      setActiveLine(2)
      setTimeout(() => {
        setActiveLine(3)
        // Mark the item for deletion animation
        setArray((array) => array.map((item, i) => (i === index ? { ...item, isDeleting: true } : item)))

        setTimeout(() => {
          setActiveLine(4)
          // After animation, remove the item
          setTimeout(() => {
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

    const searchInterval = setInterval(() => {
      setActiveLine(1)
      if (currentIndex >= array.length) {
        clearInterval(searchInterval)
        setAnimating(false)
        if (!found) {
          setSearchResult("Element not found")
          setActiveLine(4)
          setTimeout(() => setActiveLine(null), 1000)
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
      if (array[currentIndex].value === value) {
        found = true
        setSearchResult(`Element found at index ${currentIndex}`)
        setActiveLine(3)
        clearInterval(searchInterval)
        setTimeout(() => {
          setArray((array) => array.map((item) => ({ ...item, highlighted: false })))
          setAnimating(false)
          setActiveLine(null)
        }, 1000)
        return
      }

      currentIndex++

      // If we've reached the end without finding the value
      if (currentIndex >= array.length && !found) {
        setTimeout(() => {
          setSearchResult("Element not found")
        }, 500)
      }
    }, 500)

    setInputValue("")
  }

  return (
    <div className={mini ? "flex flex-col w-full" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
      {/* Operations Panel - Order 1 on Mobile, Left on Desktop */}
      {!mini && (
        <div className="order-1 md:col-start-1">
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
        </div>
      )}

      {/* Visualization Panel - Order 2 on Mobile, Right on Desktop */}
      <div className={mini ? "w-full" : "order-2 md:col-start-2 md:row-span-3"}>
        <Card className="h-full border-0 md:border md:shadow-sm">
          {!mini && (
            <CardHeader>
              <CardTitle>Visualization</CardTitle>
              <CardDescription>Visual representation of the array</CardDescription>
            </CardHeader>
          )}
          <CardContent className={mini ? "p-0" : ""}>
            {/* Improved responsive array visualization */}
            <div className="flex items-center justify-center overflow-auto py-10 bg-muted/5 border-t min-h-[300px] md:h-[350px]">
              {array.length === 0 ? (
                <div className="text-muted-foreground text-sm">Empty array</div>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-y-12 gap-x-2 px-4 max-w-full">
                  {array.map((item, index) => (
                    <div key={item.id} className="flex flex-col items-center group">
                      <div
                        className={`
                          flex items-center justify-center w-14 h-14 md:w-16 md:h-16 border-2 shadow-sm
                          transition-all duration-500 ease-in-out
                          ${item.highlighted ? "bg-yellow-100 dark:bg-yellow-900 border-yellow-500 ring-2 ring-yellow-500/20" : "bg-card border-primary"}
                          ${item.isNew ? "scale-105 border-green-500" : ""}
                          ${item.isDeleting ? "scale-75 opacity-0 -translate-y-8" : ""}
                        `}
                      >
                        <div className="text-base md:text-lg font-bold">{item.value}</div>
                      </div>
                      <div className="mt-2 text-[10px] font-mono text-muted-foreground group-hover:text-primary transition-colors">
                        [{index}]
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Code Panel - Order 3 on Mobile, Left on Desktop */}
      {!mini && (
        <div className="order-3 md:col-start-1 h-[280px]">
          <CodePanel
            code={activeCode}
            activeLine={activeLine}
            title={activeCode === INSERT_CODE ? "Insertion Algorithm" : activeCode === DELETE_CODE ? "Deletion Algorithm" : activeCode === SEARCH_CODE ? "Linear Search" : "Algorithm Pseudocode"}
          />
        </div>
      )}

      {/* Learning Panel - Order 4 on Mobile, Left on Desktop */}
      {!mini && (
        <div className="order-4 md:col-start-1">
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
        </div>
      )}
    </div>
  )
}

