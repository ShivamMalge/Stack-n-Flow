"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Code } from "lucide-react"
import { CodeImplementation, Language } from "@/lib/learn-content"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const LANGUAGES: { id: Language; label: string }[] = [
    { id: "python", label: "Python" },
    { id: "java", label: "Java" },
    { id: "cpp", label: "C++" },
    { id: "javascript", label: "JavaScript" },
]

export function MultiLanguageCode({
    implementations,
}: {
    implementations: Partial<Record<Language, CodeImplementation>>
}) {
    const availableLanguages = LANGUAGES.filter((l) => implementations[l.id])
    const [selectedLanguage, setSelectedLanguage] = useState<Language>(
        availableLanguages[0]?.id || "python"
    )

    const currentImpl = implementations[selectedLanguage]

    if (!availableLanguages.length || !currentImpl) {
        return (
            <div className="p-8 border border-dashed rounded-lg text-muted-foreground flex flex-col items-center justify-center gap-2 mt-6">
                <Code className="h-8 w-8 opacity-50" />
                <span className="text-sm">Code implementations coming soon...</span>
            </div>
        )
    }

    return (
        <div className="rounded-xl border shadow-sm overflow-hidden flex flex-col mt-6">
            <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b">
                <div className="font-semibold text-sm flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Implementation
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 gap-2 bg-background">
                            {LANGUAGES.find((l) => l.id === selectedLanguage)?.label}
                            <ChevronsUpDown className="h-3 w-3 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[150px]">
                        {availableLanguages.map((lang) => (
                            <DropdownMenuItem
                                key={lang.id}
                                onClick={() => setSelectedLanguage(lang.id)}
                                className="justify-between cursor-pointer"
                            >
                                {lang.label}
                                {selectedLanguage === lang.id && <Check className="h-4 w-4 text-primary" />}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="bg-[#0d1117] text-[#c9d1d9] p-4 overflow-x-auto text-sm font-mono leading-relaxed max-h-[400px]">
                <pre className="m-0">
                    <code className="block whitespace-pre">{currentImpl.code}</code>
                </pre>
            </div>

            {currentImpl.explanations.length > 0 && (
                <div className="bg-muted/20 p-5 border-t">
                    <h4 className="font-semibold mb-4 text-sm text-foreground">Line-by-line Explanation</h4>
                    <div className="space-y-3">
                        {currentImpl.explanations.map((exp, i) => (
                            <div key={i} className="flex gap-4 text-sm">
                                <div className="bg-primary/10 text-primary font-mono px-2 py-0.5 rounded text-xs shrink-0 self-start mt-0.5 border border-primary/20">
                                    L{exp.line}
                                </div>
                                <div className="text-muted-foreground leading-relaxed pt-0.5">{exp.text}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
