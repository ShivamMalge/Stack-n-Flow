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
 * Exits non-zero if the bundle fails to import, fails to render, or produces
 * console errors.
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
page.on("pageerror", (e) => errors.push("PAGEERROR: " + (e.stack || String(e)).split("\n").slice(0, 4).join(" | ")))
page.on("console", (m) => { if (m.type() === "error") errors.push("CONSOLE: " + m.text().slice(0, 400)) })

await page.goto("http://localhost:4321/index.html")

const result = await page.evaluate(async () => {
  const out = { imported: false, hasDefault: false, keys: [], rendered: false, html: "", error: null }
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

  // Minimal stand-in for the anywidget model.
  const state = { structure: "STACK", nodes: [{ id: "a", value: 10 }, { id: "b", value: 20 }] }
  const model = {
    get: (k) => state[k],
    set: (k, v) => { state[k] = v },
    save_changes: () => {},
    on: () => {},
    off: () => {},
  }

  const el = document.getElementById("host")
  try {
    const render = mod.default?.render
    if (typeof render !== "function") {
      out.error = "default.render is not a function; default is " + typeof mod.default
      return out
    }
    await render({ model, el })
    await new Promise((r) => setTimeout(r, 600))
    out.rendered = true
    out.html = el.innerHTML.slice(0, 300)
  } catch (e) {
    out.error = "RENDER FAILED: " + (e && e.stack ? e.stack.split("\n").slice(0, 5).join(" | ") : String(e))
  }
  return out
})

console.log("imported      ", result.imported)
console.log("module keys   ", result.keys)
console.log("has default   ", result.hasDefault)
console.log("render called ", result.rendered)
console.log("innerHTML     ", result.html ? result.html.slice(0, 200) : "(empty)")
if (result.error) console.log("\n!! " + result.error)
if (errors.length) { console.log("\nbrowser errors:"); for (const e of [...new Set(errors)].slice(0, 6)) console.log("  " + e) }
else console.log("\nno browser errors")

await browser.close()
server.close()

const problems = []
if (!result.imported) problems.push("the bundle did not import")
if (!result.hasDefault) problems.push("no default export")
if (!result.rendered) problems.push("render() did not complete")
if (!result.html || result.html.length < 40) problems.push("render produced no markup")
if (result.error) problems.push(result.error)
if (errors.length) problems.push(`${errors.length} browser error(s)`)

if (problems.length) {
  console.log("\nFAILED: " + problems.join("; "))
  process.exit(1)
}
console.log("\nBundle imports, renders, and produces markup with no console errors.")
