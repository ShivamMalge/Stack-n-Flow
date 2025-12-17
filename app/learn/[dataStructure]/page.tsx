import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowLeft,
  GitMerge,
  GitPullRequest,
  ListTree,
  SquareStack,
  Workflow,
  ArrowRight,
  ArrowLeftRight,
  CircleDashed,
  LayoutGrid,
  Search,
  SortAsc,
  Coins,
  SplitSquareVertical,
  Table2,
  Network,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

// Update metadata title
export async function generateMetadata({ params }: { params: { dataStructure: string } }): Promise<Metadata> {
  const formattedName = params.dataStructure
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  return {
    title: `${formattedName} | Stack'n'Flow`,
    description: `Learn about ${formattedName}`,
  }
}

const dataStructureInfo = {
  "linked-list": {
    name: "Linked List",
    icon: GitPullRequest,
    description: "A linear collection of data elements whose order is not given by their physical placement in memory.",
    content: {
      intuition:
        "Think of a linked list as a chain, where each link points to the next one. Unlike arrays, linked lists don't require contiguous memory allocation, making insertions and deletions more efficient.",
      types: ["Singly Linked List", "Doubly Linked List", "Circular Linked List"],
      operations: [
        { name: "Access", complexity: "O(n)", description: "To access an element, you must traverse from the head." },
        { name: "Search", complexity: "O(n)", description: "Linear search through the list." },
        {
          name: "Insertion",
          complexity: "O(1)",
          description: "If position is known, otherwise O(n) to find position.",
        },
        { name: "Deletion", complexity: "O(1)", description: "If position is known, otherwise O(n) to find position." },
      ],
      applications: [
        "Implementation of stacks and queues",
        "Dynamic memory allocation",
        "Maintaining directory of names",
        "Performing arithmetic operations on long integers",
        "Representing sparse matrices",
      ],
      advantages: [
        "Dynamic size",
        "Ease of insertion/deletion",
        "No memory wastage",
        "Implementation of other data structures",
      ],
      disadvantages: [
        "Random access is not allowed",
        "Extra memory for pointers",
        "Not cache friendly",
        "Reverse traversal is difficult in singly linked lists",
      ],
    },
  },
  "doubly-linked-list": {
    name: "Doubly Linked List",
    icon: ArrowLeftRight,
    description: "A linked list where each node contains references to both the next and previous nodes.",
    content: {
      intuition:
        "Think of a doubly linked list as a chain where each link is connected to both its neighbors. This allows for bidirectional traversal, making certain operations more efficient.",
      types: ["Simple Doubly Linked List", "Circular Doubly Linked List"],
      operations: [
        { name: "Access", complexity: "O(n)", description: "To access an element, you must traverse from either end." },
        { name: "Search", complexity: "O(n)", description: "Linear search through the list." },
        {
          name: "Insertion",
          complexity: "O(1)",
          description: "If position is known, otherwise O(n) to find position.",
        },
        { name: "Deletion", complexity: "O(1)", description: "If position is known, otherwise O(n) to find position." },
      ],
      applications: [
        "Navigation systems (forward/backward)",
        "Browser history (back and forward buttons)",
        "MRU/LRU caches",
        "Undo/Redo functionality in applications",
        "Text editors for character insertion and deletion",
      ],
      advantages: [
        "Bidirectional traversal",
        "Easier deletion (no need to track previous node)",
        "Can be traversed in both directions",
        "Quicker insertion or deletion before a known node",
      ],
      disadvantages: [
        "More memory required for extra pointer",
        "More complex implementation",
        "Still no random access",
        "Extra care needed for pointer manipulation",
      ],
    },
  },
  stack: {
    name: "Stack",
    icon: SquareStack,
    description: "A linear data structure that follows the Last In First Out (LIFO) principle.",
    content: {
      intuition:
        "Think of a stack like a pile of plates. You can only add or remove plates from the top. The last plate placed is the first one to be removed.",
      types: ["Array-based Stack", "Linked List-based Stack"],
      operations: [
        { name: "Push", complexity: "O(1)", description: "Add an element to the top of the stack." },
        { name: "Pop", complexity: "O(1)", description: "Remove the top element from the stack." },
        { name: "Peek/Top", complexity: "O(1)", description: "View the top element without removing it." },
        { name: "isEmpty", complexity: "O(1)", description: "Check if the stack is empty." },
      ],
      applications: [
        "Function call management (call stack)",
        "Expression evaluation and conversion",
        "Backtracking algorithms",
        "Undo mechanisms in text editors",
        "Browser history (back button)",
      ],
      advantages: [
        "Simple implementation",
        "Efficient for LIFO operations",
        "Memory efficient (no gaps)",
        "Useful for parsing and expression evaluation",
      ],
      disadvantages: [
        "Limited capacity in array implementation",
        "No random access to elements",
        "No easy way to search for an element",
        "Stack overflow/underflow issues",
      ],
    },
  },
  queue: {
    name: "Queue",
    icon: Workflow,
    description: "A linear data structure that follows the First In First Out (FIFO) principle.",
    content: {
      intuition:
        "Think of a queue like a line of people waiting for a service. The first person to join the line is the first one to be served.",
      types: ["Simple Queue", "Circular Queue", "Priority Queue", "Deque (Double-ended Queue)"],
      operations: [
        { name: "Enqueue", complexity: "O(1)", description: "Add an element to the rear of the queue." },
        { name: "Dequeue", complexity: "O(1)", description: "Remove the front element from the queue." },
        { name: "Front/Peek", complexity: "O(1)", description: "View the front element without removing it." },
        { name: "isEmpty", complexity: "O(1)", description: "Check if the queue is empty." },
      ],
      applications: [
        "CPU scheduling in operating systems",
        "Handling of interrupts in real-time systems",
        "Call center phone systems",
        "Printer queue management",
        "Breadth-First Search algorithm",
      ],
      advantages: [
        "Fair processing order (FIFO)",
        "Useful for resource sharing among multiple consumers",
        "Predictable data flow",
        "Asynchronous data transfer",
      ],
      disadvantages: [
        "Fixed size in array implementation",
        "No random access",
        "Complex implementation for priority queues",
        "Potential queue overflow/underflow",
      ],
    },
  },
  "circular-queue": {
    name: "Circular Queue",
    icon: CircleDashed,
    description: "A queue that uses a fixed-size array and wraps around when it reaches the end.",
    content: {
      intuition:
        "Think of a circular queue like a circular track where runners can keep going around without stopping. When the queue reaches the end of its array, it wraps around to the beginning, efficiently using the available space.",
      types: ["Simple Circular Queue", "Circular Deque"],
      operations: [
        { name: "Enqueue", complexity: "O(1)", description: "Add an element to the rear of the queue." },
        { name: "Dequeue", complexity: "O(1)", description: "Remove the front element from the queue." },
        { name: "Front/Peek", complexity: "O(1)", description: "View the front element without removing it." },
        { name: "isEmpty/isFull", complexity: "O(1)", description: "Check if the queue is empty or full." },
      ],
      applications: [
        "CPU scheduling",
        "Memory management",
        "Traffic light control systems",
        "Streaming data processing",
        "Buffering in embedded systems",
      ],
      advantages: [
        "Better memory utilization than linear queue",
        "No need to shift elements after dequeue",
        "Efficient for fixed-size applications",
        "Prevents overflow when there's space available",
      ],
      disadvantages: [
        "Fixed capacity",
        "Slightly more complex implementation",
        "Wasted space (one slot) in some implementations",
        "No dynamic resizing",
      ],
    },
  },
  tree: {
    name: "Tree",
    icon: ListTree,
    description: "A hierarchical structure with a root value and subtrees of children with a parent node.",
    content: {
      intuition:
        "Think of a tree like a family tree or an organizational chart. Each node can have multiple children, but only one parent (except the root).",
      types: ["Binary Tree", "Binary Search Tree", "AVL Tree", "Red-Black Tree", "B-Tree", "Heap"],
      operations: [
        {
          name: "Insertion",
          complexity: "O(log n) to O(n)",
          description: "Depends on the type of tree and balancing.",
        },
        { name: "Deletion", complexity: "O(log n) to O(n)", description: "Depends on the type of tree and balancing." },
        { name: "Search", complexity: "O(log n) to O(n)", description: "Depends on the type of tree and balancing." },
        { name: "Traversal", complexity: "O(n)", description: "In-order, Pre-order, Post-order, Level-order." },
      ],
      applications: [
        "File systems in operating systems",
        "Database indexing",
        "Syntax trees in compilers",
        "HTML DOM in web browsers",
        "Decision trees in machine learning",
      ],
      advantages: [
        "Hierarchical representation of data",
        "Efficient searching in balanced trees",
        "Dynamic size",
        "Reflects structural relationships in data",
      ],
      disadvantages: [
        "Complex implementation",
        "Balancing overhead",
        "Memory usage",
        "Difficult to serialize/deserialize",
      ],
    },
  },
  graph: {
    name: "Graph",
    icon: GitMerge,
    description: "A non-linear data structure consisting of nodes and edges connecting these nodes.",
    content: {
      intuition:
        "Think of a graph like a social network, where people (nodes) are connected by friendships (edges). Graphs can represent any network of connections.",
      types: ["Directed Graph", "Undirected Graph", "Weighted Graph", "Cyclic Graph", "Acyclic Graph"],
      operations: [
        { name: "Add Vertex", complexity: "O(1)", description: "Add a new node to the graph." },
        { name: "Add Edge", complexity: "O(1)", description: "Add a new connection between nodes." },
        { name: "Remove Vertex", complexity: "O(|V| + |E|)", description: "Remove a node and all its edges." },
        { name: "Remove Edge", complexity: "O(1) to O(|E|)", description: "Remove a connection between nodes." },
        { name: "Traversal", complexity: "O(|V| + |E|)", description: "BFS, DFS, and other specialized algorithms." },
      ],
      applications: [
        "Social networks",
        "Web page ranking (PageRank)",
        "GPS and mapping",
        "Network routing",
        "Recommendation systems",
        "Dependency resolution",
      ],
      advantages: [
        "Represents complex relationships",
        "Flexible structure",
        "Powerful for modeling real-world problems",
        "Many efficient algorithms available",
      ],
      disadvantages: [
        "High memory requirements",
        "Complex implementation",
        "Difficult to visualize large graphs",
        "Some problems are computationally expensive (NP-hard)",
      ],
    },
  },
  array: {
    name: "Array",
    icon: LayoutGrid,
    description: "A collection of elements stored at contiguous memory locations, accessible by an index.",
    content: {
      intuition:
        "Think of an array like a row of mailboxes, each with a unique number. You can directly access any mailbox if you know its number, without checking the others first.",
      types: ["Static Arrays", "Dynamic Arrays", "Multi-dimensional Arrays"],
      operations: [
        { name: "Access", complexity: "O(1)", description: "Direct access by index." },
        { name: "Search", complexity: "O(n)", description: "Linear search for unsorted arrays." },
        { name: "Insertion", complexity: "O(n)", description: "Need to shift elements in worst case." },
        { name: "Deletion", complexity: "O(n)", description: "Need to shift elements in worst case." },
      ],
      applications: [
        "Storing and accessing sequential data",
        "Temporary storage in algorithms",
        "Lookup tables and buffers",
        "Base for other data structures (stacks, queues)",
        "Matrix operations in scientific computing",
      ],
      advantages: [
        "Simple implementation",
        "Random access in O(1) time",
        "Good locality of reference",
        "Memory efficient (no pointers needed)",
      ],
      disadvantages: [
        "Fixed size for static arrays",
        "Expensive insertions and deletions",
        "Memory wastage in static arrays",
        "Contiguous memory requirement",
      ],
    },
  },
  "searching-algorithms": {
    name: "Searching Algorithms",
    icon: Search,
    description: "Algorithms for finding an element within a data structure.",
    content: {
      intuition:
        "Searching algorithms help us find specific items within collections of data, similar to how you might search for a book in a library or a word in a dictionary.",
      types: ["Linear Search", "Binary Search", "Depth-First Search", "Breadth-First Search", "Interpolation Search"],
      operations: [
        {
          name: "Linear Search",
          complexity: "O(n)",
          description: "Sequentially checks each element until the target is found.",
        },
        {
          name: "Binary Search",
          complexity: "O(log n)",
          description: "Divides the search space in half at each step. Requires sorted data.",
        },
        {
          name: "Depth-First Search",
          complexity: "O(V + E)",
          description: "Explores as far as possible along each branch before backtracking.",
        },
        {
          name: "Breadth-First Search",
          complexity: "O(V + E)",
          description: "Explores all neighbors at the present depth before moving to nodes at the next depth level.",
        },
      ],
      applications: [
        "Database queries",
        "Spell checkers",
        "Autocomplete features",
        "Path finding in navigation systems",
        "Web crawling",
      ],
      advantages: [
        "Essential for data retrieval",
        "Different algorithms for different scenarios",
        "Some algorithms (like binary search) are extremely efficient",
        "Can be optimized for specific data structures",
      ],
      disadvantages: [
        "Some require pre-processing (like sorting)",
        "Performance depends on data organization",
        "May require additional memory",
        "No single algorithm works best for all cases",
      ],
    },
  },
  "sorting-algorithms": {
    name: "Sorting Algorithms",
    icon: SortAsc,
    description: "Algorithms for arranging elements in a specific order.",
    content: {
      intuition:
        "Sorting algorithms arrange elements in a specific order, like alphabetical or numerical, similar to how you might organize books on a shelf or cards in a hand.",
      types: ["Bubble Sort", "Selection Sort", "Insertion Sort", "Merge Sort", "Quick Sort", "Heap Sort", "Radix Sort"],
      operations: [
        {
          name: "Bubble Sort",
          complexity: "O(n²)",
          description:
            "Repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order.",
        },
        {
          name: "Selection Sort",
          complexity: "O(n²)",
          description: "Repeatedly finds the minimum element from the unsorted part and puts it at the beginning.",
        },
        {
          name: "Insertion Sort",
          complexity: "O(n²)",
          description: "Builds the sorted array one item at a time by comparing each with the items before it.",
        },
        {
          name: "Merge Sort",
          complexity: "O(n log n)",
          description: "Divides the array into halves, sorts them, and then merges them.",
        },
        {
          name: "Quick Sort",
          complexity: "O(n log n) average",
          description: "Picks a pivot element and partitions the array around it.",
        },
      ],
      applications: [
        "Database management",
        "Search optimization",
        "Priority queues",
        "Statistics (finding median, etc.)",
        "Computational biology",
      ],
      advantages: [
        "Makes searching more efficient",
        "Helps in data analysis",
        "Different algorithms for different needs",
        "Some are very efficient for large datasets",
      ],
      disadvantages: [
        "Can be computationally expensive",
        "Some require additional memory",
        "Performance varies with initial order",
        "Stable vs. unstable sorting considerations",
      ],
    },
  },
  "greedy-algorithms": {
    name: "Greedy Algorithms",
    icon: Coins,
    description: "Algorithms that make locally optimal choices at each step.",
    content: {
      intuition:
        "Greedy algorithms make the best choice at each step, hoping these local optimums will lead to a global optimum, similar to how you might climb a hill by always taking the steepest path upward.",
      types: [
        "Coin Change Problem",
        "Fractional Knapsack",
        "Huffman Coding",
        "Dijkstra's Algorithm",
        "Prim's Algorithm",
      ],
      operations: [
        {
          name: "Coin Change",
          complexity: "O(n)",
          description: "Selects coins in descending order of value to make change with minimum coins.",
        },
        {
          name: "Fractional Knapsack",
          complexity: "O(n log n)",
          description: "Selects items with highest value-to-weight ratio first.",
        },
        {
          name: "Huffman Coding",
          complexity: "O(n log n)",
          description: "Builds an optimal prefix code based on frequency of characters.",
        },
        {
          name: "Dijkstra's Algorithm",
          complexity: "O(V² or E log V)",
          description: "Finds shortest paths from a source vertex to all other vertices.",
        },
      ],
      applications: [
        "Activity selection problems",
        "Data compression",
        "Routing algorithms",
        "Task scheduling",
        "Resource allocation",
      ],
      advantages: [
        "Simple and intuitive approach",
        "Often efficient and easy to implement",
        "Works well for many optimization problems",
        "Usually faster than exhaustive methods",
      ],
      disadvantages: [
        "Doesn't always yield globally optimal solutions",
        "Requires careful problem analysis",
        "May get stuck in local optima",
        "Not suitable for all optimization problems",
      ],
    },
  },
  "divide-conquer": {
    name: "Divide & Conquer",
    icon: SplitSquareVertical,
    description: "Algorithms that break a problem into smaller subproblems, solve them, and combine the solutions.",
    content: {
      intuition:
        "Divide and conquer breaks a problem into smaller, manageable pieces, solves each piece, and then combines the solutions, similar to how you might solve a large jigsaw puzzle by working on smaller sections first.",
      types: [
        "Merge Sort",
        "Quick Sort",
        "Binary Search",
        "Strassen's Matrix Multiplication",
        "Closest Pair of Points",
      ],
      operations: [
        {
          name: "Merge Sort",
          complexity: "O(n log n)",
          description: "Divides the array, sorts the halves, and merges them.",
        },
        {
          name: "Quick Sort",
          complexity: "O(n log n) average",
          description: "Partitions the array around a pivot and recursively sorts the partitions.",
        },
        {
          name: "Binary Search",
          complexity: "O(log n)",
          description: "Divides the search space in half at each step.",
        },
        {
          name: "Strassen's Algorithm",
          complexity: "O(n^2.81)",
          description: "Multiplies matrices more efficiently than the standard method.",
        },
      ],
      applications: [
        "Efficient sorting algorithms",
        "Fast multiplication of large numbers",
        "Convex hull algorithms",
        "Fast Fourier Transform",
        "Computational geometry",
      ],
      advantages: [
        "Solves complex problems efficiently",
        "Often leads to parallelizable algorithms",
        "Reduces time complexity for many problems",
        "Elegant recursive solutions",
      ],
      disadvantages: [
        "Recursive overhead",
        "May require additional memory",
        "Sometimes complex to implement",
        "Not always the most efficient approach",
      ],
    },
  },
  "dynamic-programming": {
    name: "Dynamic Programming",
    icon: Table2,
    description: "Algorithms that solve complex problems by breaking them down into simpler overlapping subproblems.",
    content: {
      intuition:
        "Dynamic programming solves complex problems by breaking them into overlapping subproblems and storing their solutions to avoid redundant calculations, like writing down answers to math problems you've already solved so you don't have to recalculate them.",
      types: [
        "0/1 Knapsack",
        "Longest Common Subsequence",
        "Fibonacci Sequence",
        "Shortest Path Problems",
        "Matrix Chain Multiplication",
      ],
      operations: [
        {
          name: "0/1 Knapsack",
          complexity: "O(nW)",
          description: "Selects items to maximize value while keeping total weight under a limit.",
        },
        {
          name: "Longest Common Subsequence",
          complexity: "O(mn)",
          description: "Finds the longest subsequence present in two sequences.",
        },
        {
          name: "Fibonacci",
          complexity: "O(n)",
          description: "Calculates Fibonacci numbers efficiently by storing previous results.",
        },
        {
          name: "Floyd-Warshall",
          complexity: "O(V³)",
          description: "Finds shortest paths between all pairs of vertices in a graph.",
        },
      ],
      applications: [
        "Resource allocation problems",
        "Sequence alignment in bioinformatics",
        "Text similarity and diff tools",
        "Game theory and decision making",
        "Financial optimization",
      ],
      advantages: [
        "Solves problems with optimal substructure",
        "Avoids redundant calculations",
        "Can solve problems that greedy algorithms can't",
        "Often more efficient than naive recursive approaches",
      ],
      disadvantages: [
        "Can be memory intensive",
        "Sometimes difficult to identify the subproblems",
        "May be overkill for simple problems",
        "Implementation can be complex",
      ],
    },
  },
  "graph-algorithms": {
    name: "Graph Algorithms",
    icon: Network,
    description: "Algorithms that operate on graphs to solve routing, connectivity, and optimization problems.",
    content: {
      intuition:
        "Graph algorithms help us analyze networks of connected entities, similar to how we might find the shortest route on a map or determine how information spreads through social connections.",
      types: [
        "Breadth-First Search",
        "Depth-First Search",
        "Dijkstra's Algorithm",
        "Bellman-Ford",
        "Kruskal's Algorithm",
        "Prim's Algorithm",
      ],
      operations: [
        {
          name: "BFS",
          complexity: "O(V + E)",
          description: "Explores all neighbors at the present depth before moving to nodes at the next depth level.",
        },
        {
          name: "DFS",
          complexity: "O(V + E)",
          description: "Explores as far as possible along each branch before backtracking.",
        },
        {
          name: "Dijkstra's Algorithm",
          complexity: "O(E log V)",
          description: "Finds the shortest path from a source vertex to all other vertices.",
        },
        {
          name: "Minimum Spanning Tree",
          complexity: "O(E log V)",
          description: "Finds a subset of edges that connects all vertices with minimum total weight.",
        },
      ],
      applications: [
        "Social network analysis",
        "GPS navigation systems",
        "Web page ranking",
        "Network routing protocols",
        "Dependency resolution in package managers",
      ],
      advantages: [
        "Model real-world network problems",
        "Solve complex connectivity issues",
        "Optimize paths and flows",
        "Analyze relationships between entities",
      ],
      disadvantages: [
        "Can be computationally expensive for large graphs",
        "Memory requirements for large graphs",
        "Some problems are NP-hard",
        "Implementation complexity for advanced algorithms",
      ],
    },
  },
}

