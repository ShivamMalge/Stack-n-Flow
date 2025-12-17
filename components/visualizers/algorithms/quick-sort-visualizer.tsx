"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, RotateCcw, Plus } from "lucide-react"

type ArrayItem = {
  id: number
  value: number
  highlighted?: boolean
  isPivot?: boolean
  isSorted?: boolean
  isSwapping?: boolean
}

export default function QuickSortVisualizer() {
  const [array, setArray] = useState<ArrayItem[]>([])
  const [inputValue, setInputValue] = useState("")
  const [animating, setAnimating] = useState(false)
  const [steps, setSteps] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [nextId, setNextId] = useState(1)

  // Refs for animation cleanup
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
    }
  }, [])

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
    setArray((prevArray) => [...prevArray, { id: nextId, value }])
    setNextId((prevId) => prevId + 1)

    setInputValue("")
  }

  // Function to clear the array
  const handleClearArray = () => {
    if (animating) return

    setArray([])
    setSteps([])
    setCurrentStep(0)
  }

  // Fix the Quick Sort algorithm to properly handle sorting and ensure it works correctly
  // Replace the handleSort function with this improved version:

  const handleSort = () => {
    if (animating || array.length <= 1) return

    // Clean up any existing animation
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current)
    }

    setAnimating(true)
    setSteps([])
    setCurrentStep(0)

    // Reset all highlights
    setArray((prevArray) =>
      prevArray.map((item) => ({
        ...item,
        highlighted: false,
        isPivot: false,
        isSorted: false,
        isSwapping: false,
      })),
    )

    const animations: (() => void)[] = []
    const sortingSteps: string[] = []

    // Create a deep copy of the array to work with
    const arrayCopy = [...array.map((item) => ({ ...item }))]

    sortingSteps.push("Starting Quick Sort algorithm")

    // Quick sort implementation with animations
    const quickSort = (arr: ArrayItem[], low: number, high: number) => {
      if (low < high) {
        // Partition the array and get the pivot index
        const pivotIndex = partition(arr, low, high)

        // Recursively sort the sub-arrays
        quickSort(arr, low, pivotIndex - 1)
        quickSort(arr, pivotIndex + 1, high)
      }
    }

    // Update the handleSort function to ensure we're not creating duplicate keys during swapping
    // Modify the partition function to ensure proper array updates:

    const partition = (arr: ArrayItem[], low: number, high: number) => {
      // Choose the rightmost element as pivot
      const pivotValue = arr[high].value
      sortingSteps.push(`Choosing pivot: ${pivotValue} (index ${high})`)

      animations.push(() => {
        if (!isMountedRef.current) return
        setArray((currentArray) => {
          return currentArray.map((item, index) => {
            if (index === high) {
              return { ...item, isPivot: true }
            }
            return { ...item }
          })
        })
      })

      // Index of smaller element
      let i = low - 1

      sortingSteps.push(`Partitioning array from index ${low} to ${high}`)

      for (let j = low; j < high; j++) {
        // Highlight current element being compared
        animations.push(() => {
          if (!isMountedRef.current) return
          setArray((currentArray) => {
            return currentArray.map((item, index) => {
              if (index === j) {
                return { ...item, highlighted: true }
              }
              return { ...item }
            })
          })
        })

        // If current element is smaller than the pivot
        if (arr[j].value < pivotValue) {
          i++

          // Swap arr[i] and arr[j]
          if (i !== j) {
            sortingSteps.push(`Swapping ${arr[i].value} and ${arr[j].value}`)

            animations.push(() => {
              if (!isMountedRef.current) return
              setArray((currentArray) => {
                return currentArray.map((item, index) => {
                  if (index === i) {
                    return { ...item, isSwapping: true }
                  }
                  if (index === j) {
                    return { ...item, isSwapping: true }
                  }
                  return { ...item }
                })
              })
            })

            // Perform the swap correctly
            const temp = { ...arr[i] }
            arr[i] = { ...arr[j] }
            arr[j] = { ...temp }

            animations.push(() => {
              if (!isMountedRef.current) return
              setArray((currentArray) => {
                return currentArray.map((item, index) => {
                  if (index === i) {
                    return {
                      ...item,
                      value: arr[i].value,
                      isSwapping: true,
                    }
                  }
                  if (index === j) {
                    return {
                      ...item,
                      value: arr[j].value,
                      isSwapping: true,
                    }
                  }
                  return { ...item }
                })
              })
            })

            // Remove swap highlighting
            animations.push(() => {
              if (!isMountedRef.current) return
              setArray((currentArray) => {
                return currentArray.map((item, index) => {
                  if (index === i) {
                    return { ...item, isSwapping: false }
                  }
                  if (index === j) {
                    return { ...item, isSwapping: false, highlighted: false }
                  }
                  return { ...item }
                })
              })
            })
          } else {
            // Remove highlighting if no swap
            animations.push(() => {
              if (!isMountedRef.current) return
              setArray((currentArray) => {
                return currentArray.map((item, index) => {
                  if (index === j) {
                    return { ...item, highlighted: false }
                  }
                  return { ...item }
                })
              })
            })
          }
        } else {
          // Remove highlighting if no swap
          animations.push(() => {
            if (!isMountedRef.current) return
            setArray((currentArray) => {
              return currentArray.map((item, index) => {
                if (index === j) {
                  return { ...item, highlighted: false }
                }
                return { ...item }
              })
            })
          })
        }
      }

      // Swap arr[i+1] and arr[high] (the pivot)
      i++

      if (i !== high) {
        sortingSteps.push(`Placing pivot ${pivotValue} at its correct position (index ${i})`)

        animations.push(() => {
          if (!isMountedRef.current) return
          setArray((currentArray) => {
            return currentArray.map((item, index) => {
              if (index === i) {
                return { ...item, isSwapping: true }
              }
              if (index === high) {
                return { ...item, isSwapping: true }
              }
              return { ...item }
            })
          })
        })

        // Perform the swap correctly
        const temp = { ...arr[i] }
        arr[i] = { ...arr[high] }
        arr[high] = { ...temp }

        animations.push(() => {
          if (!isMountedRef.current) return
          setArray((currentArray) => {
            return currentArray.map((item, index) => {
              if (index === i) {
                return {
                  ...item,
                  value: arr[i].value,
                  isSwapping: true,
                  isPivot: true,
                }
              }
              if (index === high) {
                return {
                  ...item,
                  value: arr[high].value,
                  isSwapping: true,
                  isPivot: false,
                }
              }
              return { ...item }
            })
          })
        })

        // Remove swap highlighting but keep pivot
        animations.push(() => {
          if (!isMountedRef.current) return
          setArray((currentArray) => {
            return currentArray.map((item, index) => {
              if (index === i) {
                return { ...item, isSwapping: false, isPivot: true, isSorted: true }
              }
              if (index === high) {
                return { ...item, isSwapping: false, isPivot: false }
              }
              return { ...item }
            })
          })
        })
      } else {
        // Mark pivot as sorted
        animations.push(() => {
          if (!isMountedRef.current) return
          setArray((currentArray) => {
            return currentArray.map((item, index) => {
              if (index === i) {
                return { ...item, isPivot: true, isSorted: true }
              }
              return { ...item }
            })
          })
        })
      }

      // Remove pivot highlighting
      animations.push(() => {
        if (!isMountedRef.current) return
        setArray((currentArray) => {
          return currentArray.map((item, index) => {
            if (index === i) {
              return { ...item, isPivot: false, isSorted: true }
            }
            return { ...item }
          })
        })
      })

      return i
    }

    // Start the sorting process
    quickSort(arrayCopy, 0, arrayCopy.length - 1)

    // Final animation to show the sorted array
    animations.push(() => {
      if (!isMountedRef.current) return

      // Create a new array with the sorted values
      setArray((currentArray) => {
        return currentArray.map((item, index) => ({
          ...item,
          value: arrayCopy[index].value,
          isSorted: true,
        }))
      })

      sortingSteps.push("Array is now sorted!")
    })

    setSteps(sortingSteps)

    // Animate the steps
    let stepIndex = 0

    const animateStep = () => {
      if (!isMountedRef.current) return

      if (stepIndex < animations.length) {
        animations[stepIndex]()
        setCurrentStep(Math.min(stepIndex, sortingSteps.length - 1))
        stepIndex++
        animationTimeoutRef.current = setTimeout(animateStep, 1000)
      } else {
        setAnimating(false)
        animationTimeoutRef.current = null
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
            <CardTitle>Quick Sort Algorithm</CardTitle>
            <CardDescription>Create an array and sort it using the Quick Sort algorithm</CardDescription>
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
                <Button onClick={handleSort} disabled={animating || array.length <= 1} className="flex-1">
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
                      2. Click "Sort Array" to visualize the Quick Sort algorithm
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
            <CardDescription>Understanding Quick Sort</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="mb-2">
              <strong>Quick Sort</strong> is a divide-and-conquer sorting algorithm that works by selecting a 'pivot'
              element and partitioning the array around it.
            </p>
            <p className="mb-2">
              <strong>Time Complexity:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Best/Average Case: O(n log n)</li>
              <li>Worst Case: O(n²) when the array is already sorted</li>
            </ul>
            <p className="mb-2">
              <strong>Key Steps:</strong>
            </p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Choose a pivot element from the array</li>
              <li>
                Partition the array around the pivot (elements less than pivot go to the left, greater go to the right)
              </li>
              <li>Recursively apply the above steps to the sub-arrays</li>
            </ol>
            <p className="mt-2">
              <strong>Advantages:</strong> Quick Sort is often faster in practice than other O(n log n) algorithms like
              Merge Sort, and it doesn't require additional memory for merging.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visualization Panel */}
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Visualization</CardTitle>
          <CardDescription>Visual representation of Quick Sort</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-center h-[300px] pt-8">
            {array.length === 0 ? (
              <div className="text-muted-foreground">Add elements to create an array</div>
            ) : (
              array.map((item, index) => {
                const height = Math.min(item.value * 2 + 20, 280) // Cap height to prevent overflow

                return (
                  <div key={`array-item-${item.id}-${index}`} className="flex flex-col items-center mx-1">
                    <div
                      style={{ height: `${height}px` }}
                      className={`
                        w-10 rounded-t-md transition-all duration-300 ease-in-out flex items-end justify-center pb-1
                        ${item.isPivot ? "bg-purple-500 dark:bg-purple-600" : ""}
                        ${item.highlighted ? "bg-blue-400 dark:bg-blue-500" : ""}
                        ${item.isSorted ? "bg-green-400 dark:bg-green-500" : ""}
                        ${item.isSwapping ? "bg-yellow-400 dark:bg-yellow-500" : ""}
                        ${!item.isPivot && !item.highlighted && !item.isSorted && !item.isSwapping ? "bg-primary/70" : ""}
                      `}
                    >
                      <span className="text-xs font-medium text-white">{item.value}</span>
                    </div>
                    <div className="mt-2 text-xs">{index}</div>
                  </div>
                )
              })
            )}
          </div>

          <div className="flex justify-center mt-4 space-x-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-purple-500 dark:bg-purple-600 rounded-sm mr-2"></div>
              <span className="text-xs">Pivot</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-400 dark:bg-blue-500 rounded-sm mr-2"></div>
              <span className="text-xs">Comparing</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-400 dark:bg-yellow-500 rounded-sm mr-2"></div>
              <span className="text-xs">Swapping</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-400 dark:bg-green-500 rounded-sm mr-2"></div>
              <span className="text-xs">Sorted</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

