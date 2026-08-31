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

## P2 — Renderer Extraction for the Remaining 12 Structures (≈ 1.5–2 weeks)

Today only Stack and Queue have true presentational renderers; the other 12 registry entries mount the full
interactive Next.js components — notebook users see input boxes, tabs, and buttons that silently do nothing.

- [ ] For each structure, split `<X>Visualizer` into `<X>Controller` (app-side state + inputs) and `<X>Renderer>`
      (pure props → SVG/DOM), following the existing `components/visualizers/stack/` pattern.
      Suggested order (teaching value ÷ effort): LinkedList → Array → BinaryTree → Graph → HashTable → Heap →
      CircularQueue → AVL → Doubly/Circular LL → BST → B-Tree.
- [ ] Update `src/bridge/registry.tsx` to consume renderers only; delete the `isRendererOnlyComponent` special case
      once everything is renderer-only.
- [ ] One vitest render-test per renderer (empty state + populated state), mirroring `stack-renderer.test.tsx`.
- [ ] This phase also pays down web-app debt: the four ~600–900-line tree monoliths shrink, and the app's
      controllers and the notebook share one rendering source of truth.

**Exit criterion:** no notebook widget shows an interactive control that doesn't work.

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
