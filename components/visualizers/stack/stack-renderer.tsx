"use client"

import { ArrowUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export type StackRendererItem = {
  id: number
  value: number
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
    <Card className="h-full border-0 md:border md:shadow-sm">
      {!mini && (
        <CardHeader>
          <CardTitle>Visualization</CardTitle>
          <CardDescription>Visual representation of the stack</CardDescription>
        </CardHeader>
      )}
      <CardContent className={mini ? "p-0" : ""}>
        <div className="flex items-center justify-center overflow-auto py-8 bg-muted/5 border-t min-h-[250px] md:h-[300px]">
          {items.length === 0 ? (
            <div className="text-muted-foreground text-sm">Empty stack</div>
          ) : (
            <div className="flex flex-col items-center space-y-2 w-full max-w-[280px] md:max-w-xs px-4">
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
          <div className="mt-4 p-2 rounded text-center bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
            {searchResult}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
