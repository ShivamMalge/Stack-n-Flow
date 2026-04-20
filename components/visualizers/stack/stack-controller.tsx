"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash, Search } from "lucide-react"

interface StackControllerProps {
  inputValue: string
  animating: boolean
  hasItems: boolean
  onInputChange: (value: string) => void
  onPush: () => void
  onPop: () => void
  onPeek: () => void
}

export default function StackController({
  inputValue,
  animating,
  hasItems,
  onInputChange,
  onPush,
  onPop,
  onPeek,
}: StackControllerProps) {
  return (
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
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onPush()}
              disabled={animating}
            />

            <Button onClick={onPush} disabled={animating}>
              <Plus className="mr-2 h-4 w-4" />
              Push
            </Button>
          </div>

          <div className="flex space-x-2">
            <Button onClick={onPop} disabled={animating || !hasItems} variant="destructive">
              <Trash className="mr-2 h-4 w-4" />
              Pop
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
