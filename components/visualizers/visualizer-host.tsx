"use client"

import dynamic from "next/dynamic"
import type { ComponentType } from "react"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Slug -> visualizer component.
 *
 * Loaded with `next/dynamic` on purpose. The old /visualize page imported all
 * 23 visualizers statically, so every visit paid for all of them; now a route
 * downloads only the one it renders.
 */

function Loading() {
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <Skeleton className="h-[420px] w-full rounded-xl" />
            <div className="flex flex-col gap-6">
                <Skeleton className="h-[380px] w-full rounded-xl" />
                <Skeleton className="h-[280px] w-full rounded-xl" />
            </div>
        </div>
    )
}

/**
 * Visualizers are always rendered bare here. Several accept optional props
 * (`mini`, `controlledNodes`) used only by the /learn embeds and the notebook
 * bridge, so the map is narrowed to the no-props shape they all satisfy.
 */
function load(importer: () => Promise<{ default: ComponentType<never> }>): ComponentType {
    return dynamic(importer, { loading: Loading }) as ComponentType
}

export const VISUALIZER_COMPONENTS: Record<string, ComponentType> = {
    "linked-list": load(() => import("@/components/visualizers/linked-list-visualizer")),
    "doubly-linked-list": load(() => import("@/components/visualizers/doubly-linked-list-visualizer")),
    "circular-linked-list": load(() => import("@/components/visualizers/circular-linked-list-visualizer")),
    stack: load(() => import("@/components/visualizers/stack-visualizer")),
    queue: load(() => import("@/components/visualizers/queue-visualizer")),
    "circular-queue": load(() => import("@/components/visualizers/circular-queue-visualizer")),
    tree: load(() => import("@/components/visualizers/tree-visualizer")),
    "binary-tree": load(() => import("@/components/visualizers/binary-tree-visualizer")),
    "binary-search-tree": load(() => import("@/components/visualizers/binary-search-tree-visualizer")),
    "avl-tree": load(() => import("@/components/visualizers/avl-tree-visualizer")),
    "b-tree": load(() => import("@/components/visualizers/b-tree-visualizer")),
    graph: load(() => import("@/components/visualizers/graph-visualizer")),
    array: load(() => import("@/components/visualizers/array-visualizer")),
    heap: load(() => import("@/components/visualizers/heap-visualizer")),
    "hash-table": load(() => import("@/components/visualizers/hash-table-visualizer")),
    "binary-search": load(() => import("@/components/visualizers/algorithms/binary-search-visualizer")),
    "quick-sort": load(() => import("@/components/visualizers/algorithms/quick-sort-visualizer")),
    "heap-sort": load(() => import("@/components/visualizers/algorithms/heap-sort-visualizer")),
    "sorting-comparison": load(() => import("@/components/visualizers/algorithms/sorting-comparison")),
    "divide-conquer": load(() => import("@/components/visualizers/algorithms/divide-conquer-visualizer")),
    greedy: load(() => import("@/components/visualizers/algorithms/greedy-algorithm-visualizer")),
    "dynamic-programming": load(() => import("@/components/visualizers/algorithms/dp-visualizer")),
    pathfinding: load(() => import("@/components/visualizers/algorithms/pathfinding-visualizer")),
}

export default function VisualizerHost({ slug }: { slug: string }) {
    const Visualizer = VISUALIZER_COMPONENTS[slug]
    if (!Visualizer) return null
    return <Visualizer />
}
