"use client"

import { ArrowUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export type StackRendererItem = {
  // Widened from number: Python generates 8-char UUID string ids and can send
  // non-numeric values (the Colab demo enqueues strings).
  id: string | number
  value: string | number
  highlighted?: boolean
  isNew?: boolean
  isPopping?: boolean
}

interface StackRendererProps {
  items: StackRendererItem[]
  mini?: boolean
  searchResult?: string | null
}

export default function StackRenderer({
  items,
  mini = false,
  searchResult = null,
}: StackRendererProps) {
  return (
    <Card className="flex flex-col h-full border-0 md:border md:shadow-sm">
      {!mini && (
        <CardHeader className="shrink-0">
          <CardTitle>Visualization</CardTitle>
          <CardDescription>Visual representation of the stack</CardDescription>
        </CardHeader>
      )}
      <CardContent className={`flex flex-col flex-1 min-h-0 ${mini ? "p-0" : "pb-4"}`}>
        {/*
          Grows to fill the card instead of a fixed height: the panel is taller
          than the plate area, so a fixed height made the stack scroll while the
          space below it stayed empty. `m-auto` on the inner column centres small
          stacks without clipping the top of tall ones the way `items-center`
          does once the content overflows.
        */}
        <div className="flex flex-1 min-h-[250px] max-h-[60vh] justify-center overflow-auto pt-10 pb-6 bg-muted/5 border-t">
          {items.length === 0 ? (
            <div className="m-auto text-muted-foreground text-sm">Empty stack</div>
          ) : (
            <div className="m-auto flex flex-col items-center space-y-2 w-full max-w-[280px] md:max-w-xs px-4">
              {items.map((item, index) => (
                <div key={item.id} className="relative w-full">
                  {index === 0 && (
                    <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                      <ArrowUp className="h-4 w-4 text-muted-foreground animate-bounce" />
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                        Top
                      </span>
                    </div>
                  )}
                  <div
                    className={`
                      flex items-center justify-center h-10 md:h-12 w-full border-2 rounded-md shadow-sm
                      transition-all duration-500 ease-in-out
                      ${item.highlighted ? "bg-yellow-100 dark:bg-yellow-900 border-yellow-500" : "bg-card border-primary"}
                      ${item.isNew ? "scale-105 border-green-500" : ""}
                      ${item.isPopping ? "translate-x-full opacity-0 rotate-12" : ""}
                    `}
                  >
                    <div className="text-base md:text-lg font-bold">{item.value}</div>
                  </div>
                </div>
              ))}
              <div className="mt-2 border-t-4 border-primary/30 w-full rounded-full"></div>
            </div>
          )}
        </div>
        {searchResult && (
          <div className="shrink-0 mt-4 p-2 rounded text-center bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
            {searchResult}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
