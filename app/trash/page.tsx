"use client";

import { useState, useEffect } from "react";
import {
    Trash2, RotateCcw, FileText, ImageIcon, Users,
    Calendar as CalendarIcon, Layout, Loader2, AlertCircle
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type TrashItemType = 'script' | 'inspiration' | 'competitor' | 'format' | 'event';

interface TrashItem {
    id: string;
    type: TrashItemType;
    title: string;
    deleted_at: string;
    original_data: any;
}

export default function TrashPage() {
    const { session } = useAuth();
    const supabase = createClient();
    const [items, setItems] = useState<TrashItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (session?.user?.id) {
            fetchAllTrash();
        }
    }, [session]);

    const fetchAllTrash = async () => {
        setLoading(true);
        try {
            const [scripts, inspiration, competitors, formats, events] = await Promise.all([
                supabase.from('scripts').select('*').eq('user_id', session?.user?.id).not('deleted_at', 'is', null),
                supabase.from('inspiration').select('*').eq('user_id', session?.user?.id).not('deleted_at', 'is', null),
                supabase.from('competitors').select('*').eq('user_id', session?.user?.id).not('deleted_at', 'is', null),
                supabase.from('formats').select('*').eq('user_id', session?.user?.id).not('deleted_at', 'is', null),
                supabase.from('calendar_events').select('*').eq('user_id', session?.user?.id).not('deleted_at', 'is', null),
            ]);

            const allItems: TrashItem[] = [
                ...(scripts.data || []).map(s => ({ id: s.id, type: 'script' as const, title: s.title, deleted_at: s.deleted_at, original_data: s })),
                ...(inspiration.data || []).map(i => ({ id: i.id, type: 'inspiration' as const, title: i.title, deleted_at: i.deleted_at, original_data: i })),
                ...(competitors.data || []).map(c => ({ id: c.id, type: 'competitor' as const, title: c.name || c.title, deleted_at: c.deleted_at, original_data: c })),
                ...(formats.data || []).map(f => ({ id: f.id, type: 'format' as const, title: f.name || f.title, deleted_at: f.deleted_at, original_data: f })),
                ...(events.data || []).map(e => ({ id: e.id, type: 'event' as const, title: e.title, deleted_at: e.deleted_at, original_data: e })),
            ];

            // Sort by deletion date
            allItems.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());
            setItems(allItems);
        } catch (err) {
            console.error("Error fetching trash:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (item: TrashItem) => {
        setActionLoading(item.id);
        const table =
            item.type === 'script' ? 'scripts' :
                item.type === 'inspiration' ? 'inspiration' :
                    item.type === 'competitor' ? 'competitors' :
                        item.type === 'format' ? 'formats' :
                            'calendar_events';

        const { error } = await supabase
            .from(table)
            .update({ deleted_at: null })
            .eq('id', item.id);

        if (!error) {
            setItems(items.filter(i => i.id !== item.id));
        }
        setActionLoading(null);
    };

    const handlePermanentDelete = async (item: TrashItem) => {
        if (!confirm("¿Estás seguro de que quieres eliminar esto permanentemente? Esta acción no se puede deshacer.")) return;

        setActionLoading(item.id);
        const table =
            item.type === 'script' ? 'scripts' :
                item.type === 'inspiration' ? 'inspiration' :
                    item.type === 'competitor' ? 'competitors' :
                        item.type === 'format' ? 'formats' :
                            'calendar_events';

        const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', item.id);

        if (!error) {
            setItems(items.filter(i => i.id !== item.id));
        }
        setActionLoading(null);
    };

    const getIcon = (type: TrashItemType) => {
        switch (type) {
            case 'script': return <FileText className="w-4 h-4" />;
            case 'inspiration': return <ImageIcon className="w-4 h-4" />;
            case 'competitor': return <Users className="w-4 h-4" />;
            case 'format': return <Layout className="w-4 h-4" />;
            case 'event': return <CalendarIcon className="w-4 h-4" />;
        }
    };

    const getTypeColor = (type: TrashItemType) => {
        switch (type) {
            case 'script': return "bg-blue-50 text-blue-600 border-blue-100";
            case 'inspiration': return "bg-purple-50 text-purple-600 border-purple-100";
            case 'competitor': return "bg-emerald-50 text-emerald-600 border-emerald-100";
            case 'format': return "bg-orange-50 text-orange-600 border-orange-100";
            case 'event': return "bg-pink-50 text-pink-600 border-pink-100";
        }
    };

    const getTypeName = (type: TrashItemType) => {
        switch (type) {
            case 'script': return "Guion";
            case 'inspiration': return "Inspiración";
            case 'competitor': return "Competencia";
            case 'format': return "Formato";
            case 'event': return "Calendario";
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto pt-10 pb-24 px-8">
            <PageHeader
                title="Papelera"
                breadcrumb={[{ label: 'Configuración', href: '#' }, { label: 'Papelera' }]}
            />

            <div className="mt-8 bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/30">
                    <div>
                        <h2 className="text-lg font-bold text-zinc-900">Elementos Eliminados</h2>
                        <p className="text-sm text-zinc-500">Aquí puedes restaurar o eliminar permanentemente tus archivos</p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-red-500 uppercase tracking-widest bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                        <AlertCircle className="w-3 h-3" />
                        <span>Los elementos se eliminan tras 30 días (próximamente)</span>
                    </div>
                </div>

                <div className="divide-y divide-zinc-100">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4 text-zinc-400">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <p className="text-sm font-medium">Escaneando papelera...</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4 text-zinc-300">
                            <div className="w-16 h-16 rounded-3xl bg-zinc-50 flex items-center justify-center">
                                <Trash2 className="w-8 h-8 opacity-20" />
                            </div>
                            <p className="text-lg font-bold uppercase tracking-widest opacity-50">La papelera está vacía</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={`${item.type}-${item.id}`} className="px-8 py-5 flex items-center justify-between hover:bg-zinc-50 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border transition-all shadow-sm", getTypeColor(item.type))}>
                                        {getIcon(item.type)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h3 className="text-sm font-bold text-zinc-900">{item.title || 'Sin Título'}</h3>
                                            <span className={cn("text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded border", getTypeColor(item.type))}>
                                                {getTypeName(item.type)}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-medium text-zinc-400 capitalize">
                                            Eliminado el {new Date(item.deleted_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleRestore(item)}
                                        disabled={!!actionLoading}
                                        className="flex items-center gap-1.5 px-4 py-2 text-zinc-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-bold transition-all border border-transparent hover:border-blue-100"
                                    >
                                        {actionLoading === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                                        <span>Restaurar</span>
                                    </button>
                                    <button
                                        onClick={() => handlePermanentDelete(item)}
                                        disabled={!!actionLoading}
                                        className="flex items-center gap-1.5 px-4 py-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-all border border-transparent hover:border-red-100"
                                    >
                                        {actionLoading === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                        <span>Eliminar</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
