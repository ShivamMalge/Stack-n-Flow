import { describe, expect, it } from "vitest"
import {
    getRegistryEntry,
    registeredStructures,
    structuresAwaitingRenderer,
} from "@/src/bridge/registry"
import StackRenderer from "@/components/visualizers/stack/stack-renderer"
import QueueRenderer from "@/components/visualizers/queue/queue-renderer"
import LinkedListRenderer from "@/components/visualizers/linked-list/linked-list-renderer"
import ArrayRenderer from "@/components/visualizers/array/array-renderer"
import TreeRenderer from "@/components/visualizers/tree/tree-renderer"
import GraphRenderer from "@/components/visualizers/graph/graph-renderer"
import HashTableRenderer from "@/components/visualizers/hash-table/hash-table-renderer"

/** Shorthand for the props a structure produces from a given payload. */
const propsFor = (structure: string, nodes: unknown, metadata: Record<string, unknown> = {}) =>
    getRegistryEntry(structure)!.props({ nodes, metadata })

describe("bridge registry", () => {
    it("resolves an entry for every registered structure", () => {
        for (const structure of registeredStructures()) {
            expect(getRegistryEntry(structure), structure).toBeDefined()
        }
    })

    it("returns nothing for an unknown structure", () => {
        expect(getRegistryEntry("NOT_A_STRUCTURE")).toBeUndefined()
    })

    it("points the extracted structures at their renderers", () => {
        expect(getRegistryEntry("STACK")!.component).toBe(StackRenderer)
        expect(getRegistryEntry("QUEUE")!.component).toBe(QueueRenderer)
        expect(getRegistryEntry("LINKED_LIST")!.component).toBe(LinkedListRenderer)
        expect(getRegistryEntry("ARRAY")!.component).toBe(ArrayRenderer)
        expect(getRegistryEntry("TREE")!.component).toBe(TreeRenderer)
        expect(getRegistryEntry("AVL_TREE")!.component).toBe(TreeRenderer)
        expect(getRegistryEntry("GRAPH")!.component).toBe(GraphRenderer)
        expect(getRegistryEntry("HASH_TABLE")!.component).toBe(HashTableRenderer)
    })
})

/**
 * These mappings are the Python/React contract. A rename on either side would
 * otherwise go unnoticed until someone opened a notebook.
 */
