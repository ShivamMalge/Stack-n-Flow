"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { STATE_BOX, swatchFor } from "@/lib/visualizer-states"

/**
 * Drawing for binary search: the array cells, with the live range, the midpoint
 * and the target marked.
 *
 * Extracted so the web app and the notebook widget share one source. The
 * notebook previously mounted the whole visualizer, which brought the array
 * builder, the search box and the animation transport with it — controls that do
 * nothing there because Python drives the state.
 */

export type BinarySearchCell = {
    id?: string | number
    value: string | number
    /** Inside the live search range. */
    highlighted?: boolean
    isTarget?: boolean
    isMid?: boolean
    isLow?: boolean
    isHigh?: boolean
}

interface BinarySearchRendererProps {
    array: BinarySearchCell[]
    /** Narration for the frame currently on screen. */
    description?: string | null
    searchResult?: string | null
    mini?: boolean
    title?: string
    emptyLabel?: string
}

const LEGEND = [
    ["comparing", "Search Range"],
    ["pivot", "Middle Element"],
    ["visited", "Target Value"],
] as const

export default function BinarySearchRenderer({
    array,
    description = null,
    searchResult = null,
    mini = false,
    title = "Visualization",
    emptyLabel = "Add elements to create an array",
}: BinarySearchRendererProps) {
    return (
        <Card className={mini ? "w-full border-0 md:border md:shadow-sm" : "h-full"}>
            {!mini && (
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>Visual representation of binary search</CardDescription>
                </CardHeader>
            )}

            <CardContent className={mini ? "p-0 pt-4" : ""}>
                <div className="flex items-center justify-center overflow-x-auto py-8 md:py-12 min-h-[200px] md:h-[300px]">
                    {array.length === 0 ? (
                        <div className="text-muted-foreground text-sm">{emptyLabel}</div>
                    ) : (
                        <div className="flex flex-col w-full max-w-full overflow-x-auto pb-4 px-2">
                            <div className="flex justify-center min-w-max mx-auto">
                                {array.map((item, index) => (
                                    <div key={item.id ?? index} className="flex flex-col items-center mx-0.5 md:mx-1">
                                        {/* Local flags mapped onto the shared vocabulary: the live
                                            search range is `comparing` (it was blue here, amber
                                            everywhere else), the midpoint is `pivot`, and the target
                                            borrows `visited` — the cell the search exists to find, so
                                            it outranks the range it sits in. One class is emitted
                                            instead of a stack, so the winner is intent rather than
                                            whichever colour Tailwind happened to emit last.
                                            isLow/isHigh stay local: they are range pointers drawn as
                                            an edge, not a state the cell is in. */}
                                        <div
                                            className={`
                        flex items-center justify-center w-10 h-10 md:w-12 md:h-12 border-2
                        transition-all duration-300 ease-in-out rounded-md
                        ${STATE_BOX[item.isTarget ? "visited" : item.isMid ? "pivot" : item.highlighted ? "comparing" : "default"]}
                        ${item.isLow ? "border-l-4 border-l-green-500" : ""}
                        ${item.isHigh ? "border-r-4 border-r-green-500" : ""}
                      `}
                                        >
                                            <div className="text-xs md:text-sm font-bold">{item.value}</div>
                                        </div>
                                        <div className="mt-1 md:mt-2 text-xs text-muted-foreground">{index}</div>
                                    </div>
                                ))}
                            </div>

                            {description && (
                                <div className="mt-4 text-center text-sm font-medium text-primary">{description}</div>
                            )}

                            {searchResult && (
                                <div className="mt-2 text-center text-sm text-muted-foreground">{searchResult}</div>
                            )}

                            {/* Swatches come from the shared map, so the legend cannot drift
                                from the cells it describes; the wording stays domain-specific. */}
                            <div className="flex flex-wrap justify-center mt-8 gap-x-4 gap-y-2">
                                {LEGEND.map(([state, label]) => (
                                    <div key={label} className="flex items-center">
                                        <div className={`w-4 h-4 rounded-sm mr-2 ${swatchFor(state, "box")}`} />
                                        <span className="text-xs">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
