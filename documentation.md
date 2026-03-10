# Phase 1 Documentation - Pratyaksha Visualization Library

Phase 1 focused on laying the foundation for **Pratyaksha**, transforming the "Stack-n-Flow" visualization component library into a reusable Python-driven visualization engine.

## Core Accomplishments

### 1. Architectural Foundation
- **Anywidget Integration**: Created the `VisualizerWidget` using `anywidget` to synchronize state between Python logic and React rendering.
- **Telemetry Layer**: Developed a synchronization mechanism where Python sends high-level state (nodes, edges, metadata) and React handles animations using Framer Motion.
- **Bundling Infrastructure**: Set up a bundling pipeline using `tsup` to package React components and Tailwind CSS into standalone assets (`pratyaksha-bridge.mjs` and `pratyaksha.css`).

### 2. Hybrid Visualization Bridge
- Implemented a `VisualizerRouter` in React that dynamically switches between different data structure visualizers based on the `structure` trait sent from Python.
- Supported structures in Phase 1:
  - **Linear**: Stack, Queue, Array, Linked List, Circular Linked List, Doubly Linked List, Circular Queue.
  - **Trees**: Binary Tree, AVL Tree, Heap.
  - **Graphs**: Node-Edge based graph visualization.
  - **Others**: Hash Table (Bucket-based).

### 3. Python Library Layer
- **Data Structure Wrappers**: Created an object-oriented Python API for all supported structures.
- **Controlled State**: Standardized the React components to accept "controlled" props, allowing Python to be the source of truth for the data.
- **Algorithm Drivers**: Established patterns for visualizing algorithms like Binary Search and Quick Sort by sending incremental state updates.

## Troubleshooting (Antigravity IDE)

If you see red squiggles or "Could not find import" errors in the Antigravity IDE, follow these steps:

1. **Install Dependencies**: Run the following command in your terminal to ensure the basic requirements are available to the linter:
   ```bash
   pip install anywidget traitlets
   ```

2. **Editable Install**: To help the linter resolve the `pratyaksha` package locally, run:
   ```bash
   pip install -e .
   ```

3. **Restart IDE**: Antigravity's linter (Pyre2) may cache old environment states. Restarting the IDE will force a re-scan of the installed packages.

4. **Verify Environment**: Run the provided verification script:
   ```bash
   python test_pratyaksha.py
   ```
   If this script prints `SUCCESS`, the library is fully functional despite any remaining IDE visual artifacts.

## Technical Details

### State Synchronization
The library uses three main traitlets for communication:
- `structure`: (String) Identifies which visualizer to load.
- `nodes`: (List/Dict) The primary data content.
- `metadata`: (Dict) Auxiliary information (e.g., current front/rear indices, edge lists, or animation states).

### Directory Structure
- `pratyaksha/`: The Python package containing the widget and structure definitions.
- `src/pratyaksha/`: The React bridge source code.
- `dist/`: Bundled assets consumed by the Python widget.
- `components/visualizers/`: The core React visualization components adapted for controlled state.

## Bug Fixes and Stability Improvements

As part of the final Phase 1 polish, several key issues were addressed:

### 1. Environmental Setup
- **Dependency Installation**: Identified and installed missing Python dependencies (`anywidget`, `traitlets`) in the local environment to ensure the widget and synchronization logic function correctly.
- **Node.js Integration**: Resolved path issues during the bundling process by explicitly pointing to the Node.js installation directory for background build commands.

### 2. Python Code Quality
- **Class Member Consistency**: Standardized the `nodes` attribute across all data structure wrappers. Resolved "inconsistent override" lint errors by ensuring that `BaseStructure` handles attribute initialization and synchronization gracefully via `getattr`.
- **Initialization Order**: Refactored subclass constructors to define structure-specific attributes (like `edges` for Graphs or `nodes` for HashTables) *before* calling `super().__init__`, ensuring that the initial synchronization (`_sync`) has access to the correct data.
- **Import Resolution**: Switched from absolute to relative imports within the `pratyaksha` package to improve portability and resolve IDE namespace issues.

### 3. Visualizer Robustness
- **Controlled Props**: Verified that all visualizers correctly fallback to internal state if controlled props are not provided, while prioritizing the Python-driven state when active.
- **State Sanitization**: Fixed variable renaming bugs in `CircularQueueVisualizer` and `QuickSortVisualizer` that were causing runtime errors during animation.

## Summary of Phase 1 Deliverables
- [x] Functional `VisualizerWidget` with cross-language state sync.
- [x] Robust Python API for 12+ data structures and key algorithms.
- [x] High-performance React bundling pipeline.
- [x] Comprehensive documentation and usage examples.
