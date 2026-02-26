"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUp, Plus, Trash, Search } from "lucide-react"
import CodePanel from "@/components/ui/code-panel"

const PUSH_CODE = [
  "def push(value):",
  "    if stack.is_full(): raise Overflow",
  "    stack.top += 1",
  "    stack[stack.top] = value",
  "    return"
]

const POP_CODE = [
  "def pop():",
  "    if stack.is_empty(): raise Underflow",
  "    value = stack[stack.top]",
  "    stack.top -= 1",
  "    return value"
]

const PEEK_CODE = [
  "def peek():",
  "    if stack.is_empty(): return None",
  "    return stack[stack.top]"
]

type StackItem = {
  id: number
  value: number
  highlighted?: boolean
  isNew?: boolean
  isPopping?: boolean
}

export default function StackVisualizer({ mini = false }: { mini?: boolean } = {}) {
  // Initialize with empty stack
  const [stack, setStack] = useState<StackItem[]>([])
  const [inputValue, setInputValue] = useState("")
  const [animating, setAnimating] = useState(false)
  const [nextId, setNextId] = useState(4)
  // Update the search (peek) function to show search results
  const [searchResult, setSearchResult] = useState<string | null>(null)
  const [activeCode, setActiveCode] = useState<string[]>([])
  const [activeLine, setActiveLine] = useState<number | null>(null)

  useEffect(() => {
    if (mini && stack.length === 0) {
      setStack([
        { id: 101, value: 40 },
        { id: 102, value: 30 },
        { id: 103, value: 20 },
        { id: 104, value: 10 }
      ]);
    }
  }, [mini, stack.length]);

  const handlePush = () => {
    if (!inputValue || animating) return

    const value = Number.parseInt(inputValue)
    setAnimating(true)
    setActiveCode(PUSH_CODE)
    setActiveLine(0)

    setTimeout(() => {
      setActiveLine(2)
      // Create a new item with the "isNew" flag for animation
      const newItem = { id: nextId, value, isNew: true }
      setStack([newItem, ...stack])
      setNextId(nextId + 1)

      setTimeout(() => {
        setActiveLine(3)
        // After animation, remove the "isNew" flag
        setTimeout(() => {
          setStack((stack) => stack.map((item) => (item.id === newItem.id ? { ...item, isNew: false } : item)))
          setAnimating(false)
          setActiveLine(null)
        }, 500)
      }, 500)
    }, 500)

    setInputValue("")
  }

  const handlePop = () => {
    if (stack.length === 0 || animating) return

    setAnimating(true)
    setActiveCode(POP_CODE)
    setActiveLine(0)

    setTimeout(() => {
      setActiveLine(2)
      // Mark the top item for popping animation
      setStack((stack) => stack.map((item, index) => (index === 0 ? { ...item, isPopping: true } : item)))

      setTimeout(() => {
        setActiveLine(3)
        // After animation, remove the item
        setTimeout(() => {
          setStack((stack) => stack.slice(1))
          setAnimating(false)
          setActiveLine(null)
        }, 500)
      }, 500)
    }, 500)
  }

  const handlePeek = () => {
    if (stack.length === 0 || animating) return

    setAnimating(true)
    setSearchResult(null)
    setActiveCode(PEEK_CODE)
    setActiveLine(0)

    setTimeout(() => {
      setActiveLine(2)
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
        setActiveLine(null)
      }, 1000)
    }, 500)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Operations Panel - Top on Mobile, Left on Desktop */}
      <div className="order-1 md:col-start-1">
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
                  onKeyDown={(e) => e.key === "Enter" && handlePush()}
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
      </div>

      {/* Visualization Panel - Second on Mobile, Right on Desktop */}
      <div className="order-2 md:col-start-2 md:row-span-3">
        <Card className="h-full border-0 md:border md:shadow-sm">
          {!mini && (
            <CardHeader>
              <CardTitle>Visualization</CardTitle>
              <CardDescription>Visual representation of the stack</CardDescription>
            </CardHeader>
          )}
          <CardContent className={mini ? "p-0" : ""}>
            {/* Improved responsive stack visualization */}
            <div className="flex items-center justify-center overflow-auto py-8 bg-muted/5 border-t min-h-[250px] md:h-[300px]">
              {stack.length === 0 ? (
                <div className="text-muted-foreground text-sm">Empty stack</div>
              ) : (
                <div className="flex flex-col items-center space-y-2 w-full max-w-[280px] md:max-w-xs px-4">
                  {stack.map((item, index) => (
                    <div key={item.id} className="relative w-full">
                      {index === 0 && (
                        <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                          <ArrowUp className="h-4 w-4 text-muted-foreground animate-bounce" />
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Top</span>
                        </div>
                      )}
                      <div
                        className={`
                          flex items-center justify-center h-10 md:h-12 w-full border-2 rounded-md shadow-sm
                          transition-all duration-500 ease-in-out
                          ${item.highlighted ? "bg-yellow-100 dark:bg-yellow-900 border-yellow-500" : "bg-card border-primary"}
                          ${item.isNew ? "scale-105 border-green-500" : ""}
                          ${item.isPopping ? "translate-x-full opacity-0 rotate-12" : ""}
                        `}
                      >
                        <div className="text-base md:text-lg font-bold">{item.value}</div>
                      </div>
                    </div>
                  ))}
                  <div className="mt-2 border-t-4 border-primary/30 w-full rounded-full"></div>
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

      {/* Live Code Panel - Third on Mobile, Left on Desktop */}
      {!mini && (
        <div className="order-3 md:col-start-1 h-[250px]">
          <CodePanel
            code={activeCode}
            activeLine={activeLine}
            title={activeCode === PUSH_CODE ? "Push Algorithm" : activeCode === POP_CODE ? "Pop Algorithm" : "Peek Algorithm"}
          />
        </div>
      )}

      {/* Learning Panel - Last on Mobile, Left on Desktop */}
      {!mini && (
        <div className="order-4 md:col-start-1">
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
      )}
    </div>
  )
}

