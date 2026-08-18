import { describe, it, expect } from "vitest"
import {
    CATEGORY_LABELS,
    VISUALIZERS,
    VISUALIZER_SLUGS,
    getVisualizer,
    shortNameOf,
    visualizerHref,
    visualizersIn,
} from "@/lib/visualizer-catalog"
import { VISUALIZER_COMPONENTS } from "@/components/visualizers/visualizer-host"

describe("visualizer catalog", () => {
    it("has no duplicate slugs", () => {
        expect(new Set(VISUALIZER_SLUGS).size).toBe(VISUALIZERS.length)
    })

    it("uses url-safe slugs", () => {
        for (const entry of VISUALIZERS) {
            expect(entry.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
        }
    })

    it("gives every entry a name, description and icon", () => {
        for (const entry of VISUALIZERS) {
            expect(entry.name.length).toBeGreaterThan(0)
            expect(entry.description.length).toBeGreaterThan(0)
            expect(entry.icon).toBeTypeOf("object")
        }
    })

    it("assigns every entry to a labelled category", () => {
        for (const entry of VISUALIZERS) {
            expect(CATEGORY_LABELS[entry.category]).toBeTruthy()
        }
    })

    it("splits cleanly across the two categories", () => {
        const total =
            visualizersIn("data-structures").length + visualizersIn("algorithms").length
        expect(total).toBe(VISUALIZERS.length)
    })

    it("builds hrefs under /visualize", () => {
        expect(visualizerHref("stack")).toBe("/visualize/stack")
    })

    it("looks entries up by slug and misses cleanly", () => {
        expect(getVisualizer("stack")?.name).toBe("Stack")
        expect(getVisualizer("not-a-structure")).toBeUndefined()
    })

    it("falls back to the full name when there is no short name", () => {
        expect(shortNameOf({ ...VISUALIZERS[0], shortName: undefined })).toBe(
            VISUALIZERS[0].name,
        )
        expect(shortNameOf({ ...VISUALIZERS[0], shortName: "Short" })).toBe("Short")
    })

    it("keeps short names genuinely shorter", () => {
        for (const entry of VISUALIZERS) {
            if (entry.shortName) {
                expect(entry.shortName.length).toBeLessThan(entry.name.length)
            }
        }
    })
})

describe("catalog and component map agree", () => {
    // A slug in one and not the other renders an empty page or an unreachable
    // visualizer, and neither shows up as a type error.
    it("has a component for every catalog entry", () => {
        for (const slug of VISUALIZER_SLUGS) {
            expect(VISUALIZER_COMPONENTS[slug], `missing component for ${slug}`).toBeDefined()
        }
    })

    it("has a catalog entry for every component", () => {
        for (const slug of Object.keys(VISUALIZER_COMPONENTS)) {
            expect(getVisualizer(slug), `missing catalog entry for ${slug}`).toBeDefined()
        }
    })
})
