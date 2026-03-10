import * as React from "react";
import { createRender } from "@anywidget/react";
import StackVisualizer from "../../components/visualizers/stack-visualizer";
import QueueVisualizer from "../../components/visualizers/queue-visualizer";
import ArrayVisualizer from "../../components/visualizers/array-visualizer";
import TreeVisualizer from "../../components/visualizers/tree-visualizer";
import LinkedListVisualizer from "../../components/visualizers/linked-list-visualizer";
import AVLTreeVisualizer from "../../components/visualizers/avl-tree-visualizer";
import GraphVisualizer from "../../components/visualizers/graph-visualizer";
import HashTableVisualizer from "../../components/visualizers/hash-table-visualizer";
import HeapVisualizer from "../../components/visualizers/heap-visualizer";
import CircularLinkedListVisualizer from "../../components/visualizers/circular-linked-list-visualizer";
import DoublyLinkedListVisualizer from "../../components/visualizers/doubly-linked-list-visualizer";
import CircularQueueVisualizer from "../../components/visualizers/circular-queue-visualizer";
import BinarySearchVisualizer from "../../components/visualizers/algorithms/binary-search-visualizer";
import QuickSortVisualizer from "../../components/visualizers/algorithms/quick-sort-visualizer";

const VisualizerRouter = ({ model }: { model: any }) => {
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

  switch (structure) {
    case "STACK":
      return <div className={containerClass}><StackVisualizer controlledNodes={nodes} /></div>;
    case "QUEUE":
      return <div className={containerClass}><QueueVisualizer controlledNodes={nodes} /></div>;
    case "ARRAY":
      return <div className={containerClass}><ArrayVisualizer controlledNodes={nodes} /></div>;
    case "LINKED_LIST":
      return <div className={containerClass}><LinkedListVisualizer controlledNodes={nodes} /></div>;
    case "TREE":
      return <div className={containerClass}><TreeVisualizer controlledRoot={nodes as any} /></div>;
    case "AVL_TREE":
      return <div className={containerClass}><AVLTreeVisualizer controlledRoot={nodes as any} /></div>;
    case "GRAPH":
      return <div className={containerClass}><GraphVisualizer controlledNodes={nodes as any} controlledEdges={metadata.edges || []} /></div>;
    case "HASH_TABLE":
      return <div className={containerClass}><HashTableVisualizer controlledBuckets={nodes as any} /></div>;
    case "HEAP":
      return <div className={containerClass}><HeapVisualizer controlledHeap={nodes as any} controlledStates={metadata.states || []} /></div>;
    case "CIRCULAR_LINKED_LIST":
      return <div className={containerClass}><CircularLinkedListVisualizer controlledNodes={nodes as any} /></div>;
    case "DOUBLY_LINKED_LIST":
      return <div className={containerClass}><DoublyLinkedListVisualizer controlledNodes={nodes as any} /></div>;
    case "CIRCULAR_QUEUE":
      return <div className={containerClass}><CircularQueueVisualizer controlledQueue={nodes as any} controlledFront={metadata.front} controlledRear={metadata.rear} controlledSize={metadata.size} /></div>;
    case "BINARY_SEARCH":
      return <div className={containerClass}><BinarySearchVisualizer controlledArray={nodes as any} controlledSearchResult={metadata.searchResult} /></div>;
    case "QUICK_SORT":
      return <div className={containerClass}><QuickSortVisualizer controlledArray={nodes as any} /></div>;
    default:
      return <div className="p-4 text-red-500">Unsupported structure: {structure}</div>;
  }
};

export default {
  render: createRender(VisualizerRouter),
};
