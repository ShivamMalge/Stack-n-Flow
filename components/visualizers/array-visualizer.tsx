"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash, Search } from "lucide-react"

type ArrayItem = {
  id: number
  value: number
  highlighted?: boolean
  isNew?: boolean
  isDeleting?: boolean
}

export default function ArrayVisualizer() {
  const [array, setArray] = useState<ArrayItem[]>([])
  const [inputValue, setInputValue] = useState("")
  const [indexValue, setIndexValue] = useState("")
  const [operation, setOperation] = useState("insert")
  const [animating, setAnimating] = useState(false)
  const [nextId, setNextId] = useState(1)
  const [searchResult, setSearchResult] = useState<string | null>(null)

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

    // Create a new item with the "isNew" flag for animation
    const newItem = { id: nextId, value, isNew: true }

    // Insert at the specified index
    const newArray = [...array]
    newArray.splice(index, 0, newItem)
    setArray(newArray)
    setNextId(nextId + 1)

    // After animation, remove the "isNew" flag
    setTimeout(() => {
      setArray((array) => array.map((item) => (item.id === newItem.id ? { ...item, isNew: false } : item)))
      setAnimating(false)
    }, 1000)

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

    // Mark the item for deletion animation
    setArray((array) => array.map((item, i) => (i === index ? { ...item, isDeleting: true } : item)))

    // After animation, remove the item
    setTimeout(() => {
      setArray((array) => array.filter((_, i) => i !== index))
      setAnimating(false)
    }, 1000)

    setIndexValue("")
  }

  const handleSearch = () => {
    if (!inputValue || animating) return

    const value = Number.parseInt(inputValue)
    setAnimating(true)
    setSearchResult(null)

    // Reset all highlights
    setArray((array) => array.map((item) => ({ ...item, highlighted: false })))

    // Animate search through each item
    let currentIndex = 0
    let found = false

    const searchInterval = setInterval(() => {
      if (currentIndex >= array.length) {
        clearInterval(searchInterval)
        setAnimating(false)
        if (!found) {
          setSearchResult("Element not found")
        }
        return
      }

      setArray((array) =>
        array.map((item, i) => ({
          ...item,
          highlighted: i === currentIndex,
        })),
      )

      // Check if current item has the value we're looking for
      if (array[currentIndex].value === value) {
        found = true
        setSearchResult(`Element found at index ${currentIndex}`)
        clearInterval(searchInterval)
        setTimeout(() => {
          setArray((array) => array.map((item) => ({ ...item, highlighted: false })))
          setAnimating(false)
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Operations Panel */}
      <div className="space-y-6">
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
                      disabled={animating}
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Enter index"
                      value={indexValue}
                      onChange={(e) => setIndexValue(e.target.value)}
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
                className={`mt-4 p-2 rounded text-center ${
                  searchResult.includes("found at index")
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

      {/* Visualization Panel */}
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Visualization</CardTitle>
          <CardDescription>Visual representation of the array</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center overflow-x-auto py-12 h-[300px]">
            {array.length === 0 ? (
              <div className="text-muted-foreground">Empty array</div>
            ) : (
              <div className="flex flex-col" style={{ minWidth: Math.max(300, array.length * 80) + "px" }}>
                <div className="flex">
                  {array.map((item, index) => (
                    <div key={item.id} className="flex flex-col items-center mx-1">
                      <div
                        className={`
                          flex items-center justify-center w-16 h-16 border-2 
                          transition-all duration-500 ease-in-out
                          ${item.highlighted ? "bg-yellow-100 dark:bg-yellow-900 border-yellow-500" : "bg-card border-primary"}
                          ${item.isNew ? "scale-110 border-green-500" : ""}
                          ${item.isDeleting ? "scale-75 opacity-50 border-red-500" : ""}
                        `}
                      >
                        <div className="text-lg font-bold">{item.value}</div>
                      </div>
                      <div className="mt-2 text-sm">{index}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

