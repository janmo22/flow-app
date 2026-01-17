"use client";

import { X, ExternalLink, MessageCircle, Heart, Play, TrendingUp, AlertCircle, FileText, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

interface CompetitorDetailProps {
    competitor: any | null;
    onClose: () => void;
    onSave: (id: string, updates: any) => Promise<void>;
}

export function CompetitorDetail({ competitor, onClose, onSave }: CompetitorDetailProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'notes'>('overview');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [notes, setNotes] = useState(competitor?.notes || "");
    const [isSaving, setIsSaving] = useState(false);

    if (!competitor) return null;

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const response = await fetch('/api/analyze-competitor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    competitorId: competitor.id,
                    url: competitor.url,
                    action: 'content'
                })
            });

            if (!response.ok) throw new Error('Analysis failed');

            const result = await response.json();

            // Fix: Merge the new posts with existing analysis_data to avoid wiping profile
            const currentAnalysisData = competitor.analysis_data || {};
            const newAnalysisData = {
                ...currentAnalysisData,
                posts: result.data // The API 'content' action returns the posts array as 'data'
            };

            await onSave(competitor.id, {
                analysis_data: newAnalysisData,
                last_content_scrape: new Date().toISOString(),
                last_scraped_at: new Date().toISOString()
            });

        } catch (error) {
            console.error(error);
            alert("Error al analizar el perfil. Asegúrate de que la URL es correcta y el token de Apify está configurado.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(competitor.id, { notes });
        setIsSaving(false);
        onClose();
    };

    // Extract posts from analysis_data if available
    const posts = competitor.analysis_data?.posts || [];

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
                {/* Header */}
                {/* Header */}
                <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-white/80 backdrop-blur-xl z-10 sticky top-0">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center text-xl font-black text-zinc-400 overflow-hidden relative shadow-sm border border-zinc-100">
                            {competitor.analysis_data?.profile?.profilePicUrl ? (
                                <Image
                                    src={competitor.analysis_data.profile.profilePicUrl}
                                    alt={competitor.name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                competitor.name[0]
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <h2 className="text-xl font-black text-zinc-900 tracking-tight">{competitor.name}</h2>
                                {competitor.analysis_data?.profile?.isVerified && (
                                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <a href={competitor.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-zinc-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
                                    @{competitor.analysis_data?.profile?.username || competitor.name}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                                {competitor.analysis_data?.profile?.biography && (
                                    <p className="text-[10px] text-zinc-500 line-clamp-1 max-w-[200px]">{competitor.analysis_data.profile.biography}</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-right mr-2 hidden sm:block">
                            <div className="text-[10px] uppercase font-black text-zinc-400">Última actualización</div>
                            <div className="text-xs font-bold text-zinc-600">
                                {competitor.last_scraped_at ? new Date(competitor.last_scraped_at).toLocaleDateString() + ' ' + new Date(competitor.last_scraped_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Nunca'}
                            </div>
                        </div>
                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all disabled:opacity-50"
                            title="Analizar Perfil"
                        >
                            {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                        </button>
                        <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 px-6 border-b border-zinc-100">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'overview' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
                    >
                        Resumen
                    </button>
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'content' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
                    >
                        Top Contenido
                    </button>
                    <button
                        onClick={() => setActiveTab('notes')}
                        className={`py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'notes' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
                    >
                        Notas
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/50">

                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
                                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Seguidores</div>
                                    <div className="text-2xl font-black text-zinc-900 flex items-center gap-2">
                                        {(competitor.analysis_data?.profile?.followersCount || competitor.followers || 0).toLocaleString()}
                                    </div>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
                                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Seguidos</div>
                                    <div className="text-2xl font-black text-zinc-900">
                                        {(competitor.analysis_data?.profile?.followsCount || 0).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* Analysis Card */}
                            <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
                                <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-blue-600" />
                                    Biografía
                                </h3>
                                <p className="text-sm text-zinc-600 leading-relaxed font-medium">
                                    {competitor.analysis_data?.profile?.biography || (
                                        <div className="flex flex-col gap-2 items-start opacity-70">
                                            <span>No hay datos de perfil disponibles.</span>
                                            <button
                                                onClick={async () => {
                                                    setIsAnalyzing(true);
                                                    try {
                                                        const res = await fetch('/api/analyze-competitor', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ competitorId: competitor.id, url: competitor.url, action: 'profile' })
                                                        });
                                                        if (res.ok) {
                                                            const result = await res.json();
                                                            onSave(competitor.id, { analysis_data: { ...competitor.analysis_data, profile: result.data } });
                                                        }
                                                    } catch (e) { console.error(e); }
                                                    setIsAnalyzing(false);
                                                }}
                                                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                                            >
                                                <RefreshCw className="w-3 h-3" /> Escanear Perfil
                                            </button>
                                        </div>
                                    )}
                                </p>
                            </div>

                            {/* Alert/Warning */}
                            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                                <h3 className="text-sm font-black text-amber-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Patrón Detectado
                                </h3>
                                <p className="text-xs text-amber-800/80 font-bold leading-relaxed">
                                    Publica consistentemente a las 18:00 todos los días. Podríamos intentar publicar 30 minutos antes para capturar su audiencia.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'content' && (
                        <div className="grid grid-cols-2 gap-4">
                            {posts.length > 0 ? posts.map((post: any, i: number) => (
                                <a key={i} href={post.url} target="_blank" rel="noopener noreferrer" className="group relative aspect-[9/16] bg-zinc-200 rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all block">
                                    {post.displayUrl || post.thumbnailUrl ? (
                                        <Image
                                            src={post.displayUrl || post.thumbnailUrl}
                                            alt={post.caption?.slice(0, 20) || "Post"}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 text-zinc-300">
                                            <Play className="w-8 h-8" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur flex items-center justify-center">
                                            <Play className="w-5 h-5 text-black fill-black ml-1" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
                                        <div className="flex items-center gap-3 text-xs font-bold mb-1">
                                            <span className="flex items-center gap-1"><Play className="w-3 h-3" /> {post.videoViewCount || post.likesCount || 0}</span>
                                            <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {post.commentsCount || 0}</span>
                                        </div>
                                        <p className="text-[10px] font-medium opacity-80 line-clamp-2">{post.caption}</p>
                                    </div>
                                </a>
                            )) : (
                                <div className="col-span-2 flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-zinc-200 rounded-3xl bg-zinc-50/50">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                                        <TrendingUp className="w-8 h-8 text-blue-500" />
                                    </div>
                                    <h3 className="text-zinc-900 font-black text-lg mb-2 tracking-tight">Analizar Contenido Viral</h3>
                                    <p className="text-zinc-500 text-sm max-w-xs mb-6 font-medium">
                                        Activa el agente de IA para escanear los últimos posts y detectar qué contenido está funcionando mejor.
                                    </p>
                                    <button
                                        onClick={handleAnalyze}
                                        disabled={isAnalyzing}
                                        className="bg-zinc-900 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-zinc-200 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Analizando...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw className="w-4 h-4" />
                                                Comenzar Análisis
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <div className="h-full bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm flex flex-col">
                            <div className="mb-4 flex items-center gap-2 text-zinc-400">
                                <FileText className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-widest">Notas Personales</span>
                            </div>
                            <textarea
                                className="w-full flex-1 resize-none focus:outline-none text-sm font-medium text-zinc-700 placeholder:text-zinc-300"
                                placeholder="Escribe tus observaciones sobre este competidor..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    )}

                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-zinc-100 bg-white z-10 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 bg-zinc-100 text-zinc-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                        Cerrar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                    >
                        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
}

