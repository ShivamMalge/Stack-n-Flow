import { describe, it, expect } from "vitest"
import {
    COURSES,
    courseCoverage,
    getCourse,
    hasSurface,
    uncoveredTopics,
} from "@/lib/config/syllabus"
import { VISUALIZER_SLUGS } from "@/lib/visualizer-catalog"
import { OPERATION_TABS } from "@/lib/config/operations"

const allTopics = COURSES.flatMap((c) => c.modules.flatMap((m) => m.topics))

describe("syllabus config", () => {
    it("carries both VTU courses", () => {
        expect(COURSES.map((c) => c.code)).toEqual(["BCS304", "BCS401"])
    })

    it("gives every course five modules, numbered 1 to 5", () => {
        for (const course of COURSES) {
            expect(course.modules.map((m) => m.number)).toEqual([1, 2, 3, 4, 5])
        }
    })

    it("looks a course up case-insensitively", () => {
        expect(getCourse("bcs304")?.name).toBe("Data Structures and Applications")
        expect(getCourse("nope")).toBeUndefined()
    })

    // The syllabus page renders a link for every mapped topic. A slug that has
    // drifted out of the catalog would render a link to a 404 in front of the
    // exact audience this page exists for.
    it("only points at visualizers that actually exist", () => {
        const mapped = allTopics.map((t) => t.visualizer).filter(Boolean) as string[]
        expect(mapped.length).toBeGreaterThan(0)
        for (const slug of mapped) {
            expect(VISUALIZER_SLUGS, `unknown visualizer slug: ${slug}`).toContain(slug)
        }
    })

    it("only points at operations tabs that actually exist", () => {
        const tabs = allTopics.map((t) => t.operations).filter(Boolean) as string[]
        expect(tabs.length).toBeGreaterThan(0)
        for (const tab of tabs) {
            expect(OPERATION_TABS, `unknown operations tab: ${tab}`).toContain(tab)
        }
    })

    // Coverage has to be backed by one of the two teaching surfaces. An early
    // draft mapped only against the visualizer catalog and so marked postfix
    // evaluation and the polynomial module as unbuilt when both already ship
    // on /operations.
    it("never claims coverage without a surface to back it", () => {
        for (const topic of allTopics) {
            if (topic.coverage === "full" || topic.coverage === "partial") {
                expect(hasSurface(topic), `"${topic.title}" claims ${topic.coverage} with no surface`)
                    .toBe(true)
            }
        }
    })

    it("does not attach a surface to a topic it marks uncovered", () => {
        for (const topic of allTopics) {
            if (topic.coverage === "none") {
                expect(hasSurface(topic), `"${topic.title}" is marked none but names a surface`)
                    .toBe(false)
            }
        }
    })

    it("explains every partial mapping, since that is a promise to finish", () => {
        for (const topic of allTopics) {
            if (topic.coverage === "partial") {
                expect(topic.note, `"${topic.title}" is partial with no note`).toBeTruthy()
            }
        }
    })

    it("gives every topic a non-empty title", () => {
        for (const topic of allTopics) {
            expect(topic.title.trim().length).toBeGreaterThan(3)
        }
    })

    it("counts coverage as full plus half credit for partial", () => {
        for (const course of COURSES) {
            const s = courseCoverage(course)
            expect(s.full + s.partial + s.none).toBe(s.total)
            expect(s.percent).toBe(Math.round(((s.full + s.partial * 0.5) / s.total) * 100))
            expect(s.percent).toBeGreaterThanOrEqual(0)
            expect(s.percent).toBeLessThanOrEqual(100)
        }
    })

    it("lists everything that is not yet fully covered", () => {
        for (const course of COURSES) {
            const stats = courseCoverage(course)
            expect(uncoveredTopics(course)).toHaveLength(stats.partial + stats.none)
        }
    })

    it("keeps the build queue in syllabus order", () => {
        for (const course of COURSES) {
            const modules = uncoveredTopics(course).map((u) => u.module)
            expect(modules).toEqual([...modules].sort((a, b) => a - b))
        }
    })
})
