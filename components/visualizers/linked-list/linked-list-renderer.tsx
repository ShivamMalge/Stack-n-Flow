"use client"

import { ArrowRight } from "lucide-react"
import { resolveState, STATE_BOX } from "@/lib/visualizer-states"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Pure drawing for a singly linked list.
 *
 * Extracted so the web app and the notebook widget share one rendering source
 * rather than two that drift. The notebook previously mounted the whole
 * visualizer, which brought its inputs, tabs and buttons along — controls that
 * do nothing there because Python drives the state.
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

interface LinkedListRendererProps {
    nodes: LinkedListRendererNode[]
    /** Embedded on /learn: drops the card chrome. */
    mini?: boolean
    searchResult?: string | null
    /** Wording differs between the list variants. */
    title?: string
    description?: string
    emptyLabel?: string
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
    mini = false,
    searchResult = null,
    title = "Visualization",
    description = "Visual representation of the linked list",
    emptyLabel = "Empty linked list",
}: LinkedListRendererProps) {
    return (
        <Card className="flex flex-col h-full border-0 md:border md:shadow-sm">
            {!mini && (
                <CardHeader className="shrink-0">
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
            )}

            <CardContent className={mini ? "p-0" : ""}>
                <div className="flex flex-1 justify-center overflow-auto py-8 bg-muted/5 border-t min-h-[250px] max-h-[60vh]">
                    {nodes.length === 0 ? (
                        <div className="m-auto text-muted-foreground text-sm">{emptyLabel}</div>
                    ) : (
                        <div className="m-auto flex flex-wrap items-center justify-center gap-y-8 gap-x-2 px-4 max-w-full">
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
                                            <div className="flex items-center px-1">
                                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
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
