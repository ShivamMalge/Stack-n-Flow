import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, BookOpen, Code, LineChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export const metadata: Metadata = {
  title: "Stack'n'Flow | Home",
  description: "Interactive Data Structure and Algorithm Visualizer",
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen dark">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-background to-background/80">
          <div className="container mx-auto max-w-5xl">
            <div className="flex flex-col items-center text-center space-y-8">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Data Structures & Algorithms <span className="text-primary">Visualized</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl">
                Learn and visualize complex data structures and algorithms through interactive animations and detailed
                explanations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <Button asChild size="lg">
                  <Link href="/visualize">
                    Start Visualizing
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/learn">
                    Learn DSA
                    <BookOpen className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-card rounded-lg p-6 shadow-sm border">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <LineChart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Interactive Visualizations</h3>
                <p className="text-muted-foreground">
                  See data structures and algorithms in action with smooth, animated visualizations.
                </p>
              </div>

              <div className="bg-card rounded-lg p-6 shadow-sm border">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Comprehensive Learning</h3>
                <p className="text-muted-foreground">
                  Detailed explanations and intuition behind each data structure and algorithm.
                </p>
              </div>

              <div className="bg-card rounded-lg p-6 shadow-sm border">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Code className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Practical Implementation</h3>
                <p className="text-muted-foreground">
                  Understand how data structures work in practice with real-time operations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Data Structures Preview */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-4">Explore Data Structures</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Dive into various data structures and understand their operations, time complexity, and real-world
              applications.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {["Linked List", "Stack", "Queue", "Binary Tree", "BST", "AVL Tree", "B-Tree", "Graph", "Heap", "Hash Table"].map((ds) => (
                <Link
                  key={ds}
                  href={`/visualize?ds=${ds.toLowerCase().replace(/ /g, "-").replace("bst", "binary-search-tree")}`}
                  className="bg-card hover:bg-card/80 border rounded-lg p-4 text-center transition-colors"
                >
                  <h3 className="font-medium">{ds}</h3>
                </Link>
              ))}
            </div>

            <div className="text-center mt-8">
              <Button asChild variant="outline">
                <Link href="/learn">
                  View All Data Structures
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

