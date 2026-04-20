"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash, Search } from "lucide-react"

interface QueueControllerProps {
  inputValue: string
  animating: boolean
  hasItems: boolean
  onInputChange: (value: string) => void
  onEnqueue: () => void
  onDequeue: () => void
  onPeek: () => void
}

export default function QueueController({
  inputValue,
  animating,
  hasItems,
  onInputChange,
  onEnqueue,
  onDequeue,
  onPeek,
}: QueueControllerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Queue Operations</CardTitle>
        <CardDescription>Enqueue, dequeue, or peek values in the queue</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              type="number"
              placeholder="Enter a value"
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onEnqueue()}
              disabled={animating}
            />

            <Button onClick={onEnqueue} disabled={animating}>
              <Plus className="mr-2 h-4 w-4" />
              Enqueue
            </Button>
          </div>

          <div className="flex space-x-2">
            <Button onClick={onDequeue} disabled={animating || !hasItems} variant="destructive">
              <Trash className="mr-2 h-4 w-4" />
              Dequeue
            </Button>

            <Button onClick={onPeek} disabled={animating || !hasItems} variant="secondary">
              <Search className="mr-2 h-4 w-4" />
              Peek
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
