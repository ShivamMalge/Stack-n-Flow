"use client"

import LinkedListVisualizer from "@/components/visualizers/linked-list-visualizer"
import StackVisualizer from "@/components/visualizers/stack-visualizer"
import ArrayVisualizer from "@/components/visualizers/array-visualizer"
import BinarySearchVisualizer from "@/components/visualizers/algorithms/binary-search-visualizer"
import { MonitorPlay } from "lucide-react"

export default function MiniVisualizerLoader({ dataStructure }: { dataStructure: string }) {
    switch (dataStructure) {
        case "linked-list":
            return <LinkedListVisualizer mini={true} />
        case "stack":
            return <StackVisualizer mini={true} />
        case "array":
            return <ArrayVisualizer mini={true} />
        case "binary-search":
            return <BinarySearchVisualizer mini={true} />
        default:
            return (
                <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-xl bg-muted/10 text-muted-foreground w-full min-h-[300px]">
                    <MonitorPlay className="h-10 w-10 mb-4 opacity-20" />
                    <p className="text-sm font-medium">Interactive visualization coming soon.</p>
                    <p className="text-xs opacity-70 mt-1">We are actively building the mini-visualizer framework for this concept.</p>
                </div>
            )
    }
}
