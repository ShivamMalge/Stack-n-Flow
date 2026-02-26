import type { Metadata } from "next"
import { Github, Linkedin, Instagram } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export const metadata: Metadata = {
  title: "About | Stack'n'Flow",
  description: "About the Stack'n'Flow project",
}

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen dark">
      <Navbar />

      <main className="flex-1">
        <section className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-4xl font-bold mb-6">About Stack&apos;n&apos;Flow</h1>
            <p className="text-xl text-muted-foreground mb-8">
              <strong>Stack&apos;n&apos;Flow</strong> is an interactive DSA visualizer designed and developed by{" "}
              <strong>Shivam Malge</strong>.
              <br />
              Its mission is to make data structures and algorithms more accessible, intuitive, and engaging for
              everyone—from beginners to seasoned developers.
            </p>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="grid md:grid-cols-1 gap-12">
              <div>
                <h2 className="text-2xl font-semibold mb-4">Our Vision</h2>
                <p className="text-muted-foreground mb-4">
                  Understanding data structures and algorithms is a cornerstone of strong programming fundamentals. Yet,
                  these topics are often taught in a theoretical and abstract manner, making it difficult for learners
                  to truly grasp their inner workings.
                </p>
                <p className="text-muted-foreground">
                  <strong>Stack&apos;n&apos;Flow</strong> bridges that gap by bringing these concepts to life through real-time
                  animations, step-by-step visualizations, and interactive controls. Whether you&apos;re a student,
                  self-learner, or software engineer, this platform is built to help you visualize logic, develop
                  intuition, and strengthen your problem-solving skills.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-semibold mb-8">About Me</h2>
            <div className="bg-card rounded-lg p-8 shadow-sm border">
              <p className="mb-4">
                I&apos;m <strong>Shivam Malge</strong>, a Computer Science Engineering student passionate about the
                intersection of <strong>web development, finance, and AI</strong>.
                <br />
                With a strong foundation in full-stack development and a growing interest in data science and system
                design, I created <strong>Stack&apos;n&apos;Flow</strong> to combine my love for elegant user experiences with
                meaningful educational tools.
              </p>
              <p className="mb-6">
                I believe in learning by doing—and seeing. Through this project, I aim to simplify complex topics and
                empower others on their programming journey.
              </p>

              <div className="flex space-x-4 mt-8">
                <a
                  href="https://www.instagram.com/epsilon_edge?igsh=MTduNDFqdWd5NGlwMQ=="
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Instagram className="h-5 w-5 mr-2" />
                  <span>Instagram</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/shivam-malge-12523a293?originalSubdomain=in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Linkedin className="h-5 w-5 mr-2" />
                  <span>LinkedIn</span>
                </a>
                <a
                  href="https://github.com/ShivamMalge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Github className="h-5 w-5 mr-2" />
                  <span>GitHub</span>
                </a>
              </div>
            </div>

            <div className="text-center mt-12 italic text-muted-foreground">
              <p>Built with passion, logic, and a little bit of late-night caffeine.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

