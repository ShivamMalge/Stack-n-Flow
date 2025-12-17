"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

type LinkedListOperation = "insert" | "delete" | "search" | "reverse" | "detectLoop" | "findMiddle" | "removeNthFromEnd"

interface ListNode {
  value: number
  next: ListNode | null
  id: number
}

export default function LinkedListOperations() {
  const [head, setHead] = useState<ListNode | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [position, setPosition] = useState("")
  const [operation, setOperation] = useState<LinkedListOperation>("insert")
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [steps, setSteps] = useState<string[]>([])
  const [nextId, setNextId] = useState(1)

  const createLinkedList = (values: number[]): ListNode | null => {
    if (values.length === 0) return null

    const newHead: ListNode = { value: values[0], next: null, id: nextId }
    setNextId(nextId + 1)
    let current = newHead

    for (let i = 1; i < values.length; i++) {
      current.next = { value: values[i], next: null, id: nextId + i }
      current = current.next
    }

    setNextId(nextId + values.length)
    return newHead
  }

  const linkedListToArray = (head: ListNode | null): number[] => {
    const result: number[] = []
    let current = head

    while (current) {
      result.push(current.value)
      current = current.next
    }

    return result
  }

  const handleCreateList = () => {
    setError(null)
    try {
      const values = inputValue.split(",").map((item) => {
        const num = Number(item.trim())
        if (isNaN(num)) throw new Error("Invalid number in list")
        return num
      })

      if (values.length === 0) {
        setError("Please enter at least one value")
        return
      }

      const newHead = createLinkedList(values)
      setHead(newHead)
      setSuccess("Linked list created successfully")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError("Please enter valid numbers separated by commas")
    }
  }

  const performOperation = () => {
    setError(null)
    setSuccess(null)
    setResult(null)
    setSteps([])

    if (!head) {
      setError("Please create a linked list first")
      return
    }

    try {
      switch (operation) {
        case "insert": {
          if (!inputValue) {
            setError("Please enter a value to insert")
            return
          }

          const value = Number(inputValue)
          if (isNaN(value)) {
            setError("Please enter a valid number to insert")
            return
          }

          const pos = position ? Number.parseInt(position) : -1
          const newSteps = []
          let newHead = { ...head }

          if (pos === 0 || pos === -1) {
            // Insert at beginning
            const newNode: ListNode = { value, next: newHead, id: nextId }
            setNextId(nextId + 1)
            newHead = newNode
            newSteps.push(`Created new node with value ${value}`)
            newSteps.push(`Inserted new node at the beginning of the list`)
          } else {
            // Insert at position
            let current = newHead
            let index = 0

            while (current.next && index < pos - 1) {
              newSteps.push(`Traversing to position ${index + 1}: node with value ${current.next.value}`)
              current = current.next
              index++
            }

            if (index < pos - 1) {
              newSteps.push(`Position ${pos} is out of bounds, inserting at the end`)
            } else {
              newSteps.push(`Reached position ${index}: node with value ${current.value}`)
            }

            const newNode: ListNode = { value, next: current.next, id: nextId }
            setNextId(nextId + 1)
            current.next = newNode

            newSteps.push(`Created new node with value ${value}`)
            newSteps.push(`Inserted new node after position ${index}`)
          }

          setHead(newHead)
          setSteps(newSteps)
          setResult(linkedListToArray(newHead))
          break
        }

        case "delete": {
          if (!position) {
            setError("Please enter a position to delete from")
            return
          }

          const pos = Number.parseInt(position)
          if (isNaN(pos) || pos < 0) {
            setError("Please enter a valid position (0 or greater)")
            return
          }

          const newSteps = []
          let newHead = { ...head }

          if (pos === 0) {
            // Delete from beginning
            if (!newHead.next) {
              newSteps.push(`Deleted the only node in the list`)
              newHead = null
            } else {
              newSteps.push(`Deleted node at position 0 with value ${newHead.value}`)
              newHead = newHead.next
            }
          } else {
            // Delete from position
            let current = newHead
            let index = 0

            while (current.next && index < pos - 1) {
              newSteps.push(`Traversing to position ${index + 1}: node with value ${current.next.value}`)
              current = current.next
              index++
            }

            if (!current.next) {
              newSteps.push(`Position ${pos} is out of bounds, no node deleted`)
            } else {
              newSteps.push(`Reached position ${index}: node with value ${current.value}`)
              newSteps.push(`Deleting node at position ${pos} with value ${current.next.value}`)
              current.next = current.next.next
            }
          }

          setHead(newHead)
          setSteps(newSteps)
          setResult(linkedListToArray(newHead))
          break
        }

        case "search": {
          if (!inputValue) {
            setError("Please enter a value to search for")
            return
          }

          const value = Number(inputValue)
          if (isNaN(value)) {
            setError("Please enter a valid number to search for")
            return
          }

          const newSteps = []
          let current = head
          let index = 0
          let found = false

          while (current) {
            newSteps.push(`Checking node at position ${index} with value ${current.value}`)

            if (current.value === value) {
              newSteps.push(`Found value ${value} at position ${index}`)
              found = true
              break
            }

            current = current.next
            index++
          }

          if (!found) {
            newSteps.push(`Value ${value} not found in the linked list`)
          }

          setSteps(newSteps)
          setResult({ found, position: found ? index : -1 })
          break
        }

        case "reverse": {
          const newSteps = []
          let prev: ListNode | null = null
          let current: ListNode | null = { ...head }
          let next: ListNode | null = null

          newSteps.push(`Original list: ${linkedListToArray(head).join(" -> ")}`)

          while (current) {
            next = current.next
            newSteps.push(`Current node: ${current.value}, Next node: ${next?.value || "null"}`)
            newSteps.push(`Reversing pointer of node ${current.value} to point to ${prev?.value || "null"}`)

            current.next = prev
            prev = current
            current = next

            newSteps.push(`After this step: ${prev.value} -> ${prev.next?.value || "null"}`)
          }

          newSteps.push(`Reversed list: ${linkedListToArray(prev).join(" -> ")}`)

          setHead(prev)
          setSteps(newSteps)
          setResult(linkedListToArray(prev))
          break
        }

        case "detectLoop": {
          const newSteps = []
          let slow: ListNode | null = head
          let fast: ListNode | null = head
          let hasLoop = false
          let steps = 0

          newSteps.push(`Using Floyd's Cycle-Finding Algorithm (Tortoise and Hare)`)

          while (fast && fast.next) {
            steps++
            slow = slow!.next
            fast = fast.next.next

            newSteps.push(`Step ${steps}: Slow pointer at ${slow?.value}, Fast pointer at ${fast?.value || "null"}`)

            if (slow === fast) {
              hasLoop = true
              newSteps.push(`Loop detected! Slow and fast pointers met at value ${slow?.value}`)
              break
            }
          }

          if (!hasLoop) {
            newSteps.push(`No loop detected in the linked list`)
          }

          setSteps(newSteps)
          setResult({ hasLoop })
          break
        }

        case "findMiddle": {
          const newSteps = []
          let slow: ListNode | null = head
          let fast: ListNode | null = head
          let steps = 0

          newSteps.push(`Using two-pointer technique to find the middle`)

          while (fast && fast.next) {
            steps++
            slow = slow!.next
            fast = fast.next.next

            newSteps.push(`Step ${steps}: Slow pointer at ${slow?.value}, Fast pointer at ${fast?.value || "null"}`)
          }

          newSteps.push(`Middle node found: ${slow?.value}`)

          setSteps(newSteps)
          setResult({ middle: slow?.value, position: Math.floor(linkedListToArray(head).length / 2) })
          break
        }

        case "removeNthFromEnd": {
          if (!position) {
            setError("Please enter a position from the end to remove")
            return
          }

          const n = Number.parseInt(position)
          if (isNaN(n) || n < 1) {
            setError("Please enter a valid position (1 or greater)")
            return
          }

          const newSteps = []
          const dummy: ListNode = { value: -1, next: { ...head }, id: -1 }
          let first: ListNode | null = dummy
          let second: ListNode | null = dummy

          newSteps.push(`Using two-pointer technique to remove ${n}th node from the end`)

          // Advance first pointer by n+1 steps
          for (let i = 1; i <= n + 1; i++) {
            if (!first) break
            first = first.next
            newSteps.push(`Moving first pointer to position ${i}: ${first?.value || "null"}`)
          }

          // If n is greater than the length of the list
          if (!first && n > linkedListToArray(head).length) {
            newSteps.push(`Position ${n} from the end is out of bounds`)
            setSteps(newSteps)
            setResult(linkedListToArray(head))
            break
          }

          // Move both pointers until first reaches the end
          while (first) {
            first = first.next
            second = second!.next
            newSteps.push(`Moving both pointers: first at ${first?.value || "null"}, second at ${second?.value}`)
          }

          // Remove the nth node from the end
          newSteps.push(`Removing node after position ${second?.value}: ${second?.next?.value}`)
          second!.next = second!.next!.next

          const newHead = dummy.next
          setHead(newHead)
          setSteps(newSteps)
          setResult(linkedListToArray(newHead))
          break
        }
      }

      setSuccess(`Operation '${operation}' performed successfully`)
    } catch (err) {
      setError(`Error performing operation: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Linked List Operations</CardTitle>
          <CardDescription>Perform various operations on linked lists</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="linkedList">Create Linked List</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Input
                  id="linkedList"
                  placeholder="e.g., 5, 2, 8, 1, 9"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <Button onClick={handleCreateList}>Create</Button>
              </div>
              {head && (
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <span className="text-sm font-medium">Current List:</span> {linkedListToArray(head).join(" → ")}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="operation">Operation</Label>
              <Select value={operation} onValueChange={(value) => setOperation(value as LinkedListOperation)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select operation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="insert">Insert Node</SelectItem>
                  <SelectItem value="delete">Delete Node</SelectItem>
                  <SelectItem value="search">Search Value</SelectItem>
                  <SelectItem value="reverse">Reverse List</SelectItem>
                  <SelectItem value="detectLoop">Detect Loop</SelectItem>
                  <SelectItem value="findMiddle">Find Middle Node</SelectItem>
                  <SelectItem value="removeNthFromEnd">Remove Nth From End</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(operation === "insert" || operation === "search") && (
              <div>
                <Label htmlFor="value">{operation === "insert" ? "Value to insert" : "Value to search"}</Label>
                <Input
                  id="value"
                  className="mt-1.5"
                  placeholder="e.g., 5"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>
            )}

            {(operation === "insert" || operation === "delete" || operation === "removeNthFromEnd") && (
              <div>
                <Label htmlFor="position">
                  {operation === "insert"
                    ? "Position (0 for head, leave empty for tail)"
                    : operation === "delete"
                      ? "Position to delete (0 for head)"
                      : "Position from end (1 for last node)"}
                </Label>
                <Input
                  id="position"
                  className="mt-1.5"
                  placeholder={operation === "removeNthFromEnd" ? "e.g., 1" : "e.g., 0"}
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                />
              </div>
            )}

            <Button className="w-full" onClick={performOperation}>
              Perform Operation
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Result</CardTitle>
          <CardDescription>View the result of your operation</CardDescription>
        </CardHeader>
        <CardContent>
          {result !== null && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Output:</h3>
                <div className="p-3 bg-muted rounded-md mt-2 overflow-x-auto">
                  {operation === "search"
                    ? result.found
                      ? `Found at position ${result.position}`
                      : "Value not found in the linked list"
                    : operation === "detectLoop"
                      ? result.hasLoop
                        ? "Loop detected in the linked list"
                        : "No loop detected in the linked list"
                      : operation === "findMiddle"
                        ? `Middle node: ${result.middle} at position ${result.position}`
                        : Array.isArray(result)
                          ? result.join(" → ")
                          : JSON.stringify(result)}
                </div>
              </div>

              {steps.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium">Steps:</h3>
                  <div className="p-3 bg-muted rounded-md mt-2 max-h-60 overflow-y-auto">
                    <ol className="list-decimal list-inside space-y-1">
                      {steps.map((step, index) => (
                        <li key={`step-${index}`} className="text-sm">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}

          {result === null && (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              Perform an operation to see the result
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

