"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash, Play, RotateCcw, Coins } from "lucide-react"

type Coin = {
  id: number
  value: number
  selected?: boolean
  count?: number
  isNew?: boolean
}

export default function GreedyAlgorithmVisualizer() {
  const [coins, setCoins] = useState<Coin[]>([])
  const [coinValue, setCoinValue] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [animating, setAnimating] = useState(false)
  const [steps, setSteps] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [nextId, setNextId] = useState(1)
  const [result, setResult] = useState<{ coins: Coin[]; total: number } | null>(null)

  // Function to add a new coin denomination
  const handleAddCoin = () => {
    if (!coinValue || animating) return

    const value = Number.parseInt(coinValue)
    if (value <= 0) return

    // Add validation to limit value to 500
    if (value > 500) {
      alert("Please enter a value not greater than 500")
      return
    }

    // Remove the check that prevents adding duplicate coin values
    // We'll generate a unique ID for each coin instead
    const newCoin = { id: nextId, value, isNew: true }
    setCoins([...coins, newCoin])
    setNextId(nextId + 1)

    // Remove the "isNew" flag after animation
    setTimeout(() => {
      setCoins((coins) => coins.map((coin) => (coin.id === newCoin.id ? { ...coin, isNew: false } : coin)))
    }, 1000)

    setCoinValue("")
  }

  // Function to remove a coin denomination
  const handleRemoveCoin = (id: number) => {
    if (animating) return

    // Find the value of the coin to remove
    const coinToRemove = coins.find((coin) => coin.id === id)
    if (!coinToRemove) return

    // Remove all coins with this value
    setCoins(coins.filter((coin) => coin.value !== coinToRemove.value))
  }

  // Function to clear all coins
  const handleClearCoins = () => {
    if (animating) return
    setCoins([])
    setSteps([])
    setCurrentStep(0)
    setResult(null)
  }

  // Function to solve the coin change problem using greedy algorithm
  const handleSolve = () => {
    if (!targetAmount || animating || coins.length === 0) return

    const amount = Number.parseInt(targetAmount)
    if (amount <= 0) return

    setAnimating(true)
    setSteps([])
    setCurrentStep(0)
    setResult(null)

    // Reset all selections
    setCoins((coins) =>
      coins.map((coin) => ({
        ...coin,
        selected: false,
        count: 0,
      })),
    )

    // Sort coins in descending order
    const sortedCoins = [...coins].sort((a, b) => b.value - a.value)

    // Greedy algorithm steps
    const animations: (() => void)[] = []
    const algorithmSteps: string[] = []

    algorithmSteps.push(`Starting Greedy Coin Change algorithm for amount: ${amount}`)
    algorithmSteps.push(`Available coins: ${sortedCoins.map((c) => c.value).join(", ")}`)
    algorithmSteps.push(`Sorting coins in descending order: ${sortedCoins.map((c) => c.value).join(", ")}`)

    let remainingAmount = amount
    const selectedCoins: Coin[] = []

    // Simulate the greedy algorithm
    for (let i = 0; i < sortedCoins.length; i++) {
      const coin = sortedCoins[i]

      algorithmSteps.push(`Considering coin with value ${coin.value}`)

      animations.push(() => {
        setCoins((currentCoins) => {
          return currentCoins.map((c) => ({
            ...c,
            selected: c.id === coin.id,
          }))
        })
      })

      if (coin.value <= remainingAmount) {
        const count = Math.floor(remainingAmount / coin.value)
        remainingAmount = remainingAmount % coin.value

        algorithmSteps.push(`Using ${count} coin(s) of value ${coin.value}`)

        animations.push(() => {
          setCoins((currentCoins) => {
            return currentCoins.map((c) => ({
              ...c,
              selected: c.id === coin.id,
              count: c.id === coin.id ? count : c.count,
            }))
          })
        })

        for (let j = 0; j < count; j++) {
          selectedCoins.push({ ...coin, count: 1 })
        }
      } else {
        algorithmSteps.push(`Coin value ${coin.value} is too large for remaining amount ${remainingAmount}`)
      }

      if (remainingAmount === 0) {
        algorithmSteps.push(`Target amount reached! Total coins used: ${selectedCoins.length}`)
        break
      }
    }

    if (remainingAmount > 0) {
      algorithmSteps.push(`Cannot make exact change with the available coins. Remaining amount: ${remainingAmount}`)
    }

    // Final animation to show the result
    animations.push(() => {
      setResult({
        coins: selectedCoins,
        total: selectedCoins.length,
      })
    })

    setSteps(algorithmSteps)

    // Animate the steps
    let stepIndex = 0

    const animateStep = () => {
      if (stepIndex < animations.length) {
        animations[stepIndex]()
        setCurrentStep(stepIndex)
        stepIndex++
        setTimeout(animateStep, 1500)
      } else {
        setAnimating(false)
      }
    }

    animateStep()
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Operations Panel */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Greedy Algorithm - Coin Change</CardTitle>
            <CardDescription>
              Define coin denominations and find the minimum number of coins to make change
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Enter coin value"
                  value={coinValue}
                  onChange={(e) => setCoinValue(e.target.value)}
                  disabled={animating}
                />

                <Button onClick={handleAddCoin} disabled={animating}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Coin
                </Button>
              </div>

              {coins.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {/* Group coins by value and count them */}
                  {Object.entries(
                    coins.reduce((acc: Record<number, { count: number; ids: number[] }>, coin) => {
                      if (!acc[coin.value]) {
                        acc[coin.value] = { count: 0, ids: [] }
                      }
                      acc[coin.value].count++
                      acc[coin.value].ids.push(coin.id)
                      return acc
                    }, {}),
                  ).map(([value, { count, ids }]) => (
                    <div
                      key={`coin-${value}-${ids[0]}`}
                      className={`
                        flex items-center justify-between px-3 py-1 rounded-full border
                        ${coins.find((c) => c.id === ids[0])?.selected ? "bg-green-100 border-green-500 dark:bg-green-900 dark:border-green-500" : "bg-card border-primary"}
                        ${coins.find((c) => c.id === ids[0])?.isNew ? "animate-pulse border-green-500" : ""}
                      `}
                    >
                      <span className="mr-2">{value}</span>
                      {count > 1 && (
                        <span className="text-xs bg-blue-500 text-white rounded-full px-2 py-0.5">x{count}</span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 ml-1"
                        onClick={() => handleRemoveCoin(ids[0])}
                        disabled={animating}
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium mb-2">Target Amount</h3>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="Enter target amount"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    disabled={animating}
                  />

                  <Button
                    onClick={handleSolve}
                    disabled={animating || coins.length === 0 || !targetAmount}
                    variant="secondary"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Solve
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleClearCoins}
                disabled={animating || coins.length === 0}
                variant="outline"
                className="w-full"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Clear All
              </Button>

              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Algorithm Steps:</h3>
                <div className="bg-muted/30 rounded-md p-3 h-[200px] overflow-y-auto">
                  {steps.length > 0 ? (
                    <ol className="space-y-1 pl-5 list-decimal">
                      {steps.map((step, index) => (
                        <li
                          key={index}
                          className={`text-sm ${index <= currentStep ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          {step}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      1. Add coin denominations (e.g., 1, 5, 10, 25)
                      <br />
                      2. Enter a target amount
                      <br />
                      3. Click "Solve" to find the minimum number of coins
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learning</CardTitle>
            <CardDescription>Understanding Greedy Algorithms</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="mb-2">
              <strong>Greedy Algorithms</strong> make locally optimal choices at each step with the hope of finding a
              global optimum.
            </p>
            <p className="mb-2">
              <strong>Coin Change Problem:</strong> Given a set of coin denominations and a target amount, find the
              minimum number of coins needed to make that amount.
            </p>
            <p className="mb-2">
              <strong>Greedy Approach:</strong>
            </p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Sort the coins in descending order</li>
              <li>Start with the largest coin and use as many as possible</li>
              <li>Move to the next largest coin and repeat</li>
              <li>Continue until the target amount is reached</li>
            </ol>
            <p className="mt-2">
              <strong>Note:</strong> The greedy approach works for some coin systems (like US coins) but doesn't always
              produce the optimal solution for arbitrary coin denominations.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visualization Panel */}
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Visualization</CardTitle>
          <CardDescription>Visual representation of the coin change solution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[350px]">
            {!result ? (
              coins.length === 0 ? (
                <div className="text-muted-foreground">Add coins to start</div>
              ) : (
                <div className="flex flex-col items-center">
                  <Coins className="h-16 w-16 text-muted-foreground mb-4" />
                  <div className="text-center text-muted-foreground">
                    {animating ? "Solving..." : "Enter a target amount and click Solve"}
                  </div>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center">
                <div className="text-xl font-bold mb-6">
                  Solution: {result.total} coin{result.total !== 1 ? "s" : ""}
                </div>

                <div className="flex flex-wrap justify-center gap-2 max-w-md">
                  {result.coins.map((coin, index) => (
                    <div
                      key={`result-coin-${coin.value}-${index}`}
                      className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 border-2 border-green-500 dark:bg-green-900"
                    >
                      <span className="font-bold">{coin.value}</span>
                    </div>
                  ))}
                </div>

                {result.coins.length > 0 && (
                  <div className="mt-6 text-sm">
                    <span className="font-medium">Coin distribution: </span>
                    {Object.entries(
                      result.coins.reduce((acc: Record<number, number>, coin) => {
                        acc[coin.value] = (acc[coin.value] || 0) + 1
                        return acc
                      }, {}),
                    )
                      .sort((a, b) => Number(b[0]) - Number(a[0]))
                      .map(([value, count], index, arr) => (
                        <span key={`dist-${value}`}>
                          {count} x {value}
                          {index < arr.length - 1 ? ", " : ""}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

