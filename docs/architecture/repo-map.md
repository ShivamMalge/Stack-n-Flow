# Repository Map

## Purpose

This document identifies which parts of the repository are authoritative for ongoing Pratyaksha work and which parts are legacy or app-specific.

## Authoritative Paths

### Next.js Application

- `app/`
- `components/`
- `hooks/`
- `lib/`
- `public/`

These paths define the currently running web application and contain the visualizers that are being reused for Pratyaksha.

### Pratyaksha Python Package

- `pratyaksha/`

This path contains the current Python widget and data structure wrappers.

### Widget Bridge

- `src/bridge/`
- `dist/`

`src/bridge/` is the source of the notebook bridge.
`dist/` contains generated assets consumed by the Python widget.

## Legacy or Non-Core Paths

### Legacy Duplicate Tree

- `Stack-n-Flow-main/`

This is a duplicate copy of the older application tree. It should not be used as the source for current refactor work.

### App-Specific Product Concerns

- `prisma/`
- `middleware.ts`
- `app/(auth)/`
- `app/api/auth/`
- `app/login/`

These remain relevant for the web app but are not part of the Pratyaksha core architecture.

## Working Rule

For architecture evolution work, prefer:

1. `components/visualizers/` for renderer extraction
2. `src/bridge/` for widget bridge changes
3. `pratyaksha/` for Python-side state and widget logic

Do not plan new work against `Stack-n-Flow-main/`.
