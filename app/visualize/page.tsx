import Link from "next/link"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { ArrowRight } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import {
    CATEGORY_LABELS,
    getVisualizer,
    visualizersIn,
    visualizerHref,
    type VisualizerCategory,
} from "@/lib/visualizer-catalog"

export const metadata: Metadata = {
    title: "Interactive Visualizer — Stack'n'Flow",
    description: "Step through data structures and algorithms one operation at a time.",
}

const CATEGORIES: VisualizerCategory[] = ["data-structures", "algorithms"]

function first(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value[0] : value
}

export default async function VisualizePage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
    // Legacy deep links: /visualize?ds=stack and ?algo=quick-sort predate the
    // per-visualizer routes and are still in the wild, so they redirect rather
    // than 404.
    const params = await searchParams
    const legacy = first(params.ds) ?? first(params.algo)
    if (legacy && getVisualizer(legacy)) {
        redirect(visualizerHref(legacy))
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
                <div className="max-w-2xl mb-10">
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">Interactive Visualizer</h1>
                    <p className="text-muted-foreground">
                        Pick a structure or an algorithm. Each one opens on its own page with the
                        controls, the animation, and the code running side by side.
                    </p>
                </div>

                {CATEGORIES.map((category) => (
                    <section key={category} id={category} className="mb-12 scroll-mt-20">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-3">
                            {CATEGORY_LABELS[category]}
                            <span className="text-xs font-normal text-muted-foreground">
                                {visualizersIn(category).length} available
                            </span>
                        </h2>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {visualizersIn(category).map((item) => (
                                <Link
                                    key={item.slug}
                                    href={visualizerHref(item.slug)}
                                    className="group flex items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
                                >
                                    <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                                        <item.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <h3 className="font-medium leading-tight">{item.name}</h3>
                                            <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 transition-all group-hover:opacity-60 group-hover:translate-x-0" />
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                ))}
            </main>

            <Footer />
        </div>
    )
}
