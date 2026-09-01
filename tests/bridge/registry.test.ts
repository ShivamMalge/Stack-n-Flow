import { describe, expect, it } from "vitest"
import {
    getRegistryEntry,
    registeredStructures,
    structuresAwaitingRenderer,
} from "@/src/bridge/registry"
import StackRenderer from "@/components/visualizers/stack/stack-renderer"
import QueueRenderer from "@/components/visualizers/queue/queue-renderer"
import LinkedListRenderer from "@/components/visualizers/linked-list/linked-list-renderer"

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
    it.each(["STACK", "QUEUE", "LINKED_LIST"])("coerces null to an empty array (%s)", (structure) => {
        const props = propsFor(structure, null)
        expect(Object.values(props).some((v) => Array.isArray(v) && v.length === 0)).toBe(true)
    })

    // A tree is the opposite: null means "no root", and [] would draw a root
    // that is not there.
    it.each(["TREE", "AVL_TREE"])("preserves null for %s, where it means no root", (structure) => {
        expect(propsFor(structure, null).controlledRoot).toBeNull()
    })

    it("maps a tree root", () => {
        const root = { id: 1, value: 10, left: null, right: null }
        expect(propsFor("TREE", root).controlledRoot).toEqual(root)
    })

    it("splits graph nodes and edges", () => {
        const edges = [{ source: "A", target: "B" }]
        const props = propsFor("GRAPH", [{ id: "A" }], { edges })
        expect(props.controlledNodes).toEqual([{ id: "A" }])
        expect(props.controlledEdges).toEqual(edges)
    })

    it("defaults graph edges to an empty array when metadata omits them", () => {
        expect(propsFor("GRAPH", [{ id: "A" }]).controlledEdges).toEqual([])
    })

    it("maps hash table buckets", () => {
        const buckets = [[{ key: "a", value: "1" }], []]
        expect(propsFor("HASH_TABLE", buckets).controlledBuckets).toEqual(buckets)
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

    it("gives array-shaped structures both prop names they may expect", () => {
        const nodes = [{ id: 1, value: 5 }]
        const props = propsFor("ARRAY", nodes)
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
    })

    it("counts down as renderers are extracted", () => {
        // Update this as P2 lands. It exists so the phase cannot quietly stall,
        // and so nothing regresses to mounting a full visualizer again.
        expect(structuresAwaitingRenderer()).toHaveLength(11)
    })
})
