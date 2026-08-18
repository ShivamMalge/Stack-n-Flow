import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight, Check, CircleDashed, CircleDot } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import {
    COURSES,
    courseCoverage,
    type Coverage,
    type SyllabusTopic,
} from "@/lib/config/syllabus"
import { getVisualizer, visualizerHref } from "@/lib/visualizer-catalog"
import { operationsHref } from "@/lib/config/operations"

export const metadata: Metadata = {
    title: "Syllabus Coverage — Stack'n'Flow",
    description:
        "VTU BCS304 and BCS401 module by module, each topic mapped to the visualizer that teaches it.",
}

const COVERAGE_STYLE: Record<Coverage, { label: string; className: string; Icon: typeof Check }> = {
    full: {
        label: "Covered",
        className: "text-emerald-700 dark:text-emerald-300 border-emerald-600/30 bg-emerald-500/10",
        Icon: Check,
    },
    partial: {
        label: "Partial",
        className: "text-amber-700 dark:text-amber-300 border-amber-600/30 bg-amber-500/10",
        Icon: CircleDot,
    },
    none: {
        label: "Planned",
        className: "text-muted-foreground border-border bg-muted/40",
        Icon: CircleDashed,
    },
}

function CoverageBadge({ coverage }: { coverage: Coverage }) {
    const { label, className, Icon } = COVERAGE_STYLE[coverage]
    return (
        <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}
        >
            <Icon className="h-3 w-3" aria-hidden="true" />
            {label}
        </span>
    )
}

/** Where a topic is taught: a visualizer page, or a tab on /operations. */
function surfaceLink(topic: SyllabusTopic): { href: string; label: string } | null {
    if (topic.visualizer) {
        const entry = getVisualizer(topic.visualizer)
        if (entry) return { href: visualizerHref(entry.slug), label: entry.shortName ?? entry.name }
    }
    if (topic.operations) {
        return { href: operationsHref(topic.operations), label: "Operations" }
    }
    return null
}

function TopicRow({ topic }: { topic: SyllabusTopic }) {
    const link = surfaceLink(topic)

    return (
        <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
                <p className="text-sm font-medium leading-snug">{topic.title}</p>
                {topic.note && (
                    <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{topic.note}</p>
                )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
                {link && (
                    <Link
                        href={link.href}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                        {link.label}
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                )}
                <CoverageBadge coverage={topic.coverage} />
            </div>
        </li>
    )
}

export default function SyllabusPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
                <div className="max-w-3xl mb-10">
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">Syllabus Coverage</h1>
                    <p className="text-muted-foreground">
                        Every module of VTU BCS304 and BCS401, transcribed from the official course
                        material, with the visualizer that teaches each topic. Topics still to be
                        built are listed rather than hidden — this is the project&apos;s own to-do list.
                    </p>
                </div>

                <div className="space-y-14">
                    {COURSES.map((course) => {
                        const stats = courseCoverage(course)
                        return (
                            <section key={course.code} id={course.code.toLowerCase()} className="scroll-mt-20">
                                <div className="mb-6 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-lg font-semibold">{course.name}</h2>
                                            <span className="rounded border px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                                                {course.code}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Semester {course.semester} · {course.scheme} scheme · {course.modules.length} modules
                                        </p>
                                    </div>

                                    <div className="sm:text-right">
                                        <p className="text-sm font-medium">{stats.percent}% covered</p>
                                        <p className="text-xs text-muted-foreground">
                                            {stats.full} covered · {stats.partial} partial · {stats.none} planned
                                        </p>
                                        {/* Partial counts half, so the bar cannot overstate the position. */}
                                        <div
                                            className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted sm:w-48"
                                            role="img"
                                            aria-label={`${stats.percent} percent of ${course.code} topics covered`}
                                        >
                                            <div className="h-full rounded-full bg-primary" style={{ width: `${stats.percent}%` }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-5 lg:grid-cols-2">
                                    {course.modules.map((module) => (
                                        <div key={module.number} className="rounded-xl border bg-card p-4">
                                            <div className="mb-1 flex items-baseline gap-2">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                                                    Module {module.number}
                                                </span>
                                            </div>
                                            <h3 className="mb-2 font-medium leading-snug">{module.title}</h3>
                                            <ul className="divide-y">
                                                {module.topics.map((topic) => (
                                                    <TopicRow key={topic.title} topic={topic} />
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )
                    })}
                </div>
            </main>

            <Footer />
        </div>
    )
}
