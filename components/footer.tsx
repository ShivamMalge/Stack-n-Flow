import Link from "next/link"
import Image from "next/image"
import SocialLinks from "@/components/social-links"

const QUICK_LINKS = [
  { name: "Home", path: "/" },
  { name: "Learn", path: "/learn" },
  { name: "Visualize", path: "/visualize" },
  { name: "Operations", path: "/operations" },
  { name: "About", path: "/about" },
]

export default function Footer() {
  return (
    // Laid out in rows rather than three stacked columns: the previous version
    // put five nav links and four social links in vertical lists, which made the
    // footer taller than some of the content above it.
    <footer className="border-t py-5 px-4">
      <div className="container mx-auto max-w-5xl space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="" width={24} height={24} className="rounded-md invert dark:invert-0" />
            <span className="font-bold">Stack&apos;n&apos;Flow</span>
            <span className="hidden lg:inline text-sm text-muted-foreground">
              — learn and visualize data structures and algorithms
            </span>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {QUICK_LINKS.map(({ name, path }) => (
              <Link
                key={path}
                href={path}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t pt-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Stack&apos;n&apos;Flow. All rights reserved.</p>
          <SocialLinks layout="row" className="gap-x-4 gap-y-1" />
        </div>
      </div>
    </footer>
  )
}
