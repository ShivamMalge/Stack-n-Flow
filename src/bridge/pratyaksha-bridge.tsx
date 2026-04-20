import * as React from "react";
import { createRender, useModel } from "@anywidget/react";
import { getVisualizerComponent, isRendererOnlyComponent } from "./registry";

const VisualizerRouter: React.FC = () => {
  const model = useModel<Record<string, any>>();
  const [structure, setStructure] = React.useState(model.get("structure") || "STACK");
  const [nodes, setNodes] = React.useState(model.get("nodes") || []);
  const [metadata, setMetadata] = React.useState(model.get("metadata") || {});

  React.useEffect(() => {
    const handleStructureChange = () => setStructure(model.get("structure"));
    const handleNodesChange = () => setNodes(model.get("nodes"));
    const handleMetadataChange = () => setMetadata(model.get("metadata"));

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

  if (isRendererOnlyComponent(Component)) {
    if (structure === "STACK" || structure === "QUEUE") {
      return (
        <div className={containerClass}>
          <Component items={nodes as any} searchResult={metadata.searchResult} />
        </div>
      );
    }
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
