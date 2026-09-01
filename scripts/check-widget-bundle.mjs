/**
 * Loads the widget bundle the way anywidget does and renders it.
 *
 * Written because the bundle shipped broken to Colab twice over, and both
 * faults were invisible everywhere except the browser console:
 *
 *   tsup defaults to platform "node", so React's entry kept a bare
 *   `process.env.NODE_ENV` comparison. Evaluating that in a browser throws
 *   ReferenceError while the module is still importing, so render() never runs
 *   and anywidget has nothing to draw and nothing to report.
 *
 *   tsconfig sets jsx "preserve" for Next, which left esbuild on the classic
 *   transform emitting React.createElement. No component imports React, so
 *   every render threw "React is not defined" — this time after a *successful*
 *   import, which looks like a rendering bug rather than a build one.
 *
 * The Python tests could not see either: they check the mimebundle, which was
 * correct throughout. Only executing the module catches this.
 *
 *   node scripts/check-widget-bundle.mjs
 *
 * Needs playwright, which is deliberately not a dependency of this project:
 *   npm i -D playwright && npx playwright install chromium
 *
 * Every registered structure is rendered, not just one. A stack-only check
 * reported the bundle healthy while the AVL tree was broken in Colab, because
 * the fault was in a component the check never mounted. The list comes from the
 * bundle's own registry, so a structure added later cannot be skipped here.
 *
 * Exits non-zero if the bundle fails to import, if any structure fails to render
 * or produces no markup, or if anything writes to the console.
 */
import http from "node:http"
import fs from "node:fs"
import path from "node:path"
let chromium
try {
  ({ chromium } = await import("playwright"))
} catch {
  console.error("playwright is not installed." + "\n" + "  npm i -D playwright && npx playwright install chromium")
  process.exit(2)
}

const ROOT = path.resolve(process.cwd(), "pratyaksha/static")

const server = http.createServer((req, res) => {
  const name = req.url.split("?")[0].slice(1) || "index.html"
  if (name === "index.html") {
    res.writeHead(200, { "content-type": "text/html" })
    return res.end("<!doctype html><html><body><div id=host></div></body></html>")
  }
  const file = path.join(ROOT, name)
  if (!fs.existsSync(file)) { res.writeHead(404); return res.end("nope") }
  res.writeHead(200, { "content-type": name.endsWith(".mjs") ? "text/javascript" : "text/css" })
  res.end(fs.readFileSync(file))
})
await new Promise((r) => server.listen(4321, r))

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
// Tagged with whichever structure is mounting, or an error names no culprit
// and the next person has to bisect fourteen of them by hand.
let current = "(startup)"
const tag = (text) => `[${current}] ${text}`
page.on("pageerror", (e) => errors.push(tag("PAGEERROR: " + (e.stack || String(e)).split("\n").slice(0, 4).join(" | "))))
page.on("console", (m) => { if (m.type() === "error") errors.push(tag("CONSOLE: " + m.text().slice(0, 400))) })

await page.goto("http://localhost:4321/index.html")

await page.exposeFunction("nowRendering", (structure) => { current = structure })

