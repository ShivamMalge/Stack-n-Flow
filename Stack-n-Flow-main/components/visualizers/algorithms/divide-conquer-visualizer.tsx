"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RotateCcw, Plus, ArrowDown, ArrowUp, Shuffle } from "lucide-react"
import AnimationControls from "@/components/ui/animation-controls"
import { useAnimationPlayer, type AnimationFrame } from "@/hooks/useAnimationPlayer"

type ArrayItem = {
  id: number
  value: number
  highlighted?: boolean
  divideLevel?: number
  merging?: boolean
  merged?: boolean
}

type DivideConquerFrame = {
  array: ArrayItem[]
  currentPhase: "divide" | "merge" | "none"
  dividePhase: { arrays: number[][]; level: number }[]
  mergePhase: { arrays: number[][]; level: number }[]
  stepDescription: string
}

export default function DivideConquerVisualizer() {
  const [array, setArray] = useState<ArrayItem[]>([])
  const [inputValue, setInputValue] = useState("")
  const [nextId, setNextId] = useState(1)
  const [steps, setSteps] = useState<string[]>([])
  const [currentPhase, setCurrentPhase] = useState<"divide" | "merge" | "none">("none")
  const [dividePhase, setDividePhase] = useState<{ arrays: number[][]; level: number }[]>([])
  const [mergePhase, setMergePhase] = useState<{ arrays: number[][]; level: number }[]>([])

  const onFrameChange = useCallback((snapshot: DivideConquerFrame) => {
    setArray(snapshot.array)
    setCurrentPhase(snapshot.currentPhase)
    setDividePhase(snapshot.dividePhase)
    setMergePhase(snapshot.mergePhase)
  }, [])

  const player = useAnimationPlayer<DivideConquerFrame>(onFrameChange)

  const handleAddElement = () => {
    if (!inputValue || player.isPlaying) return
    const value = Number.parseInt(inputValue)
    if (isNaN(value) || value > 500) {
      if (value > 500) alert("Please enter a value not greater than 500")
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
    setCurrentPhase("none")
    setDividePhase([])
    setMergePhase([])
    player.clear()
  }

  const handleGenerateRandom = () => {
    if (player.isPlaying) return
    const count = Math.floor(Math.random() * 5) + 4
    const newArray: ArrayItem[] = []
    let id = nextId
    for (let i = 0; i < count; i++) {
      newArray.push({ id: id++, value: Math.floor(Math.random() * 80) + 1 })
    }
    setNextId(id)
    setArray(newArray)
    setSteps([])
    setCurrentPhase("none")
    setDividePhase([])
    setMergePhase([])
    player.clear()
  }

  const handleMergeSort = () => {
    if (player.isPlaying || array.length <= 1) return

    const frames: AnimationFrame<DivideConquerFrame>[] = []
    const sortingSteps: string[] = []

    const cleanArray = array.map((item) => ({
      ...item,
      highlighted: false,
      divideLevel: undefined,
      merging: false,
      merged: false,
    }))

    const arr = cleanArray.map((item) => ({ ...item }))
    const dividePhaseArrays: { arrays: number[][]; level: number }[] = []
    const mergePhaseArrays: { arrays: number[][]; level: number }[] = []

    sortingSteps.push("Starting Merge Sort algorithm")
    frames.push({
      snapshot: {
        array: arr.map((i) => ({ ...i })),
        currentPhase: "none",
        dividePhase: [],
        mergePhase: [],
        stepDescription: "Starting Merge Sort",
      },
      description: "Starting Merge Sort algorithm",
    })

    const mergeSort = (arr: ArrayItem[], start: number, end: number, level = 0) => {
      if (start >= end) return

      const mid = Math.floor((start + end) / 2)

      const desc = `Dividing [${arr.slice(start, end + 1).map((i) => i.value).join(", ")}] at level ${level}`
      sortingSteps.push(desc)

      const currentArrays = []
      if (start <= mid) currentArrays.push(arr.slice(start, mid + 1).map((i) => i.value))
      if (mid + 1 <= end) currentArrays.push(arr.slice(mid + 1, end + 1).map((i) => i.value))
      dividePhaseArrays.push({ arrays: currentArrays, level })

      frames.push({
        snapshot: {
          array: arr.map((item, idx) => ({
            ...item,
            highlighted: idx >= start && idx <= end,
            divideLevel: level,
          })),
          currentPhase: "divide",
          dividePhase: dividePhaseArrays.map((d) => ({ ...d, arrays: d.arrays.map((a) => [...a]) })),
          mergePhase: mergePhaseArrays.map((m) => ({ ...m, arrays: m.arrays.map((a) => [...a]) })),
          stepDescription: desc,
        },
        description: desc,
      })

      mergeSort(arr, start, mid, level + 1)
      mergeSort(arr, mid + 1, end, level + 1)
      merge(arr, start, mid, end, level)
    }

    const merge = (arr: ArrayItem[], start: number, mid: number, end: number, level: number) => {
      const desc = `Merging [${arr.slice(start, mid + 1).map((i) => i.value).join(", ")}] and [${arr.slice(mid + 1, end + 1).map((i) => i.value).join(", ")}]`
      sortingSteps.push(desc)

      frames.push({
        snapshot: {
          array: arr.map((item, idx) => ({
            ...item,
            highlighted: idx >= start && idx <= end,
            merging: idx >= start && idx <= end,
            divideLevel: undefined,
          })),
          currentPhase: "merge",
          dividePhase: dividePhaseArrays.map((d) => ({ ...d, arrays: d.arrays.map((a) => [...a]) })),
          mergePhase: mergePhaseArrays.map((m) => ({ ...m, arrays: m.arrays.map((a) => [...a]) })),
          stepDescription: desc,
        },
        description: desc,
      })

      const leftArr = arr.slice(start, mid + 1).map((i) => ({ ...i }))
      const rightArr = arr.slice(mid + 1, end + 1).map((i) => ({ ...i }))

      let i = 0, j = 0, k = start
      while (i < leftArr.length && j < rightArr.length) {
        if (leftArr[i].value <= rightArr[j].value) {
          arr[k] = { ...leftArr[i], merged: true }; i++
        } else {
          arr[k] = { ...rightArr[j], merged: true }; j++
        }
        k++
      }
      while (i < leftArr.length) { arr[k] = { ...leftArr[i], merged: true }; i++; k++ }
      while (j < rightArr.length) { arr[k] = { ...rightArr[j], merged: true }; j++; k++ }

      const mergedArray = arr.slice(start, end + 1).map((i) => i.value)
      mergePhaseArrays.push({ arrays: [mergedArray], level })

      const mergedDesc = `Merged into [${mergedArray.join(", ")}]`
      sortingSteps.push(mergedDesc)

      frames.push({
        snapshot: {
          array: arr.map((item, idx) => ({
            ...item,
            merging: false,
            merged: idx >= start && idx <= end,
          })),
          currentPhase: "merge",
          dividePhase: dividePhaseArrays.map((d) => ({ ...d, arrays: d.arrays.map((a) => [...a]) })),
          mergePhase: mergePhaseArrays.map((m) => ({ ...m, arrays: m.arrays.map((a) => [...a]) })),
          stepDescription: mergedDesc,
        },
        description: mergedDesc,
      })
    }

    mergeSort(arr, 0, arr.length - 1)

    sortingSteps.push("Array is now sorted!")
    frames.push({
      snapshot: {
        array: arr.map((item) => ({ ...item, merged: true, merging: false, highlighted: false })),
        currentPhase: "none",
        dividePhase: [],
        mergePhase: [],
        stepDescription: "Array is now sorted!",
      },
      description: "Array is now sorted!",
    })

    setSteps(sortingSteps)
    player.loadFrames(frames)
    player.play()
  }

  const visibleStepIndex = player.currentFrame

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Divide &amp; Conquer — Merge Sort</CardTitle>
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
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>

              <Button onClick={handleMergeSort} disabled={player.isPlaying || array.length <= 1} className="w-full">
                Sort Array (Merge Sort)
              </Button>

              {player.totalFrames > 0 && (
                <AnimationControls
                  currentFrame={player.currentFrame}
                  totalFrames={player.totalFrames}
                  isPlaying={player.isPlaying}
                  isPaused={player.isPaused}
                  isComplete={player.isComplete}
                  speed={player.speed}
                  onPlay={player.play}
                  onPause={player.pause}
                  onStepForward={player.stepForward}
                  onStepBackward={player.stepBackward}
                  onReset={() => { player.reset(); setCurrentPhase("none"); setDividePhase([]); setMergePhase([]) }}
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
                          className={`text-sm transition-colors ${index <= visibleStepIndex ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          {step}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      1. Add elements to create an array
                      <br />
                      2. Click &quot;Sort Array&quot; to visualize the Merge Sort algorithm
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
              <li><strong>Divide:</strong> Split the array into two halves</li>
              <li><strong>Conquer:</strong> Recursively sort the two halves</li>
              <li><strong>Combine:</strong> Merge the sorted halves to produce a sorted array</li>
            </ol>
            <p className="mb-2 mt-2"><strong>Time Complexity:</strong> O(n log n) for all cases</p>
            <p className="mb-2"><strong>Space Complexity:</strong> O(n) for the temporary arrays used during merging</p>
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
                <div className="w-full">
                  <h3 className="text-sm font-medium mb-2">Array:</h3>
                  <div className="flex justify-center flex-wrap gap-1 px-2">
                    {array.map((item, index) => (
                      <div key={item.id} className="flex flex-col items-center">
                        <div
                          className={`
                            flex items-center justify-center w-8 h-8 md:w-10 md:h-10 border-2 
                            transition-all duration-300 ease-in-out rounded-md
                            ${item.highlighted ? "bg-blue-100 dark:bg-blue-900 border-blue-500" : "bg-card border-primary"}
                            ${item.merging ? "bg-yellow-100 dark:bg-yellow-900 border-yellow-500" : ""}
                            ${item.merged ? "bg-green-100 dark:bg-green-900 border-green-500" : ""}
                          `}
                        >
                          <span className="text-xs md:text-sm font-bold">{item.value}</span>
                        </div>
                        <div className="mt-1 text-[10px] md:text-xs text-muted-foreground">{index}</div>
                      </div>
                    ))}
                  </div>
                  {player.currentDescription && (
                    <div className="mt-2 text-center text-sm font-medium text-primary">
                      {player.currentDescription}
                    </div>
                  )}
                </div>

                {currentPhase === "divide" && dividePhase.length > 0 && (
                  <div className="w-full mt-2 bg-muted/20 p-2 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <ArrowDown className="h-4 w-4 text-blue-500" />
                      <h3 className="text-xs font-medium ml-1">Divide Phase</h3>
                    </div>
                    <div className="space-y-3 overflow-x-auto pb-2 -mx-2 px-2">
                      {dividePhase.map((level, levelIndex) => (
                        <div key={levelIndex} className="flex justify-center min-w-max mx-auto gap-2">
                          {level.arrays.map((subArray, arrayIndex) => (
                            <div key={arrayIndex} className="border border-dashed border-blue-300 p-1 rounded bg-background/50">
                              <div className="flex gap-0.5">
                                {subArray.map((value, valueIndex) => (
                                  <div key={valueIndex} className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 border border-blue-500 bg-blue-50 dark:bg-blue-900 rounded-sm">
                                    <span className="text-[10px] md:text-xs font-medium">{value}</span>
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

                {currentPhase === "merge" && mergePhase.length > 0 && (
                  <div className="w-full mt-2 bg-muted/20 p-2 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <ArrowUp className="h-4 w-4 text-green-500" />
                      <h3 className="text-xs font-medium ml-1">Merge Phase</h3>
                    </div>
                    <div className="space-y-3 overflow-x-auto pb-2 -mx-2 px-2">
                      {mergePhase.map((level, levelIndex) => (
                        <div key={levelIndex} className="flex justify-center min-w-max mx-auto gap-2">
                          {level.arrays.map((subArray, arrayIndex) => (
                            <div key={arrayIndex} className="border border-dashed border-green-300 p-1 rounded bg-background/50">
                              <div className="flex gap-0.5">
                                {subArray.map((value, valueIndex) => (
                                  <div key={valueIndex} className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 border border-green-500 bg-green-50 dark:bg-green-900 rounded-sm">
                                    <span className="text-[10px] md:text-xs font-medium">{value}</span>
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

                <div className="flex justify-center mt-2 space-x-4">
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
