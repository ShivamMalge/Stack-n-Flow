"use client"

import Link from "next/link"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    CATEGORY_LABELS,
    getVisualizer,
    shortNameOf,
    visualizerHref,
    visualizersIn,
    type VisualizerCategory,
} from "@/lib/visualizer-catalog"

const CATEGORIES: VisualizerCategory[] = ["data-structures", "algorithms"]

/**
 * Jump between visualizers without going back to the index. The tab strip that
 * used to do this job sat in the page body and cost two rows of vertical space
 * on every visit.
 */
export default function VisualizerSwitcher({ current }: { current: string }) {
    const entry = getVisualizer(current)

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="justify-between gap-2 min-w-[9rem]">
                    <span className="truncate">{entry ? shortNameOf(entry) : "Choose"}</span>
                    <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 max-h-[70vh] overflow-y-auto">
                {CATEGORIES.map((category, index) => (
                    <div key={category}>
                        {index > 0 && <DropdownMenuSeparator />}
                        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                            {CATEGORY_LABELS[category]}
                        </DropdownMenuLabel>
                        {visualizersIn(category).map((item) => (
                            <DropdownMenuItem key={item.slug} asChild>
                                <Link href={visualizerHref(item.slug)} className="cursor-pointer">
                                    <item.icon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
                                    <span className="flex-1 truncate">{shortNameOf(item)}</span>
                                    {item.slug === current && <Check className="ml-2 h-4 w-4 shrink-0" />}
                                </Link>
                            </DropdownMenuItem>
                        ))}
                    </div>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
