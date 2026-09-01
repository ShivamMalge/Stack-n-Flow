"use client"

import { ArrowLeft, ArrowRight, ArrowUp } from "lucide-react"
import { resolveState, STATE_BOX } from "@/lib/visualizer-states"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Drawing for a linked list, shared by all three variants.
 *
 * The singly, doubly and circular lists were three copies of the same node row,
 * differing only in the connector drawn between nodes and, for the circular one,
 * the wrap back to the head. They had drifted in the way copies do: only the
 * singly list shortened an id, so a notebook's 8-character uuids printed in full
 * under the other two and pushed the nodes apart.
 *
 * Extracted so the web app and the notebook widget share one source. The
 * notebook previously mounted the whole visualizer, which brought its inputs,
 * tabs and buttons along — controls that do nothing there because Python drives
 * the state.
 */

export type LinkedListRendererNode = {
    // Widened from number: Python generates 8-character UUID string ids and can
    // send non-numeric values.
    id: string | number
    value: string | number
    highlighted?: boolean
    isNew?: boolean
    isDeleting?: boolean
}

export type LinkedListVariant = "singly" | "doubly" | "circular"

interface LinkedListRendererProps {
    nodes: LinkedListRendererNode[]
    /** Decides the connector between nodes and whether the wrap is drawn. */
    variant?: LinkedListVariant
    /** Embedded on /learn: drops the card chrome. */
    mini?: boolean
    searchResult?: string | null
    title?: string
    description?: string
    emptyLabel?: string
}

const DESCRIPTIONS: Record<LinkedListVariant, string> = {
    singly: "Visual representation of the linked list",
    doubly: "Visual representation of the doubly linked list",
    circular: "Visual representation of the circular linked list",
}

const EMPTY_LABELS: Record<LinkedListVariant, string> = {
    singly: "Empty linked list",
    doubly: "Empty doubly linked list",
    circular: "Empty circular linked list",
}

/**
 * The web app numbers nodes 1, 2, 3; Python sends 8-character UUIDs, which
 * truncate into something that tells the reader nothing. Show the id only when
 * it is short enough to be a label.
 */
function shortId(id: string | number): string | null {
    const text = String(id)
    return text.length <= 4 ? text : null
}

export default function LinkedListRenderer({
    nodes,
    variant = "singly",
    mini = false,
    searchResult = null,
    title = "Visualization",
    description,
    emptyLabel,
}: LinkedListRendererProps) {
    return (
        <Card className="flex flex-col h-full border-0 md:border md:shadow-sm">
            {!mini && (
                <CardHeader className="shrink-0">
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description ?? DESCRIPTIONS[variant]}</CardDescription>
                </CardHeader>
            )}

            <CardContent className={mini ? "p-0" : ""}>
                <div className="flex flex-1 justify-center overflow-auto py-8 bg-muted/5 border-t min-h-[250px] max-h-[60vh]">
                    {nodes.length === 0 ? (
                        <div className="m-auto text-muted-foreground text-sm">
                            {emptyLabel ?? EMPTY_LABELS[variant]}
                        </div>
                    ) : (
                        // Sized to the node row, not to the plate, so the wrap
                        // bracket below can match its exact width.
                        <div className="m-auto flex max-w-full flex-col items-center px-4">
                            <div className="flex flex-wrap items-center justify-center gap-y-8 gap-x-2">
                                {nodes.map((node, index) => {
                                    const label = shortId(node.id)
                                    return (
                                        <div key={node.id} className="flex items-center">
                                            <div
                                                className={`
                          flex flex-col items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full border-2
                          transition-all duration-500 ease-in-out shadow-sm
                          ${STATE_BOX[resolveState({ removed: node.isDeleting, comparing: node.highlighted, inserted: node.isNew })]}
                          ${node.isNew ? "scale-110" : ""}
                          ${node.isDeleting ? "scale-75 opacity-50" : ""}
                        `}
                                            >
                                                <div className="text-base md:text-lg font-bold">{node.value}</div>
                                                {label && (
                                                    <div className="text-xs text-muted-foreground font-mono">id: {label}</div>
                                                )}
                                            </div>

                                            {index < nodes.length - 1 && (
                                                <div className="flex items-center px-1 text-muted-foreground">
                                                    {variant === "doubly" && <ArrowLeft className="h-3 w-3" />}
                                                    <ArrowRight className={variant === "doubly" ? "h-3 w-3" : "h-4 w-4"} />
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            {/*
                              The wrap back to the head, drawn as one bracket under
                              the row.

                              It used to be three absolutely-positioned dashed divs
                              pinned to a fixed `max-w-md` container, so on any row
                              that did not happen to be that wide the two risers and
                              the rail met nothing and the whole thing read as
                              stray lines. A single bordered box cannot come apart,
                              and it spans whatever the row actually is.
                            */}
                            {variant === "circular" && nodes.length > 1 && (
                                <div className="relative mt-6 w-full">
                                    <div className="h-6 rounded-b-xl border-x-2 border-b-2 border-dashed border-primary/40" />
                                    {/* Left edge of the bracket is the head's column, so the
                                        arrow sits under the head node's centre: half a node
                                        in, at each breakpoint's node width. */}
                                    <ArrowUp className="absolute -top-1.5 left-7 h-3 w-3 -translate-x-1/2 text-primary/60 md:left-8" />
                                    <p className="mt-1 text-center text-[10px] font-semibold uppercase tracking-widest text-primary/60">
                                        Tail links back to head
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {!mini && searchResult && (
                    <div
                        className={`mt-4 p-2 rounded text-center ${searchResult === "Element found"
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