export default function DataStructurePage({ params }: { params: { dataStructure: string } }) {
  const dsInfo = dataStructureInfo[params.dataStructure as keyof typeof dataStructureInfo]

  if (!dsInfo) {
    return (
      <div className="flex flex-col min-h-screen dark">
        <Navbar />
        <main className="flex-1 container mx-auto py-12 px-4">
          <h1 className="text-3xl font-bold mb-4">Topic Not Found</h1>
          <p className="text-muted-foreground mb-6">The requested topic does not exist.</p>
          <Button asChild>
            <Link href="/learn">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Learn
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    )
  }

  const { name, icon: Icon, description, content } = dsInfo
  const isAlgorithm =
    params.dataStructure.includes("algorithms") ||
    params.dataStructure === "divide-conquer" ||
    params.dataStructure === "dynamic-programming"

  return (
    <div className="flex flex-col min-h-screen dark">
      <Navbar />

      <main className="flex-1">
        <section className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center gap-2 mb-8">
              <Button asChild variant="outline" size="sm">
                <Link href="/learn">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Learn
                </Link>
              </Button>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">{name}</h1>
                <p className="text-xl text-muted-foreground">{description}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="grid gap-8">
              {/* Intuition */}
              <Card>
                <CardHeader>
                  <CardTitle>Intuition</CardTitle>
                  <CardDescription>Understanding the core concept</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>{content.intuition}</p>
                </CardContent>
              </Card>

              {/* Types */}
              <Card>
                <CardHeader>
                  <CardTitle>Types of {name}</CardTitle>
                  <CardDescription>Different variations and implementations</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-1">
                    {content.types.map((type, index) => (
                      <li key={index}>{type}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Operations */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {isAlgorithm ? "Common Algorithms & Complexity" : "Operations & Time Complexity"}
                  </CardTitle>
                  <CardDescription>
                    {isAlgorithm ? "Popular algorithms in this category" : "Common operations and their efficiency"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 pr-4">{isAlgorithm ? "Algorithm" : "Operation"}</th>
                          <th className="text-left py-2 pr-4">Time Complexity</th>
                          <th className="text-left py-2">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {content.operations.map((op, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-2 pr-4 font-medium">{op.name}</td>
                            <td className="py-2 pr-4 font-mono">{op.complexity}</td>
                            <td className="py-2 text-muted-foreground">{op.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Applications */}
              <Card>
                <CardHeader>
                  <CardTitle>Real-world Applications</CardTitle>
                  <CardDescription>Where {name} are commonly used</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-1">
                    {content.applications.map((app, index) => (
                      <li key={index}>{app}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Advantages & Disadvantages */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Advantages</CardTitle>
                    <CardDescription>Benefits of using {name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 space-y-1">
                      {content.advantages.map((adv, index) => (
                        <li key={index}>{adv}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Disadvantages</CardTitle>
                    <CardDescription>Limitations of {name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 space-y-1">
                      {content.disadvantages.map((disadv, index) => (
                        <li key={index}>{disadv}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Visualization Link */}
              {!isAlgorithm && (
                <div className="mt-4 text-center">
                  <Button asChild size="lg">
                    <Link href={`/visualize?ds=${params.dataStructure}`}>
                      Visualize {name}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}

              {isAlgorithm && (
                <div className="mt-4 text-center">
                  <Button asChild size="lg">
                    <Link
                      href={`/visualize?algo=${
                        params.dataStructure === "searching-algorithms"
                          ? "binary-search"
                          : params.dataStructure === "sorting-algorithms"
                            ? "quick-sort"
                            : params.dataStructure === "greedy-algorithms"
                              ? "greedy"
                              : params.dataStructure === "divide-conquer"
                                ? "divide-conquer"
                                : "binary-search"
                      }`}
                    >
                      Try Algorithm Visualizer
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

