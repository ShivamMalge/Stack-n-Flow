"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash, Search } from "lucide-react"
import CodePanel from "@/components/ui/code-panel"
import VisualizerLayout from "@/components/visualizers/visualizer-layout"
import CircularQueueRenderer from "@/components/visualizers/circular-queue/circular-queue-renderer"

const ENQUEUE_CODE = [
  "def enqueue(value):",
  "    if size == max_size: return error",
  "    rear = (rear + 1) % max_size",
  "    queue[rear] = value",
  "    size += 1"
]

const DEQUEUE_CODE = [
  "def dequeue():",
  "    if size == 0: return error",
  "    value = queue[front]",
  "    front = (front + 1) % max_size",
  "    size -= 1",
  "    return value"
]

const PEEK_CODE = [
  "def peek():",
  "    if size == 0: return error",
  "    return queue[front]"
]

type QueueItem = {
  id: number
  value: number
  highlighted?: boolean
  isNew?: boolean
  isDequeuing?: boolean
}

export default function CircularQueueVisualizer({
  controlledQueue,
  controlledFront,
  controlledRear,
  controlledSize,
}: {
  controlledQueue?: QueueItem[];
  controlledFront?: number;
  controlledRear?: number;
  controlledSize?: number;
} = {}) {
  const [internalQueue, setQueue] = useState<QueueItem[]>([])
  const [inputValue, setInputValue] = useState("")
  const [animating, setAnimating] = useState(false)
  const [nextId, setNextId] = useState(1)
  const [internalFront, setFront] = useState(0)
  const [internalRear, setRear] = useState(-1)
  const [internalSize, setSize] = useState(0)
  const queue = controlledQueue !== undefined ? controlledQueue : internalQueue;
  const front = controlledFront !== undefined ? controlledFront : internalFront;
  const rear = controlledRear !== undefined ? controlledRear : internalRear;
  const size = controlledSize !== undefined ? controlledSize : internalSize;
  const [maxSize, setMaxSize] = useState(5)
  const [searchResult, setSearchResult] = useState<string | null>(null)
  const [activeCode, setActiveCode] = useState<string[]>([])
  const [activeLine, setActiveLine] = useState<number | null>(null)

  // Timer registry so every pending animation step is cancelled on unmount
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([])

  // Mirrors of the latest queue state so timer callbacks never read a stale snapshot
  const queueRef = useRef<QueueItem[]>(queue)
  const frontRef = useRef(front)
  const sizeRef = useRef(size)

  useEffect(() => {
    queueRef.current = queue
    frontRef.current = front
    sizeRef.current = size
  }, [queue, front, size])

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timersRef.current.push(id)
    return id
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
    schedule(() => {
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
    schedule(() => {
      // Mark the slot as empty by setting it to null or a placeholder
      const newQueue = [...queueRef.current]
      newQueue[frontRef.current] = { id: -1, value: -1 } // Placeholder for empty slot
      setQueue(newQueue)

      // Update front and size
      setFront((frontRef.current + 1) % maxSize)
      setSize(sizeRef.current - 1)
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
    schedule(() => {
      setQueue((queue) => queue.map((item) => ({ ...item, highlighted: false })))
      setAnimating(false)
      setActiveLine(null)
    }, 1500)
  }

  return (
    <VisualizerLayout
      controls={
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
      }
      visualization={
        <CircularQueueRenderer slots={queue} front={front} rear={rear} size={size} capacity={maxSize} />
      }
      code={
        <CodePanel
          code={activeCode}
          activeLine={activeLine}
          title={activeCode === ENQUEUE_CODE ? "Enqueue Algorithm" : activeCode === DEQUEUE_CODE ? "Dequeue Algorithm" : "Peek Algorithm"}
        />
      }
      docs={
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
      }
    />
  )
}

