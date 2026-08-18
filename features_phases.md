# Feature Roadmap — Stack-n-Flow

New capabilities, ordered by (demo value for the department) ÷ (effort). `fixes_phases.md` Phases 0–6
are complete. Pratyaksha-library work lives in `pratyaksha_phases.md`; this file is the web platform.

**`lib/config/syllabus.ts` is the authoritative gap list, not this file.** It holds both VTU courses
transcribed from the official module PDFs, with each topic's coverage state and a note on what is
missing. The lists below are commentary on it — the build order and the reasoning — but when the two
disagree, the config wins, and `tests/lib/syllabus.test.ts` keeps it honest against the code. Keep new
work flowing back into the config so `/syllabus` stays truthful.

## Where the project actually stands

Measured against the transcribed syllabus, not the tab count. Partial counts half credit.

| Course | Covered | Partial | Planned | Total | |
| --- | --- | --- | --- | --- | --- |
| **BCS304** Data Structures and Applications | 14 | 7 | 21 | 42 | **42%** |
| **BCS401** Analysis and Design of Algorithms | 8 | 4 | 24 | 36 | **28%** |

Twenty-three visualizers reads as broad until it is laid against the syllabus it is meant to serve.
BCS401 Module 5 is at zero and Module 1 is nearly all theory.

**Two things this roadmap previously got wrong, both worth remembering:**

1. **The app has two teaching surfaces.** `/operations` carries seven components and is easy to forget
   when planning against `/visualize` alone. Postfix evaluation, parenthesis validation, the whole
   polynomial module (add, subtract, multiply, evaluate, derivative, degree) and singly-linked-list
   inversion already ship there. Check `components/operations/` before writing "unbuilt."
2. **Read the implementation, not the catalogue.** `sorting-comparison.tsx` has real frame generators
   for bubble, selection, insertion, quick and merge sort; `dp-visualizer.tsx` animates a 0/1 knapsack
   table. An earlier pass called all of those unbuilt because it inferred from names.

---

## F1 — BCS304 Gaps (≈ 1.5–2 weeks)

Twenty-one planned and seven partial topics. Each new visualizer should be a renderer + controller pair
from day one, never another 800-line monolith, and should reuse `lib/visualizer-states.ts` and
`lib/tree-layout.ts` rather than inventing placement or colour.

**Highest exam value first:**

- [ ] **Infix → postfix conversion** (M1). The other half of "Evaluation and conversion of
      expressions" — a guaranteed exam question. Postfix *evaluation* already exists in
      `components/operations/stack-operations.tsx`, so this completes a pair rather than starting one.
      Promote both to a proper visualizer page with the operator-stack and output-queue side by side.
- [ ] **Representation of disjoint sets** (M4). Union-find with union by rank and path compression.
      Build this early: Kruskal in F2 needs it, so one build serves two courses.
- [ ] **Hashing collision strategies** (M5). The hash table does chaining only. Add linear probing,
      quadratic probing and double hashing, and make table size *and* the hash function user-settable —
      that is the teaching parameter. Turns one partial row into a full one.
- [ ] **Threaded binary trees** (M3). Named explicitly in the syllabus; nothing shows thread pointers.
- [ ] **Priority queue framing** (M5). `heap` already animates min- and max-heaps but is not presented
      as the priority-queue ADT the syllabus asks for. Partly a labelling and copy job.
- [ ] **Double-ended priority queues** (M5) — min-max heaps.
- [ ] **Leftist trees** (M5). The meld operation is the whole teaching point, and it animates well.
- [ ] **Optimal binary search trees** (M5). A dynamic-programming construction, so it fits the existing
      DP table framework rather than needing a new renderer.

**Array and list representation topics (M1–M3), currently a blind spot:**

- [ ] **Sparse matrices** — triple representation and transpose (M1), then the linked representation (M3).
- [ ] **Polynomials using linked lists** (M2). The array-based polynomial module already exists on
      `/operations`; this is the linked counterpart the syllabus asks for separately.
- [ ] **Representation of multidimensional arrays** (M1) — row-major and column-major address
      calculation. Small, and genuinely asked in exams.
