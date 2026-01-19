'use client'

import { useState } from 'react'

interface CompetitorAvatarProps {
    src?: string | null
    username: string
    name?: string | null
    className?: string
    fallbackClassName?: string
    size?: 'sm' | 'lg'
}

export function CompetitorAvatar({ src, username, name, size = 'sm' }: CompetitorAvatarProps) {
    const [imageError, setImageError] = useState(false)

    // Construct unavatar URL as primary fallback if src is null
    const avatarUrl = src || `https://unavatar.io/instagram/${username}`
    const initials = (name || username || '?')[0].toUpperCase()

    // Dimensions
    const containerClass = size === 'lg'
        ? "w-32 h-32 rounded-full border-4 border-zinc-50 shadow-lg"
        : "w-8 h-8 rounded-full border border-zinc-200"

    const textSize = size === 'lg' ? "text-4xl" : "text-xs"

    return (
        <div className={`${containerClass} bg-zinc-100 flex items-center justify-center overflow-hidden relative flex-shrink-0`}>
            {!imageError ? (
                <img
                    src={avatarUrl}
                    alt={username}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                />
            ) : (
                <div className={`absolute inset-0 flex items-center justify-center bg-zinc-100 ${textSize} font-bold text-zinc-400`}>
                    {initials}
                </div>
            )}
        </div>
    )
}
