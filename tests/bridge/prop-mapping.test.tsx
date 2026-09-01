import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"

/**
 * What the *bridge* is responsible for, now that each registry entry owns its
 * own prop mapping: subscribing to the model, re-rendering on change, choosing
 * the theme, and handing the entry's props to the entry's component.
 *
 * The mappings themselves are tested against the real registry in
 * registry.test.ts. An earlier version of this file mocked the registry *and*
 * reimplemented the mapping inside the mock, so once the mapping moved it would
 * have kept passing while asserting nothing but its own fake.
 */

let received: Record<string, unknown> = {}

const Probe = (props: Record<string, unknown>) => {
    received = props
    return <div data-testid="probe" />
}

const entry = {
    component: Probe,
    props: ({ nodes, metadata }: { nodes: unknown; metadata: Record<string, unknown> }) => ({
        nodes,
        flag: metadata.flag,
    }),
    rendererOnly: true,
}

vi.mock("@/src/bridge/registry", () => ({
    getRegistryEntry: (structure: string) => (structure === "UNKNOWN" ? undefined : entry),
}))

let model: {
    get: (key: string) => unknown
    on: (event: string, handler: () => void) => void
    off: (event: string, handler: () => void) => void
}

vi.mock("@anywidget/react", () => ({
    useModel: () => model,
    createRender: (component: unknown) => component,
}))

import { VisualizerRouter } from "@/src/bridge/pratyaksha-bridge"

function mount(state: Record<string, unknown>) {
    model = {
        get: (key: string) => state[key],
        on: () => { },
        off: () => { },
    }
    return render(<VisualizerRouter />)
}

beforeEach(() => {
    received = {}
})

describe("bridge router", () => {
    it("renders the entry's component with the entry's props", () => {
        mount({ structure: "STACK", nodes: [{ id: 1 }], metadata: { flag: "yes" } })
        expect(screen.getByTestId("probe")).toBeInTheDocument()
        expect(received.nodes).toEqual([{ id: 1 }])
        expect(received.flag).toBe("yes")
    })

    it("reports an unsupported structure rather than rendering nothing", () => {
        mount({ structure: "UNKNOWN", nodes: [], metadata: {} })
        expect(screen.getByText(/Unsupported structure/)).toBeInTheDocument()
    })

    it("falls back to STACK when the structure is missing", () => {
        mount({ nodes: [], metadata: {} })
        expect(screen.getByTestId("probe")).toBeInTheDocument()
    })

    it("passes null straight through, leaving the mapping to decide", () => {
        // A tree needs null to survive, a renderer needs it coerced. That choice
        // belongs to the entry, so the bridge must not pre-empt it.
        mount({ structure: "TREE", nodes: null, metadata: {} })
        expect(received.nodes).toBeNull()
    })

    it("treats a missing metadata object as empty", () => {
        mount({ structure: "STACK", nodes: [] })
        expect(received.flag).toBeUndefined()
    })
})

describe("theme", () => {
    const containerClass = () =>
        document.querySelector(".pratyaksha-container")?.className ?? ""

    it("stays light by default", () => {
        mount({ structure: "STACK", nodes: [], metadata: {}, theme: "light" })
        expect(containerClass()).not.toMatch(/\bdark\b/)
    })

    // The widget carries the app's own tokens, whose defaults are the light
    // palette, so without this it renders as a white slab in a dark notebook.
    it("applies the dark class when asked", () => {
        mount({ structure: "STACK", nodes: [], metadata: {}, theme: "dark" })
        expect(containerClass()).toMatch(/\bdark\b/)
    })

    it("does not reserve a fixed height the content may not need", () => {
        mount({ structure: "STACK", nodes: [], metadata: {} })
        expect(containerClass()).not.toContain("h-full")
        expect(containerClass()).toContain("min-h-[160px]")
    })
})
