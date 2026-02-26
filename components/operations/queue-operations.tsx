"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

type QueueOperation = "enqueue" | "dequeue" | "peek" | "isEmpty" | "size" | "clear" | "reverse" | "generateBinary"

export default function QueueOperations() {
  const [queue, setQueue] = useState<number[]>([])
  const [inputValue, setInputValue] = useState("")
  const [operation, setOperation] = useState<QueueOperation>("enqueue")
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [steps, setSteps] = useState<string[]>([])

  const performOperation = () => {
    setError(null)
    setSuccess(null)
    setResult(null)
    setSteps([])

    try {
      switch (operation) {
        case "enqueue": {
          if (!inputValue) {
            setError("Please enter a value to enqueue")
            return
          }

          const value = Number(inputValue)
          if (isNaN(value)) {
            setError("Please enter a valid number to enqueue")
            return
          }

          const newQueue = [...queue, value]
          setQueue(newQueue)

          const newSteps = [
            `Current queue: [${queue.join(", ")}]`,
            `Enqueuing value ${value} to the queue`,
            `New queue: [${newQueue.join(", ")}]`,
          ]

          setSteps(newSteps)
          setResult(newQueue)
          setInputValue("")
          break
        }

        case "dequeue": {
          if (queue.length === 0) {
            setError("Cannot dequeue from an empty queue")
            return
          }

          const newQueue = [...queue]
          const dequeuedValue = newQueue.shift()
          setQueue(newQueue)

          const newSteps = [
            `Current queue: [${queue.join(", ")}]`,
            `Dequeuing value from the queue: ${dequeuedValue}`,
            `New queue: [${newQueue.join(", ")}]`,
          ]

          setSteps(newSteps)
          setResult({ dequeuedValue, newQueue })
          break
        }

        case "peek": {
          if (queue.length === 0) {
            setError("Cannot peek an empty queue")
            return
          }

          const frontValue = queue[0]

          const newSteps = [`Current queue: [${queue.join(", ")}]`, `Peeking at the front value: ${frontValue}`]

          setSteps(newSteps)
          setResult({ frontValue })
          break
        }

        case "isEmpty": {
          const isEmpty = queue.length === 0

          const newSteps = [
            `Current queue: [${queue.join(", ")}]`,
            `Checking if queue is empty: ${isEmpty ? "Yes" : "No"}`,
          ]

          setSteps(newSteps)
          setResult({ isEmpty })
          break
        }

        case "size": {
          const size = queue.length

          const newSteps = [`Current queue: [${queue.join(", ")}]`, `Getting queue size: ${size}`]

          setSteps(newSteps)
          setResult({ size })
          break
        }

        case "clear": {
          setQueue([])

          const newSteps = [`Current queue: [${queue.join(", ")}]`, `Clearing the queue`, `New queue: []`]

          setSteps(newSteps)
          setResult([])
          break
        }

        case "reverse": {
          if (queue.length === 0) {
            setError("Cannot reverse an empty queue")
            return
          }

          const newQueue = [...queue].reverse()

          const newSteps = [
            `Current queue: [${queue.join(", ")}]`,
            `Reversing the queue using a stack:`,
            `1. Dequeue all elements and push to a stack`,
            `2. Pop all elements from stack and enqueue back to queue`,
            `Reversed queue: [${newQueue.join(", ")}]`,
          ]

          setQueue(newQueue)
          setSteps(newSteps)
          setResult(newQueue)
          break
        }

        case "generateBinary": {
          if (!inputValue) {
            setError("Please enter a number to generate binary numbers")
            return
          }

          const n = Number.parseInt(inputValue)
          if (isNaN(n) || n <= 0) {
            setError("Please enter a positive integer")
            return
          }

          if (n > 20) {
            setError("Please enter a number less than or equal to 20 to avoid performance issues")
            return
          }

          const binaryNumbers: string[] = []
          const tempQueue: string[] = ["1"]
          const newSteps = [`Generating first ${n} binary numbers:`]

          let count = 0
          while (count < n) {
            const current = tempQueue.shift()!
            binaryNumbers.push(current)
            newSteps.push(`Generated: ${current}`)

            tempQueue.push(current + "0")
            tempQueue.push(current + "1")

            count++
          }

          setSteps(newSteps)
          setResult({ binaryNumbers })
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
          <CardTitle>Queue Operations</CardTitle>
          <CardDescription>Perform various operations on a queue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="operation">Operation</Label>
              <Select value={operation} onValueChange={(value) => setOperation(value as QueueOperation)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select operation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enqueue">Enqueue</SelectItem>
                  <SelectItem value="dequeue">Dequeue</SelectItem>
                  <SelectItem value="peek">Peek</SelectItem>
                  <SelectItem value="isEmpty">Is Empty</SelectItem>
                  <SelectItem value="size">Size</SelectItem>
                  <SelectItem value="clear">Clear</SelectItem>
                  <SelectItem value="reverse">Reverse</SelectItem>
                  <SelectItem value="generateBinary">Generate Binary Numbers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(operation === "enqueue" || operation === "generateBinary") && (
              <div>
                <Label htmlFor="value">
                  {operation === "enqueue" ? "Value to enqueue" : "Number of binary numbers to generate"}
                </Label>
                <Input
                  id="value"
                  className="mt-1.5"
                  placeholder={operation === "enqueue" ? "e.g., 5" : "e.g., 10"}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>
            )}

            <div className="p-3 bg-muted rounded-md">
              <h3 className="text-sm font-medium mb-2">Current Queue (front → rear):</h3>
              {queue.length > 0 ? (
                <div className="flex flex-row space-x-1 overflow-x-auto pb-2">
                  {queue.map((value, index) => (
                    <div
                      key={`queue-item-${index}`}
                      className={`p-2 border rounded-md min-w-[40px] text-center ${index === 0 ? "bg-primary/10 border-primary/30" : ""}`}
                    >
                      {value}
                      {index === 0 && <div className="text-xs text-muted-foreground">(front)</div>}
                      {index === queue.length - 1 && index !== 0 && (
                        <div className="text-xs text-muted-foreground">(rear)</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">Empty queue</div>
              )}
            </div>

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
                  {operation === "enqueue"
                    ? `Value ${inputValue} enqueued to queue`
                    : operation === "dequeue"
                      ? `Dequeued value: ${result.dequeuedValue}`
                      : operation === "peek"
                        ? `Front value: ${result.frontValue}`
                        : operation === "isEmpty"
                          ? `Queue is ${result.isEmpty ? "empty" : "not empty"}`
                          : operation === "size"
                            ? `Queue size: ${result.size}`
                            : operation === "clear"
                              ? `Queue cleared`
                              : operation === "reverse"
                                ? `Queue reversed`
                                : operation === "generateBinary"
                                  ? `First ${result.binaryNumbers.length} binary numbers: ${result.binaryNumbers.join(", ")}`
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

