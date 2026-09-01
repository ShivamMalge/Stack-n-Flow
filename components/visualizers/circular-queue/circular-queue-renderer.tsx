"use client"

import { RotateCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { resolveState, STATE_BOX } from "@/lib/visualizer-states"

/**
 * Drawing for a circular queue: the fixed array, with front and rear marked.
 *
 * Extracted so the web app and the notebook widget share one source. The cells
 * used to carry their own hand-written colours — `bg-yellow-100 border-yellow-500`
 * where every other structure resolves through lib/visualizer-states — so a
 * highlighted slot here was a different yellow from a highlighted slot two
 * visualizers over.
 */

export type CircularQueueSlot = {
    /** -1 is the empty marker the controller fills unused slots with. */
    id: string | number
    value: string | number
    highlighted?: boolean
    isNew?: boolean
    isDequeuing?: boolean
}

interface CircularQueueRendererProps {
    slots: (CircularQueueSlot | undefined)[]
    /** Index of the first element; ignored while the queue is empty. */
    front?: number
    /** Index of the last element; ignored while the queue is empty. */
    rear?: number
    /** How many slots are occupied. */
    size?: number
    /** Defaults to however many slots were passed. */
    capacity?: number
    mini?: boolean
    title?: string
    emptyLabel?: string
}

/** Python sends 8-character uuids, which say nothing once truncated. */
function shortId(id: string | number): string | null {
    const text = String(id)
    return text.length <= 4 ? text : null
}

export default function CircularQueueRenderer({
    slots,
    front = -1,
    rear = -1,
    size = slots.filter((slot) => slot && slot.id !== -1).length,
    capacity,
    mini = false,
    title = "Visualization",
    emptyLabel = "Empty circular queue",
}: CircularQueueRendererProps) {
    const cells = capacity ?? slots.length

    return (
        <Card className="h-full border-0 md:border">
            {!mini && (
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>Visual representation of the circular queue</CardDescription>
                </CardHeader>
            )}

            <CardContent className={mini ? "p-0" : ""}>
                <div className="flex flex-1 justify-center overflow-auto py-12 bg-muted/5 border-t min-h-[300px] max-h-[60vh]">
                    {cells === 0 ? (
                        <div className="m-auto text-muted-foreground text-sm">{emptyLabel}</div>
                    ) : (
                        <div className="m-auto flex w-full max-w-4xl flex-col items-center px-4">
                            <div className="flex items-center gap-2 mb-6">
                                <RotateCw className="h-5 w-5 text-primary/60" />
                                <span className="text-xs uppercase font-bold text-muted-foreground tracking-widest">
                                    Fixed Size Array ({cells})
                                </span>
                            </div>

                            <div className="flex flex-wrap justify-center gap-y-14 gap-x-2 md:gap-x-4">
                                {Array.from({ length: cells }, (_, index) => {
                                    const item = slots[index]
                                    const isEmpty = !item || item.id === -1
                                    const isFront = index === front && size > 0
                                    const isRear = index === rear && size > 0
                                    const label = item ? shortId(item.id) : null

                                    return (
                                        <div key={index} className="relative group">
                                            <div
                                                className={`
                          flex flex-col items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-md border-2 shadow-sm
                          transition-all duration-500 ease-in-out
                          ${isEmpty
                                                        ? "bg-muted/10 border-dashed border-muted-foreground/40"
                                                        : STATE_BOX[resolveState({
                                                            comparing: item?.highlighted,
                                                            inserted: item?.isNew,
                                                            removed: item?.isDequeuing,
                                                        })]
                                                    }
                          ${item?.isNew ? "scale-105" : ""}
                          ${item?.isDequeuing ? "-translate-y-8 opacity-0 scale-75" : ""}
                        `}
                                            >
                                                {!isEmpty && (
                                                    <>
                                                        <div className="text-base md:text-lg font-bold">{item!.value}</div>
                                                        {label && <div className="text-[9px] text-muted-foreground">id:{label}</div>}
                                                    </>
                                                )}
                                            </div>

                                            {isFront && (
                                                <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                                                    <span className="text-[9px] font-bold text-blue-500 uppercase">Front</span>
                                                    <div className="w-1 h-3 bg-blue-500/40 rounded-full mt-0.5"></div>
                                                </div>
                                            )}

                                            {isRear && (
                                                <div className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                                                    <div className="w-1 h-3 bg-red-500/40 rounded-full mb-0.5"></div>
                                                    <span className="text-[9px] font-bold text-red-500 uppercase">Rear</span>
                                                </div>
                                            )}

                                            <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
                                                <div className="text-xs font-mono text-muted-foreground opacity-50">[{index}]</div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
