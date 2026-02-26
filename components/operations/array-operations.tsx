"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

type ArrayOperation = "search" | "sort" | "reverse" | "filter" | "map" | "reduce" | "merge"

export default function ArrayOperations() {
  const [array1, setArray1] = useState<number[]>([])
  const [array2, setArray2] = useState<number[]>([])
  const [inputValue, setInputValue] = useState("")
  const [inputValue2, setInputValue2] = useState("")
  const [operation, setOperation] = useState<ArrayOperation>("sort")
  const [parameter, setParameter] = useState("")
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [steps, setSteps] = useState<string[]>([])

  const parseArray = (input: string): number[] => {
    try {
      return input.split(",").map((item) => {
        const num = Number(item.trim())
        if (isNaN(num)) throw new Error("Invalid number in array")
        return num
      })
    } catch (err) {
      setError("Please enter valid numbers separated by commas")
      return []
    }
  }

  const handleSetArray1 = () => {
    setError(null)
    const parsedArray = parseArray(inputValue)
    if (parsedArray.length > 0) {
      setArray1(parsedArray)
      setSuccess("Array 1 set successfully")
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  const handleSetArray2 = () => {
    setError(null)
    const parsedArray = parseArray(inputValue2)
    if (parsedArray.length > 0) {
      setArray2(parsedArray)
      setSuccess("Array 2 set successfully")
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  const performOperation = () => {
    setError(null)
    setSuccess(null)
    setResult(null)
    setSteps([])

    if (array1.length === 0) {
      setError("Please set Array 1 first")
      return
    }

    try {
      switch (operation) {
        case "search": {
          if (!parameter) {
            setError("Please enter a value to search for")
            return
          }
          const value = Number(parameter)
          if (isNaN(value)) {
            setError("Please enter a valid number to search for")
            return
          }

          const index = array1.indexOf(value)
          const newSteps = []

          for (let i = 0; i <= index && index !== -1; i++) {
            newSteps.push(
              `Checking index ${i}: ${array1[i]} ${i === index ? "= " + value + " (Found!)" : "!= " + value}`,
            )
          }

          if (index === -1) {
            for (let i = 0; i < array1.length; i++) {
              newSteps.push(`Checking index ${i}: ${array1[i]} != ${value}`)
            }
            newSteps.push(`Value ${value} not found in the array`)
          }

          setSteps(newSteps)
          setResult({ found: index !== -1, index: index })
          break
        }

        case "sort": {
          const sortedArray = [...array1].sort((a, b) => a - b)
          const newSteps = []

          // Simple bubble sort steps for visualization
          const tempArray = [...array1]
          for (let i = 0; i < tempArray.length; i++) {
            for (let j = 0; j < tempArray.length - i - 1; j++) {
              if (tempArray[j] > tempArray[j + 1]) {
                newSteps.push(`Swap ${tempArray[j]} and ${tempArray[j + 1]}`)
                const temp = tempArray[j]
                tempArray[j] = tempArray[j + 1]
                tempArray[j + 1] = temp
                newSteps.push(`Array: [${tempArray.join(", ")}]`)
              }
            }
          }

          setSteps(newSteps)
          setResult(sortedArray)
          break
        }

        case "reverse": {
          const reversedArray = [...array1].reverse()
          const newSteps = [`Original array: [${array1.join(", ")}]`]
          newSteps.push(`Reversed array: [${reversedArray.join(", ")}]`)
          setSteps(newSteps)
          setResult(reversedArray)
          break
        }

        case "filter": {
          if (!parameter) {
            setError("Please enter a filter condition (e.g., > 5)")
            return
          }

          let filterFn: (num: number) => boolean
          const newSteps = [`Original array: [${array1.join(", ")}]`]

          if (parameter.includes(">")) {
            const value = Number(parameter.split(">")[1].trim())
            filterFn = (num) => num > value
            newSteps.push(`Filtering elements > ${value}`)
          } else if (parameter.includes("<")) {
            const value = Number(parameter.split("<")[1].trim())
            filterFn = (num) => num < value
            newSteps.push(`Filtering elements < ${value}`)
          } else if (parameter.includes("=")) {
            const value = Number(parameter.split("=")[1].trim())
            filterFn = (num) => num === value
            newSteps.push(`Filtering elements = ${value}`)
          } else {
            setError("Invalid filter condition. Use >, <, or =")
            return
          }

          const filteredArray = array1.filter(filterFn)
          array1.forEach((num) => {
            newSteps.push(`Check ${num}: ${filterFn(num) ? "Keep" : "Remove"}`)
          })

          newSteps.push(`Result: [${filteredArray.join(", ")}]`)
          setSteps(newSteps)
          setResult(filteredArray)
          break
        }

        case "map": {
          if (!parameter) {
            setError("Please enter a map operation (e.g., * 2)")
            return
          }

          let mapFn: (num: number) => number
          const newSteps = [`Original array: [${array1.join(", ")}]`]

          if (parameter.includes("*")) {
            const value = Number(parameter.split("*")[1].trim())
            mapFn = (num) => num * value
            newSteps.push(`Multiplying each element by ${value}`)
          } else if (parameter.includes("/")) {
            const value = Number(parameter.split("/")[1].trim())
            mapFn = (num) => num / value
            newSteps.push(`Dividing each element by ${value}`)
          } else if (parameter.includes("+")) {
            const value = Number(parameter.split("+")[1].trim())
            mapFn = (num) => num + value
            newSteps.push(`Adding ${value} to each element`)
          } else if (parameter.includes("-")) {
            const value = Number(parameter.split("-")[1].trim())
            mapFn = (num) => num - value
            newSteps.push(`Subtracting ${value} from each element`)
          } else {
            setError("Invalid map operation. Use *, /, +, or -")
            return
          }

          const mappedArray = array1.map(mapFn)
          array1.forEach((num, index) => {
            newSteps.push(`Map ${num} → ${mappedArray[index]}`)
          })

          newSteps.push(`Result: [${mappedArray.join(", ")}]`)
          setSteps(newSteps)
          setResult(mappedArray)
          break
        }

        case "reduce": {
          if (!parameter) {
            setError("Please enter a reduce operation (e.g., sum, product, max, min)")
            return
          }

          const newSteps = [`Original array: [${array1.join(", ")}]`]
          let reducedValue: number

          if (parameter === "sum") {
            reducedValue = array1.reduce((acc, curr) => {
              newSteps.push(`${acc} + ${curr} = ${acc + curr}`)
              return acc + curr
            }, 0)
            newSteps.push(`Sum: ${reducedValue}`)
          } else if (parameter === "product") {
            reducedValue = array1.reduce((acc, curr) => {
              newSteps.push(`${acc} * ${curr} = ${acc * curr}`)
              return acc * curr
            }, 1)
            newSteps.push(`Product: ${reducedValue}`)
          } else if (parameter === "max") {
            reducedValue = Math.max(...array1)
            newSteps.push(`Maximum value: ${reducedValue}`)
          } else if (parameter === "min") {
            reducedValue = Math.min(...array1)
            newSteps.push(`Minimum value: ${reducedValue}`)
          } else {
            setError("Invalid reduce operation. Use sum, product, max, or min")
            return
          }

          setSteps(newSteps)
          setResult(reducedValue)
          break
        }

        case "merge": {
          if (array2.length === 0) {
            setError("Please set Array 2 for merge operation")
            return
          }

          const mergedArray = [...array1, ...array2]
          const newSteps = [
            `Array 1: [${array1.join(", ")}]`,
            `Array 2: [${array2.join(", ")}]`,
            `Merged array: [${mergedArray.join(", ")}]`,
          ]

          setSteps(newSteps)
          setResult(mergedArray)
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
          <CardTitle>Array Operations</CardTitle>
          <CardDescription>Perform various operations on arrays</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="array1">Array 1</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Input
                  id="array1"
                  placeholder="e.g., 5, 2, 8, 1, 9"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <Button onClick={handleSetArray1}>Set</Button>
              </div>
              {array1.length > 0 && (
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <span className="text-sm font-medium">Current Array 1:</span> [{array1.join(", ")}]
                </div>
              )}
            </div>

            {operation === "merge" && (
              <div>
                <Label htmlFor="array2">Array 2</Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <Input
                    id="array2"
                    placeholder="e.g., 3, 6, 7, 4"
                    value={inputValue2}
                    onChange={(e) => setInputValue2(e.target.value)}
                  />
                  <Button onClick={handleSetArray2}>Set</Button>
                </div>
                {array2.length > 0 && (
                  <div className="mt-2 p-2 bg-muted rounded-md">
                    <span className="text-sm font-medium">Current Array 2:</span> [{array2.join(", ")}]
                  </div>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="operation">Operation</Label>
              <Select value={operation} onValueChange={(value) => setOperation(value as ArrayOperation)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select operation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="search">Search</SelectItem>
                  <SelectItem value="sort">Sort</SelectItem>
                  <SelectItem value="reverse">Reverse</SelectItem>
                  <SelectItem value="filter">Filter</SelectItem>
                  <SelectItem value="map">Map</SelectItem>
                  <SelectItem value="reduce">Reduce</SelectItem>
                  <SelectItem value="merge">Merge</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(operation === "search" || operation === "filter" || operation === "map" || operation === "reduce") && (
              <div>
                <Label htmlFor="parameter">
                  {operation === "search" && "Value to search"}
                  {operation === "filter" && "Filter condition (e.g., > 5)"}
                  {operation === "map" && "Map operation (e.g., * 2)"}
                  {operation === "reduce" && "Reduce operation (sum, product, max, min)"}
                </Label>
                <Input
                  id="parameter"
                  className="mt-1.5"
                  placeholder={
                    operation === "search"
                      ? "e.g., 5"
                      : operation === "filter"
                        ? "e.g., > 5"
                        : operation === "map"
                          ? "e.g., * 2"
                          : "e.g., sum"
                  }
                  value={parameter}
                  onChange={(e) => setParameter(e.target.value)}
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
                      ? `Found at index ${result.index}`
                      : "Value not found in the array"
                    : Array.isArray(result)
                      ? `[${result.join(", ")}]`
                      : String(result)}
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

