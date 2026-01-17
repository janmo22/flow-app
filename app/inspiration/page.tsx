"use client";

import { useState, useEffect } from "react";
import { Plus, Image as ImageIcon, Link2, MoreHorizontal, Trash2, Loader2, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface Inspiration {
    id: string;
    user_id: string;
    url?: string;
    title: string;
    source?: string;
    type: 'image' | 'video' | 'link' | 'text';
    created_at: string;
    deleted_at: string | null;
}

export default function InspirationPage() {
    const { session } = useAuth();
    const supabase = createClient();
    const [items, setItems] = useState<Inspiration[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user?.id) {
            fetchInspiration();
        }
    }, [session]);

    const fetchInspiration = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('inspiration')
            .select('*')
            .eq('user_id', session?.user?.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (data) {
            setItems(data);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase
            .from('inspiration')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (!error) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto pt-10 pb-24 px-8">
            <PageHeader
                title="Banco de Inspiración"
                breadcrumb={[
                    { label: 'Zona Investigar', href: '#' },
                    { label: 'Inspiración' }
                ]}
                action={
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2.5 border border-zinc-200 rounded-full text-sm font-bold hover:bg-zinc-50 hover:border-zinc-300 transition-all text-zinc-600">
                            <Link2 className="w-4 h-4" />
                            Guardar URL
                        </button>
                        <button className="bg-zinc-900 text-white flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold hover:bg-black transition-all shadow-lg shadow-zinc-200">
                            <Plus className="w-4 h-4" />
                            Subir Imagen
                        </button>
                    </div>
                }
            />

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3 text-zinc-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-sm font-medium">Cargando inspiración...</p>
                </div>
            ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4 text-zinc-300">
                    <ImageIcon className="w-16 h-16 opacity-20" />
                    <p className="text-lg font-bold uppercase tracking-widest opacity-50">No hay inspiración guardada</p>
                </div>
            ) : (
                <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6 animate-enter">
                    {items.map((item) => (
                        <InspoCard
                            key={item.id}
                            item={item}
                            onDelete={() => handleDelete(item.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function InspoCard({ item, onDelete }: { item: Inspiration; onDelete: () => void }) {
    return (
        <div className="break-inside-avoid bg-white border border-zinc-200 rounded-xl p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative">
            <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 border border-zinc-200 px-2 py-1 rounded bg-zinc-50 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                    {item.type || 'Referencia'}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.url && (
                        <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {item.type === 'image' && item.url && (
                <div className="w-full rounded-lg mb-4 group-hover:scale-[1.02] transition-transform duration-500 overflow-hidden border border-zinc-100">
                    <img src={item.url} alt={item.title} className="w-full h-auto object-cover" />
                </div>
            )}

            <h3 className="font-bold text-lg text-zinc-900 mb-1 leading-tight group-hover:text-blue-600 transition-colors">{item.title}</h3>
            {item.source && <p className="text-sm text-zinc-500 leading-relaxed line-clamp-3">{item.source}</p>}
        </div>
    );
}
