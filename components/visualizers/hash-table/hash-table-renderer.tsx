"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { STATE_BOX, type VisualizerState } from "@/lib/visualizer-states"
import type { HashSlot } from "@/lib/hashing"

/**
 * Drawing for a hash table's bucket array.
 *
 * Everything that decides *what* is in a slot — the strategy, the hash
 * function, the probe sequence — stays in the controller. This only draws the
 * slots it is handed, so the web app and the notebook widget cannot drift.
 */

interface HashTableRendererProps {
    slots: HashSlot[]
    /** Home bucket for the key being worked on; -1 or null when there is none. */
    home?: number | null
    /** The hash working shown above the table, e.g. "h(key) = key mod 10". */
    caption?: string | null
    /** Narration for the frame currently on screen. */
    description?: string | null
    title?: string
    subtitle?: string
    emptyLabel?: string
}

const LEGEND: [VisualizerState, string][] = [
    ["default", "Free"],
    ["comparing", "Probing"],
    ["inserted", "Placed"],
    ["warning", "Collision"],
    ["removed", "Deleted"],
]

export default function HashTableRenderer({
    slots,
    home = null,
    caption = null,
    description = null,
    title = "Bucket Array",
    subtitle = "Driven from the notebook",
    emptyLabel = "Empty table",
}: HashTableRendererProps) {
    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="shrink-0">
                <CardTitle>{title}</CardTitle>
                <CardDescription>{subtitle}</CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col flex-1 min-h-0 gap-3 border-t pt-4 pb-4 bg-muted/5">
                {caption && (
                    <p className="shrink-0 rounded-md border bg-muted/30 px-3 py-1.5 text-center font-mono text-xs">
                        {caption}
                    </p>
                )}

                <div className="flex-1 min-h-0 overflow-auto pr-1">
                    {slots.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">{emptyLabel}</div>
                    ) : (
                        <ul className="space-y-1">
                            {slots.map((slot, index) => (
                                <li key={index} className="flex items-center gap-2">
                                    <span
                                        className={`w-9 shrink-0 text-right font-mono text-xs ${index === home ? "font-bold text-primary" : "text-muted-foreground"}`}
                                    >
                                        [{index}]
                                    </span>
                                    <div
                                        className={`flex flex-1 min-w-0 items-center gap-1.5 rounded-md border-2 px-2 py-1 transition-all duration-300 ${STATE_BOX[slot.state]}`}
                                    >
                                        {slot.entries.length === 0 ? (
                                            <span className="font-mono text-xs text-muted-foreground">
                                                {slot.tombstone ? "⌫ tombstone" : "∅"}
                                            </span>
                                        ) : (
                                            slot.entries.map((entry, ei) => (
                                                <span
                                                    key={`${entry.key}-${ei}`}
                                                    className={`flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-xs transition-all duration-300 ${STATE_BOX[entry.state]}`}
                                                >
                                                    <strong>{entry.key}</strong>
                                                    <span className="text-muted-foreground">:</span>
                                                    {entry.value}
                                                </span>
                                            ))
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {description && (
                    <p className="shrink-0 rounded-md border bg-muted/30 px-3 py-2 text-center text-xs md:text-sm font-medium text-primary">
                        {description}
                    </p>
                )}

                <div className="shrink-0 flex flex-wrap justify-center gap-x-4 gap-y-2 border-t pt-3 text-xs">
                    {LEGEND.map(([state, label]) => (
                        <div
                            key={label}
                            className="flex items-center gap-1.5 rounded border border-border bg-background px-2 py-0.5"
                        >
                            <div className={`h-2.5 w-2.5 rounded-sm border ${STATE_BOX[state]}`} />
                            <span className="whitespace-nowrap text-muted-foreground">{label}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * Bridge input to slot model.
 *
 * Python sends HASH_TABLE as an array of chains — the shape separate chaining
 * produces — with no slot states, tombstones or probe marks. Unknown states fall
 * back to the neutral one.
 */
export function fromBuckets(
    buckets: { key: string; value: string; state?: string }[][],
): HashSlot[] {
    return buckets.map((chain) => ({
        entries: chain.map((e) => ({ key: e.key, value: e.value, state: "default" as VisualizerState })),
        state: "default" as VisualizerState,
        tombstone: false,
    }))
}
