'use client'

import { RefreshCw, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { syncCompetitorData } from '@/app/actions/competitors'
import { useRouter } from 'next/navigation'

export function SyncCompetitorButton({ competitorId }: { competitorId: string }) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleSync = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation() // Prevent card click
        setIsLoading(true)
        try {
            await syncCompetitorData(competitorId)
            router.refresh()
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <button
            onClick={handleSync}
            disabled={isLoading}
            className="p-2 hover:bg-zinc-100 rounded-lg inline-block text-zinc-400 hover:text-blue-600 transition-colors disabled:opacity-50"
            title="Sincronizar datos"
        >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
    )
}
