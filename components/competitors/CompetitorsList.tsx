"use client";

import { useState, useMemo } from "react";
import { Users, ExternalLink } from "lucide-react";
import { CompetitorAvatar } from "@/components/competitors/CompetitorAvatar";
import { TagsManager } from "@/components/competitors/TagsManager";
import { DeleteCompetitorButton } from "@/components/competitors/DeleteCompetitorButton";
import { TagsFilter } from "@/components/competitors/TagsFilter";

interface Competitor {
    id: string;
    created_at: string;
    url: string;
    username: string;
    name: string;
    profile_pic_url: string;
    tags: string[];
}

interface CompetitorsListProps {
    initialCompetitors: Competitor[];
}

export function CompetitorsList({ initialCompetitors }: CompetitorsListProps) {
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    // Competitors might change if we implemented real-time, but for now props are fine. 
    // If TagsManager updates tags, it calls refresh(), re-fetching server component, which updates props.
    // So 'initialCompetitors' is actually the *current* competitors from the server.

    // Extract all unique tags
    const availableTags = useMemo(() => {
        const tags = new Set<string>();
        initialCompetitors?.forEach(comp => {
            comp.tags?.forEach(tag => tags.add(tag));
        });
        return Array.from(tags).sort();
    }, [initialCompetitors]);

    // Filter logic
    const filteredCompetitors = useMemo(() => {
        if (selectedTags.length === 0) return initialCompetitors;

        return initialCompetitors?.filter(comp => {
            if (!comp.tags) return false;
            // Logic: Must have ALL selected tags (AND)
            return selectedTags.every(tag => comp.tags.includes(tag));
        }) || [];
    }, [initialCompetitors, selectedTags]);

    return (
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm animate-enter delay-100">
            {/* Filter Bar */}
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/30 rounded-t-2xl">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    {filteredCompetitors?.length || 0} {filteredCompetitors?.length === 1 ? 'Competidor' : 'Competidores'}
                </div>
                <TagsFilter
                    availableTags={availableTags}
                    selectedTags={selectedTags}
                    onTagsChange={setSelectedTags}
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-zinc-50 border-b border-zinc-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-400">Competidor</th>
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-400">Enlace</th>
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-400">Etiquetas</th>
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-400 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {filteredCompetitors?.map((comp) => (
                            <tr key={comp.id} className="group hover:bg-zinc-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <CompetitorAvatar
                                            src={comp.profile_pic_url}
                                            username={comp.username}
                                            name={comp.name}
                                            size="sm"
                                        />
                                        <span className="font-bold text-zinc-700">{comp.name || comp.username}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <a
                                        href={comp.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-zinc-400 hover:text-blue-600 flex items-center gap-1.5 transition-colors text-sm font-medium w-fit"
                                    >
                                        {comp.username || 'Link'} <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                </td>
                                <td className="px-6 py-4">
                                    <TagsManager competitorId={comp.id} initialTags={comp.tags} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <DeleteCompetitorButton id={comp.id} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Empty State */}
            {(!filteredCompetitors || filteredCompetitors.length === 0) && (
                <div className="py-20 text-center text-zinc-400 rounded-b-2xl">
                    <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center mx-auto mb-3">
                        <Users className="w-5 h-5 text-zinc-300" />
                    </div>
                    <p className="text-sm font-medium">
                        {initialCompetitors?.length > 0 ? "No hay resultados para este filtro" : "Lista vacía"}
                    </p>
                    {selectedTags.length > 0 && (
                        <button
                            onClick={() => setSelectedTags([])}
                            className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
