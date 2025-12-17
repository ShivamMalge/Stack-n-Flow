"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUp, Plus, Trash, Search } from "lucide-react"

type StackItem = {
  id: number
  value: number
  highlighted?: boolean
  isNew?: boolean
  isPopping?: boolean
}

export default function StackVisualizer() {
  // Initialize with empty stack
  const [stack, setStack] = useState<StackItem[]>([])
  const [inputValue, setInputValue] = useState("")
  const [animating, setAnimating] = useState(false)
  const [nextId, setNextId] = useState(4)
  // Update the search (peek) function to show search results
  const [searchResult, setSearchResult] = useState<string | null>(null)

  const handlePush = () => {
    if (!inputValue || animating) return

    const value = Number.parseInt(inputValue)
    setAnimating(true)

    // Create a new item with the "isNew" flag for animation
    const newItem = { id: nextId, value, isNew: true }
    setStack([newItem, ...stack])
    setNextId(nextId + 1)

    // After animation, remove the "isNew" flag
    setTimeout(() => {
      setStack((stack) => stack.map((item) => (item.id === newItem.id ? { ...item, isNew: false } : item)))
      setAnimating(false)
    }, 1000)

    setInputValue("")
  }

  const handlePop = () => {
    if (stack.length === 0 || animating) return

    setAnimating(true)

    // Mark the top item for popping animation
    setStack((stack) => stack.map((item, index) => (index === 0 ? { ...item, isPopping: true } : item)))

    // After animation, remove the item
    setTimeout(() => {
      setStack((stack) => stack.slice(1))
      setAnimating(false)
    }, 1000)
  }

  const handlePeek = () => {
    if (stack.length === 0 || animating) return

    setAnimating(true)
    setSearchResult(null)

    // Highlight the top item
    setStack((stack) =>
      stack.map((item, index) => ({
        ...item,
        highlighted: index === 0,
      })),
    )

    // Show the result
    setSearchResult("Top element: " + stack[0].value)

    // After animation, remove the highlight
    setTimeout(() => {
      setStack((stack) => stack.map((item) => ({ ...item, highlighted: false })))
      setAnimating(false)
    }, 1500)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Operations Panel */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Stack Operations</CardTitle>
            <CardDescription>Push, pop, or peek values in the stack</CardDescription>
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

                <Button onClick={handlePush} disabled={animating}>
                  <Plus className="mr-2 h-4 w-4" />
                  Push
                </Button>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handlePop} disabled={animating || stack.length === 0} variant="destructive">
                  <Trash className="mr-2 h-4 w-4" />
                  Pop
                </Button>

                <Button onClick={handlePeek} disabled={animating || stack.length === 0} variant="secondary">
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
            <CardDescription>Understanding Stacks</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="mb-2">
              A <strong>Stack</strong> is a linear data structure that follows the Last In First Out (LIFO) principle.
              The last element added is the first one to be removed.
            </p>
            <p className="mb-2">
              <strong>Key Operations:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Push: Add an element to the top - O(1)</li>
              <li>Pop: Remove the top element - O(1)</li>
              <li>Peek: View the top element without removing it - O(1)</li>
            </ul>
            <p className="mt-2">
              Stacks are used in function calls, expression evaluation, and undo mechanisms in applications.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visualization Panel */}
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Visualization</CardTitle>
          <CardDescription>Visual representation of the stack</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Add horizontal scrolling to the stack visualization */}
          <div className="flex items-center justify-center overflow-x-auto py-8 h-[300px]">
            {stack.length === 0 ? (
              <div className="text-muted-foreground">Empty stack</div>
            ) : (
              <div className="flex flex-col items-center space-y-2" style={{ minWidth: "250px" }}>
                {stack.map((item, index) => (
                  <div key={item.id} className="relative w-full max-w-xs">
                    {index === 0 && (
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                        <ArrowUp className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Top</span>
                      </div>
                    )}
                    <div
                      className={`
                        flex items-center justify-center h-12 w-full border-2 rounded-md
                        transition-all duration-500 ease-in-out
                        ${item.highlighted ? "bg-yellow-100 dark:bg-yellow-900 border-yellow-500" : "bg-card border-primary"}
                        ${item.isNew ? "scale-110 border-green-500" : ""}
                        ${item.isPopping ? "scale-75 opacity-50 border-red-500 translate-x-12" : ""}
                      `}
                    >
                      <div className="text-lg font-bold">{item.value}</div>
                    </div>
                  </div>
                ))}
                <div className="mt-2 border-t-2 border-primary w-full max-w-xs"></div>
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

