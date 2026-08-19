/**
 * VTU syllabus, transcribed from the official module notes.
 *
 * Every topic below comes from the `MODULE n` header of the course material,
 * not from memory — BCS304 modules 1-3 and 5 from their text layer, module 4
 * from its scanned first page, BCS401 from the section headings of the
 * prescribed textbook extracts.
 *
 * `visualizer` points at a slug in lib/visualizer-catalog.ts. `coverage` is the
 * honest state of that mapping, and the `none`/`partial` rows are the build
 * queue: this file is the roadmap as much as it is the page's data source.
 *
 * Adding another university means adding a Course here. Nothing downstream
 * hard-codes VTU.
 */

import type { OperationTab } from "@/lib/config/operations"

export type Coverage = "full" | "partial" | "none"

export interface SyllabusTopic {
    title: string
    /** Slug from the visualizer catalog, when something teaches this topic. */
    visualizer?: string
    /**
     * Tab id on /operations, for topics taught there instead of by a
     * visualizer. The app has two teaching surfaces and an earlier draft of
     * this file only knew about one, which understated coverage: postfix
     * evaluation and the whole polynomial module live here, not in a
     * visualizer.
     */
    operations?: OperationTab
    coverage: Coverage
    /** For `partial`, what is missing. For `none` on theory topics, why. */
    note?: string
}

export interface SyllabusModule {
    number: number
    title: string
    topics: SyllabusTopic[]
}

export interface Course {
    code: string
    name: string
    shortName: string
    semester: number
    scheme: string
    modules: SyllabusModule[]
}

const BCS304: Course = {
    code: "BCS304",
    name: "Data Structures and Applications",
    shortName: "Data Structures",
    semester: 3,
    scheme: "2022",
    modules: [
        {
            number: 1,
            title: "Introduction, Arrays and Structures, Stacks",
            topics: [
                { title: "Data structures and their classification (primitive and non-primitive)", coverage: "none", note: "Conceptual; belongs in /learn rather than a visualizer." },
                { title: "Data structure operations", coverage: "none", note: "Conceptual." },
                { title: "Review of pointers and dynamic memory allocation", coverage: "none", note: "Conceptual." },
                { title: "Arrays", visualizer: "array", coverage: "full" },
                { title: "Dynamically allocated arrays", visualizer: "dynamic-array", coverage: "full", note: "Capacity against size, doubling, the element-by-element copy, and the amortised cost." },
                { title: "Structures and unions", coverage: "none" },
                { title: "Polynomials", operations: "polynomial", coverage: "full", note: "Add, subtract, multiply, evaluate, derivative and degree, on the Operations page." },
                { title: "Sparse matrices", coverage: "none", note: "Triple representation and transpose are unbuilt." },
                { title: "Representation of multidimensional arrays", coverage: "none", note: "Row-major and column-major address calculation." },
                { title: "Strings", coverage: "none" },
                { title: "Stacks", visualizer: "stack", coverage: "full" },
                { title: "Stacks using dynamic arrays", visualizer: "dynamic-array", coverage: "full", note: "Stack mode of the dynamic array, pushing and popping at the tail." },
                { title: "Evaluation and conversion of expressions", visualizer: "expressions", coverage: "full", note: "Shunting-yard conversion and postfix evaluation, both stepping the stack. Parenthesis validation also lives on the Operations page." },
            ],
        },
        {
            number: 2,
            title: "Queues and Linked Lists",
            topics: [
                { title: "Queues", visualizer: "queue", coverage: "full" },
                { title: "Circular queues", visualizer: "circular-queue", coverage: "full" },
                { title: "Queues using dynamic arrays", visualizer: "dynamic-array", coverage: "full", note: "Circular queue mode, including the unwrapping copy a wrapped queue needs when it grows." },
                { title: "Multiple stacks and queues", coverage: "none", note: "Several stacks sharing one array." },
                { title: "Singly linked lists and chains", visualizer: "linked-list", coverage: "full" },
                { title: "Representing chains in C", coverage: "none", note: "Conceptual." },
                { title: "Linked stacks and queues", coverage: "none" },
                { title: "Polynomials using linked lists", coverage: "none" },
            ],
        },
        {
            number: 3,
            title: "Linked Lists (continued) and Trees",
            topics: [
                { title: "Additional list operations (invert, concatenate)", operations: "linkedList", coverage: "partial", note: "Inversion, loop detection, find-middle and nth-from-end are on the Operations page. Concatenation is unbuilt." },
                { title: "Sparse matrices using linked lists", coverage: "none" },
                { title: "Doubly linked lists", visualizer: "doubly-linked-list", coverage: "full" },
                { title: "Trees: introduction and terminology", visualizer: "tree", coverage: "full" },
                { title: "Binary trees", visualizer: "binary-tree", coverage: "full" },
                { title: "Binary tree traversals", visualizer: "tree", coverage: "full", note: "In-order, pre-order and post-order all animate." },
                { title: "Threaded binary trees", coverage: "none", note: "Named in the syllabus; nothing shows thread pointers." },
            ],
        },
        {
            number: 4,
            title: "Trees (continued) and Graphs",
            topics: [
                { title: "Binary search trees", visualizer: "binary-search-tree", coverage: "full" },
                { title: "Selection trees (winner and loser trees)", coverage: "none" },
                { title: "Forests", coverage: "none", note: "Forest-to-binary-tree conversion is unbuilt." },
                { title: "Representation of disjoint sets", visualizer: "disjoint-set", coverage: "full", note: "The forest and the parent[] array that encodes it, with union by rank and path compression as toggles." },
                { title: "Counting binary trees", coverage: "none", note: "Catalan numbers; largely analytical." },
                { title: "The graph abstract data type", visualizer: "graph", coverage: "full" },
                { title: "Elementary graph operations (BFS, DFS)", visualizer: "graph", coverage: "full" },
            ],
        },
        {
            number: 5,
            title: "Hashing, Priority Queues, Efficient Binary Search Trees",
            topics: [
                { title: "Hashing: introduction", visualizer: "hash-table", coverage: "full" },
                { title: "Static hashing", visualizer: "hash-table", coverage: "full", note: "Chaining, linear probing, quadratic probing and double hashing, with table size and hash base settable and tombstones on delete." },
                { title: "Dynamic hashing", coverage: "none", note: "Extendible hashing with directory doubling." },
                { title: "Single-ended priority queues", visualizer: "heap", coverage: "partial", note: "Min-heap and max-heap exist; not framed as a priority queue ADT." },
                { title: "Double-ended priority queues", coverage: "none", note: "Min-max heaps." },
                { title: "Leftist trees", coverage: "none", note: "Meldable heaps; the merge operation is the teaching point." },
                { title: "Optimal binary search trees", coverage: "none", note: "A dynamic-programming construction, so it fits the existing DP framework." },
            ],
        },
    ],
}

