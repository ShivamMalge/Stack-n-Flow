import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

/**
 * Guards the two ways a `var(--token)` reference goes wrong silently.
 *
 * The disjoint-set visualizer shipped with `fill-[var(--node-label)]` and its
 * node labels rendered invisible. The token was not missing — it is defined in
 * app/theme-tokens.css. The mistake was using it *raw*: every theme token here
 * is stored as bare HSL components (`0 0% 9%`), so a reference has to be
 * wrapped as `hsl(var(--node-label))`. Unwrapped, it produced
 * `fill: 0 0% 9%`, which is invalid, and CSS drops invalid declarations
 * without complaint.
 *
 * Typecheck, tests and build were all green. Only opening the page showed it.
 * This is the half of that class of bug that needs no browser, so it runs on
 * every commit; the half that does need one lives in scripts/visual-audit.mjs.
 */

const SOURCE_DIRS = ["app", "components", "lib", "src", "hooks"]
const SOURCE_EXTS = [".ts", ".tsx", ".css"]

/**
 * Prefixes written onto elements at runtime by a library rather than declared
 * in our CSS. Radix sets these while positioning a popover, so they are correct
 * to reference and impossible to find in a stylesheet. They hold real lengths,
 * not HSL components, so the wrapper rule does not apply to them either.
 */
const RUNTIME_PREFIXES = ["--radix-"]

/** `0 0% 9%` / `220 9% 46%` — the shadcn convention this project follows. */
const HSL_TRIPLET = /^-?[\d.]+\s+[\d.]+%\s+[\d.]+%$/

interface Reference {
    token: string
    file: string
    wrapped: boolean
}

function walk(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
        const path = join(dir, entry)
        if (statSync(path).isDirectory()) walk(path, out)
        else if (SOURCE_EXTS.some((ext) => path.endsWith(ext))) out.push(path)
    }
    return out
}

/** token -> its declared value, from every stylesheet under app/. */
function definitions(): Map<string, string> {
    const tokens = new Map<string, string>()
    for (const file of walk("app").filter((f) => f.endsWith(".css"))) {
        const css = readFileSync(file, "utf8")
        for (const match of css.matchAll(/(--[a-zA-Z0-9-]+)\s*:\s*([^;}]+)/g)) {
            tokens.set(match[1], match[2].trim())
        }
    }
    return tokens
}

function references(): Reference[] {
    const found: Reference[] = []
    for (const dir of SOURCE_DIRS) {
        for (const file of walk(dir)) {
            const text = readFileSync(file, "utf8")
            for (const match of text.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g)) {
                const before = text.slice(Math.max(0, match.index - 8), match.index)
                found.push({
                    token: match[1],
                    file,
                    wrapped: /hsl\(\s*$/i.test(before),
                })
            }
        }
    }
    return found
}

describe("CSS custom properties", () => {
    const defined = definitions()
    const refs = references()

    // Both suites below are only meaningful if the parsers found anything. An
    // empty result reading as a pass is exactly how the original hand-run sweep
    // reported "clean" while silently doing nothing.
    it("parses the theme tokens", () => {
        expect(defined.size).toBeGreaterThan(20)
        expect(defined.get("--background")).toBeDefined()
        expect(defined.get("--node-label")).toBeDefined()
    })

    it("finds the references it is meant to be checking", () => {
        expect(refs.length).toBeGreaterThan(10)
    })

    it("resolves every referenced token", () => {
        const unresolved = refs
            .filter((r) => !RUNTIME_PREFIXES.some((p) => r.token.startsWith(p)))
            .filter((r) => !defined.has(r.token))
            .map((r) => `${r.token} in ${r.file}`)
        expect([...new Set(unresolved)]).toEqual([])
    })

    it("wraps every HSL-triplet token in hsl()", () => {
        const bare = refs
            .filter((r) => !RUNTIME_PREFIXES.some((p) => r.token.startsWith(p)))
            .filter((r) => {
                const value = defined.get(r.token)
                return value !== undefined && HSL_TRIPLET.test(value) && !r.wrapped
            })
            .map((r) => `${r.token} used raw in ${r.file} — needs hsl(var(${r.token}))`)
        expect([...new Set(bare)]).toEqual([])
    })

    it("classifies token values correctly", () => {
        // Protects the rule above from silently matching nothing if the token
        // format ever changes.
        const triplets = [...defined.values()].filter((v) => HSL_TRIPLET.test(v))
        expect(triplets.length).toBeGreaterThan(20)
        expect(HSL_TRIPLET.test("0 0% 9%")).toBe(true)
        expect(HSL_TRIPLET.test("220 9% 46%")).toBe(true)
        expect(HSL_TRIPLET.test("0.5rem")).toBe(false)
    })
})
