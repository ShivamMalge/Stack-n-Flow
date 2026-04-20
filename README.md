# Stack-n-Flow / Pratyaksha

This repository is in transition from `Stack-n-Flow`, a Next.js data-structure visualizer, into `Pratyaksha`, a Python-first algorithm telemetry and notebook visualization system.

Current intent:

- Keep the existing Next.js app working.
- Reuse the existing React visualizers as the rendering layer.
- Build a Python + `anywidget` bridge that can drive notebook visualizations safely.

## Repository Status

The repo currently contains multiple concerns:

- `app/`, `components/`, `hooks/`, `lib/`, `public/`: the existing Next.js application
- `src/bridge/`, `dist/`: the Pratyaksha widget bridge and built frontend assets
- `pratyaksha/`: the Python package
- `prisma/`, `middleware.ts`, auth pages: existing app-specific product concerns
- `Stack-n-Flow-main/`: legacy duplicate tree, not authoritative for new work

Phase 0 establishes repository boundaries and the authoritative paths for future work. See:

- [`docs/architecture/repo-map.md`](docs/architecture/repo-map.md)
- [`docs/architecture/phase-0-baseline.md`](docs/architecture/phase-0-baseline.md)

## Authoritative Paths

Use these paths for active development:

- Web app: `app/`, `components/`, `hooks/`, `lib/`, `public/`
- Python package: `pratyaksha/`
- Widget bridge source: `src/bridge/`
- Built widget assets: `dist/`

Treat these as legacy or out-of-scope for the Pratyaksha core:

- `Stack-n-Flow-main/`
- `prisma/`
- `middleware.ts`
- auth and onboarding pages under `app/`

## Verification

Baseline verification commands for the JavaScript side:

```bash
npm run verify:web
npm run verify:bridge
```

Python smoke verification is still environment-dependent because the local machine must provide a Python runtime:

```bash
python test_pratyaksha.py
```

## Near-Term Execution Order

1. Phase 0: Baseline and Isolation
2. Phase 1: Renderer boundary refactor, starting with `Stack`
3. Phase 2: Python telemetry model
4. Phase 3: Structured bridge protocol
5. Phase 4: Packaging and release hardening
6. Phase 5: Replay, plugins, and optional Rust/Go extensions
