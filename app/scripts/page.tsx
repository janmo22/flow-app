"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
    Plus, FileText, Trash2,
    Bold, Italic, Underline, Highlighter,
    List, ListOrdered, Quote, Image as ImageIcon, X,
    Layers, Lightbulb, PenTool, Calendar as CalendarIcon,
    ChevronLeft, ChevronRight, Check, Clock, Globe, Layout,
    Loader2, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase";
import { debounce } from "lodash";

// --- Types ---
type ScriptType = 'video' | 'carousel';

interface Slide {
    id: string;
    content: string;
    position: number;
}

interface Script {
    id: string;
    title: string;
    type: ScriptType;
    status: 'draft' | 'scheduled' | 'published';
    scheduled_date?: string;
    updated_at: string;
    hook: string;
    body: string;
    slides: Slide[];
    strategy_message: string;
    strategy_bullets: string;
    strategy_format?: string;
}

interface Inspiration {
    id: string;
    title: string;
    url?: string;
    image_url?: string;
    type: 'video' | 'image' | 'text' | 'link';
    category?: string;
    created_at: string;
}

export default function ScriptsPage() {
    const { session } = useAuth();
    const supabase = createClient();
    const [activeScript, setActiveScript] = useState<Script | null>(null);
    const [scripts, setScripts] = useState<Script[]>([]);
    const [inspirationItems, setInspirationItems] = useState<Inspiration[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingInspo, setLoadingInspo] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
    const [showGlobalReferences, setShowGlobalReferences] = useState(false);
    const [viewMode, setViewMode] = useState<'content' | 'strategy'>('content');
    const [isCreating, setIsCreating] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    // Fetch scripts on mount
    useEffect(() => {
        if (session?.user?.id) {
            fetchScripts();
            fetchInspiration();
        }
    }, [session]);

    const fetchScripts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('scripts')
            .select(`
                *,
                slides (*)
            `)
            .eq('user_id', session?.user?.id)
            .is('deleted_at', null)
            .order('updated_at', { ascending: false });

        if (data) {
            setScripts(data);
            if (data.length > 0 && !activeScript) {
                const firstScript = {
                    ...data[0],
                    slides: (data[0].slides || []).sort((a: any, b: any) => a.position - b.position)
                };
                setActiveScript(firstScript);
            }
        }
        setLoading(false);
    };

    const fetchInspiration = async () => {
        setLoadingInspo(true);
        const { data } = await supabase
            .from('inspiration')
            .select('*')
            .eq('user_id', session?.user?.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (data) setInspirationItems(data);
        setLoadingInspo(false);
    };

    // Auto-save logic
    const debouncedSave = useCallback(
        debounce(async (script: Script) => {
            setSaveStatus('saving');
            const { error } = await supabase
                .from('scripts')
                .update({
                    title: script.title,
                    status: script.status,
                    hook: script.hook,
                    body: script.body,
                    strategy_message: script.strategy_message,
                    strategy_bullets: script.strategy_bullets,
                    strategy_format: script.strategy_format,
                    scheduled_date: script.scheduled_date,
                    updated_at: new Date().toISOString()
                })
                .eq('id', script.id);

            if (script.type === 'carousel') {
                for (const slide of script.slides) {
                    await supabase
                        .from('slides')
                        .upsert({
                            id: slide.id,
                            script_id: script.id,
                            content: slide.content,
                            position: slide.position
                        });
                }
            }

            if (error) setSaveStatus('error');
            else setSaveStatus('saved');
        }, 2000),
        [session]
    );

    const updateActiveScript = (updates: Partial<Script>) => {
        if (!activeScript) return;
        const updated = { ...activeScript, ...updates };
        setActiveScript(updated);
        setScripts(scripts.map(s => s.id === updated.id ? updated : s));
        debouncedSave(updated);
    };

    const handleCreateNew = async (type: ScriptType) => {
        if (!session?.user?.id) return;

        const { data: newScriptData, error } = await supabase
            .from('scripts')
            .insert({
                user_id: session.user.id,
                title: type === 'video' ? "Nuevo Vídeo" : "Nuevo Carrusel",
                type: type,
                status: "draft",
                hook: "",
                body: "<div><br></div>",
                strategy_message: "",
                strategy_bullets: ""
            })
            .select()
            .single();

        if (newScriptData) {
            let slides: Slide[] = [];
            if (type === 'carousel') {
                const { data: slideData } = await supabase
                    .from('slides')
                    .insert({
                        script_id: newScriptData.id,
                        content: "Slide 1",
                        position: 0
                    })
                    .select()
                    .single();
                if (slideData) slides = [slideData];
            }

            const fullScript = { ...newScriptData, slides };
            setScripts([fullScript, ...scripts]);
            setActiveScript(fullScript);
            setViewMode('content');
            setIsCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase
            .from('scripts')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (!error) {
            const remaining = scripts.filter(s => s.id !== id);
            setScripts(remaining);
            if (activeScript?.id === id) {
                setActiveScript(remaining.length > 0 ? remaining[0] : null);
            }
        }
    };

    const execCmd = (command: string, value: string | undefined = undefined) => {
        document.execCommand('styleWithCSS', false, 'false');
        document.execCommand(command, false, value);
    };

    return (
        <div className="max-w-[1600px] mx-auto h-[calc(100vh-2rem)] flex flex-col pt-8 pb-6 px-6 font-sans text-zinc-900 relative">

            <div className="mb-6 flex items-end justify-between">
                <PageHeader
                    title="Studio"
                    breadcrumb={[
                        { label: 'Zona Creador', href: '#' },
                        { label: activeScript?.type === 'video' ? 'Editor de Vídeo' : activeScript?.type === 'carousel' ? 'Editor de Carrusel' : 'Editor' }
                    ]}
                />

                <button
                    onClick={() => setShowScheduleModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 transition-all group mb-1"
                >
                    <Plus className="w-4 h-4 text-blue-100 group-hover:text-white transition-colors" />
                    <span>Calendarizar</span>
                </button>
            </div>

            <div className="flex flex-1 gap-8 animate-in fade-in duration-500 overflow-hidden">
                {/* --- Sidebar --- */}
                <div className="w-72 flex flex-col h-full shrink-0 pr-6 border-r border-zinc-200/50 mr-2">
                    <div className="flex items-center justify-between mb-6 pl-2 pr-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-zinc-900">Mis Proyectos</h2>
                            {saveStatus === 'saving' && <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />}
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setIsCreating(!isCreating)}
                                className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                            {isCreating && (
                                <div className="absolute top-10 right-0 w-40 bg-white border border-zinc-100 shadow-xl rounded-xl overflow-hidden z-50 p-1">
                                    <button onClick={() => handleCreateNew('video')} className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 rounded-lg flex items-center gap-2">
                                        <FileText className="w-3 h-3" /> Vídeo
                                    </button>
                                    <button onClick={() => handleCreateNew('carousel')} className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 rounded-lg flex items-center gap-2">
                                        <Layers className="w-3 h-3" /> Carrusel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="overflow-y-auto space-y-2 pr-2 flex-1">
                        {loading ? (
                            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-zinc-300" /></div>
                        ) : scripts.length === 0 ? (
                            <div className="text-center py-10 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">No hay guiones aún</div>
                        ) : (
                            scripts.map((script) => (
                                <div
                                    key={script.id}
                                    onClick={() => setActiveScript(script)}
                                    className={cn(
                                        "p-3 rounded-xl cursor-pointer transition-all border group relative flex items-start gap-3",
                                        activeScript?.id === script.id ? "bg-white border-zinc-200 shadow-sm" : "bg-transparent border-transparent hover:bg-zinc-100/60"
                                    )}
                                >
                                    <div className={cn(
                                        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border",
                                        activeScript?.id === script.id ? "bg-zinc-900 text-white" : "bg-white text-zinc-400"
                                    )}>
                                        {script.type === 'carousel' ? <Layers className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold truncate text-zinc-900">{script.title}</p>
                                        <span className="text-[10px] text-zinc-400 capitalize">{script.status}</span>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(script.id); }} className="opacity-0 group-hover:opacity-100 p-1 text-zinc-300 hover:text-red-500 transition-all"><Trash2 className="w-3 h-3" /></button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* --- Editor Area --- */}
                <div className="flex-1 bg-white border border-zinc-100 rounded-[24px] shadow-sm flex flex-col overflow-hidden relative">
                    {!activeScript ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-zinc-300">
                            <FileText className="w-12 h-12 opacity-20" />
                            <p className="text-sm font-bold uppercase tracking-widest">Selecciona o crea un proyecto</p>
                        </div>
                    ) : (
                        <>
                            <div className="h-16 flex items-center justify-between px-8 pt-4 pb-2 shrink-0">
                                <input
                                    className="text-2xl font-bold text-zinc-900 border-none focus:ring-0 p-0 bg-transparent w-full"
                                    value={activeScript.title}
                                    onChange={(e) => updateActiveScript({ title: e.target.value })}
                                />
                                <div className="flex items-center gap-4 ml-4">
                                    <div className="bg-zinc-100 p-1 rounded-full flex">
                                        <button onClick={() => setViewMode('content')} className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-all", viewMode === 'content' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500")}>Editor</button>
                                        <button onClick={() => setViewMode('strategy')} className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-all", viewMode === 'strategy' ? "bg-white text-blue-600 shadow-sm" : "text-zinc-500")}>Estrategia</button>
                                    </div>
                                    <button onClick={() => setShowGlobalReferences(!showGlobalReferences)} className={cn("p-2 rounded-xl transition-all", showGlobalReferences ? "bg-blue-50 text-blue-600" : "text-zinc-400 hover:bg-zinc-50")}>
                                        <ImageIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {viewMode === 'content' ? (
                                <div className="flex flex-col flex-1 overflow-hidden">
                                    <div className="px-8 py-3 flex items-center gap-1 border-b border-zinc-50 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                                        <ToolbarBtn icon={Bold} onClick={() => execCmd('bold')} />
                                        <ToolbarBtn icon={Italic} onClick={() => execCmd('italic')} />
                                        <ToolbarBtn icon={Underline} onClick={() => execCmd('underline')} />
                                        <div className="w-[1px] h-4 bg-zinc-200 mx-2" />
                                        <ToolbarBtn icon={List} onClick={() => execCmd('insertUnorderedList')} />
                                        <ToolbarBtn icon={ListOrdered} onClick={() => execCmd('insertOrderedList')} />
                                        <ToolbarBtn icon={Quote} onClick={() => execCmd('formatBlock', 'blockquote')} />
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                        {activeScript.type === 'video' ? (
                                            <div className="max-w-4xl ml-0 space-y-8 animate-in slide-in-from-left-4 duration-500">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] pl-1">Hook Principal</label>
                                                    <input
                                                        className="w-full text-3xl font-black border-none focus:ring-0 p-0 text-zinc-900 placeholder:text-zinc-200 bg-transparent tracking-tighter"
                                                        placeholder="El gancho que detendrá el scroll..."
                                                        value={activeScript.hook}
                                                        onChange={(e) => updateActiveScript({ hook: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] pl-1">Cuerpo del Contenido</label>
                                                    <RichTextEditor
                                                        html={activeScript.body}
                                                        onChange={(html: string) => updateActiveScript({ body: html })}
                                                        className="min-h-[500px] text-xl leading-relaxed text-zinc-800 font-medium"
                                                        placeholder="Escribe el desarrollo de tu vídeo aquí..."
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="max-w-4xl ml-0 space-y-8 animate-in slide-in-from-left-4 duration-500">
                                                {activeScript.slides.map((slide, i) => (
                                                    <div key={slide.id} className="flex gap-6 group animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                                                        <div className="flex flex-col items-center gap-2 pt-4">
                                                            <span className="text-3xl font-black text-zinc-100 group-hover:text-zinc-200 transition-colors">{String(i + 1).padStart(2, '0')}</span>
                                                            <div className="w-[2px] flex-1 bg-zinc-50 group-last:hidden" />
                                                        </div>
                                                        <div className="flex-1 bg-white border border-zinc-100 rounded-2xl p-6 relative shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] focus-within:border-blue-200 focus-within:shadow-md transition-all group/slide">
                                                            <button
                                                                onClick={() => updateActiveScript({ slides: activeScript.slides.filter(s => s.id !== slide.id) })}
                                                                className="absolute -top-2 -right-2 p-1.5 bg-white border border-zinc-100 rounded-full text-zinc-300 hover:text-red-500 hover:shadow-sm opacity-0 group-hover/slide:opacity-100 transition-all z-10"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <RichTextEditor
                                                                html={slide.content}
                                                                onChange={(html: string) => {
                                                                    const s = [...activeScript.slides];
                                                                    const idx = s.findIndex(slide_item => slide_item.id === slide.id);
                                                                    if (idx !== -1) {
                                                                        s[idx].content = html;
                                                                        updateActiveScript({ slides: s });
                                                                    }
                                                                }}
                                                                className="text-base leading-relaxed min-h-[60px]"
                                                                placeholder="Contenido de esta slide..."
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => updateActiveScript({
                                                        slides: [...activeScript.slides, { id: crypto.randomUUID(), content: "", position: activeScript.slides.length }]
                                                    })}
                                                    className="ml-14 flex items-center gap-3 px-6 py-3 bg-zinc-900 text-white rounded-2xl text-xs font-bold shadow-lg shadow-zinc-200 hover:bg-black hover:scale-[1.02] active:scale-95 transition-all"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Añadir Nueva Slide
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto bg-zinc-50/50 p-8 custom-scrollbar">
                                    <div className="max-w-2xl mx-auto space-y-8 pb-10">
                                        <div className="bg-white border border-zinc-100 rounded-[24px] p-8 shadow-sm space-y-6 focus-within:border-blue-100 transition-all">
                                            <div className="flex items-center gap-3 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                                    <Lightbulb className="w-4 h-4" />
                                                </div>
                                                Core Strategic Message
                                            </div>
                                            <textarea
                                                className="w-full border-none focus:ring-0 p-0 text-xl font-medium text-zinc-900 placeholder:text-zinc-200 resize-none min-h-[120px] bg-transparent leading-relaxed"
                                                placeholder="Define el propósito psicológico y emocional de esta pieza..."
                                                value={activeScript.strategy_message}
                                                onChange={(e) => updateActiveScript({ strategy_message: e.target.value })}
                                            />
                                        </div>
                                        <div className="bg-white border border-zinc-100 rounded-[24px] p-8 shadow-sm space-y-6 focus-within:border-blue-100 transition-all">
                                            <div className="flex items-center gap-3 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                                <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                                                    <ListOrdered className="w-4 h-4" />
                                                </div>
                                                Key Content Points
                                            </div>
                                            <textarea
                                                className="w-full border-none focus:ring-0 p-0 text-sm font-medium text-zinc-600 placeholder:text-zinc-200 resize-none min-h-[180px] bg-transparent leading-loose"
                                                placeholder="• Punto 1: Conecta con el problema
• Punto 2: Presenta la solución
• Punto 3: Call to Action"
                                                value={activeScript.strategy_bullets}
                                                onChange={(e) => updateActiveScript({ strategy_bullets: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* --- References Panel --- */}
                {showGlobalReferences && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-end p-6 animate-in fade-in duration-300">
                        <div className="absolute inset-0 bg-black/5 blur-sm" onClick={() => setShowGlobalReferences(false)} />
                        <div className="w-[450px] h-full bg-white border border-zinc-200 rounded-[32px] shadow-[0_40px_100px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden relative animate-in slide-in-from-right-8 duration-500">
                            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-white/50 backdrop-blur shrink-0">
                                <div>
                                    <h4 className="font-extrabold text-sm text-zinc-900">Referencias</h4>
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Inspiración guardada</p>
                                </div>
                                <button onClick={() => setShowGlobalReferences(false)} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 transition-all"><X className="w-4 h-4" /></button>
                            </div>

                            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-4">
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="ref-upload"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file || !session?.user?.id) return;
                                            setLoadingInspo(true);
                                            const path = `${session.user.id}/${Date.now()}_${file.name}`;
                                            const { data, error } = await supabase.storage.from('references').upload(path, file);
                                            if (data) {
                                                const { data: { publicUrl } } = supabase.storage.from('references').getPublicUrl(path);
                                                await supabase.from('inspiration').insert({
                                                    user_id: session.user.id,
                                                    title: file.name,
                                                    image_url: publicUrl,
                                                    type: 'image'
                                                });
                                                fetchInspiration();
                                            }
                                            setLoadingInspo(false);
                                        }}
                                    />
                                    <button
                                        onClick={() => document.getElementById('ref-upload')?.click()}
                                        className="w-full py-8 rounded-2xl border-2 border-dashed border-zinc-100 text-zinc-300 hover:border-blue-100 hover:bg-blue-50/50 hover:text-blue-500 transition-all flex flex-col items-center justify-center gap-3 group"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-zinc-50 group-hover:bg-white flex items-center justify-center shadow-sm transition-all">
                                            <Plus className="w-6 h-6" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Subir Referencia Visual</span>
                                    </button>
                                </div>

                                {loadingInspo ? (
                                    <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-zinc-200" /></div>
                                ) : inspirationItems.length === 0 ? (
                                    <div className="text-center py-12">
                                        <ImageIcon className="w-8 h-8 text-zinc-100 mx-auto mb-3" />
                                        <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest leading-loose">No hay referencias<br />guardadas aún</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {inspirationItems.map(item => (
                                            <div key={item.id} className="group/item relative bg-zinc-50 border border-zinc-100 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-zinc-200/50 transition-all">
                                                {item.image_url ? (
                                                    <div className="aspect-[4/5] bg-zinc-200 relative overflow-hidden">
                                                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-110" />
                                                        <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover/item:opacity-100">
                                                            <div className="p-2 bg-white rounded-full shadow-xl transform translate-y-4 group-hover/item:translate-y-0 transition-all">
                                                                <ExternalLink className="w-4 h-4 text-zinc-900" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="p-4 flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-zinc-100 shadow-sm text-zinc-400">
                                                            {item.type === 'video' ? <FileText className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-bold text-zinc-900 truncate">{item.title}</p>
                                                            <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-tight">{item.type}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {item.url && (
                                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-10" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- Modal --- */}
                {showScheduleModal && activeScript && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md px-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm p-8 space-y-8 animate-in zoom-in-95 duration-300 border border-white/20">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-extrabold text-zinc-900 tracking-tight">Agendar</h3>
                                <button onClick={() => setShowScheduleModal(false)} className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-400 transition-all"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-[0.15em] pl-1">
                                    <CalendarIcon className="w-3.5 h-3.5" />
                                    Fecha Seleccionada
                                </div>
                                <input
                                    type="date"
                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl p-4 text-sm font-bold text-zinc-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                    value={activeScript.scheduled_date || ""}
                                    onChange={(e) => updateActiveScript({ scheduled_date: e.target.value })}
                                />
                            </div>
                            <button
                                onClick={() => setShowScheduleModal(false)}
                                className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-extrabold text-sm shadow-xl shadow-zinc-200 hover:bg-black hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                Confirmar Fecha
                            </button>
                        </div>
                    </div>
                )}

                <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #E4E4E7;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #D4D4D8;
                }
            `}</style>
            </div>
        </div>
    );
}

function RichTextEditor({ html, onChange, className, placeholder }: any) {
    const editorRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== html) {
            editorRef.current.innerHTML = html;
        }
    }, [html]);

    return (
        <div
            ref={editorRef}
            contentEditable
            onInput={() => editorRef.current && onChange(editorRef.current.innerHTML)}
            className={cn(
                "outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-200 focus:empty:before:text-zinc-100 transition-all",
                className
            )}
            data-placeholder={placeholder}
        />
    );
}

function ToolbarBtn({ icon: Icon, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="p-2.5 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all transform active:scale-90"
            onMouseDown={(e) => e.preventDefault()}
        >
            <Icon className="w-4 h-4" strokeWidth={2.5} />
        </button>
    );
}
