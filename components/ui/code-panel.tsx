"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Code2 } from "lucide-react"
import {
    availableLanguages,
    linesFromArray,
    LANGUAGE_LABELS,
    LANGUAGE_STORAGE_KEY,
    type CodeLine,
    type CodeTemplate,
    type Language,
} from "@/lib/code-templates"

interface CodePanelProps {
    /** Single-language form. Highlighted by array index. */
    code?: string[]
    activeLine?: number | null
    /** Multi-language form. Highlighted by step. */
    template?: CodeTemplate
    activeStep?: number | null
    title?: string
}

/**
 * Keywords worth colouring across the five languages the templates offer.
 * A shared set is deliberate: this is a teaching panel, not an editor, and a
 * per-language grammar would be a lot of machinery for a dozen snippets.
 */
const KEYWORDS = new Set([
    // shared control flow
    "if", "else", "elif", "while", "for", "do", "switch", "case", "break",
    "continue", "return", "in", "from", "to", "match",
    // declarations
    "def", "function", "fn", "let", "const", "var", "mut", "struct", "class",
    "public", "private", "static", "void", "new", "typedef", "template",
    "impl", "pub", "auto", "using", "namespace", "include", "import",
    // types
    "int", "float", "double", "char", "bool", "long", "short", "unsigned",
    "size_t", "usize", "i32", "u32", "f64", "String", "vec", "Vec",
])

const SPECIAL_VALUES = new Set(["true", "false", "null", "None", "nullptr", "NULL", "Some", "None_"])

// Comment to end of line (# or //) | string literal | identifier | integer.
// Everything else falls through as plain text, so a line is always reproduced
// exactly.
const TOKEN_PATTERN = /(#.*|\/\/.*)|("(?:[^"\\]|\\.)*")|([A-Za-z_][A-Za-z0-9_]*)|(\d+)/g

interface Token {
    text: string
    className?: string
}

/**
 * Splits a line into highlight tokens. Rendering these as React elements keeps
 * the panel safe for caller-supplied strings — an earlier implementation built
 * an HTML string and injected it with dangerouslySetInnerHTML, which would
 * execute markup embedded in the code it was asked to display.
 */
function tokenizeLine(line: string): Token[] {
    const tokens: Token[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    TOKEN_PATTERN.lastIndex = 0
    while ((match = TOKEN_PATTERN.exec(line)) !== null) {
        const [text, comment, string, word, digits] = match

        if (match.index > lastIndex) {
            tokens.push({ text: line.slice(lastIndex, match.index) })
        }

        if (comment) {
            // Pinned rather than `text-muted-foreground`: this panel is always a
            // dark surface, and the muted token resolves to a mid grey in the
            // light theme that fails contrast against it.
            tokens.push({ text, className: "text-slate-400" })
        } else if (string) {
            tokens.push({ text, className: "text-emerald-400" })
        } else if (word && KEYWORDS.has(word)) {
            tokens.push({ text, className: "text-purple-400" })
        } else if (word && SPECIAL_VALUES.has(word)) {
            tokens.push({ text, className: "text-orange-400" })
        } else if (digits) {
            tokens.push({ text, className: "text-yellow-400" })
        } else {
            tokens.push({ text })
        }

        lastIndex = match.index + text.length
    }

    if (lastIndex < line.length) {
        tokens.push({ text: line.slice(lastIndex) })
    }

    return tokens
}

export default function CodePanel({
    code,
    activeLine = null,
    template,
    activeStep = null,
    title,
}: CodePanelProps) {
    const languages = useMemo(() => (template ? availableLanguages(template) : []), [template])
    const [language, setLanguage] = useState<Language>("python")

    // The choice is remembered so a student picks a language once rather than on
    // every visualizer. Read in an effect because localStorage does not exist
    // during the server render.
    useEffect(() => {
        try {
            const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null
            if (stored) setLanguage(stored)
        } catch {
            // Private mode or a blocked store: the default is fine.
        }
    }, [])

    const chooseLanguage = (next: Language) => {
        setLanguage(next)
        try {
            window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next)
        } catch {
            // Not being able to remember the choice is not worth failing over.
        }
    }

    // Fall back to Python when the stored choice is not offered by this
    // template, so a page never renders an empty panel.
    const shown: Language = template && languages.includes(language) ? language : "python"

    const lines: CodeLine[] = useMemo(() => {
        if (template) return template.sources[shown] ?? template.sources.python
        return code ? linesFromArray(code) : []
    }, [template, shown, code])

    const highlighted = template ? activeStep : activeLine
    const isActive = (line: CodeLine) => highlighted !== null && line.step === highlighted

    const lineRefs = useRef<(HTMLDivElement | null)[]>([])
    const firstActive = lines.findIndex(isActive)

    useEffect(() => {
        if (firstActive < 0) return
        const el = lineRefs.current[firstActive]
        const container = el?.parentElement?.parentElement
        if (!el || !container) return
        container.scrollTo({
            top: Math.max(0, el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2),
            behavior: "smooth",
        })
    }, [firstActive])

    const heading = title ?? template?.title ?? "Pseudocode"

    return (
        // Deliberately a dark surface in both themes, the way an editor pane is.
        // The colours below are therefore pinned slates rather than theme tokens,
        // which would invert and break the syntax palette in light mode.
        <Card className="flex flex-col h-full bg-slate-950 border-slate-800 shadow-xl overflow-hidden">
            <CardHeader className="py-2.5 px-4 border-b border-slate-800 bg-slate-900/50 shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-200">
                        <Code2 className="h-4 w-4 text-blue-400" />
                        {heading}
                    </CardTitle>

                    {languages.length > 1 && (
                        <div role="tablist" aria-label="Language" className="flex flex-wrap gap-0.5">
                            {languages.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    role="tab"
                                    aria-selected={shown === option}
                                    onClick={() => chooseLanguage(option)}
                                    className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${shown === option
                                        ? "bg-blue-500/20 text-blue-300"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                                        }`}
                                >
                                    {LANGUAGE_LABELS[option]}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-hidden">
                {lines.length === 0 ? (
                    // Every caller starts with an empty code array, so without this
                    // the first thing a visitor saw on each visualizer page was an
                    // unexplained empty black rectangle.
                    <div className="flex h-full items-center justify-center px-6 text-center">
                        <p className="text-xs text-slate-500">
                            Run an operation to follow the code line by line.
                        </p>
                    </div>
                ) : (
                    <div className="h-full overflow-auto scrollbar-thin scrollbar-thumb-slate-700">
                        <div className="py-4 font-mono text-[11px] md:text-xs leading-relaxed">
                            {lines.map((line, idx) => {
                                const active = isActive(line)
                                return (
                                    <div
                                        key={idx}
                                        ref={(el) => { lineRefs.current[idx] = el }}
                                        className={`flex items-start px-4 py-0.5 transition-colors duration-200 ${active ? "bg-blue-500/20 border-l-2 border-blue-500" : "border-l-2 border-transparent"}`}
                                    >
                                        <span className={`w-6 shrink-0 text-right mr-4 select-none ${active ? "text-blue-400 font-bold" : "text-slate-500"}`}>
                                            {idx + 1}
                                        </span>
                                        <span className={`whitespace-pre transition-colors duration-200 ${active ? "text-white" : "text-slate-300"}`}>
                                            {tokenizeLine(line.text).map((token, tokenIdx) => (
                                                <span key={tokenIdx} className={token.className}>
                                                    {token.text}
                                                </span>
                                            ))}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
