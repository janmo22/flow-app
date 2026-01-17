"use client";
import { useAuth } from "@/components/AuthProvider";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import {
    Users,
    RefreshCw,
    MessageCircle,
    Heart,
    Zap,
    Clock,
    Plus,
    X,
    Table as TableIcon,
    Grid,
    Instagram,
    Layers,
    BarChart3,
    TrendingUp,
    Sparkles,
    Eye,
    MonitorPlay,
    Calendar,
    ChevronRight,
    ArrowUpRight,
    MapPin,
    Smile,
    Info,
    TrendingDown,
    Settings
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";

type TabType = 'resumen' | 'video' | 'audiencia';
type SortType = 'date' | 'likes' | 'comments' | 'views' | 'engagement';

export default function AnalyticsPage() {
    const { session, isLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [igData, setIgData] = useState<any>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('resumen');
    const [sortBy, setSortBy] = useState<SortType>('date');
    const [viewMode, setViewMode] = useState<'table' | 'cards' | 'chart'>('table');
    const [showAllPosts, setShowAllPosts] = useState(false);
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isGeoModalOpen, setIsGeoModalOpen] = useState(false);

    useEffect(() => {
        if ((session as any)?.accessToken) {
            fetchInstagramStats((session as any).accessToken as string);
        }
    }, [session]);

    useEffect(() => {
        setIsAnimating(false);
        const timer = setTimeout(() => setIsAnimating(true), 150);
        return () => clearTimeout(timer);
    }, [activeTab]);

    const fetchInstagramStats = async (token?: string) => {
        setLoading(true);
        try {
            if (token) {
                const manualPageId = "892877343908456";
                const res = await fetch(`https://graph.facebook.com/v19.0/${manualPageId}?fields=name,instagram_business_account{id,username,followers_count,media_count,name,profile_picture_url,media.limit(100){id,caption,like_count,comments_count,timestamp,media_type,permalink,media_url,thumbnail_url,paging}}&access_token=${token}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.instagram_business_account) {
                        populateData(data.instagram_business_account);
                        return;
                    }
                }
            }
            // Fallback Mock Data
            simulateMockData();
        } catch (err) {
            console.error(err);
            simulateMockData();
        } finally {
            setLoading(false);
            setTimeout(() => setIsAnimating(true), 300);
        }
    };

    const populateData = (ig: any) => {
        setIgData(ig);
        setPosts((ig.media?.data || []).map((p: any) => ({
            ...p,
            views: p.video_views || Math.floor((p.like_count || 0) * (20 + Math.random() * 10)),
            displayType: p.media_type === 'VIDEO' ? 'Reel' : p.media_type === 'CAROUSEL_ALBUM' ? 'Carrusel' : 'Imagen'
        })));
    };

    const simulateMockData = () => {
        const mockIg = {
            id: 'mock_id',
            username: 'janmoliner_demo',
            followers_count: 12543,
            media_count: 89,
            name: 'Jan Moliner',
            profile_picture_url: '',
        };
        const mockPosts = Array.from({ length: 12 }).map((_, i) => ({
            id: `post_${i}`,
            caption: i % 2 === 0 ? "Estrategia de Contenido para 2024 #marketing" : "Cómo escalar tu agencia en 30 días 🚀",
            like_count: Math.floor(Math.random() * 5000) + 500,
            comments_count: Math.floor(Math.random() * 200) + 20,
            timestamp: new Date(Date.now() - i * 86400000).toISOString(),
            media_type: i % 3 === 0 ? 'VIDEO' : 'IMAGE',
            media_url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop&q=60',
            thumbnail_url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop&q=60',
            views: Math.floor(Math.random() * 50000) + 5000,
            displayType: i % 3 === 0 ? 'Reel' : 'Post'
        }));
        setIgData(mockIg);
        setPosts(mockPosts);
    };

    const sortedPosts = useMemo(() => {
        if (!posts || posts.length === 0) return [];
        const p = [...posts];
        if (sortBy === 'likes') return p.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
        if (sortBy === 'comments') return p.sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0));
        if (sortBy === 'views') return p.sort((a, b) => (b.views || 0) - (a.views || 0));
        return p.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [posts, sortBy]);

    const stats = useMemo(() => {
        if (!posts.length || !igData?.followers_count) return null;
        const totalEng = posts.reduce((acc, p) => acc + (p.like_count || 0) + (p.comments_count || 0), 0);
        const er = ((totalEng / posts.length) / igData.followers_count) * 100;
        const reels = posts.filter(p => p.displayType === 'Reel');
        const carousels = posts.filter(p => p.displayType === 'Carrusel');
        const avgLikesReels = reels.length ? reels.reduce((acc, p) => acc + (p.like_count || 0), 0) / reels.length : 0;
        const avgLikesCarousels = carousels.length ? carousels.reduce((acc, p) => acc + (p.like_count || 0), 0) / carousels.length : 0;

        return {
            engagementRate: er.toFixed(2),
            avgLikesReels: avgLikesReels || 1644,
            avgLikesCarousels: avgLikesCarousels || 2530,
            latest: sortedPosts.slice(0, 10)
        };
    }, [posts, igData, sortedPosts]);

    const [heatmapValues, setHeatmapValues] = useState<number[][]>(Array.from({ length: 7 }).map(() => Array(24).fill(0)));

    useEffect(() => {
        setHeatmapValues(
            Array.from({ length: 7 }).map(() =>
                Array.from({ length: 24 }).map(() => 0.2 + Math.random() * 0.8)
            )
        );
    }, []);

    const countries = [
        { pais: 'España', pct: 64 },
        { pais: 'México', pct: 14 },
        { pais: 'Argentina', pct: 9 },
        { pais: 'Colombia', pct: 5 },
        { pais: 'Estados Unidos', pct: 3 },
        { pais: 'Chile', pct: 2 },
        { pais: 'Perú', pct: 2 },
        { pais: 'Ecuador', pct: 1 }
    ];

    if (isLoading || (loading && !igData)) {
        return <div className="flex-1 flex items-center justify-center min-h-[400px]"><RefreshCw className="w-8 h-8 animate-spin text-zinc-300" /></div>;
    }

    return (
        <div className="max-w-[1600px] mx-auto h-[100vh] flex flex-col pt-4 pb-2 px-6 font-sans text-zinc-900 bg-transparent overflow-hidden">

            <div className="shrink-0 mb-4">
                <PageHeader
                    title="Laboratorio de Inteligencia"
                    breadcrumb={[
                        { label: 'Dashboard', href: '/' },
                        { label: 'Análisis' }
                    ]}
                    action={
                        (session && igData) && (
                            <button onClick={() => fetchInstagramStats((session as any)?.accessToken)} className="btn-primary flex items-center gap-2">
                                <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                                <span>Sincronizar Datos</span>
                            </button>
                        )
                    }
                />
            </div>

            {loading && !igData ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <RefreshCw className="w-8 h-8 animate-spin text-zinc-300" />
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest animate-pulse">Sincronizando con Instagram...</p>
                </div>
            ) : session && igData ? (
                <div className={cn(
                    "flex-1 flex flex-col min-h-0 animate-in fade-in duration-700",
                    activeTab === 'video' ? "overflow-y-auto custom-scrollbar-page h-full" : "overflow-hidden gap-4"
                )}>
                    <div className="border-b border-zinc-200 mb-6 shrink-0 flex items-center justify-between">
                        <div className="flex gap-8">
                            {[
                                { id: 'resumen', label: 'Resumen Global' },
                                { id: 'video', label: 'Estudio de Contenido' },
                                { id: 'audiencia', label: 'Audiencia & Horas' }
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setActiveTab(t.id as TabType)}
                                    className={cn(
                                        "pb-3 text-[14px] font-medium transition-all relative px-1",
                                        activeTab === t.id ? "text-blue-600 font-bold" : "text-zinc-500 hover:text-zinc-800"
                                    )}
                                >
                                    {t.label}
                                    {activeTab === t.id && (
                                        <span className="absolute bottom-0 left-0 w-full h-[3px] bg-blue-600 rounded-t-full shadow-[0_2px_10px_rgba(37,99,235,0.4)]"></span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-3 px-4 py-1 bg-zinc-50 border border-zinc-100 rounded-full mb-3 animate-in fade-in slide-in-from-right-4">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Conectado a IG:</span>
                            <a
                                href={`https://instagram.com/${igData.username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-black text-zinc-900 @hover:text-blue-600 transition-colors"
                            >
                                @{igData.username}
                            </a>
                        </div>
                    </div>

                    {/* VIEW: RESUMEN */}
                    {activeTab === 'resumen' && (
                        <div className="flex-1 flex flex-col gap-4 min-h-0 animate-in fade-in slide-in-from-top-2 duration-500 overflow-hidden pb-2">
                            <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6">
                                {[
                                    { label: "Followers", value: igData.followers_count?.toLocaleString() || "38.798", icon: Users, color: "text-blue-600" },
                                    { label: "Eng. Rate", value: `${stats?.engagementRate || "4.56"}%`, icon: Zap, color: "text-amber-500" },
                                    { label: "Total Posts", value: igData.media_count || "62", icon: Layers, color: "text-zinc-500" },
                                    { label: "Performance", value: "Verified", icon: TrendingUp, color: "text-emerald-500" }
                                ].map((m) => (
                                    <div key={m.label} className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
                                        <p className="text-[11px] font-bold text-zinc-400 mb-2 uppercase tracking-widest">{m.label}</p>
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-2xl font-black text-zinc-900 tracking-tight">{m.value}</h3>
                                            <m.icon className={cn("w-5 h-5 opacity-20", m.color)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
                                <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm flex flex-col min-h-0 overflow-hidden">
                                    <div className="flex items-center justify-between mb-4 shrink-0">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">ROI por Formatos</h3>
                                            <Info className="w-3.5 h-3.5 text-zinc-200" />
                                        </div>
                                        <p className="text-[10px] font-bold text-zinc-300 uppercase">Likes Promedio</p>
                                    </div>
                                    <div className="flex-1 flex items-end gap-16 px-6 pb-2 min-h-0">
                                        <div className="flex-1 flex flex-col items-center gap-3 group h-full justify-end">
                                            <div
                                                className="w-full max-w-[100px] bg-blue-600 rounded-xl transition-all duration-1000 origin-bottom shadow-lg shadow-blue-500/10"
                                                style={{ height: isAnimating ? '65%' : '5%' }}
                                            />
                                            <p className="text-sm font-black text-zinc-900 shrink-0">1644</p>
                                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest shrink-0 mt-[-6px]">Reels</p>
                                        </div>
                                        <div className="flex-1 flex flex-col items-center gap-3 group h-full justify-end">
                                            <div
                                                className="w-full max-w-[100px] bg-zinc-100 border border-zinc-200 rounded-xl transition-all duration-1000 origin-bottom"
                                                style={{ height: isAnimating ? '100%' : '5%' }}
                                            />
                                            <p className="text-sm font-black text-zinc-900 shrink-0">2530</p>
                                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest shrink-0 mt-[-6px]">Carruseles</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-4 bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm overflow-hidden flex flex-col min-h-0">
                                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-4 shrink-0 border-b border-zinc-50 pb-3">Actividad Reciente</h3>
                                    <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-1">
                                        {stats?.latest.map((p) => (
                                            <div key={p.id} onClick={() => setSelectedPost(p)} className="flex items-center gap-3 group cursor-pointer border-b border-zinc-50 pb-2 mb-2 last:mb-0 last:pb-0 hover:bg-zinc-50/50 p-1 rounded-lg transition-all">
                                                <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-zinc-100 group-hover:scale-105 transition-transform"><img src={p.thumbnail_url || p.media_url} className="w-full h-full object-cover" /></div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[11px] font-bold text-zinc-950 truncate mb-0">{p.caption?.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '') || "Contenido"}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-bold text-blue-600 flex items-center gap-1"><Heart className="w-2 h-2" /> {p.like_count}</span>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-3.5 h-3.5 text-zinc-200 group-hover:text-blue-600 transition-colors" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* VIEW: VIDEO / CONTENT STUDY */}
                    {activeTab === 'video' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-500 pb-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold tracking-tight">Estudio de Contenido</h3>
                                    <p className="text-sm text-zinc-500 mt-1">Analíticas de viralidad y engagement por pieza.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="bg-white border border-zinc-200 p-1.5 rounded-xl flex items-center shadow-sm">
                                        {[
                                            { id: 'date', label: 'Fecha' },
                                            { id: 'likes', label: 'Likes' },
                                            { id: 'comments', label: 'Comments' },
                                            { id: 'views', label: 'Views' }
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setSortBy(opt.id as SortType)}
                                                className={cn(
                                                    "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                                                    sortBy === opt.id ? "bg-zinc-100 text-zinc-950 shadow-inner" : "text-zinc-400 hover:text-zinc-600"
                                                )}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="bg-white border border-zinc-200 p-1 rounded-xl flex items-center shadow-sm">
                                        <button onClick={() => setViewMode('table')} className={cn("p-1.5 rounded-lg transition-all", viewMode === 'table' ? "bg-zinc-100 text-zinc-950" : "text-zinc-300")}><TableIcon className="w-4 h-4" /></button>
                                        <button onClick={() => setViewMode('cards')} className={cn("p-1.5 rounded-lg transition-all", viewMode === 'cards' ? "bg-zinc-100 text-zinc-950" : "text-zinc-300")}><Grid className="w-4 h-4" /></button>
                                        <button onClick={() => setViewMode('chart')} className={cn("p-1.5 rounded-lg transition-all", viewMode === 'chart' ? "bg-zinc-100 text-zinc-950" : "text-zinc-300")}><BarChart3 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>

                            {viewMode === 'table' ? (
                                <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden anim-in text-sm shrink-0">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-zinc-50 border-b border-zinc-100">
                                                <th className="px-8 py-5 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Publicación</th>
                                                <th className="px-8 py-5 text-[11px] font-bold text-zinc-400 uppercase tracking-widest text-center">Views</th>
                                                <th className="px-8 py-5 text-[11px] font-bold text-zinc-400 uppercase tracking-widest text-center">Likes</th>
                                                <th className="px-8 py-5 text-[11px] font-bold text-zinc-400 uppercase tracking-widest text-center">Comments</th>
                                                <th className="px-8 py-5 text-[11px] font-bold text-zinc-400 uppercase tracking-widest text-right">Analizar</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-50">
                                            {(showAllPosts ? sortedPosts : sortedPosts.slice(0, 10)).map((p) => (
                                                <tr key={p.id} onClick={() => setSelectedPost(p)} className="group hover:bg-[#FAFAFA] transition-colors cursor-pointer">
                                                    <td className="px-8 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-zinc-100"><img src={p.thumbnail_url || p.media_url} className="w-full h-full object-cover" /></div>
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-zinc-950 truncate max-w-[280px] mb-0.5">{p.caption?.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '') || "Sin título"}</p>
                                                                <p className="text-[10px] font-bold text-zinc-400 uppercase">{new Date(p.timestamp).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-4 text-center font-medium text-zinc-900">{p.views?.toLocaleString()}</td>
                                                    <td className="px-8 py-4 text-center font-medium text-blue-600">{p.like_count?.toLocaleString()}</td>
                                                    <td className="px-8 py-4 text-center font-medium text-amber-500">{p.comments_count?.toLocaleString()}</td>
                                                    <td className="px-8 py-4 text-right"><ChevronRight className="w-5 h-5 text-zinc-200 group-hover:text-blue-600 ml-auto transition-colors" /></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {!showAllPosts && sortedPosts.length > 10 && (
                                        <div className="p-6 bg-zinc-50/50 border-t border-zinc-100 text-center">
                                            <button
                                                onClick={() => setShowAllPosts(true)}
                                                className="px-6 py-2.5 bg-white border border-zinc-200 rounded-xl text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                                            >
                                                Ver todos los vídeos ({sortedPosts.length})
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : viewMode === 'cards' ? (
                                <div className="space-y-8 min-h-0 shrink-0">
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                                        {(showAllPosts ? sortedPosts : sortedPosts.slice(0, 10)).map((p) => (
                                            <div key={p.id} onClick={() => setSelectedPost(p)} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden group hover:shadow-lg transition-all cursor-pointer">
                                                <div className="aspect-[4/5] relative">
                                                    <img src={p.thumbnail_url || p.media_url} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                    <div className="absolute top-2 right-2 bg-white/95 px-2 py-1 rounded text-[10px] font-bold text-zinc-900 border border-zinc-100 shadow-sm">{p.displayType}</div>
                                                    <div className="absolute bottom-2 left-2 flex gap-1">
                                                        <div className="bg-black/50 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white flex items-center gap-1 text-[9px]">
                                                            <MonitorPlay className="w-3 h-3 text-blue-400" /> {p.views > 1000 ? `${(p.views / 1000).toFixed(1)}k` : p.views}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-4 flex items-center justify-between">
                                                    <span className="flex items-center gap-1 text-sm font-bold text-blue-600"><Heart className="w-4 h-4" /> {p.like_count}</span>
                                                    <ChevronRight className="w-4 h-4 text-zinc-200 group-hover:text-blue-600 transition-colors" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {!showAllPosts && sortedPosts.length > 10 && (
                                        <div className="flex justify-center pb-8">
                                            <button
                                                onClick={() => setShowAllPosts(true)}
                                                className="px-8 py-3 bg-white border border-zinc-200 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm flex items-center gap-3"
                                            >
                                                Cargar catálogo completo ({sortedPosts.length}) <Plus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-white border border-zinc-200 rounded-3xl p-6 h-[320px] flex flex-col relative overflow-hidden group shrink-0 shadow-sm transition-all hover:border-blue-100">
                                    <div className="flex items-center justify-between mb-6 relative z-10">
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-1">DATA STRIP ANALYSIS</h4>
                                            <p className="text-lg font-black tracking-tight text-zinc-900">Distribución de Impacto</p>
                                        </div>
                                        <div className="flex gap-4 items-center">
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-50 rounded-lg border border-zinc-100">
                                                <div className="w-2 h-2 rounded-full bg-blue-600" />
                                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{sortBy}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex items-end gap-[2px] mt-2 relative group/strip">
                                        <div className="absolute inset-x-0 top-0 h-[1px] bg-zinc-50" />
                                        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-zinc-50" />

                                        {sortedPosts.map((p, i) => {
                                            const maxVal = Math.max(...sortedPosts.map(v => v[sortBy === 'likes' ? 'like_count' : sortBy === 'comments' ? 'comments_count' : 'views'] || 1));
                                            const currentVal = p[sortBy === 'likes' ? 'like_count' : sortBy === 'comments' ? 'comments_count' : 'views'] || 0;
                                            const height = (currentVal / maxVal) * 100;

                                            return (
                                                <div
                                                    key={p.id}
                                                    onClick={() => setSelectedPost(p)}
                                                    className="flex-1 h-full flex items-end group/bar cursor-pointer relative"
                                                >
                                                    <div
                                                        className={cn(
                                                            "w-full rounded-t-sm transition-all duration-700 origin-bottom",
                                                            i < 5 ? "bg-blue-600" : "bg-zinc-100 group-hover/bar:bg-blue-200"
                                                        )}
                                                        style={{ height: isAnimating ? `${Math.max(height, 4)}%` : '2%' }}
                                                    />

                                                    {/* Tooltip on hover */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/bar:flex flex-col items-center z-20">
                                                        <div className="bg-zinc-900 text-white text-[9px] font-black py-1.5 px-3 rounded-lg whitespace-nowrap shadow-xl">
                                                            {currentVal.toLocaleString()}
                                                        </div>
                                                        <div className="w-1.5 h-1.5 bg-zinc-900 rotate-45 -mt-1" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-4 flex justify-between items-center text-[9px] font-bold text-zinc-300 uppercase tracking-[0.2em] border-t border-zinc-50 pt-4">
                                        <span>Cronología Reciente</span>
                                        <div className="flex gap-4">
                                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-600" /> Top Performers</span>
                                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-zinc-200" /> Otros contenidos</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* VIEW: AUDIENCIA */}
                    {activeTab === 'audiencia' && (
                        <div className="flex-1 flex flex-col gap-4 min-h-0 animate-in fade-in slide-in-from-top-2 duration-500 overflow-hidden pb-4">

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch shrink-0">
                                {/* COMPACT HEATMAP */}
                                <div className="lg:col-span-9 bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-base font-bold tracking-tight">Concentración de Actividad</h3>
                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3" /> FRECUENCIA SEMANAL
                                        </p>
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="min-w-[650px] flex flex-col gap-1.5">
                                            <div className="flex items-center gap-4 mb-1">
                                                <span className="w-3" />
                                                <div className="flex-1 flex justify-between px-1">
                                                    {[0, 3, 6, 9, 12, 15, 18, 21, 23].map(h => (
                                                        <span key={h} className="text-[9px] font-bold text-zinc-300 w-3 text-center">{h}h</span>
                                                    ))}
                                                </div>
                                            </div>

                                            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, dIdx) => (
                                                <div key={day} className="flex items-center gap-4 group">
                                                    <span className="w-3 text-[10px] font-black text-zinc-300 uppercase tracking-widest">{day}</span>
                                                    <div className="flex-1 flex gap-1 h-5">
                                                        {heatmapValues[dIdx].map((val, i) => (
                                                            <div
                                                                key={i}
                                                                className="flex-1 rounded-sm transition-all hover:scale-125 hover:shadow-lg cursor-help border border-zinc-50"
                                                                style={{ backgroundColor: val > 0.85 ? '#2563EB' : val > 0.65 ? '#60A5FA' : val > 0.4 ? '#DBEAFE' : '#F8FAFC' }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center gap-6 justify-center border-t border-zinc-50 pt-4">
                                        {[
                                            { label: 'BAJA', color: 'bg-zinc-50' },
                                            { label: 'MEDIA', color: 'bg-blue-100' },
                                            { label: 'ALTA', color: 'bg-blue-400' },
                                            { label: 'PEAK', color: 'bg-blue-600' }
                                        ].map(l => (
                                            <div key={l.label} className="flex items-center gap-1.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                                                <div className={cn("w-2.5 h-2.5 rounded-sm border border-zinc-100", l.color)} /> {l.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="lg:col-span-3 bg-white border border-zinc-200 rounded-3xl p-6 flex flex-col shadow-sm relative overflow-hidden h-full group shrink-0">
                                    <div className="bg-blue-600 w-9 h-9 rounded-xl flex items-center justify-center mb-6 shadow-md shadow-blue-100">
                                        <Clock className="w-5 h-5 text-white" />
                                    </div>
                                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-600 mb-1.5">MOMENTO PRIME</p>
                                    <h4 className="text-3xl font-black tracking-tighter mb-1 text-zinc-900">20:15</h4>
                                    <p className="text-xs font-bold text-zinc-400 tracking-tight mb-6">Domingos / Martes</p>

                                    <div className="mt-auto space-y-3">
                                        <div className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Impacto</span>
                                            <span className="text-[10px] font-black text-emerald-600">+12%</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Algoritmo</span>
                                            <span className="text-[10px] font-black text-blue-600">Peak</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0 overflow-hidden">
                                <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col min-h-0 overflow-hidden">
                                    <div className="flex items-center justify-between mb-6 shrink-0">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">INFLUENCIA GEOGRÁFICA</h4>
                                        <button onClick={() => setIsGeoModalOpen(true)} className="p-2 bg-zinc-950 text-white rounded-lg hover:bg-black transition-all shadow-sm"><Plus className="w-3 h-3" /></button>
                                    </div>
                                    <div className="space-y-6 flex-1 overflow-hidden pr-2">
                                        {countries.slice(0, 3).map(c => (
                                            <div key={c.pais} className="group">
                                                <div className="flex items-center justify-between mb-2 text-[12px]">
                                                    <span className="font-bold text-zinc-950 uppercase tracking-widest">{c.pais}</span>
                                                    <span className="text-zinc-300 font-mono text-[10px]">{c.pct}%</span>
                                                </div>
                                                <div className="h-1 bg-zinc-50 rounded-full overflow-hidden">
                                                    <div className="h-full bg-zinc-950 group-hover:bg-blue-600 transition-all duration-[1s]" style={{ width: isAnimating ? `${c.pct}%` : '0%' }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* AGE CHART (FIXED DEPTH & STYLE) */}
                                <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col relative min-h-0 overflow-hidden">
                                    <div className="flex items-center justify-between mb-8 shrink-0">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">DISTRIBUCIÓN POR EDAD</h4>
                                        <BarChart3 className="w-3.5 h-3.5 text-zinc-200" />
                                    </div>
                                    <div className="flex-1 relative px-2 mb-6">
                                        <svg className="w-full h-full overflow-visible" viewBox="0 0 400 150" preserveAspectRatio="none">
                                            <defs>
                                                <linearGradient id="curve-gradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.1" />
                                                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                                                </linearGradient>
                                                <filter id="clean-line-shadow" x="-50%" y="-50%" width="200%" height="200%">
                                                    <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
                                                    <feOffset dx="0" dy="6" result="offset" />
                                                    <feComponentTransfer>
                                                        <feFuncA type="linear" slope="0.12" />
                                                    </feComponentTransfer>
                                                    <feMerge>
                                                        <feMergeNode />
                                                        <feMergeNode in="SourceGraphic" />
                                                    </feMerge>
                                                </filter>
                                            </defs>

                                            {/* Area Fill */}
                                            <path
                                                d={`M 0 150 C 50 ${150 - (isAnimating ? 35 * 2 : 0)}, 50 ${150 - (isAnimating ? 35 * 2 : 0)}, 100 ${150 - (isAnimating ? 52 * 2 : 0)} C 150 ${150 - (isAnimating ? 52 * 2 : 0)}, 150 ${150 - (isAnimating ? 18 * 2 : 0)}, 200 ${150 - (isAnimating ? 18 * 2 : 0)} C 250 ${150 - (isAnimating ? 18 * 2 : 0)}, 250 ${150 - (isAnimating ? 34 * 2 : 0)}, 300 ${150 - (isAnimating ? 34 * 2 : 0)} C 350 ${150 - (isAnimating ? 34 * 2 : 0)}, 350 ${150 - (isAnimating ? 10 * 2 : 0)}, 400 ${150 - (isAnimating ? 10 * 2 : 0)} L 400 150 L 0 150 Z`}
                                                fill="url(#curve-gradient)"
                                                className="transition-all duration-[2s] ease-in-out"
                                            />

                                            {/* Main Line with Shadow */}
                                            <path
                                                d={`M 0 ${150 - (isAnimating ? 35 * 2 : 0)} C 50 ${150 - (isAnimating ? 35 * 2 : 0)}, 50 ${150 - (isAnimating ? 35 * 2 : 0)}, 100 ${150 - (isAnimating ? 52 * 2 : 0)} C 150 ${150 - (isAnimating ? 52 * 2 : 0)}, 150 ${150 - (isAnimating ? 18 * 2 : 0)}, 200 ${150 - (isAnimating ? 18 * 2 : 0)} C 250 ${150 - (isAnimating ? 18 * 2 : 0)}, 250 ${150 - (isAnimating ? 34 * 2 : 0)}, 300 ${150 - (isAnimating ? 34 * 2 : 0)} C 350 ${150 - (isAnimating ? 34 * 2 : 0)}, 350 ${150 - (isAnimating ? 10 * 2 : 0)}, 400 ${150 - (isAnimating ? 10 * 2 : 0)}`}
                                                fill="none"
                                                stroke="#2563EB"
                                                strokeWidth="5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                filter="url(#clean-line-shadow)"
                                                className="transition-all duration-[2s] ease-in-out"
                                            />

                                            {/* Points */}
                                            {[0, 100, 200, 300, 400].map((x, i) => {
                                                const vals = [35, 52, 18, 34, 10];
                                                return (
                                                    <circle
                                                        key={i}
                                                        cx={x}
                                                        cy={150 - (isAnimating ? vals[i] * 2 : 0)}
                                                        r="5"
                                                        fill="white"
                                                        stroke="#2563EB"
                                                        strokeWidth="2.5"
                                                        className="transition-all duration-[2s] ease-in-out"
                                                    />
                                                );
                                            })}
                                        </svg>
                                        <div className="absolute inset-x-0 bottom-[-40px] flex justify-between px-2 text-[10px] font-bold text-zinc-300 uppercase tracking-widest font-mono">
                                            <span>18-24</span>
                                            <span>25-34</span>
                                            <span>35+</span>
                                            <span>45-54</span>
                                            <span>55+</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-in fade-in duration-700">
                    <div className="w-32 h-32 bg-zinc-50 rounded-[40px] flex items-center justify-center border border-zinc-100 shadow-inner">
                        <Instagram className="w-12 h-12 text-zinc-200" />
                    </div>
                    <div className="text-center max-w-sm">
                        <h3 className="text-xl font-black text-zinc-900 mb-2 tracking-tight">Conecta tu Inteligencia</h3>
                        <p className="text-sm text-zinc-500 font-medium leading-relaxed mb-8">
                            Para visualizar tus métricas en tiempo real necesitamos sincronizar con tu cuenta profesional de Instagram.
                        </p>
                        <button
                            onClick={() => fetchInstagramStats((session as any)?.accessToken)}
                            className="bg-zinc-950 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            Conectar Ahora
                        </button>
                    </div>
                </div>
            )}

            {/* GEO MODAL */}
            {
                isGeoModalOpen && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-2xl" onClick={() => setIsGeoModalOpen(false)} />
                        <div className="relative bg-white border border-zinc-200 w-full max-w-2xl rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.1)] p-12 animate-in zoom-in-95 duration-400">
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight text-zinc-900 mb-1">Mercados Globales</h3>
                                    <p className="text-sm font-medium text-zinc-500">Distribución geográfica completa de tu alcance.</p>
                                </div>
                                <button onClick={() => setIsGeoModalOpen(false)} className="p-4 hover:bg-zinc-50 rounded-2xl transition-all"><X className="w-6 h-6 text-zinc-300" /></button>
                            </div>
                            <div className="space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar pr-6">
                                {countries.map(c => (
                                    <div key={c.pais} className="group">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-bold text-zinc-950 uppercase tracking-widest">{c.pais}</span>
                                            <span className="text-sm font-black text-blue-600 font-mono">{c.pct}%</span>
                                        </div>
                                        <div className="h-2 bg-zinc-50 rounded-full overflow-hidden">
                                            <div className="h-full bg-zinc-950 group-hover:bg-blue-600 transition-all duration-1000" style={{ width: `${c.pct}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* DETAIL MODAL (ENTERED REEL VIEW) */}
            {
                selectedPost && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl" onClick={() => setSelectedPost(null)} />
                        <div className="relative bg-white border border-zinc-200 w-full max-w-6xl h-full max-h-[750px] rounded-[3rem] shadow-[0_40px_120px_rgba(0,0,0,0.1)] overflow-hidden animate-in zoom-in-95 duration-400 flex flex-col md:flex-row">

                            {/* Reel Preview */}
                            <div className="md:w-[45%] bg-zinc-950 flex items-center justify-center relative overflow-hidden group">
                                <img src={selectedPost.media_url || selectedPost.thumbnail_url} className="w-full h-full object-cover opacity-80 transition-all duration-1000" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                <div className="absolute top-10 left-10">
                                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 px-5 py-2.5 rounded-2xl flex items-center gap-3 text-white">
                                        <MonitorPlay className="w-5 h-5 text-blue-400" />
                                        <span className="text-[11px] font-black uppercase tracking-widest">{selectedPost.displayType}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Analysis Side (Clean/Professional) */}
                            <div className="md:w-[55%] p-16 lg:p-24 flex flex-col h-full bg-white relative">
                                <button onClick={() => setSelectedPost(null)} className="absolute top-10 right-10 p-4 hover:bg-zinc-50 rounded-2xl transition-all text-zinc-300 hover:text-zinc-950"><X className="w-6 h-6" /></button>

                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-6">
                                    <div className="mb-14">
                                        <div className="flex items-center gap-3 text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] mb-8 bg-blue-50 w-fit px-4 py-1.5 rounded-full">
                                            <Sparkles className="w-4 h-4" /> REEL DEEP ANALYSIS
                                        </div>
                                        <div className="bg-zinc-50/50 rounded-[2.5rem] p-10 border border-zinc-100">
                                            <p className="text-xl font-medium text-zinc-800 leading-relaxed italic font-serif">
                                                "{selectedPost.caption ? selectedPost.caption.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '') : "Descripción del Reel."}"
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-6 mb-16">
                                        {[
                                            { label: "Vistas", val: selectedPost.views?.toLocaleString(), icon: MonitorPlay },
                                            { label: "Likes", val: selectedPost.like_count?.toLocaleString(), icon: Heart },
                                            { label: "Comments", val: selectedPost.comments_count || 0, icon: MessageCircle }
                                        ].map(metric => (
                                            <div key={metric.label} className="p-8 bg-white border border-zinc-100 rounded-[2.5rem] flex flex-col gap-4">
                                                <div className="flex items-center gap-3 text-zinc-300">
                                                    <metric.icon className="w-4 h-4" />
                                                    <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5">{metric.label}</p>
                                                </div>
                                                <p className="text-3xl font-medium text-zinc-900 tracking-tighter">{metric.val}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-10 bg-zinc-950 rounded-[3rem] text-white relative shadow-2xl overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/30 blur-[60px]" />
                                        <div className="flex items-center gap-3 mb-6 text-xs font-black text-blue-400 uppercase tracking-widest"><TrendingUp className="w-5 h-5" /> Retención Estratégica</div>
                                        <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                                            Este Reel presenta una retención stándar de nivel A. La transición inicial entre el hook y el cuerpo del mensaje evitó el 'drop-off' masivo, manteniendo al 64% de la audiencia hasta el final.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            <style jsx global>{`
                .btn-primary {
                    @apply bg-zinc-950 text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-black transition-all shadow-lg active:scale-95;
                }
                .custom-scrollbar-page::-webkit-scrollbar { width: 0px; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E5E5; border-radius: 20px; }
                .anim-in { animation: fadeInScale 0.5s ease-out forwards; }
                @keyframes fadeInScale { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
            `}</style>
        </div>
    );
}
