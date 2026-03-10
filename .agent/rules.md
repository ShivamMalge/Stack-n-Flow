# rules.md — Pratyaksha Phase 1 Agent Rules

## Purpose

This document defines strict rules for the AI agent working on converting the **Stack-n-Flow** project into the **Pratyaksha Python visualization library (Phase 1)**.

Repository:
https://github.com/ShivamMalge/Stack-n-Flow

The objective of Phase 1 is **only to enable Python → Notebook visualization using existing React visualizers**.

The agent must **extract and reuse existing visualizers**, not rewrite them.

---

# Core Principle

Python handles **logic**.

React handles **visualization**.

anywidget handles **state synchronization**.

Python must **only send state**, never animation instructions.

Animations must remain controlled by **Framer Motion in React**.

---

# Phase 1 Scope

The agent must implement only the following:

1. Extract visualizers from the Next.js project
2. Create a React bridge for notebook rendering
3. Bundle React components into a single JS file
4. Create Python widget using anywidget
5. Implement Python data structure wrappers

Supported structures in Phase 1:

* Stack
* Queue
* Linked List
* Binary Tree
* Graph

Do **not** implement algorithm visualizers in Phase 1.

---

# DO NOT MODIFY EXISTING VISUALIZERS

The following directory is **authoritative and must remain unchanged**:

components/visualizers/

Examples:

* stack-visualizer.tsx
* queue-visualizer.tsx
* linked-list-visualizer.tsx
* tree-visualizer.tsx
* graph-visualizer.tsx
* heap-visualizer.tsx
* hash-table-visualizer.tsx

These files already contain working animation logic and must be reused.

The agent may **import them**, but must not rewrite their internals.

---

# DO NOT MODIFY UI COMPONENTS

The following directory must remain unchanged:

components/ui/

These are reusable UI primitives.

Do not refactor, rename, or rewrite them.

---

# DO NOT MODIFY OPERATIONS LOGIC

The following directory contains algorithmic operation logic:

components/operations/

Examples:

* stack-operations.tsx
* queue-operations.tsx
* tree-operations.tsx

These files are used by the existing visualizers.

They should remain unchanged.

---

# CREATE A VISUALIZER ROUTER

Instead of separate widgets per data structure, create one router component.

Example routing logic:

STACK → StackVisualizer
QUEUE → QueueVisualizer
LINKED_LIST → LinkedListVisualizer
TREE → TreeVisualizer
GRAPH → GraphVisualizer

The router receives the structure type from Python.

---

# DATA PROTOCOL

Python must send data in the following format:

```
{
  "structure": "STACK",
  "nodes": [
    { "id": "node1", "value": 10 },
    { "id": "node2", "value": 20 }
  ],
  "metadata": {}
}
```

Rules:

• Node IDs must remain stable
• Nodes must always be objects, not primitives
• Visualization logic must not depend on Python animations

---

# BUILD SYSTEM RULES

Next.js cannot produce standalone widgets.

The agent must use **tsup or vite** to bundle the React bridge.

Expected output:

```
dist/pratyaksha.js
```

This bundle must include:

* React
* Framer Motion
* Visualizer Router
* All visualizers

This bundle will be loaded by the Python widget.

---

# PYTHON WIDGET RULES

The widget must be built using:

```
anywidget
traitlets
```

Example traits:

* structure
* nodes
* metadata

Each trait must be defined with:

```
tag(sync=True)
```

This allows automatic state synchronization between Python and the frontend.

---

# PYTHON DATA STRUCTURE WRAPPERS

Implement Python wrappers for:

* Stack
* Queue
* LinkedList
* BinaryTree
* Graph

Each wrapper must:

1. Maintain internal state
2. Assign stable node IDs
3. Update widget state

Example usage:

```
from pratyaksha import Stack

s = Stack()

s.push(10)
s.push(20)
s.pop()
```

The visualization must update automatically.

---

# NOTEBOOK RENDERING

Objects must render automatically in notebooks.

Implement:

```
_repr_html_
```

so that simply displaying the object renders the visualization.

Example:

```
s = Stack()
s
```

---

# PERFORMANCE RULES

The system is intended for **educational visualization**, not large-scale data processing.

Assume typical sizes:

* Stack < 200 nodes
* Queue < 200 nodes
* Trees < 500 nodes
* Graphs < 300 nodes

Do not introduce unnecessary performance optimizations.

---

# ANIMATION RULES

Animations must remain controlled by **Framer Motion**.

Python must never send animation commands.

React must determine animations using:

```
layout animations
AnimatePresence
stable element keys
```

---

# FILE STRUCTURE FOR PRATYAKSHA

The final structure should resemble:

```
pratyaksha/

python/
    pratyaksha/
        stack.py
        queue.py
        linked_list.py
        tree.py
        graph.py
        widget.py

frontend/
    pratyaksha-bridge.tsx
    router.tsx

dist/
    pratyaksha.js
```

---

# STRICT PROHIBITIONS

The agent must NOT:

• Rewrite visualizer components
• Introduce new animation libraries
• Replace Framer Motion
• Move visualizer files unnecessarily
• Break existing Next.js functionality

The existing web application must continue working.

---

# SUCCESS CRITERIA

Phase 1 is complete when the following works inside Jupyter:

```
from pratyaksha import Stack

s = Stack()

s.push(10)
s.push(20)
```

And the stack visualization animates inside the notebook.

---

# PHASE 1 COMPLETION

Once this functionality works for:

* Stack
* Queue
* Linked List
* Tree
* Graph

Phase 1 is complete.

Future phases will add algorithm visualizations and debugging tools.