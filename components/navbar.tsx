"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"

export default function Navbar() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Learn", path: "/learn" },
    { name: "Visualize", path: "/visualize" },
    { name: "About", path: "/about" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">Stack&apos;n&apos;Flow</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`text-sm font-medium transition-colors hover:text-primary ${pathname === item.path ? "text-foreground" : "text-muted-foreground"
                }`}
            >
              {item.name}
            </Link>
          ))}
          <ModeToggle />
        </nav>

        {/* Mobile Navigation */}
        <div className="flex items-center gap-2 md:hidden">
          <ModeToggle />
          <Button variant="ghost" size="icon" aria-label="Toggle Menu" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 md:hidden bg-background/80 backdrop-blur-md transition-all duration-300 ease-in-out ${isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        onClick={() => setIsMenuOpen(false)}
      >
        <div
          className={`container flex flex-col items-center justify-center min-h-screen pt-16 pb-8 px-6 transition-transform duration-300 ease-in-out ${isMenuOpen ? "translate-y-0" : "-translate-y-4"
            }`}
        >
          <nav className="flex flex-col items-center gap-8 w-full max-w-xs">
            {navItems.map((item, index) => (
              <Link
                key={item.path}
                href={item.path}
                className={`w-full text-center py-4 text-2xl font-semibold transition-all hover:text-primary border-b border-border/50 ${pathname === item.path ? "text-foreground" : "text-muted-foreground"
                  }`}
                style={{ transitionDelay: `${index * 50}ms` }}
                onClick={(e) => {
                  e.stopPropagation()
                  setIsMenuOpen(false)
                }}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}

