"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ModeToggle } from "@/components/mode-toggle"
import LinkedListVisualizer from "@/components/visualizers/linked-list-visualizer"
import StackVisualizer from "@/components/visualizers/stack-visualizer"
import QueueVisualizer from "@/components/visualizers/queue-visualizer"
import TreeVisualizer from "@/components/visualizers/tree-visualizer"
import GraphVisualizer from "@/components/visualizers/graph-visualizer"

export default function DataStructureVisualizer() {
  const [activeTab, setActiveTab] = useState("linked-list")

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Choose a Data Structure</h2>
        <ModeToggle />
      </div>

      <Tabs defaultValue="linked-list" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="linked-list">Linked List</TabsTrigger>
          <TabsTrigger value="stack">Stack</TabsTrigger>
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="tree">Tree</TabsTrigger>
          <TabsTrigger value="graph">Graph</TabsTrigger>
        </TabsList>

        <TabsContent value="linked-list">
          <LinkedListVisualizer />
        </TabsContent>

        <TabsContent value="stack">
          <StackVisualizer />
        </TabsContent>

        <TabsContent value="queue">
          <QueueVisualizer />
        </TabsContent>

        <TabsContent value="tree">
          <TreeVisualizer />
        </TabsContent>

        <TabsContent value="graph">
          <GraphVisualizer />
        </TabsContent>
      </Tabs>
    </div>
  )
}

