"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Plus, RotateCcw, Play } from "lucide-react"

type ArrayItem = {
  value: number
  highlighted?: boolean
  isTarget?: boolean
  isMid?: boolean
  isLow?: boolean
  isHigh?: boolean
}

export default function BinarySearchVisualizer() {
  const [array, setArray] = useState<ArrayItem[]>([])
  const [inputValue, setInputValue] = useState("")
  const [searchValue, setSearchValue] = useState("")
  const [animating, setAnimating] = useState(false)
  const [searchResult, setSearchResult] = useState<string | null>(null)
  const [steps, setSteps] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [isSorted, setIsSorted] = useState(true)

  // Function to add a new element to the array
  const handleAddElement = () => {
    if (!inputValue || animating) return

    const value = Number.parseInt(inputValue)

    // Add validation to limit value to 500
    if (value > 500) {
      alert("Please enter a value not greater than 500")
      return
    }

    // Add the new element
    const newArray = [...array, { value }]
    setArray(newArray)

    // Check if the array is still sorted
    checkIfSorted(newArray)

    setInputValue("")
  }

  // Function to check if array is sorted
  const checkIfSorted = (arr: ArrayItem[]) => {
    const values = arr.map((item) => item.value)
    for (let i = 1; i < values.length; i++) {
      if (values[i] < values[i - 1]) {
        setIsSorted(false)
        return
      }
    }
    setIsSorted(true)
  }

  // Function to sort the array
  const handleSortArray = () => {
    if (animating) return

    const sortedArray = [...array].sort((a, b) => a.value - b.value)
    setArray(sortedArray)
    setIsSorted(true)
  }

  // Function to clear the array
  const handleClearArray = () => {
    if (animating) return

    setArray([])
    setSteps([])
    setCurrentStep(0)
    setSearchResult(null)
    setIsSorted(true)
  }

  const handleSearch = () => {
    if (!searchValue || animating || array.length === 0 || !isSorted) return

    const target = Number.parseInt(searchValue)
    setAnimating(true)
    setSearchResult(null)
    setSteps([])
    setCurrentStep(0)

    // Reset all highlights
    setArray((array) =>
      array.map((item) => ({
        ...item,
        highlighted: false,
        isTarget: false,
        isMid: false,
        isLow: false,
        isHigh: false,
      })),
    )

    // Binary search algorithm
    let low = 0
    let high = array.length - 1
    let found = false
    const searchSteps: string[] = []
    const animationSteps: (() => void)[] = []

    // Initial step
    searchSteps.push(`Starting binary search for value ${target}`)
    searchSteps.push(`Initial range: indices ${low} to ${high}`)

    animationSteps.push(() => {
      setArray((array) =>
        array.map((item, index) => ({
          ...item,
          highlighted: index >= low && index <= high,
          isLow: index === low,
          isHigh: index === high,
          isTarget: item.value === target,
        })),
      )
    })

    while (low <= high && !found) {
      const mid = Math.floor((low + high) / 2)
      const midValue = array[mid].value

      searchSteps.push(`Checking middle element at index ${mid} with value ${midValue}`)

      animationSteps.push(() => {
        setArray((array) =>
          array.map((item, index) => ({
            ...item,
            highlighted: index >= low && index <= high,
            isMid: index === mid,
            isLow: index === low,
            isHigh: index === high,
            isTarget: item.value === target,
          })),
        )
      })

      if (midValue === target) {
        found = true
        searchSteps.push(`Found ${target} at index ${mid}!`)

        animationSteps.push(() => {
          setArray((array) =>
            array.map((item, index) => ({
              ...item,
              highlighted: index === mid,
              isMid: index === mid,
              isTarget: item.value === target,
            })),
          )
          setSearchResult(`Found ${target} at index ${mid}`)
        })
      } else if (midValue < target) {
        low = mid + 1
        searchSteps.push(`${midValue} < ${target}, so we search the right half`)
        searchSteps.push(`New range: indices ${low} to ${high}`)

        animationSteps.push(() => {
          setArray((array) =>
            array.map((item, index) => ({
              ...item,
              highlighted: index >= low && index <= high,
              isLow: index === low,
              isHigh: index === high,
              isTarget: item.value === target,
            })),
          )
        })
      } else {
        high = mid - 1
        searchSteps.push(`${midValue} > ${target}, so we search the left half`)
        searchSteps.push(`New range: indices ${low} to ${high}`)

        animationSteps.push(() => {
          setArray((array) =>
            array.map((item, index) => ({
              ...item,
              highlighted: index >= low && index <= high,
              isLow: index === low,
              isHigh: index === high,
              isTarget: item.value === target,
            })),
          )
        })
      }
    }

    if (!found) {
      searchSteps.push(`${target} not found in the array`)
      animationSteps.push(() => {
        setArray((array) =>
          array.map((item) => ({
            ...item,
            highlighted: false,
            isMid: false,
            isLow: false,
            isHigh: false,
          })),
        )
        setSearchResult(`${target} not found in the array`)
      })
    }

    setSteps(searchSteps)

    // Animate the steps
    let stepIndex = 0

    const animateStep = () => {
      if (stepIndex < animationSteps.length) {
        animationSteps[stepIndex]()
        setCurrentStep(stepIndex)
        stepIndex++
        setTimeout(animateStep, 1000)
      } else {
        setAnimating(false)
      }
    }

    animateStep()
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Operations Panel */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Binary Search Algorithm</CardTitle>
            <CardDescription>Create a sorted array and search for a value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Enter a value to add"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={animating}
                />

                <Button onClick={handleAddElement} disabled={animating}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleSortArray}
                  disabled={animating || array.length <= 1 || isSorted}
                  variant="outline"
                  className="flex-1"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Sort Array
                </Button>

                <Button
                  onClick={handleClearArray}
                  disabled={animating || array.length === 0}
                  variant="outline"
                  className="flex-1"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Clear Array
                </Button>
              </div>

              {!isSorted && array.length > 1 && (
                <div className="p-2 rounded text-center bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
                  Array must be sorted for binary search to work. Click "Sort Array" button.
                </div>
              )}

              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium mb-2">Search in Array</h3>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="Enter a value to search"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    disabled={animating || !isSorted || array.length === 0}
                  />

                  <Button
                    onClick={handleSearch}
                    disabled={animating || !isSorted || array.length === 0}
                    variant="secondary"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                </div>
              </div>

              {searchResult && (
                <div
                  className={`p-2 rounded text-center ${
                    searchResult.includes("Found")
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                  }`}
                >
                  {searchResult}
                </div>
              )}

              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Algorithm Steps:</h3>
                <div className="bg-muted/30 rounded-md p-3 h-[200px] overflow-y-auto">
                  {steps.length > 0 ? (
                    <ol className="space-y-1 pl-5 list-decimal">
                      {steps.map((step, index) => (
                        <li
                          key={index}
                          className={`text-sm ${index <= currentStep ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          {step}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      1. Add elements to create an array
                      <br />
                      2. Make sure the array is sorted
                      <br />
                      3. Enter a value and click Search
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learning</CardTitle>
            <CardDescription>Understanding Binary Search</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="mb-2">
              <strong>Binary Search</strong> is a search algorithm that finds the position of a target value within a
              sorted array.
            </p>
            <p className="mb-2">
              <strong>Time Complexity:</strong> O(log n)
            </p>
            <p className="mb-2">
              <strong>Key Steps:</strong>
            </p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Compare the target value with the middle element of the array</li>
              <li>If they match, return the middle index</li>
              <li>If the target is less than the middle element, search the left half</li>
              <li>If the target is greater than the middle element, search the right half</li>
              <li>Repeat until the value is found or the search space is empty</li>
            </ol>
            <p className="mt-2">
              <strong>Requirements:</strong> The array must be sorted for binary search to work correctly.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visualization Panel */}
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Visualization</CardTitle>
          <CardDescription>Visual representation of binary search</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center overflow-x-auto py-12 h-[300px]">
            {array.length === 0 ? (
              <div className="text-muted-foreground">Add elements to create an array</div>
            ) : (
              <div className="flex flex-col">
                <div className="flex">
                  {array.map((item, index) => (
                    <div key={index} className="flex flex-col items-center mx-1">
                      <div
                        className={`
                          flex items-center justify-center w-12 h-12 border-2 
                          transition-all duration-300 ease-in-out
                          ${item.highlighted ? "bg-blue-100 dark:bg-blue-900 border-blue-500" : "bg-card border-primary"}
                          ${item.isMid ? "bg-purple-100 dark:bg-purple-900 border-purple-500" : ""}
                          ${item.isLow ? "border-l-4 border-l-green-500" : ""}
                          ${item.isHigh ? "border-r-4 border-r-green-500" : ""}
                          ${item.isTarget ? "bg-yellow-100 dark:bg-yellow-900 border-yellow-500" : ""}
                        `}
                      >
                        <div className="text-sm font-bold">{item.value}</div>
                      </div>
                      <div className="mt-2 text-xs">{index}</div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center mt-8 space-x-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900 border border-blue-500 rounded-sm mr-2"></div>
                    <span className="text-xs">Search Range</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-purple-100 dark:bg-purple-900 border border-purple-500 rounded-sm mr-2"></div>
                    <span className="text-xs">Middle Element</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900 border border-yellow-500 rounded-sm mr-2"></div>
                    <span className="text-xs">Target Value</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

