"use client"

import { useState } from "react"
import CodePanel from "@/components/ui/code-panel"
import QueueRenderer, { type QueueRendererItem } from "@/components/visualizers/queue/queue-renderer"
import QueueController from "@/components/visualizers/queue/queue-controller"
import QueueDocs from "@/components/visualizers/queue/queue-docs"
import VisualizerLayout from "@/components/visualizers/visualizer-layout"

const ENQUEUE_CODE = [
  "def enqueue(value):",
  "    if queue.is_full(): raise Overflow",
  "    queue[rear] = value",
  "    rear = (rear + 1) % size",
  "    return"
]

const DEQUEUE_CODE = [
  "def dequeue():",
  "    if queue.is_empty(): raise Underflow",
  "    value = queue[front]",
  "    front = (front + 1) % size",
  "    return value"
]

const PEEK_CODE = [
  "def peek():",
  "    if queue.is_empty(): return None",
  "    return queue[front]"
]

type QueueItem = QueueRendererItem

export default function QueueVisualizer({
  mini = false,
  controlledNodes,
}: {
  mini?: boolean;
  controlledNodes?: QueueItem[];
} = {}) {
  // Initialize with empty queue
  const [internalQueue, setQueue] = useState<QueueItem[]>([])
  // When a parent supplies nodes it owns the state, so the interactive controls
  // are disabled rather than silently writing to internal state that is never read.
  const isControlled = controlledNodes !== undefined
  const queue = isControlled ? controlledNodes : internalQueue;
  const [inputValue, setInputValue] = useState("")
  const [animating, setAnimating] = useState(false)
  // Derived from the current contents so ids cannot collide with preset data.
  // Ids may arrive from Python as strings, which never collide with the
  // numeric ids generated here, so they are skipped when finding the max.
  const nextId = queue.reduce((max, item) => (typeof item.id === "number" ? Math.max(max, item.id) : max), 0) + 1
  // Update the search (peek) function to show search results
  const [searchResult, setSearchResult] = useState<string | null>(null)
  const [activeCode, setActiveCode] = useState<string[]>([])
  const [activeLine, setActiveLine] = useState<number | null>(null)

  const handleEnqueue = () => {
    if (!inputValue || animating || isControlled) return

    const value = Number.parseInt(inputValue)
    setAnimating(true)
    setActiveCode(ENQUEUE_CODE)
    setActiveLine(0)

    setTimeout(() => {
      setActiveLine(2)
      // Create a new item with the "isNew" flag for animation
      const newItem = { id: nextId, value, isNew: true }
      setQueue([...queue, newItem])

      setTimeout(() => {
        setActiveLine(3)
        // After animation, remove the "isNew" flag
        setTimeout(() => {
          setQueue((queue) => queue.map((item) => (item.id === newItem.id ? { ...item, isNew: false } : item)))
          setAnimating(false)
          setActiveLine(null)
        }, 500)
      }, 500)
    }, 500)

    setInputValue("")
  }

  const handleDequeue = () => {
    if (queue.length === 0 || animating || isControlled) return

    setAnimating(true)
    setActiveCode(DEQUEUE_CODE)
    setActiveLine(0)

    setTimeout(() => {
      setActiveLine(2)
      // Mark the first item for dequeuing animation
      setQueue((queue) => queue.map((item, index) => (index === 0 ? { ...item, isDequeuing: true } : item)))

      setTimeout(() => {
        setActiveLine(3)
        // After animation, remove the item
        setTimeout(() => {
          setQueue((queue) => queue.slice(1))
          setAnimating(false)
          setActiveLine(null)
        }, 500)
      }, 500)
    }, 500)
  }

  const handlePeek = () => {
    if (queue.length === 0 || animating || isControlled) return

    setAnimating(true)
    setSearchResult(null)
    setActiveCode(PEEK_CODE)
    setActiveLine(0)

    setTimeout(() => {
      setActiveLine(2)
      // Highlight the first item
      setQueue((queue) =>
        queue.map((item, index) => ({
          ...item,
          highlighted: index === 0,
        })),
      )

      // Show the result
      setSearchResult("Front element: " + queue[0]?.value)

      // After animation, remove the highlight
      setTimeout(() => {
        setQueue((queue) => queue.map((item) => ({ ...item, highlighted: false })))
        setAnimating(false)
        setActiveLine(null)
      }, 1000)
    }, 500)
  }

  return (
    <VisualizerLayout
      mini={mini}
      controls={
        !isControlled ? (
          <QueueController
            inputValue={inputValue}
            animating={animating}
            hasItems={queue.length > 0}
            onInputChange={setInputValue}
            onEnqueue={handleEnqueue}
            onDequeue={handleDequeue}
            onPeek={handlePeek}
          />
        ) : undefined
      }
      visualization={<QueueRenderer items={queue} searchResult={searchResult} />}
      code={
        <CodePanel
          code={activeCode}
          activeLine={activeLine}
          title={activeCode === ENQUEUE_CODE ? "Enqueue Algorithm" : activeCode === DEQUEUE_CODE ? "Dequeue Algorithm" : "Peek Algorithm"}
        />
      }
      docs={<QueueDocs />}
    />
  )
}