- [ ] **Strings** (M1) and **structures and unions** (M1).
- [ ] **Multiple stacks and queues** (M2) — several stacks sharing one array.
- [ ] **Linked stacks and queues** (M2).
- [ ] **List concatenation** (M3) — inversion already exists on `/operations`.
- [ ] **Dynamic array growth** (M1, M2). Three partial rows — arrays, stacks and queues — all say the
      same thing: the visualizers grow without bound and never show the doubling-and-copy step that is
      the point of the topic. One shared animation fixes all three.
- [ ] **Selection trees** (winner and loser trees) and **forests** with forest-to-binary-tree
      conversion (M4).
- [ ] **Dynamic hashing** (M5) — extendible hashing with directory doubling.
- [ ] **Counting binary trees** (M4) — Catalan numbers; largely analytical, so `/learn` may serve it
      better than a visualizer.

⚠ **Sorting is not in BCS304.** The five module PDFs cover arrays/structures/stacks, queues/linked
lists, linked lists/trees, trees/graphs, and hashing/priority queues/efficient BSTs — no sorting module.
An earlier draft of this file claimed "VTU asks radix specifically" under BCS304; that is not supported
by these documents. Sorting belongs to BCS401. If radix is wanted, verify it against the **lab**
syllabus, which is a separate document nobody has transcribed yet.

---

## F2 — BCS401 Gaps (≈ 2–3 weeks)

Twenty-four planned and four partial topics — the bigger hole, and the more visual one. The syllabus is
graph-heavy, so the existing force-layout graph visualizer becomes the foundation for a suite.

**Start here — the single largest gain in the project:**

- [ ] **Weighted-graph editor**, extending the current graph visualizer with edge weights and presets.
      Everything below builds on it, so it is the real unit of work:
  - [ ] **Prim's algorithm** (M4) — MST, growing from a start vertex.
  - [ ] **Kruskal's algorithm** (M4) — MST by sorted edges; needs the union-find from F1, and showing
        the disjoint-set state beside the edge list is what makes it click.
  - [ ] **Dijkstra on a real graph** (M4). Currently partial: `pathfinding` runs it on a grid, which is
        a different mental model from the weighted graph the syllabus presents. Keep both.
  - [ ] **Topological sorting** (M2) — both the DFS and source-removal methods; VTU asks both.
- [ ] **Warshall's and Floyd's algorithms** (M4). The distance matrix animating per *k* iteration is the
      whole lesson, and it reuses the DP-table renderer rather than the graph one.
- [ ] **Backtracking suite** (M5): **n-Queens**, **Hamiltonian circuit**, **subset-sum** — one
      state-space-tree renderer with backtrack animation serves all three. Module 5 is at zero coverage
      and this is its most visual topic, so it is the best value in the module.
- [ ] **Huffman trees and codes** (M4): frequency table → tree construction → code table.
- [ ] **Branch-and-bound** (M5): assignment, knapsack and travelling salesman, with live bound pruning
      shown on the state tree. Shares the state-tree renderer with the backtracking suite.
- [ ] **Exhaustive search** (M2): travelling salesman, knapsack, assignment — the brute-force baseline
      the later techniques are measured against, so it pairs naturally with branch-and-bound.
- [ ] **String matching** (M1, M3): brute force, then **Horspool** and **Boyer–Moore** with the shift
      tables visible. Three topics off one renderer.
- [ ] **Distribution counting** (M3) — "sorting by counting"; slots into the sorting-comparison
      framework, which already has five algorithms racing.
- [ ] **Knapsack memory functions** (M4). The 0/1 table already animates; the memoised variant does not,
      and the contrast between them *is* the topic.
- [ ] **DP presets** (M4): coin-row, change-making and coin-collecting. `dp-visualizer` has the table
      machinery and does Fibonacci and knapsack; these are three more presets, not a new page.
- [ ] **2-3 trees** (M3). Partial: the B-tree visualizer generalises them but is not presented as one.
      A preset with *t* fixed and 2-3 language would close it cheaply.
- [ ] **Strassen's and large-integer multiplication** (M2) — a static step-through of the matrix
      splits, not an animation; it is asked in theory, not traced.
