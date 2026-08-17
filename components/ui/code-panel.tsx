"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Code2 } from "lucide-react"

interface CodePanelProps {
    code: string[]
    activeLine: number | null
    title?: string
}

const KEYWORDS = new Set([
    "def", "function", "if", "elif", "else", "while", "for",
    "return", "const", "let", "var", "in", "from", "to",
])

const SPECIAL_VALUES = new Set(["true", "false", "null", "None"])

// Comment to end of line | identifier | integer. Everything else falls through
// as plain text, so the whole line is always reproduced exactly.
const TOKEN_PATTERN = /(\/\/.*)|([A-Za-z_][A-Za-z0-9_]*)|(\d+)/g

interface Token {
    text: string
    className?: string
}

/**
 * Splits a line into highlight tokens. Rendering these as React elements keeps
 * the code panel safe for caller-supplied strings — the previous implementation
 * built an HTML string and injected it with dangerouslySetInnerHTML, which would
 * execute markup embedded in the code it was asked to display.
 */
function tokenizeLine(line: string): Token[] {
    const tokens: Token[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    TOKEN_PATTERN.lastIndex = 0
    while ((match = TOKEN_PATTERN.exec(line)) !== null) {
        const [text, comment, word, digits] = match

        if (match.index > lastIndex) {
            tokens.push({ text: line.slice(lastIndex, match.index) })
        }

        if (comment) {
            // Pinned rather than `text-muted-foreground`: this panel is always a
            // dark surface, and the muted token resolves to a mid grey in the
            // light theme that fails contrast against it.
            tokens.push({ text, className: "text-slate-400" })
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

export default function CodePanel({ code, activeLine, title = "Pseudocode" }: CodePanelProps) {
    const lineRefs = useRef<(HTMLDivElement | null)[]>([])

    useEffect(() => {
        if (activeLine !== null && lineRefs.current[activeLine]) {
            const el = lineRefs.current[activeLine]
            if (el && el.parentElement && el.parentElement.parentElement) {
                const container = el.parentElement.parentElement
                // Calculate position to scroll to center of container
                const containerHeight = container.clientHeight
                const targetScroll = el.offsetTop - (containerHeight / 2) + (el.clientHeight / 2)

                container.scrollTo({
                    top: Math.max(0, targetScroll),
                    behavior: "smooth"
                })
            }
        }
    }, [activeLine])

    return (
        // Deliberately a dark surface in both themes, the way an editor pane is.
        // The colours below are therefore pinned slates rather than theme tokens,
        // which would invert and break the syntax palette in light mode.
        <Card className="flex flex-col h-full bg-slate-950 border-slate-800 shadow-xl overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-slate-800 bg-slate-900/50">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-200">
                    <Code2 className="h-4 w-4 text-blue-400" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
                {code.length === 0 ? (
                    // Every caller starts with an empty `code` array, so without this
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
                        {code.map((line, idx) => (
                            <div
                                key={idx}
                                ref={(el) => { lineRefs.current[idx] = el }}
                                className={`
                                    flex items-start px-4 py-0.5 group transition-colors duration-200
                                    ${activeLine === idx ? "bg-blue-500/20 border-l-2 border-blue-500" : "border-l-2 border-transparent"}
                                `}
                            >
                                <span className={`
                                    w-6 shrink-0 text-right mr-4 select-none
                                    ${activeLine === idx ? "text-blue-400 font-bold" : "text-slate-500"}
                                `}>
                                    {idx + 1}
                                </span>
                                <span
                                    className={`
                                        whitespace-pre transition-colors duration-200
                                        ${activeLine === idx ? "text-white" : "text-slate-300"}
                                    `}
                                >
                                    {tokenizeLine(line).map((token, tokenIdx) => (
                                        <span key={tokenIdx} className={token.className}>
                                            {token.text}
                                        </span>
                                    ))}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                )}
            </CardContent>
        </Card>
    )
}
