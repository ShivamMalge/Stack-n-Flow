/**
 * Loads every page in a headless browser and measures what only shows by looking.
 *
 * Written because a run of defects reached the working tree with a clean
 * typecheck, a green suite and a successful build, and were found only by
 * opening the page: a stack that hid three of twelve items below the fold of a
 * silent scroller, tree nodes rendered outside their drawing area with nothing
 * to scroll to, a logo at 1.01:1 against its own header, rank labels clipped by
 * the top edge, and a Tailwind content glob that purged a whole shared palette.
 *
 * None of those are catchable without layout. This is the instrument for them,
 * kept rather than rebuilt ad hoc each time.
 *
 *   node scripts/visual-audit.mjs                 # all routes, both themes
 *   node scripts/visual-audit.mjs --slug graph    # one visualizer
 *   node scripts/visual-audit.mjs --theme light   # one theme
 *
 * Needs a production server on :3000 and .env.local, because the visualizers
 * sit behind auth:
 *
 *   npx next build && npx next start
 *
 * Playwright is deliberately not a dependency of this project — it would pull a
 * browser download into every `npm ci`. Install it when you want to run this:
 *
 *   npm i -D playwright && npx playwright install chromium
 *
 * Exits non-zero if anything is flagged, so it can gate a release.
 */

import { readFileSync } from "node:fs"
import { encode } from "next-auth/jwt"

const BASE = process.env.AUDIT_BASE_URL ?? "http://localhost:3000"

const args = process.argv.slice(2)
const argValue = (name) => {
    const i = args.indexOf(name)
    return i === -1 ? null : args[i + 1]
}

const onlySlug = argValue("--slug")
const onlyTheme = argValue("--theme")
const THEMES = onlyTheme ? [onlyTheme] : ["dark", "light"]
const VIEWPORTS = [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 390, height: 844 },
]

let chromium
try {
    ({ chromium } = await import("playwright"))
} catch {
    console.error(
        "playwright is not installed.\n" +
        "  npm i -D playwright && npx playwright install chromium",
    )
    process.exit(2)
}

