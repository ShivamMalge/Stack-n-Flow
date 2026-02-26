"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Code2 } from "lucide-react"

interface CodePanelProps {
    code: string[]
    activeLine: number | null
    title?: string
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

    const formatLine = (line: string) => {
        // Use unique markers to prevent double-highlighting
        // Process strings/comments first, then keywords, then numbers

        let formatted = line;

        // 1. Comments
        const comments: string[] = [];
        formatted = formatted.replace(/(\/\/.*)/g, (match) => {
            comments.push(match);
            return `__COMMENT_${comments.length - 1}__`;
        });

        // 2. Keywords
        const keywords = ["def", "function", "if", "elif", "else", "while", "for", "return", "const", "let", "var", "in", "from", "to"];
        keywords.forEach(kw => {
            const regex = new RegExp(`\\b${kw}\\b`, 'g');
            formatted = formatted.replace(regex, `<span class="text-purple-400">${kw}</span>`);
        });

        // 3. Spacial values
        const special = ["true", "false", "null", "None"];
        special.forEach(val => {
            const regex = new RegExp(`\\b${val}\\b`, 'g');
            formatted = formatted.replace(regex, `<span class="text-orange-400">${val}</span>`);
        });

        // 4. Numbers (only if not preceded by =" or other tag characters to avoid breaking HTML)
        // This is a simple fix to avoid highlighting numbers that are part of previously added <span> classes
        formatted = formatted.replace(/(?<![="])\b(\d+)\b/g, '<span class="text-yellow-400">$1</span>');

        // 5. Restore comments
        comments.forEach((comment, idx) => {
            formatted = formatted.replace(`__COMMENT_${idx}__`, `<span class="text-muted-foreground">${comment}</span>`);
        });

        return formatted;
    }

    return (
        <Card className="flex flex-col h-full bg-slate-950 border-slate-800 shadow-xl overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-slate-800 bg-slate-900/50">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-200">
                    <Code2 className="h-4 w-4 text-blue-400" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
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
                                    ${activeLine === idx ? "text-blue-400 font-bold" : "text-slate-600"}
                                `}>
                                    {idx + 1}
                                </span>
                                <span
                                    className={`
                                        whitespace-pre transition-colors duration-200
                                        ${activeLine === idx ? "text-white" : "text-slate-300"}
                                    `}
                                    dangerouslySetInnerHTML={{ __html: formatLine(line) }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
