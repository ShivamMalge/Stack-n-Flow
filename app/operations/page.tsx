"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import ArrayOperations from "@/components/operations/array-operations"
import LinkedListOperations from "@/components/operations/linked-list-operations"
import StackOperations from "@/components/operations/stack-operations"
import QueueOperations from "@/components/operations/queue-operations"
import TreeOperations from "@/components/operations/tree-operations"
import GraphOperations from "@/components/operations/graph-operations"
import PolynomialOperations from "@/components/operations/polynomial-operations"

export default function OperationsPage() {
  const [activeTab, setActiveTab] = useState("array")

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Data Structure Operations</h1>
        <p className="text-center mb-8 text-muted-foreground">
          Perform various operations on different data structures and see the results in real-time
        </p>

        <Tabs defaultValue="array" value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Horizontal scroller rather than a grid: TabsList is a fixed-height
              inline-flex, so `grid-cols-4` with seven triggers forced two rows
              into a 36px pill and the nowrap labels collided. Same pattern as
              the visualize page, which has many more tabs. */}
          <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <TabsList className="inline-flex whitespace-nowrap mb-8 md:grid md:w-full md:grid-cols-7">
              <TabsTrigger value="array" className="whitespace-nowrap text-xs md:text-sm">Array</TabsTrigger>
              <TabsTrigger value="linkedList" className="whitespace-nowrap text-xs md:text-sm">Linked List</TabsTrigger>
              <TabsTrigger value="stack" className="whitespace-nowrap text-xs md:text-sm">Stack</TabsTrigger>
              <TabsTrigger value="queue" className="whitespace-nowrap text-xs md:text-sm">Queue</TabsTrigger>
              <TabsTrigger value="tree" className="whitespace-nowrap text-xs md:text-sm">Tree</TabsTrigger>
              <TabsTrigger value="graph" className="whitespace-nowrap text-xs md:text-sm">Graph</TabsTrigger>
              <TabsTrigger value="polynomial" className="whitespace-nowrap text-xs md:text-sm">Polynomial</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="array" className="mt-0">
            <ArrayOperations />
          </TabsContent>

          <TabsContent value="linkedList" className="mt-0">
            <LinkedListOperations />
          </TabsContent>

          <TabsContent value="stack" className="mt-0">
            <StackOperations />
          </TabsContent>

          <TabsContent value="queue" className="mt-0">
            <QueueOperations />
          </TabsContent>

          <TabsContent value="tree" className="mt-0">
            <TreeOperations />
          </TabsContent>

          <TabsContent value="graph" className="mt-0">
            <GraphOperations />
          </TabsContent>

          <TabsContent value="polynomial" className="mt-0">
            <PolynomialOperations />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  )
}

