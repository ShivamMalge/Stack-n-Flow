import type { ComponentType } from "react"
import { Github, Instagram, Linkedin } from "lucide-react"
import { SiLeetcode } from "react-icons/si"

/**
 * Site identity and outbound links, shared by the footer and the about page,
 * which previously duplicated the same link list character for character.
 */

export const SITE_AUTHOR = {
    name: "Shivam Malge",
} as const

export interface SocialLink {
    label: string
    href: string
    icon: ComponentType<{ className?: string }>
}

export const SOCIAL_LINKS: SocialLink[] = [
    {
        label: "GitHub",
        href: "https://github.com/ShivamMalge",
        icon: Github,
    },
    {
        label: "LinkedIn",
        // `?originalSubdomain=in` dropped: it is a redirect artefact, not part of the profile URL.
        href: "https://www.linkedin.com/in/shivam-malge-12523a293",
        icon: Linkedin,
    },
    {
        label: "LeetCode",
        href: "https://leetcode.com/u/ShivamMalge/",
        icon: SiLeetcode,
    },
    {
        label: "Instagram",
        // `?igsh=` dropped: it is a per-share tracking token tied to one device.
        href: "https://www.instagram.com/epsilon_edge",
        icon: Instagram,
    },
]
