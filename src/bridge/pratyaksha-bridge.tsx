import * as React from "react";
import { createRender, useModel } from "@anywidget/react";
import { getVisualizerComponent, isRendererOnlyComponent } from "./registry";

/** Python sends `null` for an empty tree; the components expect null or an array. */
type BridgeNodes = unknown[] | Record<string, unknown> | null;

const DEFAULT_STRUCTURE = "STACK";

// Exported for tests: the prop mapping below is the Python/React contract.
export const VisualizerRouter: React.FC = () => {
  const model = useModel<Record<string, any>>();
  const [structure, setStructure] = React.useState<string>(model.get("structure") || DEFAULT_STRUCTURE);
  // Read through the same normaliser on mount and on change. Previously the
  // initial read coerced null to [] and the change handler did not, so a tree
  // starting empty arrived as [] and then flipped to null on first update.
  const [nodes, setNodes] = React.useState<BridgeNodes>(() => model.get("nodes") ?? null);
  const [metadata, setMetadata] = React.useState<Record<string, any>>(model.get("metadata") || {});
  const [theme, setTheme] = React.useState<string>(model.get("theme") || "auto");

  /*
    The widget carries the web app's theme tokens, whose defaults are the light
    palette, so a dark notebook got a white slab. Tailwind here uses the class
    strategy, so putting `dark` on the container is enough for both the tokens
    and every `dark:` variant inside it.

    "auto" follows the browser's colour scheme. That is the best guess
    available: the widget renders inside a sandboxed output frame and cannot see
    the notebook's own theme setting, so a user whose OS is light and whose
    Colab is dark has to say so with theme="dark".
  */
  const [prefersDark, setPrefersDark] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    setPrefersDark(query.matches);
    const onChange = (event: MediaQueryListEvent) => setPrefersDark(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  React.useEffect(() => {
    const handleStructureChange = () => setStructure(model.get("structure") || DEFAULT_STRUCTURE);
    const handleNodesChange = () => setNodes(model.get("nodes") ?? null);
    const handleMetadataChange = () => setMetadata(model.get("metadata") || {});

    const handleThemeChange = () => setTheme(model.get("theme") || "auto");

    model.on("change:theme", handleThemeChange);
    model.on("change:structure", handleStructureChange);
    model.on("change:nodes", handleNodesChange);
    model.on("change:metadata", handleMetadataChange);

    return () => {
      model.off("change:theme", handleThemeChange);
      model.off("change:structure", handleStructureChange);
      model.off("change:nodes", handleNodesChange);
      model.off("change:metadata", handleMetadataChange);
    };
  }, [model]);

  const isDark = theme === "dark" || (theme === "auto" && prefersDark);
  // No h-full and a much smaller floor: h-full stretched the card to the
  // container, and a 400px floor left a stack of two sitting in a mostly empty
  // white rectangle. The renderers carry their own minimums.
  const containerClass = [
    "pratyaksha-container w-full min-h-[160px]",
    isDark ? "dark" : "",
  ].filter(Boolean).join(" ");
  const Component = getVisualizerComponent(structure);

  if (!Component) {
    return <div className="p-4 text-red-500">Unsupported structure: {structure}</div>;
  }

  // Renderer-only components take `items`, not `controlled*`. Falling through to
  // the generic branch below would hand them the wrong prop and crash on
  // `items.length`, so an unmapped renderer reports the mismatch instead.
  if (isRendererOnlyComponent(Component)) {
    if (structure === "STACK" || structure === "QUEUE") {
      return (
        <div className={containerClass}>
          <Component items={(nodes ?? []) as any} searchResult={metadata.searchResult} />
        </div>
      );
    }

    return (
      <div className="p-4 text-red-500">
        Renderer for {structure} is not wired to a prop mapping.
      </div>
    );
  }

  if (structure === "TREE" || structure === "AVL_TREE") {
    return <div className={containerClass}><Component controlledRoot={nodes as any} /></div>;
  }

  if (structure === "GRAPH") {
    return <div className={containerClass}><Component controlledNodes={nodes as any} controlledEdges={metadata.edges || []} /></div>;
  }

  if (structure === "HASH_TABLE") {
    return <div className={containerClass}><Component controlledBuckets={nodes as any} /></div>;
  }

  if (structure === "HEAP") {
    return <div className={containerClass}><Component controlledHeap={nodes as any} controlledStates={metadata.states || []} /></div>;
  }

  if (structure === "CIRCULAR_QUEUE") {
    return (
      <div className={containerClass}>
        <Component
          controlledQueue={nodes as any}
          controlledFront={metadata.front}
          controlledRear={metadata.rear}
          controlledSize={metadata.size}
        />
      </div>
    );
  }

  if (structure === "BINARY_SEARCH") {
    return <div className={containerClass}><Component controlledArray={nodes as any} controlledSearchResult={metadata.searchResult} /></div>;
  }

  return <div className={containerClass}><Component controlledNodes={nodes as any} controlledArray={nodes as any} /></div>;
};

const widget = {
  render: createRender(VisualizerRouter),
};

export default widget;
