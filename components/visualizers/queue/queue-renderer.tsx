"use client"

import { ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export type QueueRendererItem = {
  id: number
  value: number
  highlighted?: boolean
  isNew?: boolean
  isDequeuing?: boolean
}

interface QueueRendererProps {
  items: QueueRendererItem[]
  searchResult?: string | null
}

export default function QueueRenderer({
  items,
  searchResult = null,
}: QueueRendererProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Visualization</CardTitle>
        <CardDescription>Visual representation of the queue</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center overflow-auto py-10 bg-muted/5 border-t min-h-[250px] md:h-[300px]">
          {items.length === 0 ? (
            <div className="text-muted-foreground text-sm">Empty queue</div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-y-10 gap-x-2 px-4 max-w-full">
              <div className="flex flex-col items-center mr-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Front</span>
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>

              {items.map((item, index) => (
                <div key={item.id} className="flex items-center">
                  <div
                    className={`
                      flex flex-col items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-md border-2 shadow-sm
                      transition-all duration-500 ease-in-out
                      ${item.highlighted ? "bg-yellow-100 dark:bg-yellow-900 border-yellow-500" : "bg-card border-primary"}
                      ${item.isNew ? "scale-105 border-green-500" : ""}
                      ${item.isDequeuing ? "-translate-y-full opacity-0" : ""}
                    `}
                  >
                    <div className="text-base md:text-lg font-bold">{item.value}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">id: {item.id}</div>
                  </div>

                  {index < items.length - 1 && (
                    <div className="px-1 text-muted-foreground/30">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              <div className="flex flex-col items-center ml-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Rear</span>
                <ArrowRight className="h-4 w-4 text-primary rotate-180" />
              </div>
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
