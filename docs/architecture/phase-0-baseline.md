# Phase 0 Baseline and Isolation

## Goal

Create a stable map of the repository before Phase 1 refactoring begins.

## Baseline Decisions

### 1. Phase 1 Starts with a Narrow Slice

The first Phase 1 execution target is `Stack` only.

Out of scope for the initial refactor slice:

- `Queue`
- `Tree`
- `Graph`
- all algorithm visualizers
- packaging changes
- protocol redesign

### 2. The Existing Web App Must Keep Working

Phase 1 changes must preserve compatibility with:

- `app/visualize/page.tsx`
- existing visualizer imports under `components/visualizers/`
- the current bridge entrypoint under `src/bridge/pratyaksha-bridge.tsx`

### 3. Python Core and Web App Are Still Mixed

That is an accepted current-state condition, not a signal to split the repo immediately.

Repository/package restructuring is postponed until after:

- one renderer boundary is proven
- one telemetry flow is proven
- one notebook flow is proven

### 4. Legacy Paths Are Documented, Not Deleted

`Stack-n-Flow-main/` is treated as legacy and excluded from active architecture work.

No destructive cleanup is performed in Phase 0.

## Verification Commands

JavaScript baseline:

```bash
npm run verify:web
npm run verify:bridge
```

Python smoke check when Python is available:

```bash
python test_pratyaksha.py
```

## Phase 1 Entry Criteria

Phase 1 may start once the following are true:

- repository boundaries are documented
- the authoritative paths are clear
- the first renderer extraction target is explicitly limited to `Stack`
- baseline verification commands are recorded
