import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeft, BookOpen, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import VisualizerHost from "@/components/visualizers/visualizer-host"
import VisualizerSwitcher from "@/components/visualizers/visualizer-switcher"
import { CATEGORY_LABELS, VISUALIZERS, getVisualizer } from "@/lib/visualizer-catalog"

export function generateStaticParams() {
    return VISUALIZERS.map((v) => ({ slug: v.slug }))
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>
}): Promise<Metadata> {
    const { slug } = await params
    const entry = getVisualizer(slug)
    if (!entry) return { title: "Not Found" }
    return {
        title: `${entry.name} — Stack'n'Flow`,
        description: entry.description,
    }
}

export default async function VisualizerPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const entry = getVisualizer(slug)
    if (!entry) notFound()

    const { name, description, icon: Icon, category, hasLearnModule } = entry

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
                {/* Breadcrumb, so the page says where it sits without a heading row. */}
                <nav aria-label="Breadcrumb" className="mb-4">
                    <ol className="flex items-center gap-1 text-sm text-muted-foreground">
                        <li>
                            <Link href="/visualize" className="hover:text-foreground transition-colors">
                                Visualize
                            </Link>
                        </li>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <li>
                            <Link
                                href={`/visualize#${category}`}
                                className="hover:text-foreground transition-colors"
                            >
                                {CATEGORY_LABELS[category]}
                            </Link>
                        </li>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <li className="text-foreground font-medium" aria-current="page">
                            {name}
                        </li>
                    </ol>
                </nav>

                {/* Title row: name, one-line description, and the two escapes
                    (sibling switcher, learn module) on a single line so the
                    visualizer itself starts as high up the page as possible. */}
                <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="h-11 w-11 shrink-0 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl md:text-2xl font-bold leading-tight truncate">{name}</h1>
                            <p className="text-sm text-muted-foreground truncate">{description}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <VisualizerSwitcher current={slug} />
                        {hasLearnModule && (
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/learn/${slug}`}>
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    Learn
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                <VisualizerHost slug={slug} />

                <div className="mt-8">
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/visualize">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            All visualizers
                        </Link>
                    </Button>
                </div>
            </main>

            <Footer />
        </div>
    )
}
