import Link from "next/link"
import { SOCIAL_LINKS } from "@/lib/site-config"

interface SocialLinksProps {
    /** `column` for the footer, `row` for the about page. */
    layout?: "column" | "row"
    className?: string
}

export default function SocialLinks({ layout = "column", className = "" }: SocialLinksProps) {
    const layoutClasses =
        layout === "column" ? "flex flex-col space-y-2" : "flex flex-wrap gap-4"

    return (
        <div className={`${layoutClasses} ${className}`.trim()}>
            {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <Link
                    key={label}
                    href={href}
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Icon className="h-5 w-5 mr-2" />
                    <span>{label}</span>
                </Link>
            ))}
        </div>
    )
}