const BCS401: Course = {
    code: "BCS401",
    name: "Analysis and Design of Algorithms",
    shortName: "Algorithms",
    semester: 4,
    scheme: "2022",
    modules: [
        {
            number: 1,
            title: "Introduction and Fundamentals of Analysis",
            topics: [
                { title: "What is an algorithm?", coverage: "none", note: "Conceptual." },
                { title: "Fundamentals of algorithmic problem solving", coverage: "none", note: "Conceptual." },
                { title: "The analysis framework", coverage: "none", note: "Conceptual." },
                { title: "Asymptotic notations and basic efficiency classes", coverage: "none", note: "A growth-rate plot would carry this well." },
                { title: "Mathematical analysis of non-recursive algorithms", coverage: "none" },
                { title: "Mathematical analysis of recursive algorithms", coverage: "none", note: "A recursion-tree and call-stack view; nothing in the app shows a call stack." },
                { title: "Brute force: selection sort", visualizer: "sorting-comparison", coverage: "full" },
                { title: "Brute force: bubble sort", visualizer: "sorting-comparison", coverage: "full" },
                { title: "Sequential search", coverage: "none" },
                { title: "Brute-force string matching", coverage: "none" },
            ],
        },
        {
            number: 2,
            title: "Brute Force, Decrease-and-Conquer, Divide-and-Conquer",
            topics: [
                { title: "Exhaustive search: travelling salesman, knapsack, assignment", coverage: "none" },
                { title: "Decrease-and-conquer: insertion sort", visualizer: "sorting-comparison", coverage: "full" },
                { title: "Topological sorting", coverage: "none", note: "The graph visualizer traverses but does not order, so it does not teach this." },
                { title: "Divide-and-conquer: mergesort", visualizer: "divide-conquer", coverage: "full" },
                { title: "Quicksort", visualizer: "quick-sort", coverage: "full" },
                { title: "Binary tree traversals and related properties", visualizer: "binary-tree", coverage: "full" },
                { title: "Multiplication of large integers and Strassen's matrix multiplication", coverage: "none" },
            ],
        },
        {
            number: 3,
            title: "Transform-and-Conquer and Space-Time Trade-offs",
            topics: [
                { title: "Balanced search trees: AVL trees", visualizer: "avl-tree", coverage: "full" },
                { title: "Balanced search trees: 2-3 trees", visualizer: "b-tree", coverage: "partial", note: "The B-tree visualizer generalises 2-3 trees but is not presented as one." },
                { title: "Heaps and heapsort", visualizer: "heap-sort", coverage: "full" },
                { title: "Sorting by counting (distribution counting)", coverage: "none" },
                { title: "Input enhancement in string matching: Horspool's algorithm", coverage: "none" },
                { title: "Input enhancement in string matching: Boyer-Moore", coverage: "none" },
            ],
        },
        {
            number: 4,
            title: "Dynamic Programming and the Greedy Technique",
            topics: [
                { title: "Three basic examples: coin-row, change-making, coin-collecting", visualizer: "dynamic-programming", coverage: "partial", note: "The DP table exists; these three specific problems are not among its presets." },
                { title: "The knapsack problem and memory functions", visualizer: "dynamic-programming", coverage: "partial", note: "The 0/1 knapsack table animates; the memoised variant does not." },
                { title: "Warshall's algorithm (transitive closure)", coverage: "none" },
                { title: "Floyd's algorithm (all-pairs shortest paths)", coverage: "none" },
                { title: "Prim's algorithm (minimum spanning tree)", coverage: "none" },
                { title: "Kruskal's algorithm (minimum spanning tree)", coverage: "none", note: "Needs union-find, shared with BCS304 module 4." },
                { title: "Dijkstra's algorithm (single-source shortest paths)", visualizer: "pathfinding", coverage: "partial", note: "Runs on a grid, not on a weighted graph as the syllabus presents it." },
                { title: "Huffman trees and codes", coverage: "none" },
            ],
        },
        {
            number: 5,
            title: "Limitations of Algorithm Power and Coping with Them",
            topics: [
                { title: "Decision trees", coverage: "none", note: "Lower bounds for sorting and searching." },
                { title: "P, NP and NP-complete problems", coverage: "none", note: "Theory; belongs in /learn." },
                { title: "Backtracking: n-Queens, Hamiltonian circuit, subset-sum", coverage: "none", note: "State-space tree animation — the most visual topic in the module." },
                { title: "Branch-and-bound: assignment, knapsack, travelling salesman", coverage: "none" },
                { title: "Approximation algorithms for NP-hard problems", coverage: "none" },
            ],
        },
    ],
}

