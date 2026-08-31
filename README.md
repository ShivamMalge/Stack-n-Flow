# Stack-n-Flow / Pratyaksha

This repository is in transition from `Stack-n-Flow`, a Next.js data-structure visualizer, into `Pratyaksha`, a Python-first algorithm telemetry and notebook visualization system.

Current intent:

- Keep the existing Next.js app working.
- Reuse the existing React visualizers as the rendering layer.
- Build a Python + `anywidget` bridge that can drive notebook visualizations safely.

## Quickstart — Pratyaksha in a notebook

```bash
pip install "pratyaksha @ git+https://github.com/ShivamMalge/Stack-n-Flow.git@v0.1.0"
```

```python
from pratyaksha import Stack

s = Stack()
for value in (10, 20, 30):
    s.push(value)

s          # renders a live Stack in the notebook
s.pop()    # the rendered view follows the Python object
```

Works in Jupyter Notebook and JupyterLab. Colab is untested — see the honesty
note below.

### What actually works today

`Stack` and `Queue` have dedicated presentational renderers built for the
notebook. The other twelve structures registered in the bridge — array, linked
list and its two variants, circular queue, tree, AVL tree, graph, hash table,
heap, plus the binary-search and quick-sort algorithm shells — sync their state
across the bridge but render by mounting the full web-app component, which was
built for a page rather than a notebook cell. They work; they are not yet
tailored. Extracting the remaining renderers is `pratyaksha_phases.md` P2.

There are **no animations** in the notebook widget: state updates are applied
directly. The animated stepping lives in the web app.

Verified by `tests/python/test_notebook_integration.py`, which runs a Stack and
a Queue inside a real Jupyter kernel on every CI run rather than trusting a
one-off manual check.

## Repository Status

The repo currently contains multiple concerns:

- `app/`, `components/`, `hooks/`, `lib/`, `public/`: the existing Next.js application
- `src/bridge/`: the Pratyaksha widget bridge source; built assets go to `pratyaksha/static/`
- `pratyaksha/`: the Python package
- `prisma/`, `middleware.ts`, auth pages: existing app-specific product concerns

Phase 0 establishes repository boundaries and the authoritative paths for future work. See:

- [`docs/architecture/repo-map.md`](docs/architecture/repo-map.md)
- [`docs/architecture/phase-0-baseline.md`](docs/architecture/phase-0-baseline.md)

## Authoritative Paths

Use these paths for active development:

- Web app: `app/`, `components/`, `hooks/`, `lib/`, `public/`
- Python package: `pratyaksha/`
- Widget bridge source: `src/bridge/`
- Built widget assets: `pratyaksha/static/` (inside the Python package, so they ship with `pip install`)

Treat these as legacy or out-of-scope for the Pratyaksha core:

- `prisma/`
- `middleware.ts`
- auth and onboarding pages under `app/`

## Verification

Baseline verification commands for the JavaScript side:

```bash
npm run verify:web
npm run verify:bridge
```

Python tests (requires a local Python runtime with `anywidget` and `traitlets` installed):

```bash
pytest tests/python
```

`scripts/smoke_check.py` is an import-only sanity check, not a verification gate — it does not
exercise the widget or notebook render path.

## Near-Term Execution Order

1. Phase 0: Baseline and Isolation
2. Phase 1: Renderer boundary refactor, starting with `Stack`
3. Phase 2: Python telemetry model
4. Phase 3: Structured bridge protocol
5. Phase 4: Packaging and release hardening
6. Phase 5: Replay, plugins, and optional Rust/Go extensions