- [ ] **Decision trees** (M5) — lower bounds for sorting and searching.
- [ ] **Asymptotic notation and analysis** (M1) — a growth-rate plot, and a recursion-tree/call-stack
      view for the recursive-analysis topic. Nothing in the app shows a call stack today, and Tower of
      Hanoi is the classic vehicle for it.

⚠ **Bellman–Ford is not in BCS401.** An earlier draft listed it. The prescribed textbook extract for
Module 4 is Levitin 8.1, 8.2, 8.4 and 9.1–9.4 — Prim, Kruskal, Dijkstra, Huffman. Likewise **graph
colouring** and **TSP via dynamic programming** were listed but do not appear; the syllabus reaches TSP
through exhaustive search (3.4) and branch-and-bound (12.2). Build them if you want them, but not on
the claim that the syllabus requires them.

**Theory topics for `/learn`, not visualizers** (M1, M5): what is an algorithm, fundamentals of
algorithmic problem solving, the analysis framework, and P/NP/NP-complete. Eight of the planned rows are
prose, not engineering — do not let them distort the coverage percentage in planning.

---

## F3 — Syllabus Mapping & Learn Content (≈ 1 week remaining, content-heavy)

- [x] **Syllabus map page** — `/syllabus` renders both courses module by module, each row linking to
      the visualizer or `/operations` tab that teaches it, with covered / partial / planned state and a
      note on what is missing. Data-driven via `lib/config/syllabus.ts`; another university is a Course
      entry, not a code change.
- [x] **`/operations` deep links** — `?tab=` selects a set. The page previously had no addressable
      state, so nothing could link into it.
- [ ] Finish the missing `/learn` topic pages. Structure exists in `lib/learn-content.ts`, which
      currently holds four of them (linked-list, stack, array, binary-search). This is writing work, and
      the theory topics called out in F1 and F2 belong here.
- [ ] **Lab program companion**: VTU's 3rd-sem lab programs (in C) listed per experiment, each paired
      with the visualizer that demonstrates it — bridges "what we run in lab" and "what we see here."
      ⚠ Needs the lab syllabus document; it is not among the ten module PDFs.
- [ ] Previous-year VTU question tags on each topic ("asked Dec-2023, Model QP 2") — cheap to add, high
      perceived exam value. Extend `SyllabusTopic` with an optional `askedIn` array.

---

## F4 — Classroom Features (≈ 2 weeks) — makes the roles real

The STUDENT/PROFESSOR roles and profile tables exist but drive nothing. This phase is the department
pitch. The live database already holds real users (5 students, 2 professors at last count), so there is
a genuine roster to build against rather than seed data.

- [ ] **Student progress tracking**: per-topic completion, per-visualizer operation counts, streaks.
      Small Prisma additions (`TopicProgress` table), visible on a student dashboard. Key it by the
      syllabus topic titles in `lib/config/syllabus.ts` so progress maps onto modules for free.
- [ ] **Professor dashboard**: class roster (students matched by institution/branch/semester from
      onboarding data you already collect), per-topic completion heatmap of the class.
