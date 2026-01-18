"use client";

import { useState, useEffect } from "react";
import { Plus, Image as ImageIcon, Link2, MoreHorizontal, Trash2, Loader2, ExternalLink, X, Check, Layout as LayoutIcon } from "lucide-react";
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
    image_url?: string;
}

export default function InspirationPage() {
    const { session } = useAuth();
    const supabase = createClient();

    // Data State
    const [items, setItems] = useState<Inspiration[]>([]);
    const [collections, setCollections] = useState<{ id: string, title: string }[]>([]);

    // UI State
    const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null); // null = 'All'
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [newUrl, setNewUrl] = useState("");
    const [isCreatingCollection, setIsCreatingCollection] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState("");

    useEffect(() => {
        if (session?.user?.id) {
            fetchData();
        }
    }, [session]);

    useEffect(() => {
        if (session?.user?.id) {
            fetchInspiration();
        }
    }, [activeCollectionId]);

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchCollections(), fetchInspiration()]);
        setLoading(false);
    };

    const fetchCollections = async () => {
        const { data } = await supabase
            .from('collections')
            .select('*')
            .eq('user_id', session?.user?.id)
            .order('created_at', { ascending: true });
        if (data) setCollections(data);
    };

    const fetchInspiration = async () => {
        setLoading(true);
        let query = supabase
            .from('inspiration')
            .select('*')
            .eq('user_id', session?.user?.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (activeCollectionId) {
            query = query.eq('collection_id', activeCollectionId);
        }

        const { data } = await query;
        if (data) setItems(data);
        setLoading(false);
    };

    const handleCreateCollection = async () => {
        if (!newCollectionName.trim() || !session?.user?.id) return;
        const { data } = await supabase.from('collections').insert({
            user_id: session.user.id,
            title: newCollectionName
        }).select().single();

        if (data) {
            setCollections([...collections, data]);
            setNewCollectionName("");
            setIsCreatingCollection(false);
            setActiveCollectionId(data.id);
        }
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase
            .from('inspiration')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);
        if (!error) setItems(items.filter(item => item.id !== id));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !session?.user?.id) return;

        setUploading(true);
        try {
            const path = `${session.user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
            const { data, error } = await supabase.storage.from('references').upload(path, file);

            if (data) {
                const { data: { publicUrl } } = supabase.storage.from('references').getPublicUrl(path);
                const { data: newItem } = await supabase.from('inspiration').insert({
                    user_id: session.user.id,
                    title: file.name,
                    image_url: publicUrl,
                    type: 'image',
                    source: 'Upload',
                    collection_id: activeCollectionId
                }).select().single();

                if (newItem) setItems([newItem, ...items]);
            }
        } finally {
            setUploading(false);
        }
    };

    const handleSaveUrl = async () => {
        if (!newUrl || !session?.user?.id) return;
        setUploading(true);
        try {
            const { data: newItem } = await supabase.from('inspiration').insert({
                user_id: session.user.id,
                title: newUrl,
                url: newUrl,
                type: 'link',
                source: 'External',
                collection_id: activeCollectionId
            }).select().single();

            if (newItem) {
                setItems([newItem, ...items]);
                setNewUrl("");
                setShowUrlInput(false);
            }
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto h-[calc(100vh-1rem)] flex flex-col pt-6 pb-4 px-6 gap-6">
            <PageHeader
                title="Banco de Inspiración"
                breadcrumb={[{ label: 'Zona Investigar', href: '#' }, { label: 'Inspiración' }]}
            />

            <div className="flex-1 flex gap-8 overflow-hidden">
                {/* Collections Sidebar */}
                <div className="w-64 shrink-0 flex flex-col gap-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Colecciones</h3>
                        <button onClick={() => setIsCreatingCollection(true)} className="p-1 hover:bg-zinc-100 rounded-md transition-all active:scale-95 text-zinc-400 hover:text-blue-600">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-1">
                        <button
                            onClick={() => setActiveCollectionId(null)}
                            className={cn(
                                "w-full text-left px-3 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-3",
                                activeCollectionId === null ? "bg-zinc-900 text-white shadow-md" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                            )}
                        >
                            <LayoutIcon className="w-4 h-4" /> Todos
                        </button>
                        {collections.map(col => (
                            <button
                                key={col.id}
                                onClick={() => setActiveCollectionId(col.id)}
                                className={cn(
                                    "w-full text-left px-3 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-3 group relative",
                                    activeCollectionId === col.id ? "bg-white text-blue-600 shadow-sm border border-blue-100" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                                )}
                            >
                                <div className={cn("w-1.5 h-1.5 rounded-full", activeCollectionId === col.id ? "bg-blue-500" : "bg-zinc-300")} />
                                <span className="truncate">{col.title}</span>
                            </button>
                        ))}
                    </div>

                    {isCreatingCollection && (
                        <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-lg animate-in fade-in slide-in-from-top-2">
                            <input
                                className="w-full text-sm font-medium border-b border-zinc-200 pb-1 mb-2 focus:outline-none focus:border-blue-500 placeholder:text-zinc-300"
                                placeholder="Nombre lista..."
                                value={newCollectionName}
                                onChange={(e) => setNewCollectionName(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setIsCreatingCollection(false)} className="px-2 py-1 text-xs font-bold text-zinc-400 hover:text-zinc-600">Cancelar</button>
                                <button onClick={handleCreateCollection} className="px-2 py-1 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-black">Crear</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0 bg-white border border-zinc-100 rounded-[2rem] shadow-sm relative overflow-hidden">
                    {/* Toolbar */}
                    <div className="h-16 border-b border-zinc-50 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-bold text-zinc-900">
                                {activeCollectionId ? collections.find(c => c.id === activeCollectionId)?.title : 'Todas las Referencias'}
                            </h2>
                            <span className="bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full text-xs font-bold">{items.length}</span>
                        </div>

                        <div className="flex items-center gap-3">
                            {showUrlInput ? (
                                <div className="flex items-center gap-2 animate-in slide-in-from-right-2 bg-zinc-50 p-1 rounded-xl border border-zinc-100">
                                    <input
                                        className="px-3 py-1.5 bg-transparent text-sm focus:outline-none w-64 placeholder:text-zinc-400 font-medium"
                                        placeholder="Pegar enlace..."
                                        value={newUrl}
                                        onChange={(e) => setNewUrl(e.target.value)}
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveUrl()}
                                    />
                                    <button onClick={handleSaveUrl} disabled={uploading} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50">
                                        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                    </button>
                                    <button onClick={() => setShowUrlInput(false)} className="p-1.5 text-zinc-400 hover:text-zinc-600">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <button onClick={() => setShowUrlInput(true)} className="flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-xl text-xs font-bold hover:bg-zinc-50 hover:border-zinc-300 transition-all text-zinc-600 active:scale-95">
                                    <Link2 className="w-4 h-4" />
                                    Guardar URL
                                </button>
                            )}

                            <div className="relative">
                                <button onClick={() => document.getElementById('inspo-upload')?.click()} className="bg-zinc-900 text-white flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold hover:bg-black transition-all shadow-lg shadow-zinc-900/10 active:scale-95">
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    Subir Imagen
                                </button>
                                <input
                                    type="file"
                                    id="inspo-upload"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-400">
                                <Loader2 className="w-8 h-8 animate-spin" />
                            </div>
                        ) : items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-300">
                                <ImageIcon className="w-16 h-16 opacity-20" />
                                <p className="text-sm font-bold uppercase tracking-widest opacity-50">Colección vacía</p>
                            </div>
                        ) : (
                            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6 animate-in fade-in duration-500">
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
                </div>
            </div>
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
                    {(item.url || item.image_url) && (
                        <a
                            href={item.url || item.image_url}
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

            {(item.image_url) && (
                <div className="w-full rounded-lg mb-4 group-hover:scale-[1.02] transition-transform duration-500 overflow-hidden border border-zinc-100">
                    <img src={item.image_url} alt={item.title} className="w-full h-auto object-cover" />
                </div>
            )}

            <h3 className="font-bold text-base text-zinc-900 mb-1 leading-tight group-hover:text-blue-600 transition-colors break-words">{item.title}</h3>
            {item.source && <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider mt-2">{item.source}</p>}
        </div>
    );
}
