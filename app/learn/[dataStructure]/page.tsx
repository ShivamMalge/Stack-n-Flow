import Link from "next/link"
import { ArrowLeft, ArrowRight, BookOpen, Code, ListOrdered, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import MiniVisualizerLoader from "@/components/visualizers/mini-visualizer-loader"
import { MultiLanguageCode } from "@/components/ui/multi-language-code"
import { dataStructureInfo, LearnContent } from "@/lib/learn-content"

export default async function DataStructurePage({ params }: { params: Promise<{ dataStructure: string }> }) {
  const { dataStructure } = await params
  const dsInfo: LearnContent | undefined = dataStructureInfo[dataStructure]

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
    dataStructure.includes("algorithms") ||
    dataStructure === "divide-conquer" ||
    dataStructure === "dynamic-programming" ||
    dataStructure === "binary-search"

  return (
    <div className="flex flex-col min-h-screen dark bg-background">
      <Navbar />

      <main className="flex-1">
        <section className="py-12 px-4 bg-muted/20 border-b">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center gap-2 mb-8">
              <Button asChild variant="ghost" size="sm" className="hover:bg-muted">
                <Link href="/learn">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Modules
                </Link>
              </Button>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                <Icon className="h-8 w-8 text-primary" />
              </div>
              <div className="pt-2">
                <h1 className="text-4xl font-bold mb-3 tracking-tight">{name}</h1>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">{description}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl space-y-16">

            {/* 1. Intuition */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Lightbulb className="h-4 w-4 text-blue-500" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">Intuition</h2>
              </div>
              <div className="prose dark:prose-invert max-w-none ml-10">
                <p className="text-lg text-muted-foreground leading-relaxed">{content.intuition}</p>
              </div>
            </div>

            {/* 2. Example Visualization */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-purple-500" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">Example Visualization</h2>
              </div>
              <div className="ml-10">
                <MiniVisualizerLoader dataStructure={dataStructure} />
              </div>
            </div>

            {/* 3. Algorithm Steps */}
            {content.algorithmSteps && content.algorithmSteps.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <ListOrdered className="h-4 w-4 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight">Algorithm Concept</h2>
                </div>
                <div className="ml-10 pl-6 border-l-2 border-muted">
                  <ol className="space-y-4 text-muted-foreground relative">
                    {content.algorithmSteps.map((step, idx) => (
                      <li key={idx} className="relative">
                        <span className="absolute -left-9 flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold text-foreground ring-4 ring-background">
                          {idx + 1}
                        </span>
                        <span className="text-base leading-relaxed block pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            {/* 4. Multi-language Code & 5. Explanations */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Code className="h-4 w-4 text-orange-500" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">Code Implementation</h2>
              </div>
              <div className="ml-10">
                <MultiLanguageCode implementations={content.implementations} />
              </div>
            </div>

            <hr className="border-muted/50 my-8" />

            {/* 6. Other Content */}
            <div className="space-y-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-8 w-8 rounded-full bg-zinc-500/10 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-zinc-500" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">Deep Dive Details</h2>
              </div>

              <div className="ml-10 grid gap-6">
                {content.types && content.types.length > 0 && (
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
                )}

                {content.operations && content.operations.length > 0 && (
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
                                <td className="py-2 pr-4 font-mono text-sm group-hover:text-primary transition-colors">{op.complexity}</td>
                                <td className="py-2 text-muted-foreground text-sm">{op.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {content.applications && content.applications.length > 0 && (
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
                )}

                {(content.advantages?.length > 0 || content.disadvantages?.length > 0) && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {content.advantages?.length > 0 && (
                      <Card className="border-green-500/20">
                        <CardHeader className="bg-green-500/5 pb-4">
                          <CardTitle className="text-green-500">Advantages</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <ul className="list-disc pl-5 space-y-1">
                            {content.advantages.map((adv, index) => (
                              <li key={index} className="text-sm">{adv}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {content.disadvantages?.length > 0 && (
                      <Card className="border-red-500/20">
                        <CardHeader className="bg-red-500/5 pb-4">
                          <CardTitle className="text-red-500">Disadvantages</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <ul className="list-disc pl-5 space-y-1">
                            {content.disadvantages.map((disadv, index) => (
                              <li key={index} className="text-sm">{disadv}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Full Visualization Link */}
                <div className="mt-8 text-center pt-8 border-t">
                  <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link href={isAlgorithm ? `/visualize?algo=${dataStructure}` : `/visualize?ds=${dataStructure}`}>
                      Open Full Interactive Visualizer
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>

              </div>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div >
  )
}
