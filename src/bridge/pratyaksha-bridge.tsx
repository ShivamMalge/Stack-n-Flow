import * as React from "react";
import { createRender, useModel } from "@anywidget/react";
import { getRegistryEntry, registeredStructures } from "./registry";

/*
  Re-exported so scripts/check-widget-bundle.mjs can enumerate what to render
  from the shipped bundle rather than from a list it keeps in step by hand.
  A list kept by hand is how a broken AVL tree reached Colab while a
  stack-only check reported the bundle healthy.
*/
export { registeredStructures };

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
  const entry = getRegistryEntry(structure);

  if (!entry) {
    return <div className="p-4 text-red-500">Unsupported structure: {structure}</div>;
  }

  // Each registry entry owns the mapping from synced state to its own props, so
  // the bridge no longer carries a branch per structure.
  const { component: Component, props } = entry;

  return (
    <div className={containerClass}>
      <Component {...props({ nodes, metadata })} />
    </div>
  );
};

const widget = {
  render: createRender(VisualizerRouter),
};

export default widget;
