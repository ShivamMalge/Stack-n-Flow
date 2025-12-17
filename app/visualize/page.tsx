"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import LinkedListVisualizer from "@/components/visualizers/linked-list-visualizer"
import DoublyLinkedListVisualizer from "@/components/visualizers/doubly-linked-list-visualizer"
import CircularLinkedListVisualizer from "@/components/visualizers/circular-linked-list-visualizer"
import StackVisualizer from "@/components/visualizers/stack-visualizer"
import QueueVisualizer from "@/components/visualizers/queue-visualizer"
import CircularQueueVisualizer from "@/components/visualizers/circular-queue-visualizer"
import TreeVisualizer from "@/components/visualizers/tree-visualizer"
import BinaryTreeVisualizer from "@/components/visualizers/binary-tree-visualizer"
import BinarySearchTreeVisualizer from "@/components/visualizers/binary-search-tree-visualizer"
import AVLTreeVisualizer from "@/components/visualizers/avl-tree-visualizer"
import BTreeVisualizer from "@/components/visualizers/b-tree-visualizer"
import GraphVisualizer from "@/components/visualizers/graph-visualizer"
import ArrayVisualizer from "@/components/visualizers/array-visualizer"
import BinarySearchVisualizer from "@/components/visualizers/algorithms/binary-search-visualizer"
import QuickSortVisualizer from "@/components/visualizers/algorithms/quick-sort-visualizer"
import GreedyAlgorithmVisualizer from "@/components/visualizers/algorithms/greedy-algorithm-visualizer"
import DivideConquerVisualizer from "@/components/visualizers/algorithms/divide-conquer-visualizer"

export default function VisualizePage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("linked-list")
  const [activeCategory, setActiveCategory] = useState("data-structures")

  useEffect(() => {
    const dsParam = searchParams.get("ds")
    if (dsParam) {
      setActiveTab(dsParam)
      setActiveCategory("data-structures")
    }

    const algoParam = searchParams.get("algo")
    if (algoParam) {
      setActiveTab(algoParam)
      setActiveCategory("algorithms")
    }
  }, [searchParams])

  return (
    <div className="flex flex-col min-h-screen dark">
      <Navbar />

      <main className="flex-1 container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Interactive Visualizer</h1>

        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full mb-6">
          <TabsList className="grid grid-cols-2 w-full max-w-[400px]">
            <TabsTrigger value="data-structures">Data Structures</TabsTrigger>
            <TabsTrigger value="algorithms">Algorithms</TabsTrigger>
          </TabsList>
        </Tabs>

        {activeCategory === "data-structures" && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto pb-2">
              <TabsList className="inline-flex min-w-full whitespace-nowrap mb-8">
                <TabsTrigger value="linked-list" className="whitespace-nowrap text-xs md:text-sm">
                  Linked List
                </TabsTrigger>
                <TabsTrigger value="doubly-linked-list" className="whitespace-nowrap text-xs md:text-sm">
                  Doubly Linked
                </TabsTrigger>
                <TabsTrigger value="circular-linked-list" className="whitespace-nowrap text-xs md:text-sm">
                  Circular List
                </TabsTrigger>
                <TabsTrigger value="stack" className="whitespace-nowrap text-xs md:text-sm">
                  Stack
                </TabsTrigger>
                <TabsTrigger value="queue" className="whitespace-nowrap text-xs md:text-sm">
                  Queue
                </TabsTrigger>
                <TabsTrigger value="circular-queue" className="whitespace-nowrap text-xs md:text-sm">
                  Circular Queue
                </TabsTrigger>
                <TabsTrigger value="tree" className="whitespace-nowrap text-xs md:text-sm">
                  General Tree
                </TabsTrigger>
                <TabsTrigger value="binary-tree" className="whitespace-nowrap text-xs md:text-sm">
                  Binary Tree
                </TabsTrigger>
                <TabsTrigger value="binary-search-tree" className="whitespace-nowrap text-xs md:text-sm">
                  BST
                </TabsTrigger>
                <TabsTrigger value="avl-tree" className="whitespace-nowrap text-xs md:text-sm">
                  AVL Tree
                </TabsTrigger>
                <TabsTrigger value="b-tree" className="whitespace-nowrap text-xs md:text-sm">
                  B-Tree
                </TabsTrigger>
                <TabsTrigger value="graph" className="whitespace-nowrap text-xs md:text-sm">
                  Graph
                </TabsTrigger>
                <TabsTrigger value="array" className="whitespace-nowrap text-xs md:text-sm">
                  Array
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="linked-list">
              <LinkedListVisualizer />
            </TabsContent>

            <TabsContent value="doubly-linked-list">
              <DoublyLinkedListVisualizer />
            </TabsContent>

            <TabsContent value="circular-linked-list">
              <CircularLinkedListVisualizer />
            </TabsContent>

            <TabsContent value="stack">
              <StackVisualizer />
            </TabsContent>

            <TabsContent value="queue">
              <QueueVisualizer />
            </TabsContent>

            <TabsContent value="circular-queue">
              <CircularQueueVisualizer />
            </TabsContent>

            <TabsContent value="tree">
              <TreeVisualizer />
            </TabsContent>

            <TabsContent value="binary-tree">
              <BinaryTreeVisualizer />
            </TabsContent>

            <TabsContent value="binary-search-tree">
              <BinarySearchTreeVisualizer />
            </TabsContent>

            <TabsContent value="avl-tree">
              <AVLTreeVisualizer />
            </TabsContent>

            <TabsContent value="b-tree">
              <BTreeVisualizer />
            </TabsContent>

            <TabsContent value="graph">
              <GraphVisualizer />
            </TabsContent>

            <TabsContent value="array">
              <ArrayVisualizer />
            </TabsContent>
          </Tabs>
        )}

        {activeCategory === "algorithms" && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto pb-2">
              <TabsList className="inline-flex min-w-full whitespace-nowrap mb-8">
                <TabsTrigger value="binary-search" className="whitespace-nowrap text-xs md:text-sm">
                  Binary Search
                </TabsTrigger>
                <TabsTrigger value="quick-sort" className="whitespace-nowrap text-xs md:text-sm">
                  Quick Sort
                </TabsTrigger>
                <TabsTrigger value="greedy" className="whitespace-nowrap text-xs md:text-sm">
                  Greedy Algorithm
                </TabsTrigger>
                <TabsTrigger value="divide-conquer" className="whitespace-nowrap text-xs md:text-sm">
                  Divide & Conquer
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="binary-search">
              <BinarySearchVisualizer />
            </TabsContent>

            <TabsContent value="quick-sort">
              <QuickSortVisualizer />
            </TabsContent>

            <TabsContent value="greedy">
              <GreedyAlgorithmVisualizer />
            </TabsContent>

            <TabsContent value="divide-conquer">
              <DivideConquerVisualizer />
            </TabsContent>
          </Tabs>
        )}
      </main>

      <Footer />
    </div>
  )
}

