import {
    ArrowLeftRight,
    Binary,
    Boxes,
    CircleDashed,
    Coins,
    Combine,
    GitBranchPlus,
    GitFork,
    GitMerge,
    Grid3x3,
    LayoutGrid,
    ListTree,
    Map as MapIcon,
    Network,
    Parentheses,
    Repeat,
    Search,
    SortAsc,
    SplitSquareVertical,
    SquareStack,
    Table2,
    TrendingUp,
    Triangle,
    Workflow,
    type LucideIcon,
} from "lucide-react"

/**
 * Every visualizer the app can route to.
 *
 * This is the one list: the navbar dropdown, the /visualize index, the
 * `generateStaticParams` for /visualize/[slug], and the component loader all
 * read it. Adding a visualizer means adding an entry here plus a line in
 * `visualizer-host.tsx` — nothing else needs touching.
 *
 * Deliberately free of component imports so server components can read it
 * without pulling the whole client bundle in.
 */

export type VisualizerCategory = "data-structures" | "algorithms"

export interface VisualizerEntry {
    /** URL segment: /visualize/<slug>. Matches the old ?ds= / ?algo= values. */
    slug: string
    /** Full name, used as the page heading. */
    name: string
    /** Compact name for the navbar and breadcrumbs, when the full one is long. */
    shortName?: string
    category: VisualizerCategory
    description: string
    icon: LucideIcon
    /** Set when /learn/<slug> has a written module to link across to. */
    hasLearnModule?: boolean
}

export const CATEGORY_LABELS: Record<VisualizerCategory, string> = {
    "data-structures": "Data Structures",
    algorithms: "Algorithms",
}