- [ ] **Assignments**: professor picks a visualizer + task ("insert 34,12,99 into an AVL tree; submit
      the final rotation count"), students complete it in-app, auto-checked against telemetry state.
- [ ] **Presentation mode**: a chrome-free, large-font, keyboard-driven view of any visualizer for
      projector use in lectures — a layout variant, cheap to build, disproportionately used in practice.
      Cheaper now that every visualizer routes to its own page and shares `VisualizerLayout`.
- [ ] Admin seed: professor accounts flagged manually at first (no self-serve professor verification).

---

## F5 — In-Browser IDE (≈ 2–3 weeks, staged) — the flagship

"Write binary search, run it, watch it animate." Three stages, each independently shippable:

- [ ] **F5.1 — Editor + Python runtime (browser-only, no servers)**: Monaco editor + **Pyodide**
      (CPython in WebAssembly). Preloaded templates per algorithm, Run button, stdout panel. No backend,
      no execution API, no sandboxing problem — the code runs in the student's own browser tab.
- [ ] **F5.2 — Live visualization sync (the differentiator)**: load **Pratyaksha** inside Pyodide
      (needs `pratyaksha_phases.md` P6 Pyodide compatibility). Student code writes
      `s = Stack(); s.push(x)` — telemetry snapshots stream out of Pyodide into the *existing* React
      renderers beside the editor. Professor writes the algorithm live; the class watches the structure
      move. No other DSA-teaching site does this, and it is the strongest justification for keeping
      Pratyaksha.
- [ ] **F5.3 — Multi-language execution (C/Java; VTU labs are in C)**: server-side execution via the
      **Piston** API (free, open-source) or **Judge0**. Output-only — no visualization sync for C/Java
      initially; be explicit about that boundary in the UI.
      ⚠ Never build your own arbitrary-code executor on your own server; use these sandboxed services.
- [ ] Persistence: save/load snippets per user (Prisma `Snippet` table); share-by-link for professors.

---

## F6 — Assessment & Engagement (≈ 1–2 weeks)

- [ ] **Predict-the-next-state quiz**: pause any animation, ask "which node is visited next?" —
      generated directly from telemetry snapshots, so every algorithm gets quizzes for free.
- [ ] **Module quiz bank**: MCQs per VTU module, tracked in progress; professors see class-level weak
      topics. Modules already exist in `lib/config/syllabus.ts` to hang these off.
- [ ] **Trace export & share**: download any run as JSON; shareable replay links (`/replay/<id>`) —
      pairs with Pratyaksha's `export_trace()`.
- [ ] Leaderboard / badges per class — optional; cheap once progress tracking (F4) exists.

---

## F7 — Platform Polish (ongoing, slot between phases)

- [ ] **Live complexity counters**: comparisons/swaps/visits counting up during every animation, shown
      next to the Big-O table — turns asymptotic notation into something students watch happen. Doubles
      as coverage for the BCS401 M1 analysis topics.
- [ ] Input everywhere: let students supply their own arrays/graphs/keys in every visualizer (several
      still run only on seed data).
- [ ] **Graph node placement**: the 45-slot lattice keeps nodes from overlapping but ignores edges, so
      dense graphs still cross badly. A force-directed pass would help, and the graph suite in F2 makes
      it matter much more.
- [ ] **Heap layout**: uses 47% of its available width, measured — the tree sits cramped and
      off-centre while the card is half empty.
- [ ] Mobile pass + PWA manifest (students revise on phones; offline visualizers are feasible since
      everything is client-side).
- [ ] Remaining dependency work: `npm audit` is down to 7 (0 critical). What is left needs `--force` —
      Next 15.5.15 → 15.5.23, which drags `sharp` and `postcss`, plus a Prisma bump npm reports as
      major. Framework upgrades, so do them deliberately with the full suite green.
- [ ] `next lint` is deprecated in Next 15.5 — migrate to `eslint .`.
- [ ] Optional, later: an "explain this step" panel powered by an LLM API, constrained to the current
      telemetry snapshot — useful, but only after the deterministic features above; needs an API budget
      and guardrails.

---

## Suggested build order for maximum HOD impact

F3's syllabus map is done, and it changed the ordering: the coverage table now argues for closing
BCS401 before polishing anything else, because a visible 28% is the weakest number on the site.

1. **F2 weighted-graph editor + Prim, Kruskal, Dijkstra, topological sort** — four topics off one
   build, on the strongest existing visualizer. Do F1's union-find first; Kruskal needs it.
2. **F2 Warshall + Floyd**, then the **backtracking suite** (n-Queens, Hamiltonian, subset-sum) — five
   more topics, and it lifts Module 5 off zero. Together with step 1 this takes BCS401 to roughly 55%.
3. **F1 infix → postfix** — the highest single exam-value item in either course, and half of it exists.
4. **F3 learn pages** for the eight theory topics that will never have a visualizer. Cheap, and it
   stops them dragging the coverage number down forever.
5. **F4 classroom features** — turns "student project" into "department tool."
6. **F5.1 → F5.2** IDE — the flagship demo. F5.2 depends on Pratyaksha P6.
7. **F1 representation topics** (sparse matrices, polynomials, multidimensional arrays) and the rest of
   F2 — steady coverage grind, schedulable across the semester.
8. F6/F7 continuously as small wins.

Update `lib/config/syllabus.ts` in the same commit as each visualizer. `/syllabus` is the page an HOD
will read first, and it is only worth having while it is true.
