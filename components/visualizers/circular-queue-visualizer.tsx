"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash, Search, RotateCw } from "lucide-react"
import CodePanel from "@/components/ui/code-panel"

const ENQUEUE_CODE = [
  "function enqueue(value):",
  "  if (size == maxSize) return error",
  "  rear = (rear + 1) % maxSize",
  "  queue[rear] = value",
  "  size = size + 1"
]

const DEQUEUE_CODE = [
  "function dequeue():",
  "  if (size == 0) return error",
  "  value = queue[front]",
  "  front = (front + 1) % maxSize",
  "  size = size - 1",
  "  return value"
]

const PEEK_CODE = [
  "function peek():",
  "  if (size == 0) return error",
  "  return queue[front]"
]

type QueueItem = {
  id: number
  value: number
  highlighted?: boolean
  isNew?: boolean
  isDequeuing?: boolean
}

export default function CircularQueueVisualizer() {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [inputValue, setInputValue] = useState("")
  const [animating, setAnimating] = useState(false)
  const [nextId, setNextId] = useState(1)
  const [front, setFront] = useState(0)
  const [rear, setRear] = useState(-1)
  const [size, setSize] = useState(0)
  const [maxSize, setMaxSize] = useState(5)
  const [searchResult, setSearchResult] = useState<string | null>(null)
  const [activeCode, setActiveCode] = useState<string[]>([])
  const [activeLine, setActiveLine] = useState<number | null>(null)

  const handleEnqueue = () => {
    if (!inputValue || animating || size === maxSize) return

    const value = Number.parseInt(inputValue)
    setAnimating(true)
    setActiveCode(ENQUEUE_CODE)
    setActiveLine(0)

    // Calculate new rear position
    const newRear = (rear + 1) % maxSize
    setRear(newRear)

    // Create a new item with the "isNew" flag for animation
    const newItem = { id: nextId, value, isNew: true }
    setActiveLine(2) // rear = (rear + 1) % maxSize

    // Update the queue
    const newQueue = [...queue]
    if (newQueue.length < maxSize) {
      newQueue.push(newItem)
    } else {
      newQueue[newRear] = newItem
    }

    setQueue(newQueue)
    setNextId(nextId + 1)
    setSize(size + 1)
    setActiveLine(3) // queue[rear] = value

    // After animation, remove the "isNew" flag
    setTimeout(() => {
      setQueue((queue) => queue.map((item) => (item.id === newItem.id ? { ...item, isNew: false } : item)))
      setAnimating(false)
      setActiveLine(null)
    }, 1000)

    setInputValue("")
  }

  const handleDequeue = () => {
    if (size === 0 || animating) return

    setAnimating(true)
    setActiveCode(DEQUEUE_CODE)
    setActiveLine(0)

    // Mark the front item for dequeuing animation
    setQueue((queue) => queue.map((item, index) => (index === front ? { ...item, isDequeuing: true } : item)))

    // After animation, update the front
    setTimeout(() => {
      // Mark the slot as empty by setting it to null or a placeholder
      const newQueue = [...queue]
      newQueue[front] = { id: -1, value: -1 } // Placeholder for empty slot
      setQueue(newQueue)

      // Update front and size
      setFront((front + 1) % maxSize)
      setSize(size - 1)
      setAnimating(false)
      setActiveLine(null)
    }, 1000)
  }

  const handlePeek = () => {
    if (size === 0 || animating) return

    setAnimating(true)
    setSearchResult(null)
    setActiveCode(PEEK_CODE)
    setActiveLine(0)

    // Highlight the front item
    setQueue((queue) =>
      queue.map((item, index) => ({
        ...item,
        highlighted: index === front,
      })),
    )

    // Show the result
    setSearchResult("Front element: " + queue[front].value)

    // After animation, remove the highlight
    setTimeout(() => {
      setQueue((queue) => queue.map((item) => ({ ...item, highlighted: false })))
      setAnimating(false)
      setActiveLine(null)
    }, 1500)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Operations Panel - Top on Mobile, Left on Desktop */}
      <div className="order-1 md:col-start-1">
        <Card>
          <CardHeader>
            <CardTitle>Circular Queue Operations</CardTitle>
            <CardDescription>Enqueue, dequeue, or peek values in the circular queue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Enter a value"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEnqueue()}
                  disabled={animating}
                />

                <Button onClick={handleEnqueue} disabled={animating || size === maxSize}>
                  <Plus className="mr-2 h-4 w-4" />
                  Enqueue
                </Button>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleDequeue} disabled={animating || size === 0} variant="destructive">
                  <Trash className="mr-2 h-4 w-4" />
                  Dequeue
                </Button>

                <Button onClick={handlePeek} disabled={animating || size === 0} variant="secondary">
                  <Search className="mr-2 h-4 w-4" />
                  Peek
                </Button>
              </div>

              <div className="flex justify-between text-sm">
                <div>
                  Size: {size}/{maxSize}
                </div>
                <div>Front: {size > 0 ? front : "N/A"}</div>
                <div>Rear: {size > 0 ? rear : "N/A"}</div>
              </div>
            </div>

            {searchResult && (
              <div className="mt-4 p-2 rounded text-center bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                {searchResult}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Visualization Panel - Second on Mobile, Right on Desktop */}
      <div className="order-2 md:col-start-2 md:row-span-3">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Visualization</CardTitle>
            <CardDescription>Visual representation of the circular queue</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Improved responsive circular queue visualization */}
            <div className="flex items-center justify-center overflow-auto py-12 bg-muted/5 border-t min-h-[300px] md:h-[350px]">
              {queue.length === 0 && size === 0 ? (
                <div className="text-muted-foreground text-sm">Empty circular queue</div>
              ) : (
                <div className="relative w-full max-w-4xl mx-auto px-4">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-6">
                      <RotateCw className="h-5 w-5 text-primary/60" />
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Fixed Size Array ({maxSize})</span>
                    </div>

                    <div className="flex flex-wrap justify-center gap-y-14 gap-x-2 md:gap-x-4">
                      {Array(maxSize)
                        .fill(0)
                        .map((_, index) => {
                          const item = queue[index]
                          const isEmpty = !item || item.id === -1
                          const isFront = index === front && size > 0
                          const isRear = index === rear && size > 0

                          return (
                            <div key={index} className="relative group">
                              <div
                                className={`
                                  flex flex-col items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-md border-2 shadow-sm
                                  transition-all duration-500 ease-in-out
                                  ${isEmpty ? "bg-muted/10 border-dashed border-muted-foreground/40" : "bg-card border-primary"}
                                  ${item?.highlighted ? "bg-yellow-100 dark:bg-yellow-900 border-yellow-500 ring-2 ring-yellow-500/20" : ""}
                                  ${item?.isNew ? "scale-105 border-green-500" : ""}
                                  ${item?.isDequeuing ? "-translate-y-8 opacity-0 scale-75" : ""}
                                `}
                              >
                                {!isEmpty && (
                                  <>
                                    <div className="text-base md:text-lg font-bold">{item.value}</div>
                                    <div className="text-[9px] text-muted-foreground">id:{item.id}</div>
                                  </>
                                )}
                              </div>

                              {isFront && (
                                <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                                  <span className="text-[9px] font-bold text-blue-500 uppercase">Front</span>
                                  <div className="w-1 h-3 bg-blue-500/40 rounded-full mt-0.5"></div>
                                </div>
                              )}

                              {isRear && (
                                <div className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                                  <div className="w-1 h-3 bg-red-500/40 rounded-full mb-0.5"></div>
                                  <span className="text-[9px] font-bold text-red-500 uppercase">Rear</span>
                                </div>
                              )}

                              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
                                <div className="text-[10px] font-mono text-muted-foreground opacity-50">[{index}]</div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Code Panel - Third on Mobile, Left on Desktop */}
      <div className="order-3 md:col-start-1 h-[280px]">
        <CodePanel
          code={activeCode}
          activeLine={activeLine}
          title={activeCode === ENQUEUE_CODE ? "Enqueue Algorithm" : activeCode === DEQUEUE_CODE ? "Dequeue Algorithm" : "Peek Algorithm"}
        />
      </div>

      {/* Learning Panel - Last on Mobile, Left on Desktop */}
      <div className="order-4 md:col-start-1">
        <Card>
          <CardHeader>
            <CardTitle>Learning</CardTitle>
            <CardDescription>Understanding Circular Queues</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="mb-2">
              A <strong>Circular Queue</strong> is a linear data structure that follows the FIFO principle and wraps
              around when it reaches the end of its fixed-size array.
            </p>
            <p className="mb-2">
              <strong>Key Operations:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Enqueue: Add an element to the rear - O(1)</li>
              <li>Dequeue: Remove the front element - O(1)</li>
              <li>Peek: View the front element without removing it - O(1)</li>
            </ul>
            <p className="mt-2">
              <strong>Advantages over Linear Queue:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Better memory utilization</li>
              <li>No need to shift elements</li>
              <li>Efficient for fixed-size applications</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

