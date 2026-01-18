'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Loader2, Link as LinkIcon, Instagram, X } from 'lucide-react'
import { addCompetitor } from '@/app/actions/competitors'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export function AddCompetitorDialog() {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [url, setUrl] = useState('')
    const [error, setError] = useState('')
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!url) return
        setError('')

        setIsLoading(true)
        try {
            const res = await addCompetitor(url)
            if (res.error) {
                setError(res.error)
            } else {
                setIsOpen(false)
                setUrl('')
                router.refresh()
            }
        } catch (e) {
            setError("Error inesperado.")
        } finally {
            setIsLoading(false)
        }
    }

    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors shadow-sm active:translate-y-px"
            >
                <Plus className="w-4 h-4" />
                <span className="text-xs font-bold tracking-wide">Añadir Competidor</span>
            </button>
        )
    }

    if (!mounted) return null

    // Portal to body to leave any stacking context
    return createPortal(
        <div className="fixed inset-0 z-[9999] grid place-items-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Modal Content */}
            <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-200 overflow-hidden mx-auto my-auto ring-1 ring-zinc-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
                    <h3 className="text-sm font-bold text-zinc-900">Nuevo Competidor</h3>
                    <button
                        onClick={() => !isLoading && setIsOpen(false)}
                        className="text-zinc-400 hover:text-zinc-600 transition-colors p-1 hover:bg-zinc-100 rounded-md"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                                Enlace de Instagram
                            </label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="https://instagram.com/usuario"
                                    className="w-full bg-white border border-zinc-200 rounded-lg py-2.5 pl-9 pr-3 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    autoFocus
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-medium rounded-lg animate-in fade-in slide-in-from-top-1">
                                {error}
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                disabled={isLoading}
                                className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={!url || isLoading}
                                className={cn(
                                    "px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold shadow-sm transition-all hover:bg-black active:translate-y-px flex items-center gap-2",
                                    (!url || isLoading) && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                                {isLoading ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    )
}