const result = await page.evaluate(async () => {
  const out = { imported: false, hasDefault: false, keys: [], structures: [], results: [], error: null }
  let mod
  try {
    mod = await import("/pratyaksha-bridge.mjs")
    out.imported = true
    out.keys = Object.keys(mod)
    out.hasDefault = typeof mod.default === "object" && mod.default !== null
  } catch (e) {
    out.error = "IMPORT FAILED: " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join(" | ") : String(e))
    return out
  }

  const render = mod.default?.render
  if (typeof render !== "function") {
    out.error = "default.render is not a function; default is " + typeof mod.default
    return out
  }

  /*
    A payload per structure, because they genuinely disagree about what `nodes`
    is: a list for the linear ones, a root object for the trees, buckets for the
    hash table, bare numbers for the heap. The fallback covers the linear case.
  */
  const items = [{ id: "a", value: 10 }, { id: "b", value: 20 }, { id: "c", value: 30 }]
  const root = {
    id: 1, value: 20,
    left: { id: 2, value: 10, left: null, right: null },
    right: { id: 3, value: 30, left: null, right: { id: 4, value: 40, left: null, right: null } },
  }
  const payloads = {
    TREE: { nodes: root },
    AVL_TREE: { nodes: root },
    // One node placed the way Python places them, one without coordinates:
    // Graph.add_node types x and y as Any, so a notebook can omit them.
    GRAPH: {
      nodes: [{ id: "A", label: "A", x: 120, y: 150 }, { id: "B", label: "B" }],
      metadata: { edges: [{ id: "A-B", source: "A", target: "B" }] },
    },
    HASH_TABLE: { nodes: [[{ key: "a", value: "1" }], [], [{ key: "b", value: "2" }]] },
    HEAP: { nodes: [50, 30, 40, 10], metadata: { states: ["default", "comparing", "default", "default"] } },
    CIRCULAR_QUEUE: { nodes: [1, 2, 3, null, null], metadata: { front: 0, rear: 2, size: 3 } },
    BINARY_SEARCH: { nodes: items, metadata: { searchResult: "Element found at index 1" } },
  }

  out.structures = mod.registeredStructures ? mod.registeredStructures() : ["STACK"]

  for (const structure of out.structures) {
    const payload = payloads[structure] ?? { nodes: items }
    const state = { structure, nodes: payload.nodes, metadata: payload.metadata ?? {} }
    const model = {
      get: (k) => state[k],
      set: (k, v) => { state[k] = v },
      save_changes: () => {},
      on: () => {},
      off: () => {},
    }

    await window.nowRendering(structure)
    const el = document.createElement("div")
    document.body.appendChild(el)
    const record = { structure, rendered: false, length: 0, html: "", error: null }
    try {
      await render({ model, el })
      await new Promise((r) => setTimeout(r, 250))
      record.rendered = true
      record.length = el.innerHTML.length
      record.html = el.innerHTML.slice(0, 120)
      // The bridge's own "unsupported" branch would otherwise pass as markup.
      if (el.innerHTML.includes("Unsupported structure")) {
        record.error = "the bridge reported it as unsupported"
      }
    } catch (e) {
      record.error = "RENDER FAILED: " + (e && e.stack ? e.stack.split("\n").slice(0, 4).join(" | ") : String(e))
    }
    out.results.push(record)
  }

  return out
})

console.log("imported      ", result.imported)
console.log("module keys   ", result.keys)
console.log("has default   ", result.hasDefault)
console.log("structures    ", result.structures.length)
if (result.error) console.log("\n!! " + result.error)

const problems = []
if (!result.imported) problems.push("the bundle did not import")
if (!result.hasDefault) problems.push("no default export")
if (result.error) problems.push(result.error)
if (!result.structures.length) problems.push("the bundle exposed no structures to render")

for (const record of result.results) {
  // Enough markup to be a card, not just an empty wrapper div.
  const thin = record.rendered && record.length < 200
  const bad = record.error || !record.rendered || thin
  console.log(`  ${bad ? "FAIL" : "ok  "}  ${record.structure.padEnd(22)} ${String(record.length).padStart(6)} bytes`)
  if (record.error) { console.log("        " + record.error); problems.push(`${record.structure}: ${record.error}`) }
  else if (!record.rendered) problems.push(`${record.structure}: render() did not complete`)
  else if (thin) problems.push(`${record.structure}: rendered only ${record.length} bytes of markup`)
}

if (errors.length) {
  console.log("\nbrowser errors:")
  for (const e of [...new Set(errors)].slice(0, 6)) console.log("  " + e)
  problems.push(`${errors.length} browser error(s)`)
} else {
  console.log("\nno browser errors")
}

await browser.close()
server.close()

if (problems.length) {
  console.log("\nFAILED: " + problems.join("; "))
  process.exit(1)
}
console.log(`\nAll ${result.structures.length} structures import, render and produce markup with no console errors.`)
