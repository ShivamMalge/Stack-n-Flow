"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Plus, Trash, Search } from "lucide-react"

type QueueItem = {
  id: number
  value: number
  highlighted?: boolean
  isNew?: boolean
  isDequeuing?: boolean
}

export default function QueueVisualizer() {
  // Initialize with empty queue
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [inputValue, setInputValue] = useState("")
  const [animating, setAnimating] = useState(false)
  const [nextId, setNextId] = useState(4)
  // Update the search (peek) function to show search results
  const [searchResult, setSearchResult] = useState<string | null>(null)

  const handleEnqueue = () => {
    if (!inputValue || animating) return

    const value = Number.parseInt(inputValue)
    setAnimating(true)

    // Create a new item with the "isNew" flag for animation
    const newItem = { id: nextId, value, isNew: true }
    setQueue([...queue, newItem])
    setNextId(nextId + 1)

    // After animation, remove the "isNew" flag
    setTimeout(() => {
      setQueue((queue) => queue.map((item) => (item.id === newItem.id ? { ...item, isNew: false } : item)))
      setAnimating(false)
    }, 1000)

    setInputValue("")
  }

  const handleDequeue = () => {
    if (queue.length === 0 || animating) return

    setAnimating(true)

    // Mark the first item for dequeuing animation
    setQueue((queue) => queue.map((item, index) => (index === 0 ? { ...item, isDequeuing: true } : item)))

    // After animation, remove the item
    setTimeout(() => {
      setQueue((queue) => queue.slice(1))
      setAnimating(false)
    }, 1000)
  }

  const handlePeek = () => {
    if (queue.length === 0 || animating) return

    setAnimating(true)
    setSearchResult(null)

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
    }, 1500)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Operations Panel */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Queue Operations</CardTitle>
            <CardDescription>Enqueue, dequeue, or peek values in the queue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Enter a value"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={animating}
                />

                <Button onClick={handleEnqueue} disabled={animating}>
                  <Plus className="mr-2 h-4 w-4" />
                  Enqueue
                </Button>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleDequeue} disabled={animating || queue.length === 0} variant="destructive">
                  <Trash className="mr-2 h-4 w-4" />
                  Dequeue
                </Button>

                <Button onClick={handlePeek} disabled={animating || queue.length === 0} variant="secondary">
                  <Search className="mr-2 h-4 w-4" />
                  Peek
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learning</CardTitle>
            <CardDescription>Understanding Queues</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="mb-2">
              A <strong>Queue</strong> is a linear data structure that follows the First In First Out (FIFO) principle.
              The first element added is the first one to be removed.
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
              Queues are used in scheduling, breadth-first search, and handling requests in web servers.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visualization Panel */}
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Visualization</CardTitle>
          <CardDescription>Visual representation of the queue</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Add horizontal scrolling to the queue visualization */}
          <div className="flex items-center justify-center overflow-x-auto py-12 h-[300px]">
            {queue.length === 0 ? (
              <div className="text-muted-foreground">Empty queue</div>
            ) : (
              <div className="flex items-center" style={{ minWidth: Math.max(300, queue.length * 80) + "px" }}>
                <div className="flex flex-col items-center mr-4">
                  <span className="text-xs text-muted-foreground">Front</span>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>

                {queue.map((item, index) => (
                  <div key={item.id} className="flex items-center">
                    <div
                      className={`
                        flex flex-col items-center justify-center w-16 h-16 rounded-md border-2
                        transition-all duration-500 ease-in-out
                        ${item.highlighted ? "bg-yellow-100 dark:bg-yellow-900 border-yellow-500" : "bg-card border-primary"}
                        ${item.isNew ? "scale-110 border-green-500" : ""}
                        ${item.isDequeuing ? "scale-75 opacity-50 border-red-500 -translate-y-12" : ""}
                      `}
                    >
                      <div className="text-lg font-bold">{item.value}</div>
                      <div className="text-xs text-muted-foreground">id: {item.id}</div>
                    </div>

                    {index < queue.length - 1 && <ArrowRight className="mx-2 text-muted-foreground" />}
                  </div>
                ))}

                <div className="flex flex-col items-center ml-4">
                  <span className="text-xs text-muted-foreground">Rear</span>
                  <ArrowRight className="h-5 w-5 text-muted-foreground rotate-180" />
                </div>
              </div>
            )}
          </div>
          {searchResult && (
            <div className="mt-4 p-2 rounded text-center bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
              {searchResult}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

