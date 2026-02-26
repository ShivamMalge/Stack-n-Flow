"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Shuffle } from "lucide-react"
import AnimationControls from "@/components/ui/animation-controls"
import { useAnimationPlayer, type AnimationFrame } from "@/hooks/useAnimationPlayer"

type ArrayItem = {
  id: number
  value: number
  highlighted?: boolean
  isPivot?: boolean
  isSorted?: boolean
  isSwapping?: boolean
}

type QuickSortFrame = {
  array: ArrayItem[]
  stepDescription: string
}

export default function QuickSortVisualizer() {
  const [array, setArray] = useState<ArrayItem[]>([])
  const [inputValue, setInputValue] = useState("")
  const [nextId, setNextId] = useState(1)
  const [steps, setSteps] = useState<string[]>([])

  const onFrameChange = useCallback((snapshot: QuickSortFrame, _frameIndex: number) => {
    setArray(snapshot.array)
  }, [])

  const player = useAnimationPlayer<QuickSortFrame>(onFrameChange)

  const handleAddElement = () => {
    if (!inputValue || player.isPlaying) return

    const value = Number.parseInt(inputValue)
    if (isNaN(value)) return

    if (value > 500) {
      alert("Please enter a value not greater than 500")
      return
    }

    setArray((prev) => [...prev, { id: nextId, value }])
    setNextId((prev) => prev + 1)
    setInputValue("")
  }

  const handleClearArray = () => {
    if (player.isPlaying) return
    setArray([])
    setSteps([])
    player.clear()
  }

  const handleGenerateRandom = () => {
    if (player.isPlaying) return
    const count = Math.floor(Math.random() * 6) + 5 // 5–10 elements
    const newArray: ArrayItem[] = []
    let id = nextId
    for (let i = 0; i < count; i++) {
      newArray.push({ id: id++, value: Math.floor(Math.random() * 100) + 1 })
    }
    setNextId(id)
    setArray(newArray)
    setSteps([])
    player.clear()
  }

  const handleSort = () => {
    if (player.isPlaying || array.length <= 1) return

    // Pre-compute all animation frames as snapshots
    const frames: AnimationFrame<QuickSortFrame>[] = []
    const sortingSteps: string[] = []

    // Start with a clean array
    const cleanArray = array.map((item) => ({
      ...item,
      highlighted: false,
      isPivot: false,
      isSorted: false,
      isSwapping: false,
    }))

    // Initial frame
    sortingSteps.push("Starting Quick Sort algorithm")
    frames.push({
      snapshot: { array: cleanArray.map((item) => ({ ...item })), stepDescription: "Starting Quick Sort algorithm" },
      description: "Starting Quick Sort algorithm",
    })

    // Deep copy for sorting
    const arr = cleanArray.map((item) => ({ ...item }))

    const captureFrame = (
      workingArr: ArrayItem[],
      description: string,
      overrides?: Record<number, Partial<ArrayItem>>
    ) => {
      const snap = workingArr.map((item, idx) => ({
        ...item,
        highlighted: false,
        isPivot: false,
        isSwapping: false,
        ...((overrides && overrides[idx]) || {}),
      }))
      sortingSteps.push(description)
      frames.push({
        snapshot: { array: snap, stepDescription: description },
        description,
      })
    }

    const quickSort = (arr: ArrayItem[], low: number, high: number) => {
      if (low < high) {
        const pivotIndex = partition(arr, low, high)
        quickSort(arr, low, pivotIndex - 1)
        quickSort(arr, pivotIndex + 1, high)
      } else if (low === high) {
        // Single element is already sorted
        arr[low] = { ...arr[low], isSorted: true }
        captureFrame(arr, `Element ${arr[low].value} at index ${low} is in its sorted position`, {
          [low]: { isSorted: true },
        })
      }
    }

    const partition = (arr: ArrayItem[], low: number, high: number): number => {
      const pivotValue = arr[high].value

      // Show pivot selection
      captureFrame(arr, `Choosing pivot: ${pivotValue} (index ${high})`, {
        [high]: { isPivot: true },
      })

      let i = low - 1

      for (let j = low; j < high; j++) {
        // Highlight current element being compared
        const compareOverrides: Record<number, Partial<ArrayItem>> = {
          [high]: { isPivot: true },
          [j]: { highlighted: true },
        }
        captureFrame(arr, `Comparing ${arr[j].value} with pivot ${pivotValue}`, compareOverrides)

        if (arr[j].value < pivotValue) {
          i++
          if (i !== j) {
            // Show swap
            captureFrame(arr, `${arr[j].value} < ${pivotValue}: Swapping ${arr[i].value} and ${arr[j].value}`, {
              [high]: { isPivot: true },
              [i]: { isSwapping: true },
              [j]: { isSwapping: true },
            })

            // Perform swap
            const temp = { ...arr[i] }
            arr[i] = { ...arr[j] }
            arr[j] = { ...temp }

            // Show result of swap
            captureFrame(arr, `Swapped: array now has ${arr[i].value} at index ${i} and ${arr[j].value} at index ${j}`, {
              [high]: { isPivot: true },
            })
          } else {
            captureFrame(arr, `${arr[j].value} < ${pivotValue}: Already in correct position`, {
              [high]: { isPivot: true },
            })
          }
        } else {
          captureFrame(arr, `${arr[j].value} >= ${pivotValue}: No swap needed`, {
            [high]: { isPivot: true },
          })
        }
      }

      // Place pivot in its correct position
      i++
      if (i !== high) {
        captureFrame(arr, `Placing pivot ${pivotValue} at its correct position (index ${i})`, {
          [i]: { isSwapping: true },
          [high]: { isSwapping: true, isPivot: true },
        })

        const temp = { ...arr[i] }
        arr[i] = { ...arr[high] }
        arr[high] = { ...temp }
      }

      // Mark pivot as sorted
      arr[i] = { ...arr[i], isSorted: true }
      captureFrame(arr, `Pivot ${pivotValue} is now at its sorted position (index ${i})`, {
        [i]: { isSorted: true },
      })

      return i
    }

    quickSort(arr, 0, arr.length - 1)

    // Final frame: all sorted
    const finalArr = arr.map((item) => ({ ...item, isSorted: true, highlighted: false, isPivot: false, isSwapping: false }))
    sortingSteps.push("Array is now sorted!")
    frames.push({
      snapshot: { array: finalArr, stepDescription: "Array is now sorted!" },
      description: "Array is now sorted!",
    })

    setSteps(sortingSteps)
    player.loadFrames(frames)
    player.play()
  }

  // Determine the visible step index based on player state
  const visibleStepIndex = player.currentFrame >= 0 ? player.currentFrame : -1

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
                  onKeyDown={(e) => e.key === "Enter" && handleAddElement()}
                  disabled={player.isPlaying}
                />
                <Button onClick={handleAddElement} disabled={player.isPlaying}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleGenerateRandom} disabled={player.isPlaying} variant="outline" className="flex-1">
                  <Shuffle className="mr-2 h-4 w-4" />
                  Random
                </Button>
                <Button
                  onClick={handleClearArray}
                  disabled={player.isPlaying || array.length === 0}
                  variant="outline"
                  className="flex-1"
                >
                  Clear
                </Button>
              </div>

              <Button onClick={handleSort} disabled={player.isPlaying || array.length <= 1} className="w-full">
                Sort Array
              </Button>

              {/* Animation Controls */}
              {player.totalFrames > 0 && (
                <AnimationControls
                  currentFrame={player.currentFrame}
                  totalFrames={player.totalFrames}
                  isPlaying={player.isPlaying}
                  isPaused={player.isPaused}
                  isComplete={player.isComplete}
                  speed={player.speed}
                  disabled={false}
                  onPlay={player.play}
                  onPause={player.pause}
                  onStepForward={player.stepForward}
                  onStepBackward={player.stepBackward}
                  onReset={() => {
                    player.reset()
                    // Restore the initial unsorted array
                    if (player.totalFrames > 0) {
                      player.goToFrame(0)
                    }
                  }}
                  onSpeedChange={player.setSpeed}
                  onFrameChange={player.goToFrame}
                />
              )}

              <div>
                <h3 className="text-sm font-medium mb-2">Algorithm Steps:</h3>
                <div className="bg-muted/30 rounded-md p-3 h-[200px] overflow-y-auto">
                  {steps.length > 0 ? (
                    <ol className="space-y-1 pl-5 list-decimal">
                      {steps.map((step, index) => (
                        <li
                          key={index}
                          className={`text-sm transition-colors ${index <= visibleStepIndex ? "text-foreground" : "text-muted-foreground"
                            }`}
                        >
                          {step}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      1. Add elements to create an array
                      <br />
                      2. Click &quot;Sort Array&quot; to visualize the Quick Sort algorithm
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
              <strong>Quick Sort</strong> is a divide-and-conquer sorting algorithm that works by selecting a
              &apos;pivot&apos; element and partitioning the array around it.
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
              <li>Partition the array around the pivot (elements less than pivot go to the left, greater go to the right)</li>
              <li>Recursively apply the above steps to the sub-arrays</li>
            </ol>
            <p className="mt-2">
              <strong>Advantages:</strong> Quick Sort is often faster in practice than other O(n log n) algorithms like
              Merge Sort, and it doesn&apos;t require additional memory for merging.
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
          <div className="flex items-end justify-center h-[240px] md:h-[300px] pt-8 px-2 overflow-x-hidden">
            {array.length === 0 ? (
              <div className="text-muted-foreground">Add elements to create an array</div>
            ) : (
              array.map((item, index) => {
                const height = Math.min(item.value * 2 + 20, 260)

                return (
                  <div key={`array-item-${item.id}-${index}`} className="flex flex-col items-center flex-1 max-w-[40px] mx-0.5">
                    <div
                      style={{ height: `${height}px` }}
                      className={`
                        w-full rounded-t-sm md:rounded-t-md transition-all duration-300 ease-in-out flex items-end justify-center pb-1
                        ${item.isPivot ? "bg-purple-500 dark:bg-purple-600" : ""}
                        ${item.highlighted ? "bg-blue-400 dark:bg-blue-500" : ""}
                        ${item.isSorted ? "bg-green-400 dark:bg-green-500" : ""}
                        ${item.isSwapping ? "bg-yellow-400 dark:bg-yellow-500" : ""}
                        ${!item.isPivot && !item.highlighted && !item.isSorted && !item.isSwapping ? "bg-primary/70" : ""}
                      `}
                    >
                      <span className="text-[10px] md:text-xs font-medium text-white">{item.value}</span>
                    </div>
                    <div className="mt-2 text-[10px] md:text-xs">{index}</div>
                  </div>
                )
              })
            )}
          </div>

          {/* Current step description */}
          {player.currentDescription && (
            <div className="mt-3 text-center text-sm font-medium text-primary">
              {player.currentDescription}
            </div>
          )}

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
