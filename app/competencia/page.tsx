import { Search, Plus, ExternalLink, TrendingUp, Users, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { createClient } from "@/lib/supabase-server";
import { AddCompetitorDialog } from "@/components/competitors/AddCompetitorDialog";
import { DeleteCompetitorButton } from "@/components/competitors/DeleteCompetitorButton";
import { TagsManager } from "@/components/competitors/TagsManager";

import { CompetitorExternalLink } from "@/components/competitors/CompetitorExternalLink";

// Force dynamic since we read cookies/DB
export const dynamic = 'force-dynamic'

export default async function CompetitorsPage() {
    const supabase = await createClient();
    const { data: competitors } = await supabase
        .from('competitors')
        .select('*')
        .order('created_at', { ascending: false });

    return (
        <div className="max-w-[1400px] mx-auto pt-10 pb-24 px-8">

            <PageHeader
                title="Análisis de Competencia"
                breadcrumb={[
                    { label: 'Zona Investigar', href: '#' },
                    { label: 'Competencia' }
                ]}
                action={<AddCompetitorDialog />}
            />

            {/* Simple Table */}
            <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm animate-enter delay-100">
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
                            {competitors?.map((comp) => (
                                <tr key={comp.id} className="group hover:bg-zinc-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200 overflow-hidden relative">
                                                <img
                                                    src={comp.profile_pic_url || `https://unavatar.io/instagram/${comp.username}`}
                                                    alt={comp.username}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 text-xs font-bold text-zinc-400 hidden">
                                                    {(comp.name || comp.username || '?')[0]}
                                                </div>
                                            </div>
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
                {(!competitors || competitors.length === 0) && (
                    <div className="py-20 text-center text-zinc-400">
                        <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center mx-auto mb-3">
                            <Users className="w-5 h-5 text-zinc-300" />
                        </div>
                        <p className="text-sm font-medium">Lista vacía</p>
                    </div>
                )}
            </div>
        </div>
    );
}
