# Fixes & Hardening Plan — Stack-n-Flow / Pratyaksha

Audit date: 2026-08-17. Findings are grouped into phases ordered by risk and dependency.
Each item lists the file(s), the problem, and the fix. Severity: 🔴 critical · 🟠 high · 🟡 medium · ⚪ low.

---

## Phase 0 — Repo Hygiene & Baseline ✅ COMPLETE (2026-08-17)

Cheap, mechanical fixes that make every later phase cleaner.

- [x] 🔴 **Put the project under version control.** `git init` on `main`; baseline committed as `b417e14` before any changes, Phase 0 work as `071633f`.
- [x] 🟠 **Delete the nested legacy duplicate** `Stack-n-Flow-main/` (1.2 MB). Recoverable from the baseline commit.
- [x] 🟠 **Fix `.gitignore` corruption.** Rewritten as UTF-8; added `__pycache__/`, `*.py[cod]`, `*.egg-info/`, `.pytest_cache/`, `.venv/`, `venv/`, `*.map`.
- [x] 🟠 **Untrack generated build metadata:** `src/pratyaksha.egg-info/` removed.
- [x] 🟡 **Stop committing the 3.3 MB sourcemap.** `sourcemap: false` in `tsup.config.ts`; `*.map` ignored. Also removed the contradictory `external: ["react", "react-dom"]` line, which `noExternal: [/(.*)/]` on the next line already negated. `dist/` went from 4.0 MB → 824 KB.
- [x] 🟡 **Delete dead code:** `components/data-structure-visualizer.tsx`; `pratyaksha/algorithms.py`; `pratyaksha/data_structures.py` reduced from 261 lines to a 31-line re-export module; unused `StackVisualizer`/`QueueVisualizer` imports in `src/bridge/registry.tsx`.
- [x] 🟡 **`test_pratyaksha.py`** → `scripts/smoke_check.py`, rewritten to state plainly that it is not a verification gate. `README.md`, `documentation.md`, and `docs/architecture/phase-0-baseline.md` now point at `pytest tests/python`.
- [x] ⚪ **Rename the package:** `my-app` → `stack-n-flow`.
- [x] ⚪ **`SECURITY.md`** replaced with a real policy (advisory link, 7-day response, honest version table).

**Verification:** `npm test` → 11 passed (3 files); `npm run verify:bridge` → build succeeds, 746 KB bundle.
Working tree (excluding `node_modules`/`.git`) is now 2.5 MB, down from ~6 MB.

> Note: `npm ci` was run to enable verification, so `node_modules/` now exists locally (correctly gitignored).

---

## Phase 1 — Security ✅ COMPLETE (2026-08-17)

- [x] 🔴 **Privilege escalation via `useSession().update()`** — `lib/auth.ts`. The JWT callback now ignores the client payload on `trigger === "update"` and re-reads `role` / `onboardingCompleted` from the database; `app/(auth)/onboarding/page.tsx` calls `update()` with no arguments.
- [x] 🔴 **XSS-prone renderer** — `components/ui/code-panel.tsx`. `formatLine()` + `dangerouslySetInnerHTML` replaced with a `tokenizeLine()` function emitting React elements, so displayed text can never be parsed as markup. The old number-highlighting `(?<![="])` lookbehind hack — which existed only to avoid corrupting the generated HTML — is gone. Locked in by `tests/components/code-panel.test.tsx`.
- [x] 🟠 **Fail-fast env validation** — new `lib/env.ts` (zod) with `SKIP_ENV_VALIDATION=1` escape hatch for secret-less builds, plus a documented `.env.example` (gitignore exception added). `lib/auth.ts` consumes `env` instead of `process.env.X!`.
- [x] 🟡 **Security headers** — `next.config.ts` now sets CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `images.remotePatterns` for `lh3.googleusercontent.com`.
- [x] 🟡 **Middleware is deny-by-default** — runs on everything except the auth API and static assets; public pages come from an explicit `PUBLIC_ROUTES` allowlist in the new `lib/routes.ts`, which also dedupes the `signIn` path. Verified `/`, `/login`, `/about` stay public and an unknown route requires a session.
- [x] 🟡 **USN validation** — now `/^[A-Z0-9]{4,20}$/` with trim + uppercase normalisation.
- [x] ⚪ **Re-enabled lint rules** — `no-explicit-any` and `no-unused-vars` as `warn` with `^_` ignore patterns.

**Also fixed in passing:** `prisma.config.ts` overrode `datasource.url` eagerly, which broke `prisma generate` (it needs only the schema) whenever `DATABASE_URL` was unset. The override was redundant — `schema.prisma` already declares `env("DATABASE_URL")` — so it was removed.

