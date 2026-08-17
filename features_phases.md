# Feature Roadmap — Stack-n-Flow

New capabilities, ordered by (demo value for the department) ÷ (effort). Assumes `fixes_phases.md`
Phases 0–3 are done (security fixed, hardcoding lifted, dead links resolved). Pratyaksha-library work
lives in `pratyaksha_phases.md`; this file is the web platform.

---

## F1 — VTU 3rd-Sem DSA Syllabus Coverage (BCS304) (≈ 1.5–2 weeks)

Fill the gaps between the current 15 DS / 8 algo tabs and the actual syllabus. New visualizers reuse the
shared renderer/constants infrastructure from the fixes plan — each new one should be a renderer + controller
pair from day one, never another 800-line monolith.

Already covered: stack, queue, circular queue, all linked-list variants, BST, AVL, B-tree, heap, hash table, graph.

- [ ] **Infix → Postfix conversion** visualizer (stack-driven, step-by-step) — a guaranteed exam question.
      The stack expression-evaluation logic in `components/operations/stack-operations.tsx` is a starting point.
- [ ] **Postfix evaluation** as a follow-on tab of the same component.
- [ ] **Priority Queue** and **Double-Ended Queue (Deque)** — small deltas on existing queue renderers.
- [ ] **Hashing collision strategies**: extend the hash-table visualizer with linear probing, quadratic probing,
      and double hashing side-by-side (currently chaining only). Make table size and the hash function user-settable —
      that's the teaching parameter.
- [ ] **Sorting additions**: Insertion, Selection, Bubble, **Radix** (VTU asks radix specifically), Merge —
      slot into the existing sorting-comparison framework rather than new pages.
- [ ] **Recursion visualizer**: call-stack animation for factorial, Fibonacci, **Tower of Hanoi**, Ackermann —
      VTU Module 1; nothing in the app shows a call stack today.
- [ ] **Expression trees** and **threaded binary tree** (Module 4) — expression tree builds naturally on the
      infix/postfix work.

---

## F2 — VTU 4th-Sem DAA Syllabus Coverage (BCS401) (≈ 2–3 weeks)

The DAA syllabus is graph-heavy; the single force-layout graph visualizer becomes the foundation for a suite.

- [ ] **Graph algorithm suite** on one shared weighted-graph editor (user-drawn nodes/edges + presets):
  - BFS / DFS with visit order and frontier highlighting (decrease & conquer)
  - **Topological sort** (both DFS and source-removal methods — VTU asks both)
  - **Dijkstra** on a real graph (the current grid pathfinder is a different mental model; keep both)
  - **Prim** and **Kruskal** MST side-by-side, with union-find visualization for Kruskal
  - **Floyd–Warshall** and **Warshall** with the distance-matrix animating per k-iteration
  - **Bellman–Ford**
- [ ] **Huffman coding**: frequency table → tree construction → code table (greedy, Module 3).
- [ ] **Dynamic programming set**: 0/1 knapsack exists — add its table-filling animation, plus
      **Travelling Salesman (DP)** on small graphs.
- [ ] **Backtracking set**: **N-Queens** (the canonical one), subset-sum, graph coloring — a chessboard/state-tree
      renderer with backtrack animation.
- [ ] **Branch & bound**: assignment problem or knapsack with live bound pruning shown on the state tree.
- [ ] Divide & conquer: merge/quick already exist — add **Strassen's** as a static step-through (matrix splits),
      not an animation; it's asked in theory, not traced.
- [ ] Every algorithm page shows: pseudocode panel with line highlighting (component exists), recurrence +
      complexity analysis, and the live operation counters from F7.

---

## F3 — Syllabus Mapping & Learn Content (≈ 1 week, content-heavy)

- [ ] **Syllabus map page**: `/syllabus` — VTU BCS304 and BCS401 module tables, each row linking to the matching
      visualizer + learn page. Make the scheme data-driven (`lib/config/syllabus.ts`) so other universities/schemes
      are a config file, not a code change. This is the page that makes an HOD instantly understand the project.
