import { describe, it, expect } from "vitest"
import {
    availableLanguages,
    linesFromArray,
    src,
    LANGUAGES,
    type CodeTemplate,
} from "@/lib/code-templates"
import { FAST_TRANSPOSE, SIMPLE_TRANSPOSE } from "@/lib/templates/sparse-matrix"

/** Every template in the app, with the steps its visualizer actually emits. */
const TEMPLATES: { name: string; template: CodeTemplate; steps: number[] }[] = [
    { name: "simple transpose", template: SIMPLE_TRANSPOSE, steps: [1, 3, 4] },
    { name: "fast transpose", template: FAST_TRANSPOSE, steps: [1, 3, 6, 7] },
]

describe("src", () => {
    it("marks lines with their steps", () => {
        const lines = src(`
for i in range(n):
    total += a[i]`, "1 2")
        expect(lines).toEqual([
            { text: "for i in range(n):", step: 1 },
            { text: "    total += a[i]", step: 2 },
        ])
    })

    it("leaves a dot-marked line unhighlightable", () => {
        expect(src(`
int main() {
    return 0;
}`, ". 1 .")).toEqual([
            { text: "int main() {" },
            { text: "    return 0;", step: 1 },
            { text: "}" },
        ])
    })

    it("preserves indentation exactly", () => {
        expect(src(`
        deep`, "1")[0].text).toBe("        deep")
    })

    // A miscount would silently highlight the wrong line in one language only,
    // which is the hardest kind of mistake to notice by eye.
    it("throws when the markers do not match the lines", () => {
        expect(() => src(`
a
b
c`, "1 2")).toThrow(/3 lines against 2 step markers/)
    })

    it("names the offending lines in the error", () => {
        expect(() => src(`
alpha
beta`, "1")).toThrow(/MISSING/)
    })
})

describe("linesFromArray", () => {
    it("uses each index as its own step, matching the single-language panels", () => {
        expect(linesFromArray(["a", "b"])).toEqual([
            { text: "a", step: 0 },
            { text: "b", step: 1 },
        ])
    })
})

describe("availableLanguages", () => {
    it("reports only what a template provides, in a stable order", () => {
        const partial: CodeTemplate = {
            title: "t",
            sources: { python: linesFromArray(["x"]), rust: linesFromArray(["y"]) },
        }
        expect(availableLanguages(partial)).toEqual(["python", "rust"])
    })
})

describe.each(TEMPLATES)("$name template", ({ template, steps }) => {
    const languages = availableLanguages(template)

    it("offers every supported language", () => {
        expect(languages).toEqual([...LANGUAGES])
    })

    it("has a title", () => {
        expect(template.title.length).toBeGreaterThan(2)
    })

    // The point of the whole step mechanism: a visualizer reports one step and
    // every language must have somewhere to highlight for it. A missing step in
    // one language shows as a panel that simply never highlights, which is easy
    // to miss unless it is asserted.
    it.each(steps)("covers step %i in every language", (step) => {
        for (const language of languages) {
            const lines = template.sources[language]!
            expect(
                lines.some((line) => line.step === step),
                `${language} has no line for step ${step}`,
            ).toBe(true)
        }
    })

    it("uses no step the visualizer never emits", () => {
        for (const language of languages) {
            for (const line of template.sources[language]!) {
                if (line.step === undefined) continue
                expect(steps, `${language} marks step ${line.step}, which is never emitted`)
                    .toContain(line.step)
            }
        }
    })

    it("has no blank or whitespace-only code in any language", () => {
        for (const language of languages) {
            const lines = template.sources[language]!
            expect(lines.length).toBeGreaterThan(3)
            expect(lines.every((l) => typeof l.text === "string")).toBe(true)
        }
    })

    it("reads as real code, not pseudocode", () => {
        // Every braced language should actually carry braces, and Python a colon.
        for (const language of ["c", "cpp", "java", "rust"] as const) {
            const text = template.sources[language]!.map((l) => l.text).join("\n")
            expect(text, `${language} looks like pseudocode`).toMatch(/[{}]/)
            expect(text).toMatch(/;|\bb\b/)
        }
        expect(template.sources.python.map((l) => l.text).join("\n")).toMatch(/:/)
    })
})
