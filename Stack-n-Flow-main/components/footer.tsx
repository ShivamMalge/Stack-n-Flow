import Link from "next/link"
import { GitMerge, Github, Instagram, Linkedin } from "lucide-react"
import { SiLeetcode } from "react-icons/si"

export default function Footer() {
  return (
    <footer className="border-t py-8 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GitMerge className="h-5 w-5" />
              <span className="text-lg font-bold">Stack&apos;n&apos;Flow</span>
            </div>
            <p className="text-sm text-muted-foreground">
              An interactive tool to learn and visualize data structures and algorithms.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/learn" className="text-muted-foreground hover:text-foreground transition-colors">
                  Learn
                </Link>
              </li>
              <li>
                <Link href="/visualize" className="text-muted-foreground hover:text-foreground transition-colors">
                  Visualize
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Connect</h3>
            <div className="flex flex-col space-y-2">
              <Link
                href="https://github.com/ShivamMalge"
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-5 w-5 mr-2" />
                <span>GitHub</span>
              </Link>
              <Link
                href="https://www.linkedin.com/in/shivam-malge-12523a293?originalSubdomain=in"
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="h-5 w-5 mr-2" />
                <span>LinkedIn</span>
              </Link>
              <Link
                href="https://leetcode.com/u/ShivamMalge/"
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                <SiLeetcode className="h-5 w-5 mr-2" />
                <span>LeetCode</span>
              </Link>
              <Link
                href="https://www.instagram.com/epsilon_edge?igsh=MTduNDFqdWd5NGlwMQ=="
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="h-5 w-5 mr-2" />
                <span>Instagram</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Stack&apos;n&apos;Flow. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

