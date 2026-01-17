'use client'

import { ExternalLink } from "lucide-react"

export function CompetitorExternalLink({ url }: { url: string }) {
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-zinc-100 rounded-lg inline-block text-zinc-400 hover:text-blue-600 transition-colors"
            onClick={(e) => e.stopPropagation()}
        >
            <ExternalLink className="w-4 h-4" />
        </a>
    )
}
