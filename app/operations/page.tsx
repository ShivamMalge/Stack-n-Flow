"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ArrayOperations from "@/components/operations/array-operations"
import LinkedListOperations from "@/components/operations/linked-list-operations"
import StackOperations from "@/components/operations/stack-operations"
import QueueOperations from "@/components/operations/queue-operations"
import TreeOperations from "@/components/operations/tree-operations"
import GraphOperations from "@/components/operations/graph-operations"
import PolynomialOperations from "@/components/operations/polynomial-operations"

export default function OperationsPage() {
  const [activeTab, setActiveTab] = useState("array")
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Data Structure Operations</h1>
      <p className="text-center mb-8 text-muted-foreground">
        Perform various operations on different data structures and see the results in real-time
      </p>

      <Tabs defaultValue="array" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 md:grid-cols-7 mb-8">
          <TabsTrigger value="array">Array</TabsTrigger>
          <TabsTrigger value="linkedList">Linked List</TabsTrigger>
          <TabsTrigger value="stack">Stack</TabsTrigger>
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="tree">Tree</TabsTrigger>
          <TabsTrigger value="graph">Graph</TabsTrigger>
          <TabsTrigger value="polynomial">Polynomial</TabsTrigger>
        </TabsList>

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
    </div>
  )
}

