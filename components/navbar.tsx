"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useSession, signIn, signOut } from "next-auth/react"
import { Menu, X, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

export default function Navbar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
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
            <Image src="/logo.jpg" alt="Stack'n'Flow Logo" width={32} height={32} className="rounded-md" />
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

          <div className="flex items-center gap-4 border-l pl-4 ml-2">
            <ModeToggle />

            {status === "loading" ? (
              <Skeleton className="h-9 w-20 rounded-md" />
            ) : session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full overflow-hidden border">
                    {session.user.image ? (
                      <img src={session.user.image} alt="Avatar" className="object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user.email}
                      </p>
                      {session.user.role && (
                        <p className="text-xs font-semibold text-primary mt-1 uppercase tracking-wider">{session.user.role}</p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => signIn("google")} variant="default" size="sm">
                Sign In
              </Button>
            )}
          </div>
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
        className={`absolute top-16 left-0 right-0 z-40 md:hidden bg-background border-b shadow-lg transition-all duration-300 ease-in-out origin-top ${isMenuOpen ? "scale-y-100 opacity-100 pointer-events-auto" : "scale-y-0 opacity-0 pointer-events-none"
          }`}
        onClick={() => setIsMenuOpen(false)}
      >
        <nav className="flex flex-col p-4 w-full gap-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`w-full py-3 px-4 text-base font-medium rounded-md transition-colors hover:bg-muted ${pathname === item.path ? "text-foreground bg-muted" : "text-muted-foreground"
                }`}
              onClick={(e) => {
                e.stopPropagation()
                setIsMenuOpen(false)
              }}
            >
              {item.name}
            </Link>
          ))}

          <div className="border-t mt-2 pt-4 px-4 flex flex-col gap-4">
            {status === "loading" ? (
              <Skeleton className="h-10 w-full rounded-md" />
            ) : session?.user ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full overflow-hidden border shrink-0">
                    {session.user.image ? (
                      <img src={session.user.image} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{session.user.name}</span>
                    <span className="text-xs text-muted-foreground">{session.user.role || "Pending Onboarding"}</span>
                  </div>
                </div>
                <Button onClick={() => signOut()} variant="outline" className="w-full text-destructive" size="sm">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </div>
            ) : (
              <Button onClick={() => { setIsMenuOpen(false); signIn("google"); }} className="w-full">
                Sign In
              </Button>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}

