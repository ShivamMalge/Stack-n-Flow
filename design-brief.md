# Claude Design brief — Stack'n'Flow

Paste everything below the line into Claude Design. It describes the app as it
actually is today, not as planned: every count was read out of the codebase.

---

Design a UI for **Stack'n'Flow**, a web app that teaches data structures and
algorithms by animating them step by step. It is built for an Indian
engineering college — the content is mapped to the VTU syllabus — and its users
are second-year undergraduates revising for exams, plus the professors teaching
them.

## What makes it different

Most DSA sites show a finished animation. This one shows **the code executing
beside the structure moving**. Every visualizer has a code panel that highlights
the exact line being run, and the same algorithm can be read in **Python, C,
C++, Java or Rust** — the student picks their language once and it is
remembered everywhere. That matters because their lab work is in C while
teaching material is usually in Python.

It also states its own coverage honestly: a `/syllabus` page lists every topic
in two VTU courses and marks each one covered, partial or planned, rather than
implying completeness.

## Pages

1. **Home** (`/`) — landing page. Explains the idea, links into the visualizers.
2. **Learn** (`/learn`, `/learn/[topic]`) — written modules: intuition,
   algorithm steps, implementations in several languages, complexity tables,
   applications, advantages and disadvantages. 4 modules written so far, more
   planned.
3. **Visualize** (`/visualize`) — index of all 28 visualizers as cards, grouped
   into Data Structures and Algorithms.
4. **Visualizer page** (`/visualize/[slug]`) — one per topic, 28 of them. This
   is the heart of the app and the screen that matters most.
5. **Syllabus** (`/syllabus`) — VTU BCS304 and BCS401, module by module, each
   topic linked to the visualizer that teaches it with a covered / partial /
   planned badge and a per-course progress bar.
6. **Operations** (`/operations`) — a lighter, non-animated playground with 7
   tabs (array, linked list, stack, queue, tree, graph, polynomial) for running
   single operations and seeing the result plus an execution trace.
7. **About** (`/about`) — project and author.
8. **Login** (`/login`) and **Onboarding** (`/onboarding`) — Google sign-in,
   then a two-step role picker: Student, Professor or general User, with
   institution and semester for students.

## Anatomy of a visualizer page

Every one of the 28 shares a layout, and this is the screen to get right. Left
column roughly 40%, right roughly 60%, stacking to one column on mobile in the
order controls → visualization → code → notes.

- **Breadcrumb + title row** — topic icon, name, one-line description, a
  dropdown to jump to any other visualizer, and a "Learn" button when a written
  module exists.
- **Controls card** (left) — inputs and buttons for the structure, plus
  playback: a scrubbable progress bar, reset / step back / play-pause / step
  forward, a speed slider from 0.5x to 3x, and a stats row (comparisons, swaps,
  probes, load factor — varies by topic).
- **Visualization card** (right) — the structure itself, animating. SVG for
  anything tree- or graph-shaped, boxes and bars otherwise. Carries a
  one-sentence description of the current step and a legend of state colours.
- **Code panel** (right, under the visualization) — dark editor-style surface in
  both themes, line numbers, syntax colouring, the executing line highlighted
  and auto-scrolled into view, and language tabs across the top.
- **Learning card** (left, under the controls) — prose explaining the idea, the
  complexity, and the trap students fall into.

## The visualizers

**Data structures (19):** Linked List · Doubly Linked List · Circular Linked
List · Stack · Queue · Circular Queue · Tree Traversals · Binary Tree · Binary
Search Tree · AVL Tree · B-Tree · Graph · Array · Dynamic Array · Heap ·
Disjoint Sets · Sparse Matrix · Priority Queue · Hash Table

**Algorithms (9):** Binary Search · Expression Conversion · Quick Sort · Heap
Sort · Sorting Comparison · Divide & Conquer · Greedy Algorithms · Dynamic
Programming · Pathfinding

They are visually varied and the design has to hold all of them:

- **Node-and-edge diagrams** — trees, graphs, heaps, disjoint-set forests.
  Circles joined by lines, dragged to reposition, zoom and pan.
- **Linear cells** — arrays, stacks, queues, hash buckets. Boxes with index
  labels, front/rear/top markers.
- **Bar charts** — the sorting visualizers, bars of varying height.
- **Grids** — pathfinding (a maze with walls, start and goal) and dynamic
  programming (a filled table).
- **Two-panel comparisons** — sparse matrix shows a dense grid beside a triple
  table; dynamic array shows an old array being copied into a new one.

## Shared visual language

Elements carry one of eight states and the colour must mean the same thing
everywhere: **default / comparing / swapping / pivot / inserted / removed /
visited / warning**. Getting this consistent across circles, boxes, bars and
grid cells is a real design problem — currently amber for comparing, emerald
for inserted, red for removed, and it needs a proper palette that works as SVG
fills, box backgrounds and bar fills alike.

## Constraints

- **Light and dark themes, both first-class.** The code panel stays dark in
  both, deliberately, like an editor pane.
- **Responsive to 390px.** Wide diagrams scroll horizontally inside their card
  rather than shrinking; the page itself never scrolls sideways.
- **Contrast matters.** Labels sit inside coloured nodes, and small index labels
  sit under them at 9-10px, so text and fill must be legible in both themes.
- Built with Next.js, Tailwind and shadcn/ui, so the design should be
  expressible in those.

## What to design

Priority order:

1. **A visualizer page** — the shared layout, with a tree-shaped one and a
   bar-chart one to prove it holds both.
2. **The `/visualize` index** — 28 cards in two groups, scannable.
3. **The `/syllabus` page** — dense but readable coverage tables.
4. **Home** — this is a student project shown to faculty, so it should look
   credible without overclaiming.
5. **The state colour palette** as a small system, in both themes.

## Tone

Serious teaching tool, not a toy. The audience is students under exam pressure
and the faculty who might adopt it. Clean, calm, high information density,
nothing cute. It should look like something a department would be comfortable
putting in front of a class.
