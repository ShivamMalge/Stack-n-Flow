"use client"

import { resolveState, STATE_BOX } from "@/lib/visualizer-states"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Pure drawing for an array.
 *
 * Extracted so the web app and the notebook widget share one rendering source
 * rather than two that drift. See linked-list-renderer.tsx for why: in a
 * notebook the full visualizer's inputs and tabs do nothing, because Python
 * drives the state.
 */

export type ArrayRendererItem = {
    // Widened from number: Python generates string ids and can send
    // non-numeric values.
    id: string | number
    value: string | number
    highlighted?: boolean
    isNew?: boolean
    isDeleting?: boolean
}

interface ArrayRendererProps {
    items: ArrayRendererItem[]
    /** Embedded on /learn: drops the card chrome. */
    mini?: boolean
    searchResult?: string | null
    /** Wording differs between the array-shaped structures. */
    title?: string
    description?: string
    emptyLabel?: string
}

/*
  Cells shrink as the array grows, the same way the stack's plates do.

  The row wraps, so this is less urgent than it was for the stack — but a
  notebook can hand us fifty elements in one call where the web app builds up
  one insert at a time, and at a fixed 64px those wrap into more rows than the
  `max-h-[60vh]` scroller shows at once.
*/
function cellSize(count: number): string {
    if (count <= 12) return "w-14 h-14 md:w-16 md:h-16"
    if (count <= 24) return "w-11 h-11 md:w-12 md:h-12"
    return "w-9 h-9 md:w-10 md:h-10"
}

function cellText(count: number): string {
    if (count <= 12) return "text-base md:text-lg"
    if (count <= 24) return "text-sm md:text-base"
    return "text-xs"
}

export default function ArrayRenderer({
    items,
    mini = false,
    searchResult = null,
    title = "Visualization",
    description = "Visual representation of the array",
    emptyLabel = "Empty array",
}: ArrayRendererProps) {
    const size = cellSize(items.length)
    const text = cellText(items.length)

    return (
        <Card className="flex flex-col h-full border-0 md:border md:shadow-sm">
            {!mini && (
                <CardHeader className="shrink-0">
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
            )}

            <CardContent className={mini ? "p-0" : ""}>
                <div className="flex flex-1 justify-center overflow-auto py-10 bg-muted/5 border-t min-h-[300px] max-h-[60vh]">
                    {items.length === 0 ? (
                        <div className="m-auto text-muted-foreground text-sm">{emptyLabel}</div>
                    ) : (
                        <div className="m-auto flex flex-wrap items-center justify-center gap-y-12 gap-x-2 px-4 max-w-full">
                            {items.map((item, index) => (
                                <div key={item.id} className="flex flex-col items-center group">
                                    <div
                                        className={`
                                            flex items-center justify-center border-2 shadow-sm ${size}
                                            transition-all duration-500 ease-in-out
                                            ${STATE_BOX[resolveState({ removed: item.isDeleting, comparing: item.highlighted, inserted: item.isNew })]}
                                            ${item.isNew ? "scale-105" : ""}
                                            ${item.isDeleting ? "scale-75 opacity-0 -translate-y-8" : ""}
                                        `}
                                    >
                                        <div className={`font-bold ${text}`}>{item.value}</div>
                                    </div>
                                    {/*
                                      The index is the point of an array, so it is
                                      the position that is labelled, not the id.
                                    */}
                                    <div className="mt-2 text-xs font-mono text-muted-foreground group-hover:text-primary transition-colors">
                                        [{index}]
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/*
                  The web visualizer reports the search result beside its own
                  controls. The notebook has no controls, so the result has to be
                  able to appear here or Python's search says nothing.
                */}
                {!mini && searchResult && (
                    <div
                        className={`mt-4 p-2 rounded text-center ${searchResult.includes("found at index")
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                            }`}
                    >
                        {searchResult}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
