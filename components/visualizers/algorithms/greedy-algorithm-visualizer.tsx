"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash, RotateCcw, Coins } from "lucide-react"
import AnimationControls from "@/components/ui/animation-controls"
import { useAnimationPlayer, type AnimationFrame } from "@/hooks/useAnimationPlayer"

type Coin = {
  id: number
  value: number
  selected?: boolean
  count?: number
  isNew?: boolean
}

type GreedyFrame = {
  coins: Coin[]
  result: { coins: Coin[]; total: number } | null
  stepDescription: string
}

export default function GreedyAlgorithmVisualizer() {
  const [coins, setCoins] = useState<Coin[]>([])
  const [coinValue, setCoinValue] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [steps, setSteps] = useState<string[]>([])
  const [nextId, setNextId] = useState(1)
  const [result, setResult] = useState<{ coins: Coin[]; total: number } | null>(null)

  const onFrameChange = useCallback((snapshot: GreedyFrame) => {
    setCoins(snapshot.coins)
    setResult(snapshot.result)
  }, [])

  const player = useAnimationPlayer<GreedyFrame>(onFrameChange)

  const handleAddCoin = () => {
    if (!coinValue || player.isPlaying) return
    const value = Number.parseInt(coinValue)
    if (!value || value <= 0) return
    if (value > 500) {
      alert("Please enter a value not greater than 500")
      return
    }
    const newCoin: Coin = { id: nextId, value, isNew: true }
    setCoins((prev) => [...prev, newCoin])
    setNextId((prev) => prev + 1)
    setTimeout(() => {
      setCoins((coins) => coins.map((c) => c.id === newCoin.id ? { ...c, isNew: false } : c))
    }, 1000)
    setCoinValue("")
  }

  const handleRemoveCoin = (id: number) => {
    if (player.isPlaying) return
    const coinToRemove = coins.find((c) => c.id === id)
    if (!coinToRemove) return
    setCoins(coins.filter((c) => c.value !== coinToRemove.value))
  }

  const handleClearCoins = () => {
    if (player.isPlaying) return
    setCoins([])
    setSteps([])
    setResult(null)
    player.clear()
  }

  const handleSolve = () => {
    if (!targetAmount || player.isPlaying || coins.length === 0) return
    const amount = Number.parseInt(targetAmount)
    if (!amount || amount <= 0) return

    setResult(null)
    const frames: AnimationFrame<GreedyFrame>[] = []
    const algorithmSteps: string[] = []

    const cleanCoins = coins.map((c) => ({ ...c, selected: false, count: 0 }))
    const sortedCoins = [...cleanCoins].sort((a, b) => b.value - a.value)

    algorithmSteps.push(`Starting Greedy Coin Change for amount: ${amount}`)
    algorithmSteps.push(`Available coins (sorted): ${sortedCoins.map((c) => c.value).join(", ")}`)

    frames.push({
      snapshot: { coins: cleanCoins, result: null, stepDescription: `Finding change for ${amount}` },
      description: `Finding change for ${amount}. Coins sorted: ${sortedCoins.map((c) => c.value).join(", ")}`,
    })

    let remainingAmount = amount
    const selectedCoins: Coin[] = []
    const coinCounts: Record<number, number> = {}

    for (let i = 0; i < sortedCoins.length; i++) {
      const coin = sortedCoins[i]

      // Highlight current coin being considered
      const considerDesc = `Considering coin with value ${coin.value} (remaining: ${remainingAmount})`
      algorithmSteps.push(considerDesc)

      const considerSnapshot = cleanCoins.map((c) => ({
        ...c,
        selected: c.id === coin.id,
        count: coinCounts[c.value] || 0,
      }))

      frames.push({
        snapshot: { coins: considerSnapshot, result: null, stepDescription: considerDesc },
        description: considerDesc,
      })

      if (coin.value <= remainingAmount) {
        const count = Math.floor(remainingAmount / coin.value)
        remainingAmount = remainingAmount % coin.value
        coinCounts[coin.value] = (coinCounts[coin.value] || 0) + count

        const useDesc = `Using ${count} × ${coin.value} = ${count * coin.value}. Remaining: ${remainingAmount}`
        algorithmSteps.push(useDesc)

        for (let j = 0; j < count; j++) selectedCoins.push({ ...coin, count: 1 })

        const useSnapshot = cleanCoins.map((c) => ({
          ...c,
          selected: c.id === coin.id,
          count: coinCounts[c.value] || 0,
        }))

        frames.push({
          snapshot: { coins: useSnapshot, result: null, stepDescription: useDesc },
          description: useDesc,
        })
      } else {
        const skipDesc = `${coin.value} is too large for remaining ${remainingAmount}, skip`
        algorithmSteps.push(skipDesc)
        frames.push({
          snapshot: { coins: considerSnapshot, result: null, stepDescription: skipDesc },
          description: skipDesc,
        })
      }

      if (remainingAmount === 0) {
        algorithmSteps.push(`Done! Used ${selectedCoins.length} coin(s) total`)
        break
      }
    }

    if (remainingAmount > 0) {
      algorithmSteps.push(`Cannot make exact change. Remaining: ${remainingAmount}`)
    }

    const finalResult = { coins: selectedCoins, total: selectedCoins.length }
    const finalCoins = cleanCoins.map((c) => ({
      ...c,
      selected: selectedCoins.some((sc) => sc.value === c.value),
      count: coinCounts[c.value] || 0,
    }))

    algorithmSteps.push(remainingAmount === 0
      ? `Solution: ${selectedCoins.length} coin(s) needed`
      : `No exact solution found`)

    frames.push({
      snapshot: { coins: finalCoins, result: finalResult, stepDescription: "Complete!" },
      description: remainingAmount === 0 ? `Done! ${selectedCoins.length} coin(s) used` : "No exact solution",
    })

    setSteps(algorithmSteps)
    player.loadFrames(frames)
    player.play()
  }

  const visibleStepIndex = player.currentFrame

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Greedy Algorithm — Coin Change</CardTitle>
            <CardDescription>Define coin denominations and find the minimum number of coins to make change</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Enter coin value"
                  value={coinValue}
                  onChange={(e) => setCoinValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCoin()}
                  disabled={player.isPlaying}
                />
                <Button onClick={handleAddCoin} disabled={player.isPlaying}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Coin
                </Button>
              </div>

              {coins.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(
                    coins.reduce((acc: Record<number, { count: number; ids: number[] }>, coin) => {
                      if (!acc[coin.value]) acc[coin.value] = { count: 0, ids: [] }
                      acc[coin.value].count++
                      acc[coin.value].ids.push(coin.id)
                      return acc
                    }, {})
                  ).map(([value, { count, ids }]) => (
                    <div
                      key={`coin-${value}-${ids[0]}`}
                      className={`flex items-center justify-between px-3 py-1 rounded-full border
                        ${coins.find((c) => c.id === ids[0])?.selected ? "bg-green-100 border-green-500 dark:bg-green-900" : "bg-card border-primary"}
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
                        disabled={player.isPlaying}
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
                    onKeyDown={(e) => e.key === "Enter" && handleSolve()}
                    disabled={player.isPlaying}
                  />
                  <Button onClick={handleSolve} disabled={player.isPlaying || coins.length === 0 || !targetAmount} variant="secondary">
                    Solve
                  </Button>
                </div>
              </div>

              <Button onClick={handleClearCoins} disabled={player.isPlaying || coins.length === 0} variant="outline" className="w-full">
                <RotateCcw className="mr-2 h-4 w-4" />
                Clear All
              </Button>

              {player.totalFrames > 0 && (
                <AnimationControls
                  currentFrame={player.currentFrame}
                  totalFrames={player.totalFrames}
                  isPlaying={player.isPlaying}
                  isPaused={player.isPaused}
                  isComplete={player.isComplete}
                  speed={player.speed}
                  onPlay={player.play}
                  onPause={player.pause}
                  onStepForward={player.stepForward}
                  onStepBackward={player.stepBackward}
                  onReset={() => { player.reset(); setResult(null); setCoins(coins.map((c) => ({ ...c, selected: false, count: 0 }))) }}
                  onSpeedChange={player.setSpeed}
                  onFrameChange={player.goToFrame}
                />
              )}

              <div>
                <h3 className="text-sm font-medium mb-2">Algorithm Steps:</h3>
                <div className="bg-muted/30 rounded-md p-3 h-[200px] overflow-y-auto">
                  {steps.length > 0 ? (
                    <ol className="space-y-1 pl-5 list-decimal">
                      {steps.map((step, index) => (
                        <li
                          key={index}
                          className={`text-sm transition-colors ${index <= visibleStepIndex ? "text-foreground" : "text-muted-foreground"}`}
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
                      3. Click &quot;Solve&quot; to find the minimum number of coins
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
            <p className="mb-2"><strong>Greedy Approach:</strong></p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Sort the coins in descending order</li>
              <li>Start with the largest coin and use as many as possible</li>
              <li>Move to the next largest coin and repeat</li>
              <li>Continue until the target amount is reached</li>
            </ol>
            <p className="mt-2">
              <strong>Note:</strong> The greedy approach works for some coin systems (like US coins) but doesn&apos;t
              always produce the optimal solution for arbitrary coin denominations.
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
            {player.currentDescription && (
              <div className="mb-4 text-center text-sm font-medium text-primary">
                {player.currentDescription}
              </div>
            )}
            {!result ? (
              coins.length === 0 ? (
                <div className="text-muted-foreground">Add coins to start</div>
              ) : (
                <div className="flex flex-col items-center">
                  <Coins className="h-16 w-16 text-muted-foreground mb-4" />
                  <div className="text-center text-muted-foreground">
                    {player.isPlaying ? "Solving..." : "Enter a target amount and click Solve"}
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
                      }, {})
                    )
                      .sort((a, b) => Number(b[0]) - Number(a[0]))
                      .map(([value, count], index, arr) => (
                        <span key={`dist-${value}`}>
                          {count} × {value}{index < arr.length - 1 ? ", " : ""}
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
