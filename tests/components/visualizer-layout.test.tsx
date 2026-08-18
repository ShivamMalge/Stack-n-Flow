import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import VisualizerLayout from "@/components/visualizers/visualizer-layout"

function renderAll() {
    return render(
        <VisualizerLayout
            controls={<div data-testid="controls">controls</div>}
            visualization={<div data-testid="visualization">viz</div>}
            code={<div data-testid="code">code</div>}
            docs={<div data-testid="docs">docs</div>}
        />,
    )
}

/** The wrapper div a region is placed in, which carries the layout classes. */
function cellOf(testId: string): HTMLElement {
    const el = screen.getByTestId(testId).parentElement
    if (!el) throw new Error(`no cell for ${testId}`)
    return el
}

describe("VisualizerLayout", () => {
    it("renders every region it is given", () => {
        renderAll()
        for (const id of ["controls", "visualization", "code", "docs"]) {
            expect(screen.getByTestId(id)).toBeInTheDocument()
        }
    })

    it("puts the code panel in the same column as the visualization", () => {
        renderAll()
        expect(cellOf("code").parentElement).toBe(cellOf("visualization").parentElement)
    })

    it("puts the docs in the same column as the controls", () => {
        renderAll()
        expect(cellOf("docs").parentElement).toBe(cellOf("controls").parentElement)
    })

    it("keeps the two columns independent, so no region waits on the other side's height", () => {
        // The regression this replaced: code sat at `md:row-start-2` in a grid
        // shared with the controls, so it could not start until the taller
        // controls column had finished, leaving a dead band under the graph.
        renderAll()
        const left = cellOf("controls").parentElement!
        const right = cellOf("visualization").parentElement!
        expect(left).not.toBe(right)
        for (const column of [left, right]) {
            expect(column.className).toContain("contents")
            expect(column.className).toContain("lg:flex-col")
        }
        expect(document.body.innerHTML).not.toContain("row-start")
    })

    it("orders the regions for mobile reading: controls, visualization, code, docs", () => {
        renderAll()
        expect(cellOf("controls").className).toContain("order-1")
        expect(cellOf("visualization").className).toContain("order-2")
        expect(cellOf("code").className).toContain("order-3")
        expect(cellOf("docs").className).toContain("order-4")
    })

    it("omits the regions it is not given", () => {
        render(<VisualizerLayout visualization={<div data-testid="visualization">viz</div>} />)
        expect(screen.getByTestId("visualization")).toBeInTheDocument()
        expect(screen.queryByTestId("code")).not.toBeInTheDocument()
        expect(screen.queryByTestId("docs")).not.toBeInTheDocument()
    })

    it("renders the visualization alone in mini mode", () => {
        render(
            <VisualizerLayout
                mini
                controls={<div data-testid="controls">controls</div>}
                visualization={<div data-testid="visualization">viz</div>}
                code={<div data-testid="code">code</div>}
                docs={<div data-testid="docs">docs</div>}
            />,
        )
        expect(screen.getByTestId("visualization")).toBeInTheDocument()
        expect(screen.queryByTestId("controls")).not.toBeInTheDocument()
        expect(screen.queryByTestId("code")).not.toBeInTheDocument()
        expect(screen.queryByTestId("docs")).not.toBeInTheDocument()
    })

    it("lets a caller override the code cell height", () => {
        render(
            <VisualizerLayout
                visualization={<div data-testid="visualization">viz</div>}
                code={<div data-testid="code">code</div>}
                codeClassName="h-[420px]"
            />,
        )
        expect(cellOf("code").className).toContain("h-[420px]")
    })
})