export const COURSES: readonly Course[] = [BCS304, BCS401]

export function getCourse(code: string): Course | undefined {
    return COURSES.find((c) => c.code.toLowerCase() === code.toLowerCase())
}

export interface CoverageStats {
    full: number
    partial: number
    none: number
    total: number
    /** Full plus half credit for partial, as a percentage. */
    percent: number
}

export function courseCoverage(course: Course): CoverageStats {
    const topics = course.modules.flatMap((m) => m.topics)
    const full = topics.filter((t) => t.coverage === "full").length
    const partial = topics.filter((t) => t.coverage === "partial").length
    const none = topics.filter((t) => t.coverage === "none").length
    const total = topics.length
    return {
        full,
        partial,
        none,
        total,
        percent: total === 0 ? 0 : Math.round(((full + partial * 0.5) / total) * 100),
    }
}

/** Every topic without a full visualizer yet, in syllabus order — the build queue. */
/** True when a topic points at any teaching surface. */
export function hasSurface(topic: SyllabusTopic): boolean {
    return Boolean(topic.visualizer || topic.operations)
}

export function uncoveredTopics(course: Course): { module: number; topic: SyllabusTopic }[] {
    return course.modules.flatMap((m) =>
        m.topics.filter((t) => t.coverage !== "full").map((topic) => ({ module: m.number, topic })),
    )
}
