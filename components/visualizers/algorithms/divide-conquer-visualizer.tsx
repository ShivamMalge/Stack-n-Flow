"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, RotateCcw, Plus, ArrowDown, ArrowUp } from "lucide-react"

type ArrayItem = {
  id: number
  value: number
  highlighted?: boolean
  divideLevel?: number
  merging?: boolean
  merged?: boolean
}

export default function DivideConquerVisualizer() {
  const [array, setArray] = useState<ArrayItem[]>([])
  const [inputValue, setInputValue] = useState("")
  const [animating, setAnimating] = useState(false)
  const [steps, setSteps] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [nextId, setNextId] = useState(1)
  const [dividePhase, setDividePhase] = useState<{ arrays: number[][]; level: number }[]>([])
  const [mergePhase, setMergePhase] = useState<{ arrays: number[][]; level: number }[]>([])
  const [currentPhase, setCurrentPhase] = useState<"divide" | "merge" | "none">("none")

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
    setArray([...array, { id: nextId, value }])
    setNextId(nextId + 1)

    setInputValue("")
  }

  // Function to clear the array
  const handleClearArray = () => {
    if (animating) return

    setArray([])
    setSteps([])
    setCurrentStep(0)
    setDividePhase([])
    setMergePhase([])
    setCurrentPhase("none")
  }

  const handleMergeSort = () => {
    if (animating || array.length <= 1) return

    setAnimating(true)
    setSteps([])
    setCurrentStep(0)
    setDividePhase([])
    setMergePhase([])
    setCurrentPhase("none")

    // Reset all highlights
    setArray((array) =>
      array.map((item) => ({
        ...item,
        highlighted: false,
        divideLevel: undefined,
        merging: false,
        merged: false,
      })),
    )

    const animations: (() => void)[] = []
    const sortingSteps: string[] = []
    const arrayCopy = [...array]

    sortingSteps.push("Starting Merge Sort algorithm")

    // Track the divide and merge phases for visualization
    const dividePhaseArrays: { arrays: number[][]; level: number }[] = []
    const mergePhaseArrays: { arrays: number[][]; level: number }[] = []

    // Merge sort implementation with animations
    const mergeSort = (arr: ArrayItem[], start: number, end: number, level = 0) => {
      if (start >= end) {
        return
      }

      const mid = Math.floor((start + end) / 2)

      // Divide phase
      sortingSteps.push(
        `Dividing array at level ${level}: [${arr
          .slice(start, end + 1)
          .map((item) => item.value)
          .join(", ")}]`,
      )

      // Record the divide phase for visualization
      const currentArrays = []
      if (start <= mid) {
        currentArrays.push(arr.slice(start, mid + 1).map((item) => item.value))
      }
      if (mid + 1 <= end) {
        currentArrays.push(arr.slice(mid + 1, end + 1).map((item) => item.value))
      }

      dividePhaseArrays.push({ arrays: currentArrays, level })

      // Highlight the divide phase
      animations.push(() => {
        setCurrentPhase("divide")
        setDividePhase(dividePhaseArrays.slice(0, level + 1))

        setArray((currentArray) => {
          return currentArray.map((item, idx) => ({
            ...item,
            highlighted: idx >= start && idx <= end,
            divideLevel: level,
          }))
        })
      })

      // Recursively sort the sub-arrays
      mergeSort(arr, start, mid, level + 1)
      mergeSort(arr, mid + 1, end, level + 1)

      // Merge phase
      merge(arr, start, mid, end, level)
    }

    const merge = (arr: ArrayItem[], start: number, mid: number, end: number, level: number) => {
      sortingSteps.push(
        `Merging at level ${level}: [${arr
          .slice(start, mid + 1)
          .map((item) => item.value)
          .join(", ")}] and [${arr
          .slice(mid + 1, end + 1)
          .map((item) => item.value)
          .join(", ")}]`,
      )

      // Highlight the merge phase
      animations.push(() => {
        setCurrentPhase("merge")

        setArray((currentArray) => {
          return currentArray.map((item, idx) => ({
            ...item,
            highlighted: idx >= start && idx <= end,
            merging: idx >= start && idx <= end,
            divideLevel: undefined,
          }))
        })
      })

      // Create temporary arrays
      const leftSize = mid - start + 1
      const rightSize = end - mid

      const leftArray = []
      const rightArray = []

      for (let i = 0; i < leftSize; i++) {
        leftArray.push({ ...arr[start + i] })
      }

      for (let i = 0; i < rightSize; i++) {
        rightArray.push({ ...arr[mid + 1 + i] })
      }

      // Merge the temporary arrays back into arr
      let i = 0,
        j = 0,
        k = start

      while (i < leftSize && j < rightSize) {
        if (leftArray[i].value <= rightArray[j].value) {
          arr[k] = { ...leftArray[i], merged: true }
          i++
        } else {
          arr[k] = { ...rightArray[j], merged: true }
          j++
        }
        k++
      }

      // Copy the remaining elements of leftArray, if any
      while (i < leftSize) {
        arr[k] = { ...leftArray[i], merged: true }
        i++
        k++
      }

      // Copy the remaining elements of rightArray, if any
      while (j < rightSize) {
        arr[k] = { ...rightArray[j], merged: true }
        j++
        k++
      }

      // Record the merge phase for visualization
      const mergedArray = arr.slice(start, end + 1).map((item) => item.value)
      mergePhaseArrays.push({ arrays: [mergedArray], level })

      // Show the merged array
      animations.push(() => {
        setMergePhase(mergePhaseArrays.slice(0, mergePhaseArrays.length))

        setArray((currentArray) => {
          const newArray = [...currentArray]
          for (let i = start; i <= end; i++) {
            newArray[i] = { ...arr[i], merging: false, merged: true }
          }
          return newArray
        })
      })
    }

    // Start the sorting process
    mergeSort(arrayCopy, 0, arrayCopy.length - 1)

    // Final animation to show the sorted array
    animations.push(() => {
      setArray(arrayCopy.map((item) => ({ ...item, merged: true })))
      sortingSteps.push("Array is now sorted!")
    })

    setSteps(sortingSteps)

    // Animate the steps
    let stepIndex = 0

    const animateStep = () => {
      if (stepIndex < animations.length) {
        animations[stepIndex]()
        setCurrentStep(stepIndex)
        stepIndex++
        setTimeout(animateStep, 2000)
      } else {
        setAnimating(false)
        setCurrentPhase("none")
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
            <CardTitle>Divide & Conquer - Merge Sort</CardTitle>
            <CardDescription>Create an array and sort it using the Merge Sort algorithm</CardDescription>
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
                <Button onClick={handleMergeSort} disabled={animating || array.length <= 1} className="flex-1">
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
                      2. Click "Sort Array" to visualize the Merge Sort algorithm
                      <br />
                      3. Watch the divide and conquer process
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
            <CardDescription>Understanding Divide and Conquer Algorithms</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="mb-2">
              <strong>Divide and Conquer</strong> is an algorithmic paradigm that breaks a problem into smaller
              subproblems, solves them recursively, and then combines their solutions.
            </p>
            <p className="mb-2">
              <strong>Merge Sort</strong> is a classic divide and conquer algorithm with three main steps:
            </p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                <strong>Divide:</strong> Split the array into two halves
              </li>
              <li>
                <strong>Conquer:</strong> Recursively sort the two halves
              </li>
              <li>
                <strong>Combine:</strong> Merge the sorted halves to produce a sorted array
              </li>
            </ol>
            <p className="mb-2">
              <strong>Time Complexity:</strong> O(n log n) for all cases
            </p>
            <p className="mb-2">
              <strong>Space Complexity:</strong> O(n) for the temporary arrays used during merging
            </p>
            <p className="mt-2">
              <strong>Advantages:</strong> Stable sort with guaranteed O(n log n) performance regardless of input data
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visualization Panel */}
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Visualization</CardTitle>
          <CardDescription>Visual representation of Merge Sort</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-between h-[350px]">
            {array.length === 0 ? (
              <div className="text-muted-foreground self-center">Add elements to create an array</div>
            ) : (
              <>
                {/* Original Array */}
                <div className="w-full">
                  <h3 className="text-sm font-medium mb-2">Original Array:</h3>
                  <div className="flex justify-center">
                    {array.map((item, index) => (
                      <div key={item.id} className="flex flex-col items-center mx-1">
                        <div
                          className={`
                            flex items-center justify-center w-10 h-10 border-2 
                            transition-all duration-300 ease-in-out
                            ${item.highlighted ? "bg-blue-100 dark:bg-blue-900 border-blue-500" : "bg-card border-primary"}
                            ${item.merging ? "bg-yellow-100 dark:bg-yellow-900 border-yellow-500" : ""}
                            ${item.merged ? "bg-green-100 dark:bg-green-900 border-green-500" : ""}
                          `}
                        >
                          <span className="text-sm font-bold">{item.value}</span>
                        </div>
                        <div className="mt-1 text-xs">{index}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Divide Phase Visualization */}
                {currentPhase === "divide" && dividePhase.length > 0 && (
                  <div className="w-full mt-4">
                    <div className="flex items-center justify-center mb-2">
                      <ArrowDown className="h-6 w-6 text-blue-500" />
                      <h3 className="text-sm font-medium ml-2">Divide Phase</h3>
                    </div>

                    <div className="space-y-4">
                      {dividePhase.map((level, levelIndex) => (
                        <div key={levelIndex} className="flex justify-center">
                          {level.arrays.map((subArray, arrayIndex) => (
                            <div key={arrayIndex} className="mx-2 border border-dashed border-blue-300 p-1 rounded">
                              <div className="flex">
                                {subArray.map((value, valueIndex) => (
                                  <div
                                    key={valueIndex}
                                    className="flex items-center justify-center w-8 h-8 border border-blue-500 mx-0.5 bg-blue-50 dark:bg-blue-900"
                                  >
                                    <span className="text-xs font-medium">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Merge Phase Visualization */}
                {currentPhase === "merge" && mergePhase.length > 0 && (
                  <div className="w-full mt-4">
                    <div className="flex items-center justify-center mb-2">
                      <ArrowUp className="h-6 w-6 text-green-500" />
                      <h3 className="text-sm font-medium ml-2">Merge Phase</h3>
                    </div>

                    <div className="space-y-4">
                      {mergePhase.map((level, levelIndex) => (
                        <div key={levelIndex} className="flex justify-center">
                          {level.arrays.map((subArray, arrayIndex) => (
                            <div key={arrayIndex} className="mx-2 border border-dashed border-green-300 p-1 rounded">
                              <div className="flex">
                                {subArray.map((value, valueIndex) => (
                                  <div
                                    key={valueIndex}
                                    className="flex items-center justify-center w-8 h-8 border border-green-500 mx-0.5 bg-green-50 dark:bg-green-900"
                                  >
                                    <span className="text-xs font-medium">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-center mt-4 space-x-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900 border border-blue-500 rounded-sm mr-2"></div>
                    <span className="text-xs">Dividing</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900 border border-yellow-500 rounded-sm mr-2"></div>
                    <span className="text-xs">Merging</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-100 dark:bg-green-900 border border-green-500 rounded-sm mr-2"></div>
                    <span className="text-xs">Merged</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