**Verification:** `npx tsc --noEmit` — no application-code errors (pre-existing test-file errors remain: vitest globals aren't in `tsconfig.json`, worth fixing in Phase 5). `next build` succeeds, 10 routes. `npx vitest run` — 14 passed.

### Known limitations / follow-ups
- **CSP still allows `'unsafe-inline'` and `'unsafe-eval'` in `script-src`**, required by the Next.js runtime's inline bootstrap. A nonce-based policy needs middleware-generated nonces.
- **Logged-in users with incomplete onboarding are now redirected to `/onboarding` from `/` and `/about` too**, since middleware runs on public pages. This matches the original "lock them to onboarding" intent but is a behaviour change.
- **131 Dependabot alerts** (3 critical, 65 high) were reported on the default branch at push time. Some should clear now that the legacy duplicate tree and its stale lockfile are gone; re-check and fold any remainder into a dependency-bump pass.

---

## Phase 2 — De-hardcoding ✅ COMPLETE (2026-08-17)

**New shared modules:** `lib/constants.ts`, `lib/site-config.ts`, `lib/config/institutions.ts`, `components/social-links.tsx`, `pratyaksha/core/structures.py`, `pratyaksha/core/base.py`.

**Verification:** 16 Python tests pass, 14 JS tests pass, `next build` succeeds, `tsc` clean on application code. Confirmed by grep that no `1AT`/Atria literal survives outside `lib/config/institutions.ts`, no social URL outside `lib/site-config.ts`, no `"not greater than 500"` string anywhere, and no `structure="..."` literal in the Python package.

### Behaviour changes worth knowing
- **`parseBoundedInt`'s default lower bound is `-500`, not `1`.** A subagent's first pass defaulted to `1`, which silently made negative keys un-insertable in a BST — a real capability regression. The default now mirrors the upper bound; call sites needing a positive count (array sizes, element counts) pass `{ min: 1 }` explicitly.
- **One speed ladder replaced two.** `sorting-comparison`'s 5× (160 ms) preset is gone; the shared ladder tops out at 3× (267 ms).
- **Two tracking parameters dropped** from the social URLs (Instagram `igsh=` per-share token, LinkedIn `originalSubdomain=` redirect artefact).
- **Search handlers still use raw `Number.parseInt`** in the five tree visualizers (~6 sites). They never had a bound check, and `NaN` there simply reports "not found", so tightening them would add an error path that did not exist. Left for Phase 3.
- **B-tree order input kept its `Math.max/min` clamp** rather than `parseBoundedInt`: routing it through the helper would turn "clamp 7 down to 5" into "reject and reset".
- **`anywidget`, `traitlets` and `pytest` were installed locally** to verify the Python refactor — the suite had never actually been executed before. Phase 5 should pin these in `[project.optional-dependencies]`.

### Web (TypeScript)

- [x] 🟠 **Institution rules baked into JSX** — `app/(auth)/onboarding/page.tsx:73-76,83,167,174-187`: `"atria institute of technology"`, the `1AT` USN prefix (repeated 5×), `maxLength={7}`, and the year/branch whitelist string. Extract `lib/config/institutions.ts` (name → USN prefix, format regex, length); the form derives everything from it. The current code special-cases one college and will silently rot in 2026.
- [x] 🟠 **`500` input limit copy-pasted in 10 files** with inconsistent bounds elsewhere (999 in heap/sorting, 20/15/8 in dp). Create `lib/constants.ts`:
  ```ts
  export const MAX_INPUT_VALUE = 500
  export const SPEED_PRESETS = [1600, 800, 533, 400, 267]
  export const MOBILE_BREAKPOINT = 768
  ```
  and a shared `parsePositiveInt(raw, max)` helper — this also fixes the NaN-bypass bug (Phase 3, B4) in one change.
- [x] 🟡 **Two divergent speed ladders** — `components/ui/animation-controls.tsx:30-36` vs `sorting-comparison.tsx:309-310`. Unify on the shared `SPEED_PRESETS`.
- [x] 🟡 **Duplicated personal/social links** — identical 4-link block in `components/footer.tsx:51-78` and `app/about/page.tsx:71-98` (incl. an Instagram `igsh=` tracking token — strip it). Extract `lib/site-config.ts` + a `<SocialLinks/>` component. Author name also hardcoded twice in `app/about/page.tsx:23,57`.
- [x] 🟡 **Raw hex colors bypassing the theme** — `heap-visualizer.tsx:162-175,224-247` (12 dark-only hex values, invisible in light mode), `multi-language-code.tsx:71`. Move to CSS variables in `globals.css`.
- [x] 🟡 **Hardcoded sample graph + random pixel coords** — `graph-visualizer.tsx:100-122`. Extract a `SAMPLE_GRAPH` constant and compute layout (a `lib/tree-layout.ts` precedent already exists).
- [x] ⚪ Named constants for: hash multiplier `31` + `TABLE_SIZE` (`hash-table-visualizer.tsx:47,62`), pathfinding grid `15×25` + wall density `0.28`, B-tree order bounds `2..5`, seed datasets in linked-list/stack/dp visualizers, `nextId` starting at `4` (collides with seed ids 101–104 — start at `1`).

### Python (Pratyaksha)

- [x] 🟠 **Structure-name literals duplicated across the language boundary** — 14 magic strings hand-written in every constructor **twice** (e.g. `structures/stack.py:47` and `:52`), again in `src/bridge/registry.tsx:22-35` and `pratyaksha-bridge.tsx`. Add a `StructureType` StrEnum in `pratyaksha/core/`, derive `structure_type` from `run.structure` in the base class, and generate the TS union from it.
- [x] 🟡 **`_telemetry_metadata` copy-pasted 8×** with 4 signatures across `pratyaksha/structures/*` — replace with one `telemetry_metadata(event_count, last_op, **extra)` in `core/telemetry.py`. Also merge the ~90%-identical `structures/base.py` and `algorithms/base.py` into one `BaseTelemetryObject` (fixes `event_history()` missing on algorithms).
- [x] ⚪ Named constants: uuid truncation `[:8]` (collision risk), hash `31`, bucket `10`, capacity `5`, `front=0/rear=-1` sentinels. Add `__version__` to `pratyaksha/__init__.py` (version currently stated in 3 places, readable in none).

---

## Phase 3 — Web App Correctness Bugs ✅ COMPLETE (2026-08-17)

**Verification:** `next build` succeeds, **`tsc --noEmit` is now completely clean across the whole project** (test files included, for the first time), 19 JS tests pass (5 new in `tests/components/visualizer-modes.test.tsx` lock in the mini/controlled behaviour), 16 Python tests still pass.

Two extras beyond the checklist: `window.alert()` is gone from all ten visualizers, replaced by a shared `components/ui/inline-alert.tsx` rendered next to the offending input; and `tsconfig.json` now declares `vitest/globals` + `@testing-library/jest-dom`, which cleared the "Cannot find name describe/it/expect" errors that had been reported in every test file (this was listed as a Phase 5 item).

### Two extra bugs found while fixing the timers
Neither was in the original audit; both were found by reading the code around the timer cleanup.
- **Zooming the B-tree wiped it.** Its init effect depended on the memoised drag handlers, which are recreated whenever `scale` changes — so every zoom re-ran the effect, reset the tree to empty and cleared the animation timeout, leaving `animating` stuck. Split into a mount-only effect and a listener-cleanup effect.
- **B-tree root splits produced duplicate node ids.** `createNode()` read its counter from state, so when one insert created two nodes both got the same id — duplicate React keys and colliding drag positions. The counter moved to a ref.

### Deferred (deliberately, with reasons)
- **Index keys on reordering lists** (`key={index}` in ~35 places). Real but cosmetic; touching sorting/merge animation keys risks visual regressions with no test coverage to catch them.
- **`Number.parseInt` in tree search handlers** (~6 sites). They never had bounds, and `NaN` there simply reports "not found" — adding an error path would change behaviour rather than fix a defect.
- **`/learn` content itself.** 16 topics now honestly say "Coming soon"; writing them is `features_phases.md` F3, not a bug fix.
- **Merging the duplicate BST visualizers.** The "General Tree" tab was renamed to "Tree" because the component builds an ordered binary tree, not an n-ary one — but it still overlaps the separate Binary Search Tree tab. Deciding whether to merge them is a product call.

### Original checklist

- [x] 🟠 **NaN bypasses validation in ~17 of 25 input handlers** — `Number.parseInt(x)` then `if (value > 500)`; `NaN > 500` is `false`, so NaN gets inserted as a node. Fixed by the shared `parsePositiveInt()` from Phase 2.
- [x] 🟠 **Un-cleaned timers throughout the visualizers** — 4-level nested `setTimeout` chains with no cleanup (`linked-list-visualizer.tsx:101-213`, stack, queue, array, circular/doubly variants) and `setInterval` reading stale closures (`linked-list:236-275`, `array:175`, `tree:128,240`, …). Switching tabs mid-animation leaks timers and setState-on-unmounted. Store handles in refs, clear in `useEffect` cleanup — or migrate to `useAnimationPlayer`, which already does this correctly.
- [x] 🟠 **setState during render** — `sorting-comparison.tsx:366-367` calls `setDescA/B` in the render body. Delete the redundant state; read `player.currentDescription` directly.
- [x] 🟠 **Wall-clock timers race the animation player** — `heap-visualizer.tsx:318,328`, `hash-table-visualizer.tsx:221`: `setTimeout(…, frames.length * speed + 200)` fires even if the user pauses/scrubs, clobbering the display. Reset on `player.isComplete` in an effect instead.
- [x] 🟠 **"Controlled" props silently no-op** — `linked-list/stack/queue-visualizer` read `controlledNodes || internalNodes` but every mutation writes internal state; with a controlled parent, all user actions do nothing. Also two different fallback idioms across 12 components (`||` vs `!== undefined`) — standardize on `??`. 
- [x] 🟡 **16 of 19 "Learn More" links dead-end** — `lib/learn-content.ts` has 4 entries; `app/learn/page.tsx` renders 19 cards → "Topic Not Found". Derive cards from `Object.keys(dataStructureInfo)` and mark the rest "Coming soon". (`binary-search` has content but no card.)
- [x] 🟡 **Theme toggle permanently broken on 5 of 8 pages** — root divs hardcode `className="… dark"` (`app/page.tsx:15`, about, learn ×2, visualize). Delete the literal; `layout.tsx` already sets `defaultTheme="dark" enableSystem`.
- [x] 🟡 **`/operations` is orphaned** (~3,700 lines reachable only by typing the URL; no navbar/footer/metadata on the page either). Decide: add it to the nav with page chrome, or delete the subtree.
- [x] 🟡 Smaller fixes: greedy coin remove deletes all coins of same value (`greedy-algorithm-visualizer.tsx:57-62` — filter by `id`); empty array input parses to `[0]` (`array-operations.tsx:26-37`); B-tree wipes state under React Strict Mode double-mount (`b-tree-visualizer.tsx:74,144-150`); stack mini-preview leaks full controls (`stack-visualizer.tsx:151` — missing `!mini` guard); queue lacks the `mini` prop entirely; `tree-visualizer.tsx` implements a BST but is labelled "General Tree".
- [x] 🟡 **Runtime deps in `devDependencies`** — `framer-motion`, `lucide-react`, `clsx`, `tailwind-merge` are imported by app code but declared dev-only; breaks any `npm ci --omit=dev` deploy. Move to `dependencies`.
- [x] ⚪ Accessibility: unassociated `<label>`s (b-tree, hash-table), raw `<img>` avatar → `next/image` with descriptive alt (`navbar.tsx:66,138`), blocking `alert()` in 10 files → inline `<Alert>` (component already exists), keyboard-inaccessible scrubber (`animation-controls.tsx:69-79`), index keys on reordering lists.

---

## Phase 4 — Pratyaksha Delivery Path ✅ COMPLETE (2026-08-17)

**The library is now installable and renders in notebooks.** All four critical defects were fixed and verified end-to-end: a wheel was built, installed into a clean virtualenv outside the repo, and confirmed to import from `site-packages`, load both assets non-empty, and return a real `application/vnd.jupyter.widget-view+json` mimebundle. That full path had never been executed before.

| Before | After |
|---|---|
| wheel contained **0** Python modules | 23 modules + assets + `py.typed` |
| assets sought at `site-packages/dist` (never exists) | `pratyaksha/static/`, shipped as package-data |
| missing asset → blank widget, no error | `RuntimeError` naming the path and build command |
| `_repr_html_` (suppressed widget rendering) | `_repr_mimebundle_` |

**Verification:** 23 Python tests (up from 16), 19 JS tests, `next build` succeeds, `tsc --noEmit` clean.

### Notable details
- **The CSS would have restyled the whole notebook.** anywidget injects the stylesheet into the host document, and the app's CSS carried Tailwind Preflight plus global `*` and `body` rules. The bundle now builds from `src/bridge/bridge.css` via `tailwind.bridge.config.ts` (Preflight disabled, base rules scoped to `.pratyaksha-container`). Design tokens moved to `app/theme-tokens.css`, shared by both stylesheets so they cannot drift.
- **Tokens could not stay inside `@layer base`.** Next.js compiles the imported tokens file as its own module, where no `@tailwind base` directive is in scope, so the build failed until the layer wrapper was dropped. Custom properties do not need it.
- **`dist/` is gone**, replaced by `pratyaksha/static/`. Docs updated accordingly.
- **Still true after this phase:** only Stack and Queue are real renderers, there are no animations, and `QuickSort` does not sort. `documentation.md` now says so plainly instead of claiming otherwise — those are P2/P3 in `pratyaksha_phases.md`.

### Original checklist

The telemetry core and bridge are healthy; the distribution path is broken end-to-end. In dependency order:

- [x] 🔴 **`pip install .` ships zero Python code.** `pyproject.toml` has no package config; setuptools auto-discovery takes the src-layout branch (because `src/` exists) and builds a wheel containing only an empty `bridge` package. Fix:
  ```toml
  [tool.setuptools.packages.find]
  include = ["pratyaksha*"]
  ```
- [x] 🔴 **Widget assets can never load after install** — `widget.py:6` resolves `../dist` to `site-packages/dist`, and `dist/` isn't package data anyway. Build tsup output to `pratyaksha/static/`, add `[tool.setuptools.package-data] pratyaksha = ["static/*"]`, point `widget.py` at `Path(__file__).parent / "static"`.
- [x] 🔴 **Silent failure + encoding hazard** — `widget.py:11-12` falls back to `""` when assets are missing (blank widget, no error) and `read_text()` uses the locale codec (cp1252 on Windows). Use `read_text(encoding="utf-8")` and `raise RuntimeError("run npm run build-lib")` when missing.
- [x] 🔴 **Wrong notebook render hook** — `structures/base.py:40-41` and `algorithms/base.py:33-34` delegate to `widget._repr_html_()`, which anywidget widgets don't expose (they use `_repr_mimebundle_`), and static HTML can't carry a live comm anyway. Replace with `_repr_mimebundle_(**kwargs)` delegation, **then open a real notebook and verify a Stack renders and animates** — this is the one thing never tested end-to-end.
- [x] 🟠 **HashTable type bug** — `structures/hash_table.py:30,60`: keys stored as `str(key)` but compared as raw `key`, so `insert(5, …)` twice creates a duplicate instead of an update. Normalize `key = str(key)` once at the top. (Existing test uses only string keys, masking this.)
- [x] 🟠 **Global CSS leak into notebooks** — `dist/pratyaksha.css` starts with Tailwind Preflight (`*` selectors); anywidget injects it document-wide and will restyle Jupyter/Colab chrome. Scope under `.pratyaksha-container` or disable preflight for the bridge build. Also add `./src/**/*.{ts,tsx}` to `tailwind.config.ts` content globs (bridge classes currently survive only because the app happens to use them).
- [x] 🟡 **Bridge polish:** `nodes: null` coerced to `[]` on mount but not on update (`pratyaksha-bridge.tsx:8,13`); renderer types declare `id: number` while Python sends 8-char UUID strings — widen to `string | number` and remove the eight `as any` casts; add an `else`/error branch after the `isRendererOnlyComponent` guard.
- [x] 🟡 **Truthful metadata & docs:** fill `pyproject.toml` (`requires-python`, `readme`, `license`, `authors`, dependency floors, `[project.optional-dependencies] dev = ["pytest"]`); pin the Colab notebook's `pip install git+…` to a tag; rewrite `documentation.md:78-83` — three of the four "Phase 1 complete" checkboxes are not currently true, and Framer Motion animation is documented in three places but imported nowhere. Scope the claim to what will now be real: "Stack and Queue render live in a notebook."
- [ ] ⚪ *(deferred to pratyaksha_phases.md P3)* Implement or delete the stubs: `QuickSort` has an identity reducer and no `sort()`; `BinarySearch` has only `set_result()` — the caller does the searching. Either implement stepwise algorithms on the telemetry core (great demo material) or remove them from the public API.

---

## Phase 5 — Tests & CI ✅ COMPLETE (2026-08-18)

- [x] 🟠 **CI now exists.** `.github/workflows/ci.yml` with four jobs: **web** (typecheck, lint,
      vitest, build) on Node 20 and 22; **bridge** (build the widget bundle); **python** (install
      the package and run pytest) on Python 3.9, 3.11 and 3.12; and **package** (build a wheel and
      assert its contents). Previously nothing ran the Python suite at all.
- [x] 🟡 **Missing tests added.** `tests/python/test_edge_cases.py` (12 tests) covers the early-return
      branches nothing exercised: pop/peek/dequeue on empty, `remove_at` out of range and at the
      last valid index, circular-queue overflow and wrap-around reuse, and integer hash-table keys.
      `tests/bridge/prop-mapping.test.tsx` (13 tests) covers every routing branch in the bridge —
      previously only the registry lookup was tested. JS suite 19 → 32, Python 23 → 35.
- [x] ⚪ **`vitest.config.ts`** given explicit `include`/`exclude`.

### Two real defects this phase uncovered

- 🔴 **The committed widget bundle was stale**, so `pip install` still shipped the invisible
      heap-label bug fixed earlier the same day — the source was correct but `pratyaksha/static/`
      had not been rebuilt. The new **bridge** job fails the build whenever a fresh bundle differs
      from the committed one, which is what caught it. Confirmed the build is byte-for-byte
      reproducible first, so the gate is not flaky.
- 🟠 **`CircularQueue` had no `dequeue`** — only `enqueue`, with no reducer branch for anything
      else. It filled to capacity and was then permanently stuck, so the structure could never
      demonstrate the wrap-around that is its entire teaching point. Writing the capacity test is
      what surfaced it. Added `dequeue()` and `peek()`.

**Verification:** 32 JS tests, 35 Python tests, `tsc` clean, `next lint` exits 0, `next build`
succeeds. The package was installed with `pip install -e ".[dev]"` and imported from outside the
repo: assets resolve (772 KB ESM, 52 KB CSS), both carry the theme fix, and `_repr_mimebundle_`
returns `application/vnd.jupyter.widget-view+json` — the correct notebook protocol.

### Notes
- The **package** job asserts the wheel contains real modules *and* `pratyaksha/static/*.mjs`.
  Those were the two faults that made the library uninstallable before Phase 4; a wheel can be
  built successfully and still ship neither.
- The **python** job imports from `$RUNNER_TEMP` rather than the repo root on purpose: a suite run
  from the checkout passes even when packaging is broken, because the source tree is importable.
- `next lint` is deprecated in Next 15.5. It works today; migrating to `eslint .` is a small
  follow-up.

---

## Phase 6 — UI & Layout (added 2026-08-17, after visual review)

> **Scope note.** Phases 0–5 came from *reading* the code: security holes, state races, uncleaned
> timers, hardcoding, packaging. **No one had opened the running app and looked at it.** Layout,
> spacing, and visual-flow defects are invisible to that kind of audit, so none of the items below
> were in the original plan. Expect more of them — this phase should be treated as open until
> someone has clicked through every visualizer tab at both desktop and mobile widths.

### Done in the first visual pass
- [x] 🟠 **Stack overflowed its panel while the panel sat half empty.** The scroll area was pinned to
      `md:h-[300px]` inside a card that stretched much taller, so ~5 items started scrolling with a
      large blank area below, and `items-center` clipped the "TOP" marker once content overflowed.
      The area now grows with `flex-1` and centres via `m-auto`, which does not clip on overflow.
      Same fix applied to the queue renderer.
- [x] 🟠 **Live code panel moved under the visualization** in the right-hand column across all
      visualizers. Previously the left column carried controls + code + docs while the right column
      held only the visualization, so the right column ran out of content early. Reading the
      highlighted line next to the structure it describes was the user's stated goal.
- [x] 🟡 **Footer was taller than some page content.** Three stacked columns with a five-item
      vertical nav list and a four-item vertical social list. Rebuilt as two compact rows.

### Second pass — full static UI audit (2026-08-17)

Two exhaustive read-only audits were run: one on layout/responsive/SVG-overflow across all 24
visualizer files, one on light-theme correctness. Both confirmed the user's instinct that the first
visual pass had only scratched the surface. Headline findings:

- 🔴 **Content that overflowed an SVG plate was permanently unreachable.** Six visualizers used
      `items-center justify-center` on an `overflow-auto` box; centred overflow spills symmetrically
      and `scrollLeft`/`scrollTop` cannot go negative, so the leading half could never be scrolled
      to. Concretely: on a 6-level tree **the root node was the first thing to vanish**, and a
      20-node binary tree lost roughly its 5 leftmost nodes. Compounded by an `absolute inset-0`
      child that made the outer `overflow-auto` a **dead scroller**, and by `pan.y` existing in
      state but never being set by any control — so vertical clipping had no recourse at all.
- 🔴 **`tree-visualizer` drew nodes outside its own viewBox.** The sizer and the renderer used
      different spacing maths, so any **3-level tree hid its deepest nodes entirely**; zoom-out
      could not help because `transform: scale()` scales an already-clipped raster.
- 🔴 **Heap node labels were invisible in light mode** — a regression from Phase 2: the circle
      fills were migrated to theme tokens (near-white in light) while the label stayed
      `fill="white"`, giving 1.05:1 contrast. The file's own comment claimed both themes worked.
- 🟠 **Bar charts were taller than their containers** by arithmetic: heap-sort computed 200px bars
      inside a 160px plate, sorting-comparison 168px inside 140px.
- 🟠 **`divide-conquer` had no overflow handling** on a fixed 350px box whose content reaches
      ~480px, so recursion levels rendered outside the card border.
- 🟠 **Graph nodes could be dragged off-canvas unrecoverably** (no clamp, no zoom/pan, no view
      reset), and the drag ignored the SVG's CSS scale so the node lagged the cursor ~16%.
- 🟠 **`/operations` put 7 tabs in a `grid-cols-4` inside a fixed 36px pill**, forcing two squashed
      rows with colliding nowrap labels.
- 🟠 **The code panel rendered a 280px black void** on all 15 pages until the user ran something —
      the first thing every visitor saw.

### Fixed in the second pass
- [x] 🔴 Heap label + `--node-label` token (light/dark), and a real dark value for
      `--node-index-label`, which was byte-identical in both themes and failed AA at 9px.
- [x] 🔴 Centred-scroller plate replaced in all six SVG visualizers; dead `absolute inset-0`
      wrappers flattened; vertical pan controls added.
- [x] 🟠 Bar-height arithmetic, `divide-conquer` overflow, graph drag clamp + scale correction.
- [x] 🟠 `/operations` tab list rebuilt as a horizontal scroller (the pattern `/visualize` already used).
- [x] 🟠 Code panel now shows "Run an operation to follow the code line by line."
- [x] 🟠 `md:items-start` added to the 7 grids that were missing it — the exact defect class the
      user reported, where a short visualization card is stretched by a much taller left column.
- [x] 🟡 Code panels committed to a deliberately dark surface with pinned slates, and the
      contrast failures inside them fixed (`text-muted-foreground` comments at 4.3:1, line
      numbers at 2.3:1). The misleading "via theme tokens" comment was corrected.
- [x] 🟡 Legends given `flex-wrap`; `doubly-linked-list` desktop grid widened to stop label overlap;
      BST visualization moved back to `order-2` on mobile.

### Third pass — state vocabulary unified (2026-08-18)

`lib/visualizer-states.ts` is now the single source for how a state is drawn. It
defines eight states (`default`, `comparing`, `swapping`, `pivot`, `inserted`,
`removed`, `visited`, `warning`), four rendering maps (`STATE_BOX`,
`STATE_SHAPE`, `STATE_BAR`, `STATE_SWATCH`), shared labels, and `resolveState()`.
15 components consume it. Covered by `tests/lib/visualizer-states.test.ts`.

- [x] 🟡 **Seven renderings of "highlighted" collapsed to one.** The same idea was
      `bg-yellow-100 dark:bg-yellow-900` in the linear structures, `fill-yellow-200`
      in the trees, `bg-blue-500/20` in the heap, solid `bg-blue-400` in two sorters
      and solid `bg-yellow-400` in a third. All now resolve through the shared maps.
- [x] 🟡 **Tree state precedence is no longer arbitrary.** The five tree
      visualizers concatenated one class string per flag, so a node that was both
      highlighted and unbalanced emitted `fill-yellow-200` *and* `fill-orange-200`
      — the winner decided by the order Tailwind happened to emit its palette in.
      `resolveState()` picks exactly one state by documented precedence
      (removed > swapping > comparing > pivot > inserted > warning > visited).
- [x] 🟡 **Legends derive from the same constants** they describe, so they cannot
      drift. This also fixed a real bug in the graph legend: its "Unvisited"
      swatch used `fill-card`, an SVG-only utility, on a `<div>` — it rendered
      transparent in both themes.
- [x] 🟡 **Graph placement no longer piles up.** Nodes were random (could land
      off-canvas), then on a single ellipse where golden-angle neighbours 8 apart
      sat ~26px apart — an overlap for 40px nodes by the ninth addition. A spiral
      was no better: 500x300 cannot hold twenty 40px nodes on a curve. Now a
      lattice: 45 slots at 56px spacing, verified non-overlapping and on-canvas.
- [x] 🟡 **`b-tree` is legible again.** It rendered `width="100%"` against a
      viewBox up to 1500 wide, so a ~500px plate letterboxed it to about a third
      scale and 12px key labels came out near 4px. It now draws at intrinsic size
      and the plate scrolls, matching the other trees.
- [x] 🟡 **`prose dark:prose-invert` removed** from the learn page. The plugin was
      never installed so both classes were dead; the paragraph they wrapped
      already carried its own styling. Fixed indentation (`ml-10` to `md:ml-10`,
      which cost 64px on a 375px screen) and the unresponsive `text-4xl` heading.
- [x] ⚪ **Success alerts** — `success` variant added to `components/ui/alert.tsx`,
      replacing seven hand-rolled `bg-green-50` copies that had no dark counterpart.
- [x] ⚪ **`text-[10px]` raised to `text-xs`** across 18 files.
- [x] ⚪ **Step panes unified** — one height (`h-40`) and one heading
      ("Algorithm Steps:") across six visualizers, which previously used six
      heights and four different names for the same pane. The hash table keeps
      "Execution Trace": it lists probe attempts, not algorithm steps.
- [x] 🔴 **The shared palette was being purged.** `tailwind.config.ts` scanned
      `pages`, `components`, `app` and `src` but not `lib`, so every class named
      only in `lib/visualizer-states.ts` was stripped from the build. Verified
      against the built CSS: zero `amber-*` and `emerald-*` rules, while
      `yellow-*` (used directly in components) was present. The five tree
      visualizers that adopted `STATE_SHAPE` first were already drawing with
      purged classes. Fixed by adding `./lib/**/*.{js,ts}` to the content globs;
      the bridge config inherits it, so the notebook widget is covered too.
- [x] 🟡 **Legend swatches now mirror their own mark.** One swatch set put a
      saturated dot beside a pale cell — in hue, but not the same colour.
      `swatchFor(state, mark)` returns the bar fill beside bar charts, the box
      fill beside cells, and the neutral dot beside SVG marks, whose `fill-*`
      classes cannot be reused on a `<div>`.
- [x] 🟡 **`STATE_FILL` added** for marks whose container draws its own border.
      `STATE_BOX` carries a border colour, which collided with the pathfinding
      grid's hairline — two border-colour classes on one element, resolved by
      Tailwind's emit order rather than intent.
- [x] ⚪ **Queue node ids truncate** — Python sends 8-character UUIDs into a 56px tile.

### The click-through happened, and it is now automated ✅ (2026-08-23)

The scope note above said this phase stays open until someone has clicked through every
visualizer at both desktop and mobile widths. That happened, and rather than being a one-off it
became `scripts/visual-audit.mjs` — 132 page loads across every catalog route, both themes, both
viewports, checking sideways scroll, content past the viewport with no scroller, content hidden
behind `overflow:hidden`, svg children outside their viewBox, svgs scaled below intrinsic size,
and console errors. Run it with `npm run audit:visual` against a production server.

Two defects it found on its first correct run, neither visible to any test:

- [x] 🟠 **The graph rendered at 0.71x on mobile** — 356px of an intrinsic 500 — because the svg is
      a flex child and flex children shrink. It was scaling down instead of scrolling, which
      contradicted a comment already in that file. The disjoint set had the same defect at 0.557x.
      Both now carry `shrink-0`.
- [x] 🟡 **Disjoint-set rank labels clipped** by 9 user-units at the top edge.

Writing the instrument taught the same lesson twice. Its first version compared client rects and
cleared a genuinely clipped label, because `getBoundingClientRect` reports CSS-pixel geometry and
cannot see viewBox clipping. Its second used `getBBox` alone and reported five false positives on
the graph, because `getBBox` is in the element's own user space and the graph draws nodes as
`<g transform="translate(x,y)"><circle r=20>`, whose raw bbox reads as 20 units outside. Only
`getBBox` mapped through `getCTM` is correct. Both versions were run against a deliberately
reintroduced bug before being trusted.

`tests/lib/css-tokens.test.ts` is the half that needs no browser and runs on every commit: every
`var(--token)` must resolve, and any token stored as bare HSL components must be wrapped in
`hsl()`. That rule exists because a visualizer shipped with `fill-[var(--node-label)]` and its
labels rendered invisible — the token was defined, but used raw, producing `fill: 0 0% 9%`, which
is invalid, and CSS drops invalid declarations silently.

**Phase 6 is closed.** Visual regressions are now caught by an instrument rather than by chance.

## Phase 7 — Feature Roadmap (post-hardening)

Highest-leverage additions, roughly in order of demo value per effort:

1. **Professor dashboard** — the `PROFESSOR`/`STUDENT` roles and profile tables exist but drive nothing. Assignments ("visualize AVL insertion of this sequence"), completion tracking per student. Turns the auth system from ceremony into a feature.
2. **Student progress tracking** — mark `/learn` topics complete, per-DS operation counters, streaks. Small Prisma additions, big perceived depth.
3. **Live complexity counters** — comparisons/swaps/visits counted during animation, displayed next to the Big-O table. The telemetry event stream already carries the data.
4. **Trace export & replay** — `export_trace()` already exists; add JSON download, shareable replay links on the web app, and step-through replay in notebooks.
5. **Predict-the-next-state quiz mode** — pause the animation, ask the student what happens next; generated directly from telemetry snapshots.
6. **Publish `pratyaksha` to PyPI** — after Phase 4, `pip install pratyaksha` working in Colab is the single most impressive demo artifact.
7. **Finish the learn content** — the 16 missing topic pages (Phase 3) are the fastest visible win.
8. **Custom input everywhere** — let students paste their own arrays/graphs instead of seeds.
