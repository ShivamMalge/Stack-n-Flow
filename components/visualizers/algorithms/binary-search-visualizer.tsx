"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Plus, RotateCcw, Shuffle } from "lucide-react"
import AnimationControls from "@/components/ui/animation-controls"
import { useAnimationPlayer, type AnimationFrame } from "@/hooks/useAnimationPlayer"
import CodePanel from "@/components/ui/code-panel"
import VisualizerLayout from "@/components/visualizers/visualizer-layout"
import BinarySearchRenderer from "@/components/visualizers/algorithms/binary-search/binary-search-renderer"
import { BINARY_SEARCH } from "@/lib/templates/algorithms"
import { MAX_INPUT_MESSAGE, parseBoundedInt } from "@/lib/constants"
import InlineAlert from "@/components/ui/inline-alert"

type ArrayItem = {
  value: number
  highlighted?: boolean
  isTarget?: boolean
  isMid?: boolean
  isLow?: boolean
  isHigh?: boolean
}

type BinarySearchFrame = {
  array: ArrayItem[]
  stepDescription: string
  searchResult?: string | null
  /** Step in the code panel; see lib/templates/algorithms.ts. */
  activeStep: number
}

export default function BinarySearchVisualizer({ 
  mini = false,
  controlledArray,
  controlledSearchResult,
}: { 
  mini?: boolean;
  controlledArray?: ArrayItem[];
  controlledSearchResult?: string | null;
} = {}) {
  const [internalArray, setArray] = useState<ArrayItem[]>([])
  const [inputValue, setInputValue] = useState("")
  const [searchValue, setSearchValue] = useState("")
  const [internalSearchResult, setSearchResult] = useState<string | null>(null)
  const array = controlledArray !== undefined ? controlledArray : internalArray;
  const searchResult = controlledSearchResult !== undefined ? controlledSearchResult : internalSearchResult;
  const [steps, setSteps] = useState<string[]>([])
  const [isSorted, setIsSorted] = useState(true)
  const [inputError, setInputError] = useState<string | null>(null)

  const onFrameChange = useCallback((snapshot: BinarySearchFrame) => {
    setArray(snapshot.array)
    if (snapshot.searchResult !== undefined) {
      setSearchResult(snapshot.searchResult)
    }
  }, [])

  const player = useAnimationPlayer<BinarySearchFrame>(onFrameChange)

  useEffect(() => {
    if (mini && array.length === 0) {
      setArray([
        { value: 1 }, { value: 3 }, { value: 5 }, { value: 7 }, { value: 9 }, { value: 11 }, { value: 13 }, { value: 15 }
      ]);
      setIsSorted(true);
    }
  }, [mini, array.length]);

  const handleAddElement = () => {
    setInputError(null)

    if (!inputValue || player.isPlaying) return

    const value = parseBoundedInt(inputValue)
    if (value === null) {
      setInputError(MAX_INPUT_MESSAGE)
      return
    }

    const newArray = [...array, { value }]
    setArray(newArray)
    checkIfSorted(newArray)
    setInputValue("")
  }

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

  const handleSortArray = () => {
    if (player.isPlaying) return
    const sortedArray = [...array].sort((a, b) => a.value - b.value)
    setArray(sortedArray)
    setIsSorted(true)
  }

  const handleClearArray = () => {
    if (player.isPlaying) return
    setArray([])
    setSteps([])
    setSearchResult(null)
    setIsSorted(true)
    setInputError(null)
    player.clear()
  }

  const handleGenerateRandom = () => {
    if (player.isPlaying) return
    const count = Math.floor(Math.random() * 8) + 5
    const newArray: ArrayItem[] = []
    for (let i = 0; i < count; i++) {
      newArray.push({ value: Math.floor(Math.random() * 100) + 1 })
    }
    newArray.sort((a, b) => a.value - b.value)
    setArray(newArray)
    setIsSorted(true)
    setSteps([])
    setSearchResult(null)
    setInputError(null)
    player.clear()
  }

  const handleSearch = () => {
    if (!searchValue || player.isPlaying || array.length === 0 || !isSorted) return

    // Same bounds as handleAddElement: nothing outside them can be in the array.
    const target = parseBoundedInt(searchValue)
    if (target === null) return

    setSearchResult(null)

    const frames: AnimationFrame<BinarySearchFrame>[] = []
    const searchSteps: string[] = []

    // Reset highlights
    const cleanArray = array.map((item) => ({
      ...item,
      highlighted: false,
      isTarget: false,
      isMid: false,
      isLow: false,
      isHigh: false,
    }))

    let low = 0
    let high = cleanArray.length - 1
    let found = false

    searchSteps.push(`Starting binary search for value ${target}`)
    searchSteps.push(`Initial range: indices ${low} to ${high}`)

    // Initial frame
    frames.push({
      snapshot: {
        array: cleanArray.map((item, index) => ({
          ...item,
          highlighted: index >= low && index <= high,
          isLow: index === low,
          isHigh: index === high,
          isTarget: item.value === target,
        })),
        stepDescription: `Starting binary search for value ${target}`,
          activeStep: 1,
      },
      description: `Searching for ${target}. Range: [${low}, ${high}]`,
    })

    while (low <= high && !found) {
      const mid = Math.floor((low + high) / 2)
      const midValue = cleanArray[mid].value

      searchSteps.push(`Checking middle element at index ${mid} with value ${midValue}`)

      // Show mid element
      frames.push({
        snapshot: {
          array: cleanArray.map((item, index) => ({
            ...item,
            highlighted: index >= low && index <= high,
            isMid: index === mid,
            isLow: index === low,
            isHigh: index === high,
            isTarget: item.value === target,
          })),
          stepDescription: `Checking middle element at index ${mid} with value ${midValue}`,
          activeStep: 2,
        },
        description: `Mid=${mid} (value ${midValue}), comparing with ${target}`,
      })

      if (midValue === target) {
        found = true
        searchSteps.push(`Found ${target} at index ${mid}!`)

        frames.push({
          snapshot: {
            array: cleanArray.map((item, index) => ({
              ...item,
              highlighted: index === mid,
              isMid: index === mid,
              isTarget: item.value === target,
            })),
            stepDescription: `Found ${target} at index ${mid}!`,
          activeStep: 4,
            searchResult: `Found ${target} at index ${mid}`,
          },
          description: `Found ${target} at index ${mid}!`,
        })
      } else if (midValue < target) {
        low = mid + 1
        searchSteps.push(`${midValue} < ${target}, so we search the right half`)
        searchSteps.push(`New range: indices ${low} to ${high}`)

        frames.push({
          snapshot: {
            array: cleanArray.map((item, index) => ({
              ...item,
              highlighted: index >= low && index <= high,
              isLow: index === low,
              isHigh: index === high,
              isTarget: item.value === target,
            })),
            stepDescription: `${midValue} < ${target}: searching right half [${low}, ${high}]`,
          activeStep: 5,
          },
          description: `${midValue} < ${target}: search right half [${low}, ${high}]`,
        })
      } else {
        high = mid - 1
        searchSteps.push(`${midValue} > ${target}, so we search the left half`)
        searchSteps.push(`New range: indices ${low} to ${high}`)

        frames.push({
          snapshot: {
            array: cleanArray.map((item, index) => ({
              ...item,
              highlighted: index >= low && index <= high,
              isLow: index === low,
              isHigh: index === high,
              isTarget: item.value === target,
            })),
            stepDescription: `${midValue} > ${target}: searching left half [${low}, ${high}]`,
          activeStep: 6,
          },
          description: `${midValue} > ${target}: search left half [${low}, ${high}]`,
        })
      }
    }

    if (!found) {
      searchSteps.push(`${target} not found in the array`)
      frames.push({
        snapshot: {
          array: cleanArray.map((item) => ({
            ...item,
            highlighted: false,
            isMid: false,
            isLow: false,
            isHigh: false,
          })),
          stepDescription: `${target} not found in the array`,
          activeStep: 7,
          searchResult: `${target} not found in the array`,
        },
        description: `${target} not found`,
      })
    }

    setSteps(searchSteps)
    player.loadFrames(frames)
    player.play()
  }

  const visibleStepIndex = player.currentFrame >= 0 ? player.currentFrame : -1

  return (
    <VisualizerLayout
      mini={mini}
      controls={
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
                  onKeyDown={(e) => e.key === "Enter" && handleAddElement()}
                  disabled={player.isPlaying}
                />
                <Button onClick={handleAddElement} disabled={player.isPlaying}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>

              <InlineAlert message={inputError} />

              <div className="flex space-x-2">
                <Button onClick={handleGenerateRandom} disabled={player.isPlaying} variant="outline" className="flex-1">
                  <Shuffle className="mr-2 h-4 w-4" />
                  Random Sorted
                </Button>
                <Button
                  onClick={handleSortArray}
                  disabled={player.isPlaying || array.length <= 1 || isSorted}
                  variant="outline"
                  className="flex-1"
                >
                  Sort
                </Button>
                <Button
                  onClick={handleClearArray}
                  disabled={player.isPlaying || array.length === 0}
                  variant="outline"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>

              {!isSorted && array.length > 1 && (
                <div className="p-2 rounded text-center bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
                  Array must be sorted for binary search. Click &quot;Sort&quot;.
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
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    disabled={player.isPlaying || !isSorted || array.length === 0}
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={player.isPlaying || !isSorted || array.length === 0}
                    variant="secondary"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                </div>
              </div>

              {searchResult && (
                <div
                  className={`p-2 rounded text-center ${searchResult.includes("Found")
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                    }`}
                >
                  {searchResult}
                </div>
              )}

              {/* Animation Controls */}
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
                  onReset={() => {
                    player.reset()
                    setSearchResult(null)
                    setArray(array.map((item) => ({
                      ...item,
                      highlighted: false,
                      isTarget: false,
                      isMid: false,
                      isLow: false,
                      isHigh: false,
                    })))
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
      }
      visualization={
        <BinarySearchRenderer
          array={array}
          mini={mini}
          description={player.currentDescription}
        />
      }
      code={
        <CodePanel template={BINARY_SEARCH} activeStep={player.currentSnapshot?.activeStep ?? null} />
      }
      docs={
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
      }
    />
  )
}
