"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

type StackOperation = "push" | "pop" | "peek" | "isEmpty" | "size" | "clear" | "validateParentheses" | "evaluatePostfix"

export default function StackOperations() {
  const [stack, setStack] = useState<number[]>([])
  const [inputValue, setInputValue] = useState("")
  const [operation, setOperation] = useState<StackOperation>("push")
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
        case "push": {
          if (!inputValue) {
            setError("Please enter a value to push")
            return
          }

          const value = Number(inputValue)
          if (isNaN(value)) {
            setError("Please enter a valid number to push")
            return
          }

          const newStack = [...stack, value]
          setStack(newStack)

          const newSteps = [
            `Current stack: [${stack.join(", ")}]`,
            `Pushing value ${value} onto the stack`,
            `New stack: [${newStack.join(", ")}]`,
          ]

          setSteps(newSteps)
          setResult(newStack)
          setInputValue("")
          break
        }

        case "pop": {
          if (stack.length === 0) {
            setError("Cannot pop from an empty stack")
            return
          }

          const newStack = [...stack]
          const poppedValue = newStack.pop()
          setStack(newStack)

          const newSteps = [
            `Current stack: [${stack.join(", ")}]`,
            `Popping value from the stack: ${poppedValue}`,
            `New stack: [${newStack.join(", ")}]`,
          ]

          setSteps(newSteps)
          setResult({ poppedValue, newStack })
          break
        }

        case "peek": {
          if (stack.length === 0) {
            setError("Cannot peek an empty stack")
            return
          }

          const topValue = stack[stack.length - 1]

          const newSteps = [`Current stack: [${stack.join(", ")}]`, `Peeking at the top value: ${topValue}`]

          setSteps(newSteps)
          setResult({ topValue })
          break
        }

        case "isEmpty": {
          const isEmpty = stack.length === 0

          const newSteps = [
            `Current stack: [${stack.join(", ")}]`,
            `Checking if stack is empty: ${isEmpty ? "Yes" : "No"}`,
          ]

          setSteps(newSteps)
          setResult({ isEmpty })
          break
        }

        case "size": {
          const size = stack.length

          const newSteps = [`Current stack: [${stack.join(", ")}]`, `Getting stack size: ${size}`]

          setSteps(newSteps)
          setResult({ size })
          break
        }

        case "clear": {
          setStack([])

          const newSteps = [`Current stack: [${stack.join(", ")}]`, `Clearing the stack`, `New stack: []`]

          setSteps(newSteps)
          setResult([])
          break
        }

        case "validateParentheses": {
          if (!inputValue) {
            setError("Please enter a string of parentheses to validate")
            return
          }

          const expression = inputValue
          const newSteps = [`Validating expression: ${expression}`]
          const tempStack: string[] = []
          let isValid = true

          for (let i = 0; i < expression.length; i++) {
            const char = expression[i]

            if (char === "(" || char === "[" || char === "{") {
              tempStack.push(char)
              newSteps.push(`Pushing '${char}' onto stack: [${tempStack.join(", ")}]`)
            } else if (char === ")" || char === "]" || char === "}") {
              if (tempStack.length === 0) {
                isValid = false
                newSteps.push(`Error: Found closing '${char}' without matching opening bracket`)
                break
              }

              const top = tempStack.pop()
              newSteps.push(`Popping '${top}' from stack: [${tempStack.join(", ")}]`)

              if ((char === ")" && top !== "(") || (char === "]" && top !== "[") || (char === "}" && top !== "{")) {
                isValid = false
                newSteps.push(`Error: Mismatched brackets '${top}' and '${char}'`)
                break
              }
            }
          }

          if (isValid && tempStack.length > 0) {
            isValid = false
            newSteps.push(`Error: Unclosed brackets remaining: [${tempStack.join(", ")}]`)
          }

          if (isValid) {
            newSteps.push(`Expression is valid: All brackets are properly matched`)
          }

          setSteps(newSteps)
          setResult({ isValid })
          break
        }

        case "evaluatePostfix": {
          if (!inputValue) {
            setError("Please enter a postfix expression to evaluate")
            return
          }

          const expression = inputValue.split(/\s+/)
          const newSteps = [`Evaluating postfix expression: ${expression.join(" ")}`]
          const tempStack: number[] = []

          for (let i = 0; i < expression.length; i++) {
            const token = expression[i]

            if (!isNaN(Number(token))) {
              // If token is a number, push it to the stack
              const num = Number(token)
              tempStack.push(num)
              newSteps.push(`Pushing number ${num} onto stack: [${tempStack.join(", ")}]`)
            } else {
              // If token is an operator, pop two values from stack, apply operator, and push result back
              if (tempStack.length < 2) {
                setError("Invalid postfix expression: Not enough operands")
                return
              }

              const b = tempStack.pop()!
              const a = tempStack.pop()!
              let result: number

              switch (token) {
                case "+":
                  result = a + b
                  newSteps.push(`Operator '+': ${a} + ${b} = ${result}`)
                  break
                case "-":
                  result = a - b
                  newSteps.push(`Operator '-': ${a} - ${b} = ${result}`)
                  break
                case "*":
                  result = a * b
                  newSteps.push(`Operator '*': ${a} * ${b} = ${result}`)
                  break
                case "/":
                  if (b === 0) {
                    setError("Division by zero")
                    return
                  }
                  result = a / b
                  newSteps.push(`Operator '/': ${a} / ${b} = ${result}`)
                  break
                case "^":
                  result = Math.pow(a, b)
                  newSteps.push(`Operator '^': ${a} ^ ${b} = ${result}`)
                  break
                default:
                  setError(`Unknown operator: ${token}`)
                  return
              }

              tempStack.push(result)
              newSteps.push(`Pushing result ${result} onto stack: [${tempStack.join(", ")}]`)
            }
          }

          if (tempStack.length !== 1) {
            setError("Invalid postfix expression: Too many operands")
            return
          }

          const finalResult = tempStack[0]
          newSteps.push(`Final result: ${finalResult}`)

          setSteps(newSteps)
          setResult({ value: finalResult })
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
          <CardTitle>Stack Operations</CardTitle>
          <CardDescription>Perform various operations on a stack</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="operation">Operation</Label>
              <Select value={operation} onValueChange={(value) => setOperation(value as StackOperation)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select operation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="push">Push</SelectItem>
                  <SelectItem value="pop">Pop</SelectItem>
                  <SelectItem value="peek">Peek</SelectItem>
                  <SelectItem value="isEmpty">Is Empty</SelectItem>
                  <SelectItem value="size">Size</SelectItem>
                  <SelectItem value="clear">Clear</SelectItem>
                  <SelectItem value="validateParentheses">Validate Parentheses</SelectItem>
                  <SelectItem value="evaluatePostfix">Evaluate Postfix</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(operation === "push" || operation === "validateParentheses" || operation === "evaluatePostfix") && (
              <div>
                <Label htmlFor="value">
                  {operation === "push"
                    ? "Value to push"
                    : operation === "validateParentheses"
                      ? "Parentheses expression"
                      : "Postfix expression (space-separated)"}
                </Label>
                <Input
                  id="value"
                  className="mt-1.5"
                  placeholder={
                    operation === "push"
                      ? "e.g., 5"
                      : operation === "validateParentheses"
                        ? "e.g., {[()]}"
                        : "e.g., 3 4 + 2 *"
                  }
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>
            )}

            <div className="p-3 bg-muted rounded-md">
              <h3 className="text-sm font-medium mb-2">Current Stack (top → bottom):</h3>
              {stack.length > 0 ? (
                <div className="flex flex-col-reverse space-y-reverse space-y-1">
                  {stack.map((value, index) => (
                    <div
                      key={`stack-item-${stack.length - 1 - index}`}
                      className={`p-2 border rounded-md ${index === 0 ? "bg-primary/10 border-primary/30" : ""}`}
                    >
                      {value}
                      {index === 0 && <span className="ml-2 text-xs text-muted-foreground">(top)</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">Empty stack</div>
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
                  {operation === "push"
                    ? `Value ${inputValue} pushed to stack`
                    : operation === "pop"
                      ? `Popped value: ${result.poppedValue}`
                      : operation === "peek"
                        ? `Top value: ${result.topValue}`
                        : operation === "isEmpty"
                          ? `Stack is ${result.isEmpty ? "empty" : "not empty"}`
                          : operation === "size"
                            ? `Stack size: ${result.size}`
                            : operation === "clear"
                              ? `Stack cleared`
                              : operation === "validateParentheses"
                                ? `Expression is ${result.isValid ? "valid" : "invalid"}`
                                : operation === "evaluatePostfix"
                                  ? `Result: ${result.value}`
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

