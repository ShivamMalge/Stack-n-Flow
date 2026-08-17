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

## Phase 1 — Security (≈ 1 day, highest priority code changes)

- [ ] 🔴 **Privilege escalation via `useSession().update()`** — `lib/auth.ts:26-30`. The JWT callback copies `role` and `onboardingCompleted` straight from a client-supplied payload. Any logged-in user can run `update({ role: "PROFESSOR", onboardingCompleted: true })` from the browser console and mint a forged token, bypassing onboarding (`middleware.ts:13`).
  **Fix:** on `trigger === "update"`, ignore the payload and re-read from the DB:
  ```ts
  const dbUser = await prisma.user.findUnique({
      where: { id: token.id as string },
      select: { role: true, onboardingCompleted: true },
  })
  if (dbUser) { token.role = dbUser.role; token.onboardingCompleted = dbUser.onboardingCompleted }
  ```
  Then in `app/(auth)/onboarding/page.tsx:59-63`, call `update()` with no arguments.
- [ ] 🔴 **XSS-prone renderer** — `components/ui/code-panel.tsx:103`: `dangerouslySetInnerHTML` fed by `formatLine()` (`:33-70`), which does regex substitution with **no HTML escaping**. Safe today only because all inputs are code literals; the Pratyaksha bridge is designed to pipe Python-supplied strings into these components. **Fix:** escape `& < > " '` before formatting, or render token arrays with `<span>`s and drop `innerHTML` entirely.
- [ ] 🟠 **Fail-fast env validation.** `lib/auth.ts:10-11,47` uses `process.env.X!`; `prisma.config.ts` casts `as string`. Missing vars boot the app with `undefined` credentials and fail opaquely. Add a zod-validated `lib/env.ts` that throws at startup for `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DATABASE_URL`.
- [ ] 🟡 **Security headers.** `next.config.ts` is empty — no CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`. Add a `headers()` block; a CSP is real defense-in-depth given the `innerHTML` usage above. Also add `images.remotePatterns` for `lh3.googleusercontent.com` (needed by Phase 3's `next/image` fix).
- [ ] 🟡 **Middleware allowlist-by-omission** — `middleware.ts:34-42` protects only 4 route prefixes; any future route is public by default. Prefer a deny-by-default matcher that excludes `/login`, `/api/auth`, `/_next`, and static assets. Also dedupe `pages.signIn` (defined in both `middleware.ts:29` and `lib/auth.ts:44`).
- [ ] 🟡 **USN validation** — `lib/validations/onboarding.ts:7` accepts any 4–20 char string for a `@unique` DB column. Add a `.regex()` so users can't squat arbitrary USNs.
- [ ] ⚪ **Re-enable lint rules** — `eslint.config.mjs:15-19` turns off `no-explicit-any` and `no-unused-vars` repo-wide; this is why dead code and 14× `as any` survived. Re-enable as `warn` with an `_` ignore pattern.

---

## Phase 2 — De-hardcoding (≈ 1–2 days)

### Web (TypeScript)

- [ ] 🟠 **Institution rules baked into JSX** — `app/(auth)/onboarding/page.tsx:73-76,83,167,174-187`: `"atria institute of technology"`, the `1AT` USN prefix (repeated 5×), `maxLength={7}`, and the year/branch whitelist string. Extract `lib/config/institutions.ts` (name → USN prefix, format regex, length); the form derives everything from it. The current code special-cases one college and will silently rot in 2026.
- [ ] 🟠 **`500` input limit copy-pasted in 10 files** with inconsistent bounds elsewhere (999 in heap/sorting, 20/15/8 in dp). Create `lib/constants.ts`:
  ```ts
  export const MAX_INPUT_VALUE = 500
  export const SPEED_PRESETS = [1600, 800, 533, 400, 267]
  export const MOBILE_BREAKPOINT = 768
  ```
  and a shared `parsePositiveInt(raw, max)` helper — this also fixes the NaN-bypass bug (Phase 3, B4) in one change.
- [ ] 🟡 **Two divergent speed ladders** — `components/ui/animation-controls.tsx:30-36` vs `sorting-comparison.tsx:309-310`. Unify on the shared `SPEED_PRESETS`.
- [ ] 🟡 **Duplicated personal/social links** — identical 4-link block in `components/footer.tsx:51-78` and `app/about/page.tsx:71-98` (incl. an Instagram `igsh=` tracking token — strip it). Extract `lib/site-config.ts` + a `<SocialLinks/>` component. Author name also hardcoded twice in `app/about/page.tsx:23,57`.
- [ ] 🟡 **Raw hex colors bypassing the theme** — `heap-visualizer.tsx:162-175,224-247` (12 dark-only hex values, invisible in light mode), `multi-language-code.tsx:71`. Move to CSS variables in `globals.css`.
- [ ] 🟡 **Hardcoded sample graph + random pixel coords** — `graph-visualizer.tsx:100-122`. Extract a `SAMPLE_GRAPH` constant and compute layout (a `lib/tree-layout.ts` precedent already exists).
- [ ] ⚪ Named constants for: hash multiplier `31` + `TABLE_SIZE` (`hash-table-visualizer.tsx:47,62`), pathfinding grid `15×25` + wall density `0.28`, B-tree order bounds `2..5`, seed datasets in linked-list/stack/dp visualizers, `nextId` starting at `4` (collides with seed ids 101–104 — start at `1`).

### Python (Pratyaksha)

- [ ] 🟠 **Structure-name literals duplicated across the language boundary** — 14 magic strings hand-written in every constructor **twice** (e.g. `structures/stack.py:47` and `:52`), again in `src/bridge/registry.tsx:22-35` and `pratyaksha-bridge.tsx`. Add a `StructureType` StrEnum in `pratyaksha/core/`, derive `structure_type` from `run.structure` in the base class, and generate the TS union from it.
- [ ] 🟡 **`_telemetry_metadata` copy-pasted 8×** with 4 signatures across `pratyaksha/structures/*` — replace with one `telemetry_metadata(event_count, last_op, **extra)` in `core/telemetry.py`. Also merge the ~90%-identical `structures/base.py` and `algorithms/base.py` into one `BaseTelemetryObject` (fixes `event_history()` missing on algorithms).
- [ ] ⚪ Named constants: uuid truncation `[:8]` (collision risk), hash `31`, bucket `10`, capacity `5`, `front=0/rear=-1` sentinels. Add `__version__` to `pratyaksha/__init__.py` (version currently stated in 3 places, readable in none).

---

## Phase 3 — Web App Correctness Bugs (≈ 2–3 days)

- [ ] 🟠 **NaN bypasses validation in ~17 of 25 input handlers** — `Number.parseInt(x)` then `if (value > 500)`; `NaN > 500` is `false`, so NaN gets inserted as a node. Fixed by the shared `parsePositiveInt()` from Phase 2.
- [ ] 🟠 **Un-cleaned timers throughout the visualizers** — 4-level nested `setTimeout` chains with no cleanup (`linked-list-visualizer.tsx:101-213`, stack, queue, array, circular/doubly variants) and `setInterval` reading stale closures (`linked-list:236-275`, `array:175`, `tree:128,240`, …). Switching tabs mid-animation leaks timers and setState-on-unmounted. Store handles in refs, clear in `useEffect` cleanup — or migrate to `useAnimationPlayer`, which already does this correctly.
- [ ] 🟠 **setState during render** — `sorting-comparison.tsx:366-367` calls `setDescA/B` in the render body. Delete the redundant state; read `player.currentDescription` directly.
- [ ] 🟠 **Wall-clock timers race the animation player** — `heap-visualizer.tsx:318,328`, `hash-table-visualizer.tsx:221`: `setTimeout(…, frames.length * speed + 200)` fires even if the user pauses/scrubs, clobbering the display. Reset on `player.isComplete` in an effect instead.
- [ ] 🟠 **"Controlled" props silently no-op** — `linked-list/stack/queue-visualizer` read `controlledNodes || internalNodes` but every mutation writes internal state; with a controlled parent, all user actions do nothing. Also two different fallback idioms across 12 components (`||` vs `!== undefined`) — standardize on `??`. 
- [ ] 🟡 **16 of 19 "Learn More" links dead-end** — `lib/learn-content.ts` has 4 entries; `app/learn/page.tsx` renders 19 cards → "Topic Not Found". Derive cards from `Object.keys(dataStructureInfo)` and mark the rest "Coming soon". (`binary-search` has content but no card.)
- [ ] 🟡 **Theme toggle permanently broken on 5 of 8 pages** — root divs hardcode `className="… dark"` (`app/page.tsx:15`, about, learn ×2, visualize). Delete the literal; `layout.tsx` already sets `defaultTheme="dark" enableSystem`.
- [ ] 🟡 **`/operations` is orphaned** (~3,700 lines reachable only by typing the URL; no navbar/footer/metadata on the page either). Decide: add it to the nav with page chrome, or delete the subtree.
- [ ] 🟡 Smaller fixes: greedy coin remove deletes all coins of same value (`greedy-algorithm-visualizer.tsx:57-62` — filter by `id`); empty array input parses to `[0]` (`array-operations.tsx:26-37`); B-tree wipes state under React Strict Mode double-mount (`b-tree-visualizer.tsx:74,144-150`); stack mini-preview leaks full controls (`stack-visualizer.tsx:151` — missing `!mini` guard); queue lacks the `mini` prop entirely; `tree-visualizer.tsx` implements a BST but is labelled "General Tree".
- [ ] 🟡 **Runtime deps in `devDependencies`** — `framer-motion`, `lucide-react`, `clsx`, `tailwind-merge` are imported by app code but declared dev-only; breaks any `npm ci --omit=dev` deploy. Move to `dependencies`.
- [ ] ⚪ Accessibility: unassociated `<label>`s (b-tree, hash-table), raw `<img>` avatar → `next/image` with descriptive alt (`navbar.tsx:66,138`), blocking `alert()` in 10 files → inline `<Alert>` (component already exists), keyboard-inaccessible scrubber (`animation-controls.tsx:69-79`), index keys on reordering lists.

---

## Phase 4 — Pratyaksha Delivery Path (≈ 2–3 days) — "make it actually installable"

The telemetry core and bridge are healthy; the distribution path is broken end-to-end. In dependency order:

- [ ] 🔴 **`pip install .` ships zero Python code.** `pyproject.toml` has no package config; setuptools auto-discovery takes the src-layout branch (because `src/` exists) and builds a wheel containing only an empty `bridge` package. Fix:
  ```toml
  [tool.setuptools.packages.find]
  include = ["pratyaksha*"]
  ```
- [ ] 🔴 **Widget assets can never load after install** — `widget.py:6` resolves `../dist` to `site-packages/dist`, and `dist/` isn't package data anyway. Build tsup output to `pratyaksha/static/`, add `[tool.setuptools.package-data] pratyaksha = ["static/*"]`, point `widget.py` at `Path(__file__).parent / "static"`.
- [ ] 🔴 **Silent failure + encoding hazard** — `widget.py:11-12` falls back to `""` when assets are missing (blank widget, no error) and `read_text()` uses the locale codec (cp1252 on Windows). Use `read_text(encoding="utf-8")` and `raise RuntimeError("run npm run build-lib")` when missing.
- [ ] 🔴 **Wrong notebook render hook** — `structures/base.py:40-41` and `algorithms/base.py:33-34` delegate to `widget._repr_html_()`, which anywidget widgets don't expose (they use `_repr_mimebundle_`), and static HTML can't carry a live comm anyway. Replace with `_repr_mimebundle_(**kwargs)` delegation, **then open a real notebook and verify a Stack renders and animates** — this is the one thing never tested end-to-end.
- [ ] 🟠 **HashTable type bug** — `structures/hash_table.py:30,60`: keys stored as `str(key)` but compared as raw `key`, so `insert(5, …)` twice creates a duplicate instead of an update. Normalize `key = str(key)` once at the top. (Existing test uses only string keys, masking this.)
- [ ] 🟠 **Global CSS leak into notebooks** — `dist/pratyaksha.css` starts with Tailwind Preflight (`*` selectors); anywidget injects it document-wide and will restyle Jupyter/Colab chrome. Scope under `.pratyaksha-container` or disable preflight for the bridge build. Also add `./src/**/*.{ts,tsx}` to `tailwind.config.ts` content globs (bridge classes currently survive only because the app happens to use them).
- [ ] 🟡 **Bridge polish:** `nodes: null` coerced to `[]` on mount but not on update (`pratyaksha-bridge.tsx:8,13`); renderer types declare `id: number` while Python sends 8-char UUID strings — widen to `string | number` and remove the eight `as any` casts; add an `else`/error branch after the `isRendererOnlyComponent` guard.
- [ ] 🟡 **Truthful metadata & docs:** fill `pyproject.toml` (`requires-python`, `readme`, `license`, `authors`, dependency floors, `[project.optional-dependencies] dev = ["pytest"]`); pin the Colab notebook's `pip install git+…` to a tag; rewrite `documentation.md:78-83` — three of the four "Phase 1 complete" checkboxes are not currently true, and Framer Motion animation is documented in three places but imported nowhere. Scope the claim to what will now be real: "Stack and Queue render live in a notebook."
- [ ] ⚪ Implement or delete the stubs: `QuickSort` has an identity reducer and no `sort()`; `BinarySearch` has only `set_result()` — the caller does the searching. Either implement stepwise algorithms on the telemetry core (great demo material) or remove them from the public API.

---

## Phase 5 — Tests & CI (≈ 1 day)

- [ ] 🟠 **Nothing runs the Python tests.** 15 genuinely good tests exist in `tests/python/`, but `anywidget`/`traitlets` aren't even installed locally, no file declares dev dependencies, and there is no `.github/` at all. Add a GitHub Actions workflow: `npm ci && npm run verify:web && npm test` + `pip install -e .[dev] && pytest tests/python`.
- [ ] 🟡 Add the missing tests: int-key HashTable (regression for the Phase 4 bug), `widget.py` asset resolution, `_repr_mimebundle_`, negative paths (`pop()` empty, `CircularQueue` overflow, `remove_at` out of range), and the 7 untested prop-mapping branches in `pratyaksha-bridge.tsx`.
- [ ] ⚪ Give `vitest.config.ts` explicit `include`/`exclude` so it never walks legacy trees.

---

## Phase 6 — Feature Roadmap (post-hardening)

Highest-leverage additions, roughly in order of demo value per effort:

1. **Professor dashboard** — the `PROFESSOR`/`STUDENT` roles and profile tables exist but drive nothing. Assignments ("visualize AVL insertion of this sequence"), completion tracking per student. Turns the auth system from ceremony into a feature.
2. **Student progress tracking** — mark `/learn` topics complete, per-DS operation counters, streaks. Small Prisma additions, big perceived depth.
3. **Live complexity counters** — comparisons/swaps/visits counted during animation, displayed next to the Big-O table. The telemetry event stream already carries the data.
4. **Trace export & replay** — `export_trace()` already exists; add JSON download, shareable replay links on the web app, and step-through replay in notebooks.
5. **Predict-the-next-state quiz mode** — pause the animation, ask the student what happens next; generated directly from telemetry snapshots.
6. **Publish `pratyaksha` to PyPI** — after Phase 4, `pip install pratyaksha` working in Colab is the single most impressive demo artifact.
7. **Finish the learn content** — the 16 missing topic pages (Phase 3) are the fastest visible win.
8. **Custom input everywhere** — let students paste their own arrays/graphs instead of seeds.
