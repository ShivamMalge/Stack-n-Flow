import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  GitMerge,
  GitPullRequest,
  ListTree,
  SquareStack,
  Workflow,
  ArrowLeftRight,
  CircleDashed,
  LayoutGrid,
  Search,
  SortAsc,
  Coins,
  SplitSquareVertical,
  Table2,
  Network,
  Binary,
  GitBranchPlus,
  GitFork,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export const metadata: Metadata = {
  title: "Learn DSA | Stack'n'Flow",
  description: "Learn about various data structures and algorithms",
}

const dataStructures = [
  {
    name: "Linked List",
    description: "A linear collection of data elements whose order is not given by their physical placement in memory.",
    icon: GitPullRequest,
    slug: "linked-list",
  },
  {
    name: "Doubly Linked List",
    description: "A linked list where each node contains references to both the next and previous nodes.",
    icon: ArrowLeftRight,
    slug: "doubly-linked-list",
  },
  {
    name: "Stack",
    description: "A linear data structure that follows the Last In First Out (LIFO) principle.",
    icon: SquareStack,
    slug: "stack",
  },
  {
    name: "Queue",
    description: "A linear data structure that follows the First In First Out (FIFO) principle.",
    icon: Workflow,
    slug: "queue",
  },
  {
    name: "Circular Queue",
    description: "A queue that uses a fixed-size array and wraps around when it reaches the end.",
    icon: CircleDashed,
    slug: "circular-queue",
  },
  {
    name: "Binary Tree",
    description: "A tree data structure in which each node has at most two children.",
    icon: Binary,
    slug: "binary-tree",
  },
  {
    name: "Binary Search Tree",
    description: "A binary tree where nodes are ordered: left child < parent < right child.",
    icon: GitFork,
    slug: "binary-search-tree",
  },
  {
    name: "AVL Tree",
    description: "A self-balancing binary search tree where heights of child subtrees differ by at most one.",
    icon: GitBranchPlus,
    slug: "avl-tree",
  },
  {
    name: "B-Tree",
    description:
      "A self-balancing tree data structure that maintains sorted data and allows for efficient insertion, deletion, and search.",
    icon: ListTree,
    slug: "b-tree",
  },
  {
    name: "Graph",
    description: "A non-linear data structure consisting of nodes and edges connecting these nodes.",
    icon: GitMerge,
    slug: "graph",
  },
  {
    name: "Array",
    description: "A collection of elements stored at contiguous memory locations, accessible by an index.",
    icon: LayoutGrid,
    slug: "array",
  },
]

const algorithms = [
  {
    name: "Searching Algorithms",
    description: "Algorithms for finding an element within a data structure.",
    icon: Search,
    slug: "searching-algorithms",
  },
  {
    name: "Sorting Algorithms",
    description: "Algorithms for arranging elements in a specific order.",
    icon: SortAsc,
    slug: "sorting-algorithms",
  },
  {
    name: "Greedy Algorithms",
    description: "Algorithms that make locally optimal choices at each step.",
    icon: Coins,
    slug: "greedy-algorithms",
  },
  {
    name: "Divide & Conquer",
    description: "Algorithms that break a problem into smaller subproblems, solve them, and combine the solutions.",
    icon: SplitSquareVertical,
    slug: "divide-conquer",
  },
  {
    name: "Dynamic Programming",
    description: "Algorithms that solve complex problems by breaking them down into simpler overlapping subproblems.",
    icon: Table2,
    slug: "dynamic-programming",
  },
  {
    name: "Graph Algorithms",
    description: "Algorithms that operate on graphs to solve routing, connectivity, and optimization problems.",
    icon: Network,
    slug: "graph-algorithms",
  },
]

export default function LearnPage() {
  return (
    <div className="flex flex-col min-h-screen dark">
      <Navbar />

      <main className="flex-1">
        <section className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <h1 className="text-4xl font-bold mb-6">Learn Data Structures & Algorithms</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Explore detailed explanations and intuition behind various data structures and algorithms.
            </p>

            <Tabs defaultValue="data-structures" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
                <TabsTrigger value="data-structures">Data Structures</TabsTrigger>
                <TabsTrigger value="algorithms">Algorithms</TabsTrigger>
              </TabsList>

              <TabsContent value="data-structures">
                <div className="grid md:grid-cols-2 gap-6">
                  {dataStructures.map((ds) => (
                    <Card key={ds.slug} className="overflow-hidden">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-xl">{ds.name}</CardTitle>
                          <ds.icon className="h-6 w-6 text-primary" />
                        </div>
                        <CardDescription>{ds.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                          <li>Operations and time complexity</li>
                          <li>Implementation strategies</li>
                          <li>Real-world applications</li>
                          <li>Common interview questions</li>
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button asChild variant="outline" className="w-full">
                          <Link href={`/learn/${ds.slug}`}>
                            Learn More
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="algorithms">
                <div className="grid md:grid-cols-2 gap-6">
                  {algorithms.map((algo) => (
                    <Card key={algo.slug} className="overflow-hidden">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-xl">{algo.name}</CardTitle>
                          <algo.icon className="h-6 w-6 text-primary" />
                        </div>
                        <CardDescription>{algo.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                          <li>Key concepts and principles</li>
                          <li>Common algorithms in this category</li>
                          <li>Time and space complexity analysis</li>
                          <li>Practical applications</li>
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button asChild variant="outline" className="w-full">
                          <Link href={`/learn/${algo.slug}`}>
                            Learn More
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