/** Mint a session cookie so the audit can reach the authenticated pages. */
function sessionSecret() {
    const line = readFileSync(".env.local", "utf8")
        .split("\n")
        .map((l) => l.trim())
        .find((l) => l.startsWith("NEXTAUTH_SECRET="))
    if (!line) throw new Error("NEXTAUTH_SECRET not found in .env.local")
    return line.slice("NEXTAUTH_SECRET=".length).replace(/^["']|["']$/g, "")
}

/**
 * Everything the audit measures, evaluated in the page.
 *
 * Each check corresponds to a defect that actually shipped, rather than a
 * generic lint: the point is to stop those specific classes recurring.
 */
function collect(viewportWidth) {
    const findings = []
    const describe = (el) => {
        const cls = String(el.className?.baseVal ?? el.className ?? "").slice(0, 54)
        return `<${el.tagName.toLowerCase()}> ${cls}`.trim()
    }

    // 1. The page itself scrolls sideways.
    const pageOverflow = document.documentElement.scrollWidth - viewportWidth
    if (pageOverflow > 2) findings.push(`page scrolls sideways by ${pageOverflow}px`)

    const inScroller = (el) => {
        let p = el.parentElement
        while (p && p !== document.body) {
            const s = getComputedStyle(p)
            if (["auto", "scroll"].includes(s.overflowX) || ["auto", "scroll"].includes(s.overflow)) return true
            p = p.parentElement
        }
        return false
    }

    for (const el of document.querySelectorAll("main *")) {
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) continue

        // 2. Content past the right edge with no scroller to reach it.
        if (r.right - viewportWidth > 2 && getComputedStyle(el).position !== "fixed" && !inScroller(el)) {
            findings.push(`${describe(el)} extends ${Math.round(r.right - viewportWidth)}px past the viewport`)
        }

        // 3. Content hidden inside overflow:hidden with no way to reveal it.
        const style = getComputedStyle(el)
        if (style.overflow === "hidden" || style.overflowY === "hidden") {
            const hidden = el.scrollHeight - el.clientHeight
            if (hidden > 4 && el.clientHeight > 0) {
                findings.push(`${describe(el)} hides ${hidden}px of content behind overflow:hidden`)
            }
        }
    }

    // 4. SVG children drawn outside their own viewBox. SVG clips to the viewBox
    //    silently and a scroller cannot reach past it, so that content is gone.
    //
    //    This must be measured in *user units* via getBBox() against the
    //    viewBox. getBoundingClientRect() reports a CSS-pixel position that
    //    stays inside the element's box even when the content is clipped —
    //    an earlier version of this check compared client rects and reported
    //    a genuinely clipped label as fine.
    for (const svg of document.querySelectorAll("main svg")) {
        const rect = svg.getBoundingClientRect()
        if (rect.width < 40) continue // a button icon, not a visualization
        const viewBox = (svg.getAttribute("viewBox") ?? "").split(/[\s,]+/).map(Number)
        if (viewBox.length !== 4 || viewBox.some(Number.isNaN)) continue
        const [vx, vy, vw, vh] = viewBox
        for (const child of svg.querySelectorAll("circle, rect, text, line")) {
            let bbox
            let ctm
            try {
                bbox = child.getBBox()
                // getBBox() is in the element's OWN user space and ignores
                // ancestor transforms. The graph draws each node as
                // <g transform="translate(x,y)"><circle r=20>, whose raw bbox
                // is (-20,-20) — which reads as "20 units outside" and is a
                // false positive indistinguishable from a real clip. getCTM()
                // maps it into the svg's viewBox space, which is what the
                // viewBox actually clips against.
                ctm = child.getCTM()
            } catch {
                continue
            }
            if (!bbox || !ctm) continue
            if (bbox.width === 0 && bbox.height === 0) continue

            const corners = [
                [bbox.x, bbox.y],
                [bbox.x + bbox.width, bbox.y],
                [bbox.x, bbox.y + bbox.height],
                [bbox.x + bbox.width, bbox.y + bbox.height],
            ].map(([x, y]) => ({ x: ctm.a * x + ctm.c * y + ctm.e, y: ctm.b * x + ctm.d * y + ctm.f }))
            const minX = Math.min(...corners.map((c) => c.x))
            const maxX = Math.max(...corners.map((c) => c.x))
            const minY = Math.min(...corners.map((c) => c.y))
            const maxY = Math.max(...corners.map((c) => c.y))

            const worst = Math.max(vx - minX, vy - minY, maxX - (vx + vw), maxY - (vy + vh))
            if (worst > 1) {
                const label = (child.textContent ?? "").trim().slice(0, 8)
                findings.push(
                    `<${child.tagName}>${label ? ` "${label}"` : ""} is ${Math.round(worst)} user-units outside the viewBox`,
                )
            }
        }

        // 5. An svg squeezed below its intrinsic size renders everything
        //    smaller instead of scrolling — usually a flex child that needs
        //    shrink-0. Measured as the ratio of rendered width to width attr.
        const attrWidth = Number(svg.getAttribute("width"))
        if (attrWidth > 0 && rect.width / attrWidth < 0.95) {
            findings.push(
                `svg scaled to ${(rect.width / attrWidth).toFixed(2)}x its intrinsic width ` +
                `(${Math.round(rect.width)}px of ${attrWidth}px) instead of scrolling`,
            )
        }
    }

    return { findings: [...new Set(findings)].slice(0, 8), height: document.documentElement.scrollHeight }
}

const token = await encode({
    secret: sessionSecret(),
    maxAge: 60 * 60,
    token: {
        id: "visual-audit",
        sub: "visual-audit",
        name: "Visual Audit",
        email: "visual-audit@localhost",
        role: "STUDENT",
        onboardingCompleted: true,
    },
})

const browser = await chromium.launch()
const context = await browser.newContext()
await context.addCookies([{
    name: "next-auth.session-token",
    value: token,
    domain: new URL(BASE).hostname,
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
}])

// Routes come from the running index page rather than a hand-kept list, so a
// new visualizer is audited the moment it appears in the catalog.
const discovery = await context.newPage()
const indexResponse = await discovery.goto(`${BASE}/visualize`, { waitUntil: "networkidle" })
if (!indexResponse || indexResponse.status() >= 400) {
    console.error(`Could not load ${BASE}/visualize — is the server running?`)
    process.exit(2)
}
let routes = await discovery.evaluate(() =>
    [...new Set([...document.querySelectorAll('a[href^="/visualize/"]')].map((a) => a.getAttribute("href")))],
)
await discovery.close()

if (routes.length === 0) {
    console.error("Found no visualizer links on /visualize — the session cookie was probably rejected.")
    process.exit(2)
}

routes = ["/", "/learn", "/syllabus", "/operations", "/visualize", ...routes]
if (onlySlug) routes = routes.filter((r) => r.endsWith(`/${onlySlug}`))

let failures = 0
let checked = 0

for (const theme of THEMES) {
    const themed = await browser.newContext({ viewport: VIEWPORTS[0] })
    await themed.addCookies([{
        name: "next-auth.session-token", value: token,
        domain: new URL(BASE).hostname, path: "/", httpOnly: true, sameSite: "Lax",
    }])
    await themed.addInitScript((t) => localStorage.setItem("theme", t), theme)

    for (const viewport of VIEWPORTS) {
        const page = await themed.newPage()
        await page.setViewportSize({ width: viewport.width, height: viewport.height })

        for (const route of routes) {
            const consoleErrors = []
            const onError = (e) => consoleErrors.push(String(e).split("\n")[0].slice(0, 120))
            const onConsole = (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 120)) }
            page.on("pageerror", onError)
            page.on("console", onConsole)

            try {
                await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 45000 })
                // Visualizers arrive via next/dynamic; wait out the skeleton.
                await page
                    .waitForFunction(() => document.querySelectorAll(".animate-pulse").length === 0, { timeout: 15000 })
                    .catch(() => {})
                await page.waitForTimeout(250)

                const { findings } = await page.evaluate(collect, viewport.width)
                const all = [...findings, ...[...new Set(consoleErrors)].map((e) => `console: ${e}`)]
                checked++

                if (all.length) {
                    failures++
                    console.log(`\nFAIL ${route}  [${theme}/${viewport.name}]`)
                    for (const finding of all) console.log(`       ${finding}`)
                }
            } catch (error) {
                failures++
                console.log(`\nFAIL ${route}  [${theme}/${viewport.name}]`)
                console.log(`       ${String(error).split("\n")[0].slice(0, 140)}`)
            } finally {
                page.off("pageerror", onError)
                page.off("console", onConsole)
            }
        }
        await page.close()
    }
    await themed.close()
}

await browser.close()

console.log(
    `\n${checked} page loads checked across ${routes.length} routes, ` +
    `${THEMES.length} theme(s) and ${VIEWPORTS.length} viewports.`,
)
if (failures) {
    console.log(`${failures} flagged.`)
    process.exit(1)
}
console.log("No layout or console problems found.")
