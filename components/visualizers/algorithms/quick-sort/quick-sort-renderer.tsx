"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { STATE_BAR, STATE_LABEL, swatchFor } from "@/lib/visualizer-states"

/**
 * Drawing for quick sort: the bar chart, with the pivot, the comparison and the
 * settled tail marked.
 *
 * Extracted so the web app and the notebook widget share one source. The
 * notebook previously mounted the whole visualizer, which brought the array
 * builder and the animation transport with it — controls that do nothing there
 * because Python drives the state.
 */

export type QuickSortBar = {
    id?: string | number
    value: number
    highlighted?: boolean
    isPivot?: boolean
    isSorted?: boolean
    isSwapping?: boolean
}

interface QuickSortRendererProps {
    array: QuickSortBar[]
    /** Narration for the frame currently on screen. */
    description?: string | null
    mini?: boolean
    title?: string
    emptyLabel?: string
}

/*
  Tallest bar allowed, in pixels. The plate is 240px tall on mobile with 32px of
  top padding, and each column also carries a ~24px index label under the bar,
  which leaves ~184px for the bar itself. An earlier cap of 260px clipped any
  value >= 94 against the top edge of the card.
*/
export const MAX_BAR_HEIGHT = 180

/** Shortest a bar may be, so the smallest value is still a bar. */
const BAR_FLOOR = 20

const LEGEND = [
    ["pivot", STATE_LABEL.pivot],
    ["comparing", STATE_LABEL.comparing],
    ["swapping", STATE_LABEL.swapping],
    // "Sorted" is the domain word for `visited` here.
    ["visited", "Sorted"],
] as const

/**
 * Scaled so the tallest value fills the plate rather than assuming values are
 * roughly 0-80. `value * 2 + 20` capped at 180 flattened any array of large
 * numbers into a row of identical full-height bars — every value at or above 80
 * drew the same, which is the one thing a bar chart must not do.
 */
export function barHeight(value: number, max: number): number {
    if (!Number.isFinite(value)) return BAR_FLOOR
    const ceiling = Number.isFinite(max) && max > 0 ? max : 1
    // Clamped rather than trusted: the caller passes the array's own maximum,
    // but a value above it would otherwise run out through the top of the card
    // exactly the way the old fixed cap let large values do.
    const fraction = Math.min(Math.max(value, 0) / ceiling, 1)
    return BAR_FLOOR + fraction * (MAX_BAR_HEIGHT - BAR_FLOOR)
}

export default function QuickSortRenderer({
    array,
    description = null,
    mini = false,
    title = "Visualization",
    emptyLabel = "Add elements to create an array",
}: QuickSortRendererProps) {
    const tallest = array.reduce((max, item) => Math.max(max, Number(item.value) || 0), 0)

    return (
        <Card className={mini ? "w-full border-0 md:border md:shadow-sm" : "h-full"}>
            {!mini && (
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>Visual representation of Quick Sort</CardDescription>
                </CardHeader>
            )}

            <CardContent className={mini ? "p-0 pt-4" : ""}>
                <div className="flex items-end justify-center h-[240px] md:h-[300px] pt-8 px-2 overflow-x-hidden">
                    {array.length === 0 ? (
                        <div className="text-muted-foreground">{emptyLabel}</div>
                    ) : (
                        array.map((item, index) => (
                            // Local flags mapped onto the shared vocabulary:
                            // highlighted → comparing (it was blue here, amber
                            // everywhere else), isSwapping → swapping, isPivot →
                            // pivot, and isSorted → visited, since a bar in its final
                            // position is one the algorithm is finished with. One
                            // class is emitted instead of a stack, so the winner is
                            // intent rather than whichever colour Tailwind happened
                            // to emit last.
                            <div
                                key={`bar-${item.id ?? index}-${index}`}
                                className="flex flex-col items-center flex-1 max-w-[40px] mx-0.5"
                            >
                                <div
                                    style={{ height: `${barHeight(Number(item.value), tallest)}px` }}
                                    className={`
                    w-full max-h-full rounded-t-sm md:rounded-t-md transition-all duration-300 ease-in-out flex items-end justify-center pb-1
                    ${STATE_BAR[item.isSwapping ? "swapping" : item.isPivot ? "pivot" : item.highlighted ? "comparing" : item.isSorted ? "visited" : "default"]}
                  `}
                                >
                                    <span className="text-xs font-medium text-white">{item.value}</span>
                                </div>
                                <div className="mt-2 text-xs">{index}</div>
                            </div>
                        ))
                    )}
                </div>

                {description && (
                    <div className="mt-3 text-center text-sm font-medium text-primary">{description}</div>
                )}

                {/* Swatches and wording come from the shared maps, so the legend cannot
                    drift from the bars it describes. */}
                <div className="flex flex-wrap justify-center mt-4 gap-x-4 gap-y-2">
                    {LEGEND.map(([state, label]) => (
                        <div key={label} className="flex items-center">
                            <div className={`w-4 h-4 rounded-sm mr-2 ${swatchFor(state, "bar")}`} />
                            <span className="text-xs">{label}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
