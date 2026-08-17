# Pratyaksha — Notebook Visualisation Library

Pratyaksha drives the Stack'n'Flow React visualizers from Python, so a notebook cell like

```python
from pratyaksha import Stack

s = Stack()
s.push(10)
s.push(20)
s          # renders an interactive stack
```

displays a live widget backed by the same components the web app uses.

## Install

```bash
pip install git+https://github.com/ShivamMalge/Stack-n-Flow.git@v0.1.0
```

From a source checkout you must build the widget bundle first, because the Python
package reads it at import time:

```bash
npm install
npm run build-lib        # writes pratyaksha/static/
pip install -e .
```

If the bundle is missing, importing the package raises a `RuntimeError` naming the
expected path and the command to run — it does not fail silently.

## What actually works today

| Capability | Status |
|---|---|
| `pip install` ships the package and its assets | ✅ verified from a clean virtualenv |
| Widget renders in a notebook via the ipywidgets mimebundle | ✅ |
| Python → React state sync (`structure`, `nodes`, `metadata`) | ✅ |
| Stack and Queue as dedicated presentational renderers | ✅ |
| 12 further structures render through the app's interactive components | ⚠️ see limitations |
| `export_trace()` replay data | ✅ produced; no replay UI yet |
| Algorithm drivers (`BinarySearch`, `QuickSort`) | ⚠️ stubs — see limitations |

### Supported structures

- **Linear**: Stack, Queue, Array, Linked List, Circular Linked List, Doubly Linked List, Circular Queue
- **Trees**: Binary Tree, AVL Tree, Heap
- **Graphs**: node/edge graph
- **Other**: Hash Table (separate chaining)

## Known limitations

These are real and worth stating plainly rather than discovering later:

- **Only Stack and Queue are true renderers.** The other twelve entries in the bridge
  registry mount the full interactive web components, so a notebook shows input boxes and
  buttons whose state is overwritten by Python on the next update. Extracting the
  remaining renderers is P2 in `pratyaksha_phases.md`.
- **There are no animations.** Earlier documentation claimed Framer Motion drove
  transitions; nothing in the codebase imports it. Notebook visuals are static re-renders
  between states.
- **`QuickSort` does not sort and `BinarySearch` does not search.** Both hold an initial
  array; `QuickSort`'s reducer is the identity function and `BinarySearch` only stores a
  result string the caller computed. Real stepwise drivers are P3.
- **No playback controls** in the widget yet.

## Architecture

### State synchronisation

Three traitlets carry state from Python to React:

- `structure` — which visualizer to mount, one of `StructureType`
- `nodes` — the primary data
- `metadata` — auxiliary state (edges, heap node states, queue front/rear, search results)

Structure names are defined once in `pratyaksha/core/structures.py` and must match the keys
in `src/bridge/registry.tsx`.

### Telemetry core

`pratyaksha/core/telemetry.py` is an event-sourced core: every operation emits a
`TelemetryEvent`, a reducer folds it into an immutable `TelemetrySnapshot`, and the full
history is retained. `export_trace()` returns the events and snapshots as JSON-ready data,
which is what a future replay feature will consume.

### Layout

- `pratyaksha/` — the Python package
  - `core/` — telemetry, shared base class, structure enum
  - `structures/`, `algorithms/` — the public API
  - `static/` — built widget assets, shipped as package data
- `src/bridge/` — React bridge source (router + registry + stylesheet)
- `components/visualizers/` — the React components, shared with the web app

### Styling

The widget stylesheet is built with `tailwind.bridge.config.ts`, which disables Tailwind
Preflight and scopes the base rules to `.pratyaksha-container`. This matters because
anywidget injects the CSS into the host document: the web app's stylesheet would otherwise
reset margins and repaint the background of the whole notebook. Design tokens live in
`app/theme-tokens.css` and are shared by both builds.

## Verification

```bash
npm run verify:web       # Next.js build
npm run verify:bridge    # widget bundle + stylesheet
npm test                 # React/bridge tests
pytest tests/python      # telemetry tests
python scripts/smoke_check.py   # import sanity check only, not a gate
```
