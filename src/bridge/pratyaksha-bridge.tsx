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

  React.useEffect(() => {
    const handleStructureChange = () => setStructure(model.get("structure") || DEFAULT_STRUCTURE);
    const handleNodesChange = () => setNodes(model.get("nodes") ?? null);
    const handleMetadataChange = () => setMetadata(model.get("metadata") || {});

    model.on("change:structure", handleStructureChange);
    model.on("change:nodes", handleNodesChange);
    model.on("change:metadata", handleMetadataChange);

    return () => {
      model.off("change:structure", handleStructureChange);
      model.off("change:nodes", handleNodesChange);
      model.off("change:metadata", handleMetadataChange);
    };
  }, [model]);

  const containerClass = "pratyaksha-container w-full h-full min-h-[400px]";
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
