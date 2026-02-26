"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

type PolynomialOperation = "add" | "subtract" | "multiply" | "evaluate" | "derivative" | "degree"

interface Term {
  coefficient: number
  exponent: number
}

export default function PolynomialOperations() {
  const [poly1, setPoly1] = useState<Term[]>([])
  const [poly2, setPoly2] = useState<Term[]>([])
  const [inputPoly1, setInputPoly1] = useState("")
  const [inputPoly2, setInputPoly2] = useState("")
  const [xValue, setXValue] = useState("")
  const [operation, setOperation] = useState<PolynomialOperation>("add")
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [steps, setSteps] = useState<string[]>([])

  const parsePolynomial = (input: string): Term[] => {
    try {
      // Remove all spaces
      input = input.replace(/\s+/g, "")

      // Match terms like 3x^2, -5x, 7, x^3, -x, etc.
      const termRegex = /([+-]?(?:\d*\.?\d*)?x(?:\^-?\d+)?|[+-]?\d+\.?\d*)/g
      const terms = input.match(termRegex)

      if (!terms) {
        throw new Error("Invalid polynomial format")
      }

      const result: Term[] = []

      for (const term of terms) {
        let coefficient: number
        let exponent: number

        if (term.includes("x")) {
          // Term with variable
          if (term === "x" || term === "+x") {
            coefficient = 1
            exponent = 1
          } else if (term === "-x") {
            coefficient = -1
            exponent = 1
          } else if (term.endsWith("x")) {
            coefficient = Number.parseFloat(term.slice(0, -1))
            exponent = 1
          } else {
            // Term with exponent
            const parts = term.split("x^")
            const coeffPart = parts[0].endsWith("x") ? parts[0].slice(0, -1) : parts[0]

            coefficient =
              coeffPart === "" ? 1 : coeffPart === "+" ? 1 : coeffPart === "-" ? -1 : Number.parseFloat(coeffPart)
            exponent = Number.parseInt(parts[1])
          }
        } else {
          // Constant term
          coefficient = Number.parseFloat(term)
          exponent = 0
        }

        if (isNaN(coefficient) || isNaN(exponent)) {
          throw new Error(`Invalid term: ${term}`)
        }

        // Add term to result, combining like terms
        const existingTerm = result.find((t) => t.exponent === exponent)
        if (existingTerm) {
          existingTerm.coefficient += coefficient
        } else {
          result.push({ coefficient, exponent })
        }
      }

      // Sort terms by descending exponent
      return result.sort((a, b) => b.exponent - a.exponent)
    } catch (err) {
      throw new Error("Invalid polynomial format")
    }
  }

  const polynomialToString = (poly: Term[]): string => {
    if (poly.length === 0) return "0"

    return poly
      .map((term, index) => {
        if (term.coefficient === 0) return ""

        let termStr = ""

        // Add sign
        if (index === 0) {
          if (term.coefficient < 0) termStr += "-"
        } else {
          termStr += term.coefficient < 0 ? " - " : " + "
        }

        // Add coefficient
        const absCoeff = Math.abs(term.coefficient)
        if (term.exponent === 0 || absCoeff !== 1) {
          termStr += absCoeff
        }

        // Add variable and exponent
        if (term.exponent > 0) {
          termStr += "x"
          if (term.exponent > 1) {
            termStr += `^${term.exponent}`
          }
        }

        return termStr
      })
      .filter(Boolean)
      .join("")
  }

  const handleSetPoly1 = () => {
    setError(null)
    try {
      const parsedPoly = parsePolynomial(inputPoly1)
      setPoly1(parsedPoly)
      setSuccess("Polynomial 1 set successfully")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError("Invalid polynomial format. Use format like 3x^2 + 5x - 7")
    }
  }

  const handleSetPoly2 = () => {
    setError(null)
    try {
      const parsedPoly = parsePolynomial(inputPoly2)
      setPoly2(parsedPoly)
      setSuccess("Polynomial 2 set successfully")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError("Invalid polynomial format. Use format like 3x^2 + 5x - 7")
    }
  }

  const performOperation = () => {
    setError(null)
    setSuccess(null)
    setResult(null)
    setSteps([])

    if (poly1.length === 0) {
      setError("Please set Polynomial 1 first")
      return
    }

    if ((operation === "add" || operation === "subtract" || operation === "multiply") && poly2.length === 0) {
      setError("Please set Polynomial 2 for this operation")
      return
    }

    try {
      switch (operation) {
        case "add": {
          const resultPoly: Term[] = [...poly1]
          const newSteps = [
            `Polynomial 1: ${polynomialToString(poly1)}`,
            `Polynomial 2: ${polynomialToString(poly2)}`,
            `Adding polynomials term by term`,
          ]

          // Add terms from poly2 to resultPoly
          for (const term2 of poly2) {
            const matchingTerm = resultPoly.find((t) => t.exponent === term2.exponent)

            if (matchingTerm) {
              newSteps.push(
                `Adding coefficients for x^${term2.exponent}: ${matchingTerm.coefficient} + ${term2.coefficient} = ${matchingTerm.coefficient + term2.coefficient}`,
              )
              matchingTerm.coefficient += term2.coefficient
            } else {
              newSteps.push(`Adding new term: ${term2.coefficient}x^${term2.exponent}`)
              resultPoly.push({ ...term2 })
            }
          }

          // Sort by descending exponent
          resultPoly.sort((a, b) => b.exponent - a.exponent)

          // Remove terms with coefficient 0
          const finalResult = resultPoly.filter((term) => term.coefficient !== 0)

          newSteps.push(`Result: ${polynomialToString(finalResult)}`)

          setSteps(newSteps)
          setResult(finalResult)
          break
        }

        case "subtract": {
          const resultPoly: Term[] = [...poly1]
          const newSteps = [
            `Polynomial 1: ${polynomialToString(poly1)}`,
            `Polynomial 2: ${polynomialToString(poly2)}`,
            `Subtracting polynomials term by term`,
          ]

          // Subtract terms from poly2 from resultPoly
          for (const term2 of poly2) {
            const matchingTerm = resultPoly.find((t) => t.exponent === term2.exponent)

            if (matchingTerm) {
              newSteps.push(
                `Subtracting coefficients for x^${term2.exponent}: ${matchingTerm.coefficient} - ${term2.coefficient} = ${matchingTerm.coefficient - term2.coefficient}`,
              )
              matchingTerm.coefficient -= term2.coefficient
            } else {
              newSteps.push(`Adding new term with negated coefficient: ${-term2.coefficient}x^${term2.exponent}`)
              resultPoly.push({ coefficient: -term2.coefficient, exponent: term2.exponent })
            }
          }

          // Sort by descending exponent
          resultPoly.sort((a, b) => b.exponent - a.exponent)

          // Remove terms with coefficient 0
          const finalResult = resultPoly.filter((term) => term.coefficient !== 0)

          newSteps.push(`Result: ${polynomialToString(finalResult)}`)

          setSteps(newSteps)
          setResult(finalResult)
          break
        }

        case "multiply": {
          const resultPoly: Term[] = []
          const newSteps = [
            `Polynomial 1: ${polynomialToString(poly1)}`,
            `Polynomial 2: ${polynomialToString(poly2)}`,
            `Multiplying polynomials term by term`,
          ]

          // Multiply each term in poly1 with each term in poly2
          for (const term1 of poly1) {
            for (const term2 of poly2) {
              const newCoefficient = term1.coefficient * term2.coefficient
              const newExponent = term1.exponent + term2.exponent

              newSteps.push(
                `Multiplying ${term1.coefficient}x^${term1.exponent} * ${term2.coefficient}x^${term2.exponent} = ${newCoefficient}x^${newExponent}`,
              )

              // Check if there's already a term with this exponent
              const existingTerm = resultPoly.find((t) => t.exponent === newExponent)

              if (existingTerm) {
                newSteps.push(
                  `Combining like terms: ${existingTerm.coefficient}x^${newExponent} + ${newCoefficient}x^${newExponent} = ${existingTerm.coefficient + newCoefficient}x^${newExponent}`,
                )
                existingTerm.coefficient += newCoefficient
              } else {
                resultPoly.push({ coefficient: newCoefficient, exponent: newExponent })
              }
            }
          }

          // Sort by descending exponent
          resultPoly.sort((a, b) => b.exponent - a.exponent)

          // Remove terms with coefficient 0
          const finalResult = resultPoly.filter((term) => term.coefficient !== 0)

          newSteps.push(`Result: ${polynomialToString(finalResult)}`)

          setSteps(newSteps)
          setResult(finalResult)
          break
        }

        case "evaluate": {
          if (!xValue) {
            setError("Please enter a value for x")
            return
          }

          const x = Number.parseFloat(xValue)
          if (isNaN(x)) {
            setError("Please enter a valid number for x")
            return
          }

          let result = 0
          const newSteps = [`Polynomial: ${polynomialToString(poly1)}`, `Evaluating at x = ${x}`]

          for (const term of poly1) {
            const termValue = term.coefficient * Math.pow(x, term.exponent)
            result += termValue

            newSteps.push(
              `Term ${term.coefficient}x^${term.exponent} = ${term.coefficient} * ${x}^${term.exponent} = ${termValue}`,
            )
          }

          newSteps.push(`Sum of all terms: ${result}`)

          setSteps(newSteps)
          setResult({ value: result })
          break
        }

        case "derivative": {
          const resultPoly: Term[] = []
          const newSteps = [`Polynomial: ${polynomialToString(poly1)}`, `Finding the derivative`]

          for (const term of poly1) {
            if (term.exponent === 0) {
              newSteps.push(`Term ${term.coefficient} (constant) becomes 0 in the derivative`)
            } else {
              const newCoefficient = term.coefficient * term.exponent
              const newExponent = term.exponent - 1

              newSteps.push(`Term ${term.coefficient}x^${term.exponent} becomes ${newCoefficient}x^${newExponent}`)
              resultPoly.push({ coefficient: newCoefficient, exponent: newExponent })
            }
          }

          // Sort by descending exponent
          resultPoly.sort((a, b) => b.exponent - a.exponent)

          // If empty, add a zero term
          if (resultPoly.length === 0) {
            resultPoly.push({ coefficient: 0, exponent: 0 })
          }

          newSteps.push(`Result: ${polynomialToString(resultPoly)}`)

          setSteps(newSteps)
          setResult(resultPoly)
          break
        }

        case "degree": {
          if (poly1.length === 0) {
            setSteps([`Polynomial is 0, degree is -∞`])
            setResult({ degree: Number.NEGATIVE_INFINITY })
            break
          }

          // Sort by descending exponent
          const sortedPoly = [...poly1].sort((a, b) => b.exponent - a.exponent)

          // Find the highest exponent with non-zero coefficient
          const highestTerm = sortedPoly.find((term) => term.coefficient !== 0)

          if (!highestTerm) {
            setSteps([`All coefficients are 0, degree is -∞`])
            setResult({ degree: Number.NEGATIVE_INFINITY })
          } else {
            setSteps([
              `Polynomial: ${polynomialToString(poly1)}`,
              `Highest exponent with non-zero coefficient: ${highestTerm.exponent}`,
            ])
            setResult({ degree: highestTerm.exponent })
          }

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
          <CardTitle>Polynomial Operations</CardTitle>
          <CardDescription>Perform various operations on polynomials</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="poly1">Polynomial 1</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Input
                  id="poly1"
                  placeholder="e.g., 3x^2 + 5x - 7"
                  value={inputPoly1}
                  onChange={(e) => setInputPoly1(e.target.value)}
                />
                <Button onClick={handleSetPoly1}>Set</Button>
              </div>
              {poly1.length > 0 && (
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <span className="text-sm font-medium">Current Polynomial 1:</span> {polynomialToString(poly1)}
                </div>
              )}
            </div>

            {(operation === "add" || operation === "subtract" || operation === "multiply") && (
              <div>
                <Label htmlFor="poly2">Polynomial 2</Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <Input
                    id="poly2"
                    placeholder="e.g., 2x^3 - x + 4"
                    value={inputPoly2}
                    onChange={(e) => setInputPoly2(e.target.value)}
                  />
                  <Button onClick={handleSetPoly2}>Set</Button>
                </div>
                {poly2.length > 0 && (
                  <div className="mt-2 p-2 bg-muted rounded-md">
                    <span className="text-sm font-medium">Current Polynomial 2:</span> {polynomialToString(poly2)}
                  </div>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="operation">Operation</Label>
              <Select value={operation} onValueChange={(value) => setOperation(value as PolynomialOperation)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select operation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add</SelectItem>
                  <SelectItem value="subtract">Subtract</SelectItem>
                  <SelectItem value="multiply">Multiply</SelectItem>
                  <SelectItem value="evaluate">Evaluate</SelectItem>
                  <SelectItem value="derivative">Derivative</SelectItem>
                  <SelectItem value="degree">Degree</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {operation === "evaluate" && (
              <div>
                <Label htmlFor="xValue">Value of x</Label>
                <Input
                  id="xValue"
                  className="mt-1.5"
                  placeholder="e.g., 2"
                  value={xValue}
                  onChange={(e) => setXValue(e.target.value)}
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
                  {operation === "add" ||
                  operation === "subtract" ||
                  operation === "multiply" ||
                  operation === "derivative"
                    ? polynomialToString(result)
                    : operation === "evaluate"
                      ? `P(${xValue}) = ${result.value}`
                      : operation === "degree"
                        ? `Degree: ${result.degree === Number.NEGATIVE_INFINITY ? "-∞ (zero polynomial)" : result.degree}`
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

