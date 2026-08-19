/**
 * Multi-language code templates for the visualizers.
 *
 * The panels used to hold a single array of pseudocode lines, highlighted by
 * array index. That cannot survive more than one language: the same algorithm
 * is 5 lines of Python and 11 of C, so no shared index means the same thing in
 * both.
 *
 * So highlighting keys on a **step** instead. Each line may declare which
 * semantic step it belongs to, a visualizer reports the step it is currently
 * executing, and every language highlights whichever of its own lines carry
 * that step. A step may cover several lines — a `for` header and its opening
 * brace, say — which is exactly what braced languages need.
 *
 * Python is required on every template because it is the language the rest of
 * the site teaches in. The others are optional, and the panel only offers what
 * a template actually provides.
 */

export const LANGUAGES = ["python", "c", "cpp", "java", "rust"] as const

export type Language = (typeof LANGUAGES)[number]

export const LANGUAGE_LABELS: Record<Language, string> = {
    python: "Python",
    c: "C",
    cpp: "C++",
    java: "Java",
    rust: "Rust",
}

/** Remembered across pages, so a student picks their language once. */
export const LANGUAGE_STORAGE_KEY = "snf.code-language"

export interface CodeLine {
    text: string
    /**
     * Semantic step this line belongs to. Lines without one are never
     * highlighted — declarations, closing braces, blank lines.
     */
    step?: number
}

export interface CodeTemplate {
    title: string
    /** Python is mandatory; the panel only offers languages present here. */
    sources: { python: CodeLine[] } & Partial<Record<Language, CodeLine[]>>
}

/**
 * Builds lines from a plain string array, marking each line with its own index
 * as its step.
 *
 * Lets an existing single-language panel become a template without rewriting
 * its step numbering: index and step coincide, which is what those visualizers
 * already assume.
 */
export function linesFromArray(source: readonly string[]): CodeLine[] {
    return source.map((text, step) => ({ text, step }))
}

/** Languages a template actually provides, in a stable order. */
export function availableLanguages(template: CodeTemplate): Language[] {
    return LANGUAGES.filter((language) => (template.sources[language]?.length ?? 0) > 0)
}

/**
 * Marks up a language's source with steps taken from a control string.
 *
 * The source is a template literal, so it reads as code rather than as an
 * escaped string. The control string carries one token per line: a number for
 * a step, or `.` for a line that is never highlighted. Keeping the two beside
 * each other makes the mapping visible at a glance.
 *
 *     src(`
 *     for (int i = 0; i < n; i++) {
 *         sum += a[i];
 *     }`, ". 1 2 .")
 *
 * Throws on a count mismatch, which is the one mistake that would otherwise
 * mis-highlight silently — every template is built at module load, so a
 * mistake fails the moment anything imports it.
 */
export function src(source: string, steps: string): CodeLine[] {
    const texts = source
        .replace(/^\n/, "")
        .replace(/\n[ \t]*$/, "")
        .split("\n")
    const tokens = steps.trim().split(/\s+/)
    if (texts.length !== tokens.length) {
        throw new Error(
            `code template mismatch in "${texts[0]?.trim().slice(0, 60) ?? "?"}": ` +
            `${texts.length} lines against ${tokens.length} step markers.` +
            "\n" +
            texts
                .map((t, i) => `  ${(tokens[i] ?? "MISSING").padStart(7)}  ${t}`)
                .join("\n"),
        )
    }
    return texts.map((text, i) => {
        const token = tokens[i]
        return token === "." ? { text } : { text, step: Number(token) }
    })
}
