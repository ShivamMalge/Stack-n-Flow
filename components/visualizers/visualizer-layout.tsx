"use client"

import type { ReactNode } from "react"

interface VisualizerLayoutProps {
    /** Inputs and buttons that drive the structure. */
    controls?: ReactNode
    /** The structure itself. The only region every visualizer must supply. */
    visualization: ReactNode
    /** Live code panel, shown directly beneath the visualization on desktop. */
    code?: ReactNode
    /** Explanatory notes, shown beneath the controls on desktop. */
    docs?: ReactNode
    /** Embedded mode used by /learn: the visualization alone, full width. */
    mini?: boolean
    /** Override the code cell height when a panel needs more room. */
    codeClassName?: string
}

/**
 * The single layout used by every visualizer.
 *
 * Previously each visualizer hand-placed four cells in a 2x2 grid with
 * `md:col-start-*` / `md:row-start-*`. A grid row is as tall as its tallest
 * cell, so the code panel in row 2 could not start until the *controls* in
 * row 1 had finished — leaving a dead band under the visualization as tall as
 * the difference between them. On the graph visualizer that was roughly 400px
 * of empty page.
 *
 * The two sides are therefore independent columns, not grid rows. On mobile the
 * column wrappers are `display: contents`, so the four regions collapse back
 * into the parent grid and `order-*` sequences them in reading order:
 * controls, visualization, code, docs.
 */
export default function VisualizerLayout({
    controls,
    visualization,
    code,
    docs,
    mini = false,
    codeClassName = "h-[280px]",
}: VisualizerLayoutProps) {
    if (mini) {
        return <div className="flex flex-col w-full">{visualization}</div>
    }

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
            <div className="contents lg:flex lg:flex-col lg:gap-6 lg:min-w-0">
                {controls && <div className="order-1 min-w-0">{controls}</div>}
                {docs && <div className="order-4 min-w-0">{docs}</div>}
            </div>

            <div className="contents lg:flex lg:flex-col lg:gap-6 lg:min-w-0">
                <div className="order-2 min-w-0">{visualization}</div>
                {code && <div className={`order-3 min-w-0 ${codeClassName}`}>{code}</div>}
            </div>
        </div>
    )
}
