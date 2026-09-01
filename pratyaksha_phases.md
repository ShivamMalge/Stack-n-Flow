# Pratyaksha Completion Plan

Goal: take Pratyaksha from "well-built core with a broken delivery path" to a published Python library where
`pip install pratyaksha` in Jupyter/Colab gives live, animated data-structure visualizations driven from Python code.

Prerequisite: **Phase 4 of `fixes_phases.md`** (packaging fix, asset path, `_repr_mimebundle_`, verified notebook render).
That phase makes Pratyaksha *installable*; this plan makes it *complete*. Do not start P1 here until a Stack
renders and updates in a real Colab/Jupyter notebook.

Severity of dependence flows downward — each phase assumes the previous one shipped.

---

## P1 — Honest Baseline & Release 0.1 (≈ 3–4 days)

Ship the truthful minimum: Stack and Queue, working in notebooks, installable from GitHub.

- [x] Verify end-to-end in **three** environments: Jupyter Notebook, JupyterLab, Google Colab (Colab's widget manager behaves differently — test it explicitly).
- [ ] Tag `v0.1.0`, pin the Colab demo notebook's install to the tag, and re-record the demo notebook so every cell actually runs top to bottom.
- [x] Rewrite `documentation.md` and README to claim exactly what works: "Stack and Queue render live in notebooks; 10 more structures sync state but reuse app components."
- [x] Add `__version__`, `py.typed`, and a minimal quickstart (`pip install`, 5-line Stack demo).
- [x] CI publishes `dist/` bridge assets as a build artifact so `pratyaksha/static/` is reproducible, not hand-committed.

**Exit criterion:** a stranger with the README and no help gets a rendering Stack in Colab in under 5 minutes.

### Where P1 actually stands (2026-08-23)

Done: the render path is verified inside a **real Jupyter kernel**, not just by
importing the package. `tests/python/test_notebook_integration.py` executes a
Stack and a Queue in a spawned kernel and asserts the widget-view mimetype is
present, that three pushes leave three nodes, that a pop leaves two, and that
the bundle loads from the *installed* package. Deleting the bundle makes all
four fail, which is the point: the failure mode being guarded is a widget that
renders blank while every unit test stays green. CI installs the notebook stack
and runs them; they skip locally when it is absent.

Also done: `__version__` and `py.typed` were already present; the README now
carries a quickstart that states plainly which two structures have real
notebook renderers and which twelve mount the web-app component instead; and
the wheel is published as a CI artifact so a release can be cut from a green run
rather than a local build.

**Not done, and not claimable:** JupyterLab and Colab. Both need a browser to
verify — the kernel test proves the Python and packaging halves, not that the
JavaScript widget manager mounts the view. Colab's widget manager differs
enough that it has to be opened by hand. Until someone does, the README says
Colab is untested rather than implying otherwise, and `v0.1.0` should not be
tagged on the strength of the kernel test alone.

---

## P2 — Renderer Extraction for the Remaining 12 Structures — DONE

All 14 registry entries mount a presentational renderer. Previously only Stack
and Queue did, and the other twelve mounted the full interactive Next.js
component, so notebook users saw input boxes, tabs and buttons that silently did
nothing — Python owns the state, so none of them could work.

- [x] Every `<X>Visualizer` split into a controller (app-side state and inputs)
      and an `<X>Renderer` (props → SVG/DOM), following `components/visualizers/stack/`.
- [x] `src/bridge/registry.tsx` consumes renderers only. `isRendererOnlyComponent`
      is gone; each entry now owns its own mapping from synced state to its props,
      replacing the chain of `if (structure === ...)` in the bridge.
- [x] A vitest render test per renderer, mirroring `stack-renderer.test.tsx`.
- [x] Web-app debt paid down along the way: the BST and AVL tree became one
      `TreeRenderer` with a variant, and the three linked lists became one
      `LinkedListRenderer` with a variant, so the app and the notebook draw from
      one source rather than several that drift.

**Exit criterion — met:** no notebook widget shows an interactive control that
doesn't work. What survived into the renderers is view state only: zoom, pan and
node drag change how you are looking at a structure, not what it is, so they
keep working when Python owns the data. Clicking a graph node to pick a BFS
start does not, so the bridge passes no handler and the renderer drops the
affordance with it.

**Held by tests, not by memory:** `structuresAwaitingRenderer()` must be empty
and every entry's `rendererOnly` must be true, asserted in
`tests/bridge/registry.test.ts`. A structure added later that mounts a whole
visualizer fails there rather than in someone's notebook.

**Held by an instrument:** `npm run check:widget` renders all 14 structures from
the shipped bundle and fails on any console error, naming the structure that
caused it. It used to render Stack alone — which is exactly how the AVL tree
reached Colab broken while the check reported the bundle healthy.

Still copies of each other, and not in the bridge registry, so out of scope
here: `binary-tree-visualizer.tsx`, `binary-search-tree-visualizer.tsx` and
`b-tree-visualizer.tsx` each carry their own layout, drag and zoom code. The
first two are plain binary trees and should move onto `TreeRenderer`.

Palette drift found and left deliberately, because repainting shared tokens is a
design decision rather than a refactor:
- `STATE_SHAPE` gives `swapping` and `warning` the same orange, so the AVL
  tree's "Rotating" and "Unbalanced" are one colour. The legend now draws from
  the same table the nodes do, so it shows that honestly instead of claiming a
  blue dot for rotation.
- The heap carries three palettes that disagree: CSS variables for the svg,
  Tailwind classes for the array cells, and `lib/visualizer-states` everywhere
  else.

---

## P3 — Real Algorithm Drivers (≈ 1–2 weeks)

`QuickSort` is an identity-reducer stub and `BinarySearch` doesn't search. Build genuine stepwise algorithms
on the telemetry core — this is the layer professors will actually teach from.

- [ ] Define the driver contract: `algo = QuickSort([5,2,8]); algo.run()` records every comparison/swap/partition
      as telemetry events; `algo.play(speed=1.0)`, `algo.step()`, `algo.reset()` control playback by walking snapshots.
- [ ] Playback must be event-loop-friendly (`asyncio` task updating traits), not `time.sleep` in user code.
- [ ] Implement in this order: BinarySearch (real), QuickSort, MergeSort, BubbleSort/InsertionSort (trivial once
      the contract exists), BFS/DFS on Graph, Dijkstra, tree traversals (in/pre/post-order) on BinaryTree.
- [ ] Emit standard event metadata (`comparing`, `swapping`, `visited`, `pivot`) that renderers map to highlight states.
- [ ] Tests: assert full event sequences for small inputs (e.g. QuickSort([3,1,2]) produces a known trace).

**Exit criterion:** `QuickSort(arr).play()` animates partitions in a notebook with pause/step control from Python.

---

## P4 — Notebook UX & Animation (≈ 1 week)

- [ ] In-widget playback bar (play/pause/step/speed) rendered by the bridge, wired to snapshot index via traitlets —
      so control works from the UI as well as from Python.
- [ ] Actual animation: the docs promise Framer Motion but nothing imports it. Decide once — either add
      `motion.div` transitions to the renderers (bundle cost ~40KB) or commit to CSS transitions and fix the docs.
- [ ] Replay: `pratyaksha.replay(trace)` loads an `export_trace()` JSON and steps through it — enables
      "professor exports a trace, students replay it" without re-running code.
- [ ] Scope the injected CSS to `.pratyaksha-container` (fixes the Preflight leak that restyles notebook chrome).
- [ ] Dark/light: detect notebook theme (JupyterLab sets `data-jp-theme-light`) instead of assuming dark.

**Exit criterion:** a viewer can scrub an algorithm run without touching Python.

---

## P5 — PyPI Release & Docs (≈ 3–4 days)

- [ ] Full `pyproject.toml` metadata (license, authors, classifiers, urls, floors on `anywidget`/`traitlets`).
- [ ] GitHub Actions release workflow: build bridge → copy to `pratyaksha/static/` → `python -m build` →
      `twine upload` on tag. Stop committing built assets to the repo at all.
- [ ] Docs site (MkDocs Material is the least effort): quickstart, per-structure API, algorithm gallery with
      Colab badges, architecture page (the telemetry core deserves showing off).
- [ ] Versioning policy: bridge protocol version stamped into both the Python package and the JS bundle,
      checked at widget init with a clear mismatch error.

**Exit criterion:** `pip install pratyaksha` works from PyPI; docs URL in the repo header.

---

## P6 — Differentiators (post-1.0, pick opportunistically)

- [ ] **Pyodide compatibility** — make the package pure-Python-importable under Pyodide so the web app's IDE
      feature (see `features_phases.md` F5) can run Pratyaksha in the browser. This is the highest-leverage item:
      it unifies the website and the library into one story.
- [ ] `%%pratyaksha` cell magic: annotate a plain Python cell and auto-visualize the named structure.
- [ ] Plugin API: `register_structure(name, reducer, renderer_url)` so others can add structures without forking.
- [ ] Auto-instrumentation experiment: trace a user's plain `list`/`dict` operations via a proxy class
      (`watch(my_list)`) — zero-API-change visualization. Hard, but a paper-worthy demo if it lands.
- [ ] Structure-name enum shared across the boundary (generate the TS union from the Python `StructureType`
      StrEnum in CI) — closes the drift risk permanently.