- [ ] Finish the 16 missing `/learn` topic pages (structure exists in `lib/learn-content.ts`; it's writing work).
- [ ] **Lab program companion**: VTU's 3rd-sem lab programs (in C) listed per experiment, each paired with the
      visualizer that demonstrates it — bridges "what we run in lab" and "what we see here."
- [ ] Previous-year VTU question tags on each topic ("asked in Dec-2023, Model QP 2") — cheap to add, high
      perceived exam value for students.

---

## F4 — Classroom Features (≈ 2 weeks) — makes the roles real

The STUDENT/PROFESSOR roles and profile tables exist but drive nothing. This phase is the department pitch.

- [ ] **Student progress tracking**: per-topic completion, per-visualizer operation counts, streaks.
      Small Prisma additions (`TopicProgress` table), visible on a student dashboard.
- [ ] **Professor dashboard**: class roster (students matched by institution/branch/semester from onboarding
      data you already collect), per-topic completion heatmap of the class.
- [ ] **Assignments**: professor picks a visualizer + task ("insert 34,12,99 into an AVL tree; submit the final
      rotation count"), students complete it in-app, auto-checked against the telemetry state.
- [ ] **Presentation mode**: a chrome-free, large-font, keyboard-driven view of any visualizer for projector use
      in lectures — trivial to build (a layout variant), disproportionately used in practice.
- [ ] Admin seed: professor accounts flagged manually at first (no self-serve professor verification yet).

---

## F5 — In-Browser IDE (≈ 2–3 weeks, staged) — the flagship

"Write binary search, run it, watch it animate." Three stages, each independently shippable:

- [ ] **F5.1 — Editor + Python runtime (browser-only, no servers)**: Monaco editor + **Pyodide** (CPython in
      WebAssembly). Preloaded templates per algorithm (binary search, quick sort, BFS…), Run button, stdout panel.
      No backend, no execution API, no sandboxing problem — the code runs in the student's own browser tab.
- [ ] **F5.2 — Live visualization sync (the differentiator)**: load **Pratyaksha** inside Pyodide
      (needs `pratyaksha_phases.md` P6 Pyodide compatibility). Student code writes
      `s = Stack(); s.push(x)` — telemetry snapshots stream out of Pyodide into the *existing* React renderers
      beside the editor. Professor writes the algorithm live; the class watches the structure move.
      No other DSA-teaching site does this; it's also the strongest possible justification for keeping Pratyaksha.
- [ ] **F5.3 — Multi-language execution (C/Java, VTU labs are in C)**: server-side execution via the
      **Piston** API (free, open-source) or **Judge0** (self-host on the free tier, or paid API). Output-only —
      no visualization sync for C/Java initially; be explicit about that boundary in the UI.
      ⚠ Never build your own arbitrary-code executor on your own server; use these sandboxed services only.
- [ ] Persistence: save/load code snippets per user (Prisma `Snippet` table); share-by-link for professors.

---

## F6 — Assessment & Engagement (≈ 1–2 weeks)

- [ ] **Predict-the-next-state quiz**: pause any animation, ask "which node is visited next?" — generated
      directly from telemetry snapshots, so every algorithm gets quizzes for free.
- [ ] **Module quiz bank**: MCQs per VTU module, tracked in progress; professors see class-level weak topics.
- [ ] **Trace export & share**: download any run as JSON; shareable replay links (`/replay/<id>`) — pairs with
      Pratyaksha's `export_trace()`.
- [ ] Leaderboard / badges per class — optional; cheap once progress tracking (F4) exists.

---

## F7 — Platform Polish (ongoing, slot between phases)

- [ ] **Live complexity counters**: comparisons/swaps/visits counting up during every animation, displayed next
      to the Big-O table — turns asymptotic notation into something students watch happen.
- [ ] Input everywhere: let students supply their own arrays/graphs/keys in every visualizer (several still
      run only on seed data).
- [ ] Mobile responsiveness pass + PWA manifest (students revise on phones; offline visualizers are feasible
      since everything is client-side).
- [ ] Real light theme (after the fixes-plan theme repairs): audit every visualizer's colors as CSS tokens.
- [ ] Optional, later: an "explain this step" panel powered by an LLM API, constrained to the current telemetry
      snapshot — useful, but only after the deterministic features above; it needs an API budget and guardrails.

---

## Suggested build order for maximum HOD impact

1. **F3 syllabus map** (1 week, mostly content) — instantly legible to faculty.
2. **F1** DSA gaps — makes the tool complete for the semester being taught.
3. **F4** classroom features — turns "student project" into "department tool."
4. **F5.1 → F5.2** IDE — the flagship demo. F5.2 depends on Pratyaksha P6.
5. **F2** DAA suite — biggest build, schedule across the 4th-sem timeline.
6. F6/F7 continuously as small wins.
