import { Search, Plus, ExternalLink, TrendingUp, Users, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { createClient } from "@/lib/supabase-server";
import { AddCompetitorDialog } from "@/components/competitors/AddCompetitorDialog";
import { SyncCompetitorButton } from "@/components/competitors/SyncCompetitorButton";
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

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-enter delay-100">
                {competitors?.map((comp) => (
                    <a href={`/competencia/${comp.id}`} key={comp.id} className="block group">
                        <div className="bg-white border border-zinc-200 rounded-xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative h-full">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <SyncCompetitorButton competitorId={comp.id} />
                                <CompetitorExternalLink url={`https://instagram.com/${comp.username}`} />
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                {comp.profile_pic_url ? (
                                    <img
                                        src={comp.profile_pic_url}
                                        alt={comp.full_name || comp.username}
                                        className="w-14 h-14 rounded-full object-cover shadow-inner bg-zinc-100"
                                    />
                                ) : (
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center text-xl font-bold text-zinc-500 shadow-inner">
                                        {(comp.username || '?')[0].toUpperCase()}
                                    </div>
                                )}

                                <div className="overflow-hidden">
                                    <h3 className="font-bold text-lg text-zinc-900 leading-tight truncate flex items-center gap-1">
                                        {comp.full_name || comp.username}
                                        {comp.is_verified && <span className="text-blue-500 text-xs">✓</span>}
                                    </h3>
                                    <p className="text-sm text-zinc-500 truncate">@{comp.username}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                                    <span className="text-zinc-500 flex items-center gap-2"><Users className="w-3 h-3" /> Seguidores</span>
                                    <span className="font-bold text-zinc-900">{comp.followers?.toLocaleString() || '-'}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm p-3 bg-blue-50/50 rounded-lg border border-blue-50">
                                    <span className="text-blue-600/80 flex items-center gap-2"><TrendingUp className="w-3 h-3" /> Posts Analizados</span>
                                    <span className="font-bold text-blue-700">{comp.posts_count || 0}</span>
                                </div>
                            </div>

                            {comp.status === 'pending_scrape' && (
                                <div className="mt-4 text-xs text-center text-amber-600 bg-amber-50 py-1 rounded-full animate-pulse">
                                    Analizando datos...
                                </div>
                            )}
                        </div>
                    </a>
                ))}

                {/* Placeholder if empty */}
                {(!competitors || competitors.length === 0) && (
                    <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No tienes competidores añadidos aún.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