describe("prop mappings", () => {
    it("hands a stack its items, not a controlled prop", () => {
        const props = propsFor("STACK", [{ id: "a1", value: 1 }], { searchResult: "Top: 1" })
        expect(props.items).toEqual([{ id: "a1", value: 1 }])
        expect(props.searchResult).toBe("Top: 1")
        expect(props.controlledNodes).toBeUndefined()
    })

    it("hands a linked list its nodes", () => {
        const props = propsFor("LINKED_LIST", [{ id: "n1", value: 7 }])
        expect(props.nodes).toEqual([{ id: "n1", value: 7 }])
    })

    // Python sends null for an empty structure. A renderer indexes straight into
    // the array, so null has to become [] before it reaches one.
    it.each(["STACK", "QUEUE", "LINKED_LIST", "ARRAY"])("coerces null to an empty array (%s)", (structure) => {
        const props = propsFor(structure, null)
        expect(Object.values(props).some((v) => Array.isArray(v) && v.length === 0)).toBe(true)
    })

    // A tree is the opposite: null means "no root", and [] would draw a root
    // that is not there.
    it.each(["TREE", "AVL_TREE"])("preserves null for %s, where it means no root", (structure) => {
        expect(propsFor(structure, null).root).toBeNull()
    })

    // An empty payload arrives as [] from some call sites, and a tree renderer
    // handed [] would try to draw it as a root.
    it.each(["TREE", "AVL_TREE"])("treats an empty array as no root for %s", (structure) => {
        expect(propsFor(structure, []).root).toBeNull()
    })

    it("maps a tree root", () => {
        const root = { id: 1, value: 10, left: null, right: null }
        expect(propsFor("TREE", root).root).toEqual(root)
    })

    // The BST and the AVL share one renderer; the variant is what makes the AVL
    // print balance factors and show the state legend.
    it("asks for the avl variant only for the avl tree", () => {
        const root = { id: 1, value: 10, left: null, right: null }
        expect(propsFor("AVL_TREE", root).variant).toBe("avl")
        expect(propsFor("TREE", root).variant).toBeUndefined()
    })

    it("splits graph nodes and edges", () => {
        const edges = [{ id: "A-B", source: "A", target: "B" }]
        const props = propsFor("GRAPH", [{ id: "A", label: "A" }], { edges })
        expect(props.nodes).toEqual([{ id: "A", label: "A" }])
        expect(props.edges).toEqual(edges)
    })

    it("defaults graph edges to an empty array when metadata omits them", () => {
        expect(propsFor("GRAPH", [{ id: "A", label: "A" }]).edges).toEqual([])
    })

    // The renderer drops the click affordance when it has no handler, which is
    // what keeps a notebook from offering a start-node click that does nothing.
    it("gives the graph no click handler", () => {
        expect(propsFor("GRAPH", []).onNodeClick).toBeUndefined()
    })

    it("converts hash table chains into slots", () => {
        const buckets = [[{ key: "a", value: "1" }], []]
        const slots = propsFor("HASH_TABLE", buckets).slots as {
            entries: { key: string; value: string }[]
            tombstone: boolean
        }[]
        expect(slots).toHaveLength(2)
        expect(slots[0].entries).toEqual([{ key: "a", value: "1", state: "default" }])
        expect(slots[1].entries).toEqual([])
        expect(slots[1].tombstone).toBe(false)
    })

    it("maps heap values and their states", () => {
        const props = propsFor("HEAP", [5, 3], { states: ["default", "comparing"] })
        expect(props.controlledHeap).toEqual([5, 3])
        expect(props.controlledStates).toEqual(["default", "comparing"])
    })

    it("carries the circular queue's front, rear and size", () => {
        const props = propsFor("CIRCULAR_QUEUE", [1, 2, 3], { front: 0, rear: 2, size: 3 })
        expect(props.controlledFront).toBe(0)
        expect(props.controlledRear).toBe(2)
        expect(props.controlledSize).toBe(3)
    })

    it("maps a binary search array and its result", () => {
        const props = propsFor("BINARY_SEARCH", [{ value: 1 }], { searchResult: "found" })
        expect(props.controlledArray).toEqual([{ value: 1 }])
        expect(props.controlledSearchResult).toBe("found")
    })

    it("hands an array its items", () => {
        const props = propsFor("ARRAY", [{ id: 1, value: 5 }], { searchResult: "Element found at index 0" })
        expect(props.items).toEqual([{ id: 1, value: 5 }])
        expect(props.searchResult).toBe("Element found at index 0")
    })

    // The structures still mounting a full visualizer disagree about what to
    // call the same array, so those entries send both names.
    it("gives a full visualizer both prop names it may expect", () => {
        const nodes = [{ id: 1, value: 5 }]
        const props = propsFor("QUICK_SORT", nodes)
        expect(props.controlledNodes).toEqual(nodes)
        expect(props.controlledArray).toEqual(nodes)
    })

    it("never returns undefined props for any structure", () => {
        for (const structure of registeredStructures()) {
            const props = propsFor(structure, [], {})
            expect(Object.keys(props).length, structure).toBeGreaterThan(0)
        }
    })
})

/**
 * P2 in pratyaksha_phases.md: every structure should mount a presentational
 * renderer rather than the full interactive visualizer, because in a notebook
 * the controls do nothing — Python drives the state.
 */
describe("renderer extraction progress", () => {
    it("reports which structures still mount a full visualizer", () => {
        const waiting = structuresAwaitingRenderer()
        expect(waiting).not.toContain("STACK")
        expect(waiting).not.toContain("QUEUE")
        expect(waiting).not.toContain("LINKED_LIST")
        expect(waiting).not.toContain("ARRAY")
        expect(waiting).not.toContain("TREE")
        expect(waiting).not.toContain("AVL_TREE")
        expect(waiting).not.toContain("GRAPH")
        expect(waiting).not.toContain("HASH_TABLE")
    })

    it("counts down as renderers are extracted", () => {
        // Update this as P2 lands. It exists so the phase cannot quietly stall,
        // and so nothing regresses to mounting a full visualizer again.
        expect(structuresAwaitingRenderer()).toHaveLength(6)
    })
})