export const VISUALIZERS: readonly VisualizerEntry[] = [
    {
        slug: "linked-list",
        name: "Linked List",
        category: "data-structures",
        description: "Nodes chained by a single forward pointer.",
        icon: ArrowLeftRight,
        hasLearnModule: true,
    },
    {
        slug: "doubly-linked-list",
        name: "Doubly Linked List",
        shortName: "Doubly Linked",
        category: "data-structures",
        description: "Each node points both forward and back.",
        icon: GitBranchPlus,
    },
    {
        slug: "circular-linked-list",
        name: "Circular Linked List",
        shortName: "Circular List",
        category: "data-structures",
        description: "The tail links back to the head, so traversal never ends.",
        icon: CircleDashed,
    },
    {
        slug: "stack",
        name: "Stack",
        category: "data-structures",
        description: "Last in, first out. Push and pop from one end.",
        icon: SquareStack,
        hasLearnModule: true,
    },
    {
        slug: "queue",
        name: "Queue",
        category: "data-structures",
        description: "First in, first out. Enqueue at the rear, dequeue at the front.",
        icon: ArrowLeftRight,
    },
    {
        slug: "circular-queue",
        name: "Circular Queue",
        category: "data-structures",
        description: "A fixed buffer whose front and rear wrap around.",
        icon: Repeat,
    },
    {
        // Named "Tree" for the route, but the component inserts by comparison,
        // so what it builds is an ordered binary tree, not an n-ary one. The
        // description says so rather than promising a general tree.
        slug: "tree",
        name: "Tree Traversals",
        shortName: "Tree",
        category: "data-structures",
        description: "Build an ordered tree and walk it in-order, pre-order, or post-order.",
        icon: ListTree,
    },
    {
        slug: "binary-tree",
        name: "Binary Tree",
        category: "data-structures",
        description: "Every node has at most two children.",
        icon: Binary,
    },
    {
        slug: "binary-search-tree",
        name: "Binary Search Tree",
        shortName: "BST",
        category: "data-structures",
        description: "An ordered binary tree: left is smaller, right is larger.",
        icon: GitFork,
    },
    {
        slug: "avl-tree",
        name: "AVL Tree",
        category: "data-structures",
        description: "A BST that rotates itself back into balance after every insert.",
        icon: GitMerge,
    },
    {
        slug: "b-tree",
        name: "B-Tree",
        category: "data-structures",
        description: "A wide, shallow tree that keeps many keys per node.",
        icon: Boxes,
    },
    {
        slug: "graph",
        name: "Graph",
        category: "data-structures",
        description: "Nodes joined by edges, traversed with BFS and DFS.",
        icon: Network,
    },
    {
        slug: "array",
        name: "Array",
        category: "data-structures",
        description: "Contiguous, index-addressable storage.",
        icon: LayoutGrid,
        hasLearnModule: true,
    },
    {
        slug: "heap",
        name: "Heap",
        category: "data-structures",
        description: "A complete tree where every parent beats its children.",
        icon: Triangle,
    },
    {
        slug: "disjoint-set",
        name: "Disjoint Sets",
        category: "data-structures",
        description: "Union-find: a forest of sets, with rank and path compression.",
        icon: Combine,
    },
    {
        slug: "hash-table",
        name: "Hash Table",
        category: "data-structures",
        description: "Keys hashed to buckets, with chaining on collision.",
        icon: Table2,
    },
    {
        slug: "binary-search",
        name: "Binary Search",
        category: "algorithms",
        description: "Halve the search range on every comparison.",
        icon: Search,
        hasLearnModule: true,
    },
    {
        slug: "expressions",
        name: "Expression Conversion",
        shortName: "Expressions",
        category: "algorithms",
        description: "Convert infix to postfix with a stack, then evaluate it.",
        icon: Parentheses,
    },
    {
        slug: "quick-sort",
        name: "Quick Sort",
        category: "algorithms",
        description: "Partition around a pivot, then sort each side.",
        icon: SortAsc,
    },
    {
        slug: "heap-sort",
        name: "Heap Sort",
        category: "algorithms",
        description: "Build a max-heap, then extract the root repeatedly.",
        icon: Triangle,
    },
    {
        slug: "sorting-comparison",
        name: "Sorting Comparison",
        shortName: "Sort Comparison",
        category: "algorithms",
        description: "Race several sorting algorithms on the same input.",
        icon: Grid3x3,
    },
    {
        slug: "divide-conquer",
        name: "Divide & Conquer",
        category: "algorithms",
        description: "Merge sort, split down and merged back up.",
        icon: SplitSquareVertical,
    },
    {
        slug: "greedy",
        name: "Greedy Algorithms",
        shortName: "Greedy",
        category: "algorithms",
        description: "Coin change by always taking the largest coin that fits.",
        icon: Coins,
    },
    {
        slug: "dynamic-programming",
        name: "Dynamic Programming",
        category: "algorithms",
        description: "Build answers from a table of solved subproblems.",
        icon: TrendingUp,
    },
    {
        slug: "pathfinding",
        name: "Pathfinding",
        category: "algorithms",
        description: "Find a route across a grid with BFS, Dijkstra, or A*.",
        icon: MapIcon,
    },
] as const

export const VISUALIZER_SLUGS: readonly string[] = VISUALIZERS.map((v) => v.slug)

export function getVisualizer(slug: string): VisualizerEntry | undefined {
    return VISUALIZERS.find((v) => v.slug === slug)
}

export function visualizersIn(category: VisualizerCategory): VisualizerEntry[] {
    return VISUALIZERS.filter((v) => v.category === category)
}

/** Name for tight spaces such as the navbar and breadcrumbs. */
export function shortNameOf(entry: VisualizerEntry): string {
    return entry.shortName ?? entry.name
}

/** Route for a visualizer. Kept here so no caller hand-builds the path. */
export function visualizerHref(slug: string): string {
    return `/visualize/${slug}`
}

/**
 * Workflow icon is re-exported for the /visualize index hero; keeping the
 * import here means the icon set has one owner.
 */
export { Workflow as VisualizeIcon }
