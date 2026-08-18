"use client"

import { useState, useEffect } from "react"
import CodePanel from "@/components/ui/code-panel"
import StackRenderer, { type StackRendererItem } from "@/components/visualizers/stack/stack-renderer"
import StackController from "@/components/visualizers/stack/stack-controller"
import StackDocs from "@/components/visualizers/stack/stack-docs"
import VisualizerLayout from "@/components/visualizers/visualizer-layout"

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

type StackItem = StackRendererItem

export default function StackVisualizer({ 
  mini = false,
  controlledNodes,
}: { 
  mini?: boolean;
  controlledNodes?: StackItem[];
} = {}) {
  // Initialize with empty stack
  const [internalStack, setStack] = useState<StackItem[]>([])
  // When a parent supplies nodes it owns the state, so the interactive controls
  // are disabled rather than silently writing to internal state that is never read.
  const isControlled = controlledNodes !== undefined
  const stack = isControlled ? controlledNodes : internalStack;
  const [inputValue, setInputValue] = useState("")
  const [animating, setAnimating] = useState(false)
  // Derived from the current contents so ids cannot collide with preset data.
  // Ids may arrive from Python as strings, which never collide with the
  // numeric ids generated here, so they are skipped when finding the max.
  const nextId = stack.reduce((max, item) => (typeof item.id === "number" ? Math.max(max, item.id) : max), 0) + 1
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
    if (!inputValue || animating || isControlled) return

    const value = Number.parseInt(inputValue)
    setAnimating(true)
    setActiveCode(PUSH_CODE)
    setActiveLine(0)

    setTimeout(() => {
      setActiveLine(2)
      // Create a new item with the "isNew" flag for animation
      const newItem = { id: nextId, value, isNew: true }
      setStack([newItem, ...stack])

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
    if (stack.length === 0 || animating || isControlled) return

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
    if (stack.length === 0 || animating || isControlled) return

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
    <VisualizerLayout
      mini={mini}
      controls={
        !isControlled ? (
          <StackController
            inputValue={inputValue}
            animating={animating}
            hasItems={stack.length > 0}
            onInputChange={setInputValue}
            onPush={handlePush}
            onPop={handlePop}
            onPeek={handlePeek}
          />
        ) : undefined
      }
      visualization={
        <StackRenderer items={stack} mini={mini} searchResult={searchResult} />
      }
      code={
        <CodePanel
          code={activeCode}
          activeLine={activeLine}
          title={activeCode === PUSH_CODE ? "Push Algorithm" : activeCode === POP_CODE ? "Pop Algorithm" : "Peek Algorithm"}
        />
      }
      docs={
        <StackDocs />
      }
    />
  )
}

