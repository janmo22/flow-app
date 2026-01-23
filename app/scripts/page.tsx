"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
    Plus, FileText, Trash2,
    Bold, Italic, Underline,
    List, ListOrdered, Quote, Image as ImageIcon, X,
    Layers, Lightbulb, Calendar as CalendarIcon,
    ChevronLeft, ChevronRight, Check, Video, Globe, Layout,
    Loader2, ExternalLink, ChevronDown, PlayCircle, Target, MessageSquare, Highlighter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase";
import { debounce } from "lodash";
import { useSearchParams } from "next/navigation";

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

interface Format {
    id: string;
    title: string;
    tag: string;
    structure: string;
}

interface Inspiration {
    id: string;
    title: string;
    url?: string;
    image_url?: string;
    type: 'video' | 'image' | 'text' | 'link';
    category?: string;
    created_at: string;
    script_id?: string;
}

export default function ScriptsPage() {
    const { session } = useAuth();
    const supabase = createClient();

    // Data State
    const [activeScript, setActiveScript] = useState<Script | null>(null);
    const [scripts, setScripts] = useState<Script[]>([]);
    const [formats, setFormats] = useState<Format[]>([]);
    const [inspirationItems, setInspirationItems] = useState<Inspiration[]>([]);

    // UI State
    const [loading, setLoading] = useState(true);
    const [loadingInspo, setLoadingInspo] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
    const [showGlobalReferences, setShowGlobalReferences] = useState(false);
    const [viewMode, setViewMode] = useState<'content' | 'strategy'>('content');
    const [isCreating, setIsCreating] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showFormatSelector, setShowFormatSelector] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(new Date());

    // Fetch Initial Data
    useEffect(() => {
        if (session?.user?.id) {
            fetchScripts();
            fetchFormats();
        }
    }, [session]);

    // Handle Deep Linking via Search Params
    const searchParams = useSearchParams();
    const initialScriptId = searchParams.get('id');
    const hasHandledDeepLink = useRef(false);

    useEffect(() => {
        if (initialScriptId && scripts.length > 0 && !hasHandledDeepLink.current) {
            const linkedScript = scripts.find(s => s.id === initialScriptId);
            if (linkedScript) {
                setActiveScript({
                    ...linkedScript,
                    slides: (linkedScript.slides || []).sort((a: any, b: any) => a.position - b.position)
                });
                hasHandledDeepLink.current = true;
            }
        }
    }, [initialScriptId, scripts]);

    // Fetch references when active script changes
    useEffect(() => {
        if (session?.user?.id && activeScript?.id) {
            fetchScriptReferences(activeScript.id);
        } else {
            setInspirationItems([]);
        }
    }, [activeScript?.id, session?.user?.id]);

    const fetchScripts = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('scripts')
            .select(`*, slides (*)`)
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

    const fetchFormats = async () => {
        const { data } = await supabase
            .from('formats')
            .select('id, title, tag, structure')
            .eq('user_id', session?.user?.id)
            .is('deleted_at', null)
            .order('title', { ascending: true });
        if (data) setFormats(data);
    };

    const fetchScriptReferences = async (scriptId: string) => {
        setLoadingInspo(true);
        const { data } = await supabase
            .from('inspiration')
            .select('*')
            .eq('user_id', session?.user?.id)
            .eq('script_id', scriptId)
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
                    await supabase.from('slides').upsert({
                        id: slide.id,
                        script_id: script.id,
                        content: slide.content,
                        position: slide.position
                    });
                }
            }
            setSaveStatus(error ? 'error' : 'saved');
        }, 1500),
        [session]
    );

    const updateActiveScript = (updates: Partial<Script>) => {
        if (!activeScript) return;
        const updated = { ...activeScript, ...updates };
        setActiveScript(updated);
        setScripts(prev => prev.map(s => s.id === updated.id ? updated : s));
        debouncedSave(updated);
    };

    // Actions
    const handleCreateNew = async (type: ScriptType) => {
        if (!session?.user?.id) return;
        const { data: newScriptData } = await supabase
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
                const { data: slideData } = await supabase.from('slides').insert({
                    script_id: newScriptData.id,
                    content: "Slide 1",
                    position: 0
                }).select().single();
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
        await supabase.from('scripts').update({ deleted_at: new Date().toISOString() }).eq('id', id);
        const remaining = scripts.filter(s => s.id !== id);
        setScripts(remaining);
        if (activeScript?.id === id) setActiveScript(remaining[0] || null);
    };

    const handleApplyFormat = (format: Format) => {
        updateActiveScript({
            strategy_format: format.id,
            // Optionally autofill structure if user wants? For now just linking data
        });
        setShowFormatSelector(false);
    };

    // Editor Commands
    const execCmd = (command: string, value: string | undefined = undefined) => {
        // Prevent default focus loss is handled in onMouseDown of buttons
        document.execCommand(command, false, value);
    };

    // Calendar Helpers
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const days = new Date(year, month + 1, 0).getDate();
        const res = [];
        for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) res.push(null);
        for (let i = 1; i <= days; i++) res.push(new Date(year, month, i));
        return res;
    };

    return (
        <div className="max-w-[1600px] mx-auto h-[calc(100vh-2rem)] flex flex-col pt-8 pb-6 px-6 font-sans text-zinc-900 relative">

            {/* Header */}
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
                    className="flex items-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black hover:shadow-lg hover:scale-105 active:scale-95 transition-all group mb-1"
                >
                    <CalendarIcon className="w-4 h-4 text-zinc-300 group-hover:text-white transition-colors" />
                    <span>{activeScript?.scheduled_date ? new Date(activeScript.scheduled_date).toLocaleDateString() : 'Agendar'}</span>
                </button>
            </div>

            <div className="flex flex-1 gap-8 animate-in fade-in duration-500 overflow-hidden">
                {/* --- Sidebar Projects --- */}
                <div className="w-72 flex flex-col h-full shrink-0 pr-6 border-r border-zinc-200/50 mr-2">
                    <div className="flex items-center justify-between mb-6 pl-2 pr-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-zinc-900">Mis Proyectos</h2>
                            {saveStatus === 'saving' && <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />}
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setIsCreating(!isCreating)}
                                className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-all active:scale-95"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                            {isCreating && (
                                <div className="absolute top-8 right-0 w-48 bg-white border border-zinc-100 shadow-xl rounded-xl overflow-hidden z-50 p-1 animate-in zoom-in-95 duration-200">
                                    <button onClick={() => handleCreateNew('video')} className="w-full text-left px-3 py-2.5 text-xs font-bold text-zinc-600 hover:bg-zinc-50 rounded-lg flex items-center gap-3">
                                        <PlayCircle className="w-4 h-4 text-purple-500" /> Vídeo
                                    </button>
                                    <button onClick={() => handleCreateNew('carousel')} className="w-full text-left px-3 py-2.5 text-xs font-bold text-zinc-600 hover:bg-zinc-50 rounded-lg flex items-center gap-3">
                                        <Layers className="w-4 h-4 text-blue-500" /> Carrusel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="overflow-y-auto space-y-2 pr-2 flex-1 custom-scrollbar">
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
                                        "p-3 rounded-xl cursor-pointer transition-all border group relative flex items-start gap-3 select-none active:scale-[0.98]",
                                        activeScript?.id === script.id ? "bg-white border-zinc-200 shadow-sm" : "bg-transparent border-transparent hover:bg-zinc-50"
                                    )}
                                >
                                    <div className={cn(
                                        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                                        activeScript?.id === script.id ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-400 border-zinc-100"
                                    )}>
                                        {script.type === 'carousel' ? <Layers className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <p className="text-xs font-bold truncate text-zinc-900">{script.title}</p>
                                        <span className="text-[9px] text-zinc-400 font-medium capitalize">{script.status}</span>
                                        {script.scheduled_date && <span className="ml-2 text-[9px] text-blue-500 font-bold bg-blue-50 px-1.5 py-0.5 rounded-full">{new Date(script.scheduled_date).getDate()}/{new Date(script.scheduled_date).getMonth() + 1}</span>}
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(script.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-300 hover:text-red-500 transition-all hover:bg-red-50 rounded-md absolute right-2 top-2"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* --- Main Editor Area --- */}
                <div className="flex-1 bg-white border border-zinc-100 rounded-[24px] shadow-sm flex flex-col overflow-hidden relative">
                    {!activeScript ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-6 text-zinc-300">
                            <div className="w-20 h-20 rounded-full bg-zinc-50 flex items-center justify-center">
                                <FileText className="w-8 h-8 opacity-50" />
                            </div>
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Selecciona o crea un proyecto</p>
                        </div>
                    ) : (
                        <>
                            {/* Editor Top Bar */}
                            <div className="h-18 flex items-center justify-between px-8 py-5 shrink-0 bg-white border-b border-zinc-50">
                                <div className="flex items-center gap-4 flex-1 mr-8">
                                    <input
                                        className="text-2xl font-black text-zinc-900 border-none focus:ring-0 p-0 bg-transparent w-full tracking-tight placeholder:text-zinc-200"
                                        value={activeScript.title}
                                        onChange={(e) => updateActiveScript({ title: e.target.value })}
                                        placeholder="Título del Guion"
                                    />

                                    {/* Format Select Dropdown */}
                                    <div className="relative shrink-0">
                                        <button
                                            onClick={() => setShowFormatSelector(!showFormatSelector)}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:border-blue-200 hover:text-blue-600 transition-all"
                                        >
                                            {formats.find(f => f.id === activeScript.strategy_format)?.title || "Formato: Ninguno"}
                                            <ChevronDown className="w-3 h-3" />
                                        </button>

                                        {showFormatSelector && (
                                            <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-zinc-100 shadow-xl rounded-xl overflow-hidden z-20 animate-in zoom-in-95 duration-200">
                                                <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                                                    <button
                                                        onClick={() => { updateActiveScript({ strategy_format: undefined }); setShowFormatSelector(false); }}
                                                        className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-50 rounded-lg mb-1"
                                                    >
                                                        Ninguno
                                                    </button>
                                                    {formats
                                                        .filter(f => {
                                                            if (!activeScript.type) return true;
                                                            if (activeScript.type === 'video') return f.tag === 'Video';
                                                            if (activeScript.type === 'carousel') return f.tag === 'Carrusel';
                                                            return true;
                                                        })
                                                        .map(format => (
                                                            <button
                                                                key={format.id}
                                                                onClick={() => handleApplyFormat(format)}
                                                                className="w-full text-left px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg flex items-center gap-2 mb-0.5"
                                                            >
                                                                <Layout className="w-3 h-3 opacity-50" />
                                                                {format.title}
                                                            </button>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="bg-zinc-100 p-1 rounded-xl flex">
                                        <button onClick={() => setViewMode('content')} className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", viewMode === 'content' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}>Editor</button>
                                        <button onClick={() => setViewMode('strategy')} className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", viewMode === 'strategy' ? "bg-white text-blue-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}>Estrategia</button>
                                    </div>
                                    <button
                                        onClick={() => setShowGlobalReferences(!showGlobalReferences)}
                                        className={cn(
                                            "p-2 rounded-xl transition-all border",
                                            showGlobalReferences ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-white text-zinc-400 border-zinc-200 hover:border-zinc-300"
                                        )}
                                        title="Abrir Referencias"
                                    >
                                        <ImageIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Content View */}
                            {viewMode === 'content' ? (
                                <div className="flex flex-col flex-1 overflow-hidden relative">
                                    <div className="px-8 py-3 flex items-center gap-1 border-b border-zinc-50 bg-white/80 backdrop-blur-md sticky top-0 z-10 transition-all">
                                        <ToolbarBtn icon={Bold} onClick={() => execCmd('bold')} tooltip="Negrita" />
                                        <ToolbarBtn icon={Italic} onClick={() => execCmd('italic')} tooltip="Cursiva" />
                                        <ToolbarBtn icon={Underline} onClick={() => execCmd('underline')} tooltip="Subrayado" />
                                        <ColorPickerBtn onSelect={(color: string) => execCmd('hiliteColor', color)} />
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
                                        {activeScript.type === 'video' ? (
                                            <div className="max-w-3xl space-y-8 animate-in slide-in-from-bottom-2 duration-500">
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em] pl-1 flex items-center gap-2">
                                                        <Target className="w-3 h-3" /> Hook Principal
                                                    </label>
                                                    <input
                                                        className="w-full text-base font-bold border-none focus:ring-0 p-0 text-zinc-900 placeholder:text-zinc-300 bg-transparent tracking-tight leading-relaxed"
                                                        placeholder="Escribe un gancho potente aquí..."
                                                        value={activeScript.hook}
                                                        onChange={(e) => updateActiveScript({ hook: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em] pl-1 flex items-center gap-2">
                                                        <FileText className="w-3 h-3" /> Cuerpo del Guion
                                                    </label>
                                                    <RichTextEditor
                                                        html={activeScript.body}
                                                        onChange={(html: string) => updateActiveScript({ body: html })}
                                                        className="min-h-[500px] text-sm leading-relaxed text-zinc-700 font-normal pb-20"
                                                        placeholder="Desarrolla tu idea aquí..."
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="max-w-4xl space-y-8 animate-in slide-in-from-bottom-2 duration-500">
                                                {activeScript.slides.map((slide, i) => (
                                                    <div key={slide.id} className="flex gap-6 group">
                                                        <div className="flex flex-col items-center gap-2 pt-4">
                                                            <span className="text-3xl font-black text-zinc-100 group-hover:text-blue-100 transition-colors">{String(i + 1).padStart(2, '0')}</span>
                                                            <div className="w-[2px] flex-1 bg-zinc-50 group-last:hidden" />
                                                        </div>
                                                        <div className="flex-1 bg-white border border-zinc-100 rounded-2xl p-6 relative shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] focus-within:border-blue-200 focus-within:shadow-md transition-all group/slide hover:border-zinc-200">
                                                            <button
                                                                onClick={() => updateActiveScript({ slides: activeScript.slides.filter(s => s.id !== slide.id) })}
                                                                className="absolute -top-2 -right-2 p-1.5 bg-white border border-zinc-100 rounded-full text-zinc-300 hover:text-red-500 hover:shadow-sm opacity-0 group-hover/slide:opacity-100 transition-all z-10 scale-90 hover:scale-100"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <RichTextEditor
                                                                html={slide.content}
                                                                onChange={(html: string) => {
                                                                    const s = [...activeScript.slides];
                                                                    const idx = s.findIndex(slide_item => slide_item.id === slide.id);
                                                                    if (idx !== -1) { s[idx].content = html; updateActiveScript({ slides: s }); }
                                                                }}
                                                                className="text-sm leading-relaxed min-h-[60px] text-zinc-700"
                                                                placeholder={`Contenido de la slide ${i + 1}...`}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => updateActiveScript({ slides: [...activeScript.slides, { id: crypto.randomUUID(), content: "", position: activeScript.slides.length }] })}
                                                    className="ml-14 flex items-center gap-3 px-6 py-3 bg-zinc-50 text-zinc-500 rounded-xl text-xs font-bold border border-zinc-200 hover:bg-white hover:text-zinc-900 hover:shadow-sm transition-all"
                                                >
                                                    <Plus className="w-4 h-4" /> Añadir Slide
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                // Strategy View (Refactored)
                                <div className="flex-1 overflow-y-auto bg-[#F8F9FA] p-8 custom-scrollbar">
                                    <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-12 animate-in slide-in-from-bottom-4 duration-500">

                                        {/* Strategic Message - Prominent */}
                                        <div className="bg-white border border-zinc-200 rounded-[28px] p-8 relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
                                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                                                <Target className="w-32 h-32 text-blue-600 rotate-12" />
                                            </div>
                                            <div className="relative z-10 flex flex-col h-full">
                                                <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight mb-2 flex items-center gap-3">
                                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                        <Target className="w-5 h-5" />
                                                    </div>
                                                    Mensaje Estratégico
                                                </h3>
                                                <p className="text-xs text-zinc-500 font-medium mb-6 ml-1">Define el propósito psicológico y emocional único de esta pieza. ¿Qué debe sentir la audiencia?</p>
                                                <textarea
                                                    className="w-full min-h-[140px] border border-zinc-100 hover:border-zinc-200 bg-zinc-50/50 focus:bg-white rounded-2xl p-6 text-lg font-medium text-zinc-800 placeholder:text-zinc-300 resize-none focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all leading-relaxed shadow-sm"
                                                    placeholder="Escribe el mensaje central aquí..."
                                                    value={activeScript.strategy_message}
                                                    onChange={(e) => updateActiveScript({ strategy_message: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {/* Key Points - Bullet List */}
                                        <div className="bg-white border border-zinc-200 rounded-[28px] p-8 relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
                                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                                                <ListOrdered className="w-32 h-32 text-purple-600 -rotate-12" />
                                            </div>
                                            <div className="relative z-10 flex flex-col h-full">
                                                <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight mb-2 flex items-center gap-3">
                                                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                                        <List className="w-5 h-5" />
                                                    </div>
                                                    Puntos Clave
                                                </h3>
                                                <p className="text-xs text-zinc-500 font-medium mb-6 ml-1">Estructura del argumento. Usa atajos: "<b>1.</b> " para lista numerada, "<b>-</b> " para bullets.</p>
                                                <div className="min-h-[200px] border border-zinc-100 hover:border-zinc-200 bg-zinc-50/50 focus-within:bg-white rounded-2xl p-6 focus-within:ring-4 focus-within:ring-purple-500/5 transition-all shadow-sm">
                                                    <RichTextEditor
                                                        html={activeScript.strategy_bullets}
                                                        onChange={(html: string) => updateActiveScript({ strategy_bullets: html })}
                                                        className="text-base leading-relaxed text-zinc-700 min-h-[180px]"
                                                        placeholder="• Punto 1: Contexto..."
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* --- References Panel (With Animations) --- */}
                {showGlobalReferences && (
                    <div className="fixed inset-0 z-[100] flex justify-end">
                        <div className="absolute inset-0 bg-zinc-900/20 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowGlobalReferences(false)} />
                        <div className="w-[420px] h-full bg-white shadow-2xl relative z-10 flex flex-col animate-in slide-in-from-right duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-white shrink-0">
                                <div>
                                    <h4 className="font-extrabold text-base text-zinc-900 flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-blue-500" /> Referencias
                                    </h4>
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">Tu banco de inspiración</p>
                                </div>
                                <button onClick={() => setShowGlobalReferences(false)} className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 transition-all"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">Añadir Nueva</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => document.getElementById('ref-upload')?.click()} className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-zinc-200 text-zinc-400 hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50 transition-all active:scale-95 text-xs font-bold text-left">
                                            <ImageIcon className="w-5 h-5" /> Subir Imagen
                                        </button>
                                        <input
                                            type="file"
                                            id="ref-upload"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file || !session?.user?.id || !activeScript?.id) return;
                                                setLoadingInspo(true);
                                                try {
                                                    const path = `${session.user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
                                                    const { data, error } = await supabase.storage.from('references').upload(path, file);

                                                    if (data) {
                                                        const { data: { publicUrl } } = supabase.storage.from('references').getPublicUrl(path);
                                                        await supabase.from('inspiration').insert({
                                                            user_id: session.user.id,
                                                            script_id: activeScript.id,
                                                            title: file.name,
                                                            image_url: publicUrl,
                                                            type: 'image'
                                                        });
                                                        await fetchScriptReferences(activeScript.id);
                                                    }
                                                } finally {
                                                    setLoadingInspo(false);
                                                }
                                            }}
                                        />
                                        <button className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-zinc-200 text-zinc-400 hover:text-purple-500 hover:border-purple-200 hover:bg-purple-50 transition-all active:scale-95 text-xs font-bold text-left">
                                            <ExternalLink className="w-5 h-5" /> Guardar URL
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">Guardadas</label>
                                    {loadingInspo ? (
                                        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-zinc-200" /></div>
                                    ) : inspirationItems.length === 0 ? (
                                        <div className="text-center py-10 opacity-30 border border-dashed border-zinc-200 rounded-xl">
                                            <p className="text-xs font-bold">Vacío</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4">
                                            {inspirationItems.map((item, i) => (
                                                <div key={item.id} className="group relative rounded-xl overflow-hidden border border-zinc-100 hover:shadow-lg transition-all bg-white animate-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${i * 50}ms` }}>
                                                    {item.image_url ? (
                                                        <div className="aspect-square relative">
                                                            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                            <a href={item.image_url} target="_blank" className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                                <ExternalLink className="w-6 h-6 text-white drop-shadow-md" />
                                                            </a>
                                                        </div>
                                                    ) : (
                                                        <div className="p-4 flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-zinc-50 flex items-center justify-center border border-zinc-100 text-zinc-400">
                                                                <Globe className="w-5 h-5" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-bold truncate text-zinc-900">{item.title}</p>
                                                                <p className="text-[10px] text-zinc-400">Enlace</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- Schedule Modal (with Visual Calendar) --- */}
                {showScheduleModal && activeScript && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm px-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-300 overflow-hidden relative">
                            <div className="flex justify-between items-center mb-6 pl-2">
                                <h3 className="text-xl font-black text-zinc-900 tracking-tight">Agendar Publicación</h3>
                                <button onClick={() => setShowScheduleModal(false)} className="p-2 rounded-full hover:bg-zinc-100 transition-all"><X className="w-5 h-5 text-zinc-400" /></button>
                            </div>

                            <div className="bg-zinc-50 rounded-3xl p-6 mb-6 border border-zinc-100">
                                <div className="flex items-center justify-between mb-6">
                                    <button onClick={() => setCalendarMonth(new Date(calendarMonth.setMonth(calendarMonth.getMonth() - 1)))} className="p-1 hover:bg-white rounded-lg transition-all"><ChevronLeft className="w-4 h-4 text-zinc-400" /></button>
                                    <span className="text-sm font-black text-zinc-900 capitalize">{calendarMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</span>
                                    <button onClick={() => setCalendarMonth(new Date(calendarMonth.setMonth(calendarMonth.getMonth() + 1)))} className="p-1 hover:bg-white rounded-lg transition-all"><ChevronRight className="w-4 h-4 text-zinc-400" /></button>
                                </div>
                                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <span key={d} className="text-[10px] font-bold text-zinc-300">{d}</span>)}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {getDaysInMonth(calendarMonth).map((d, i) => {
                                        if (!d) return <div key={i} />;

                                        // Use local date string for consistent comparison and key
                                        const year = d.getFullYear();
                                        const month = String(d.getMonth() + 1).padStart(2, '0');
                                        const day = String(d.getDate()).padStart(2, '0');
                                        const localDateString = `${year}-${month}-${day}`;

                                        const isSelected = activeScript.scheduled_date === localDateString;

                                        return (
                                            <button
                                                key={localDateString}
                                                onClick={() => {
                                                    updateActiveScript({ scheduled_date: localDateString });
                                                }}
                                                className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold mx-auto transition-all relative",
                                                    isSelected ? "bg-zinc-900 text-white shadow-lg scale-110 z-10" : "text-zinc-600 hover:bg-white hover:shadow-sm"
                                                )}
                                            >
                                                {d.getDate()}
                                                {isSelected && <div className="absolute -bottom-1 w-1 h-1 bg-zinc-900 rounded-full" />}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <button
                                onClick={() => setShowScheduleModal(false)}
                                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <Check className="w-5 h-5" />
                                Confirmar Fecha
                            </button>
                        </div>
                    </div>
                )}

                <style jsx global>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #E4E4E7; border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D4D4D8; }
                `}</style>
            </div>
        </div>
    );
}

function ToolbarBtn({ icon: Icon, onClick, tooltip }: any) {
    return (
        <button
            onMouseDown={(e) => {
                e.preventDefault(); // Prevent focus loss!
                onClick();
            }}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all active:scale-90"
            title={tooltip}
        >
            <Icon className="w-4 h-4" strokeWidth={2.5} />
        </button>
    );
}

function RichTextEditor({ html, onChange, className, placeholder }: any) {
    const editorRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== html) {
            if (document.activeElement !== editorRef.current) {
                editorRef.current.innerHTML = html || '';
            }
        }
    }, [html]);



    return (
        <div
            ref={editorRef}
            contentEditable
            onInput={() => editorRef.current && onChange(editorRef.current.innerHTML)}

            className={cn(
                "pro-editor outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-300 focus:empty:before:text-zinc-200 transition-all cursor-text",
                className
            )}
            data-placeholder={placeholder}
            spellCheck={false}
        />
    );
}

function ColorPickerBtn({ onSelect }: { onSelect: (color: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const colors = [
        { name: 'Amarillo', value: '#fef08a' }, // yellow-200
        { name: 'Verde', value: '#bbf7d0' },    // green-200
        { name: 'Azul', value: '#bfdbfe' },     // blue-200
        { name: 'Rosa', value: '#fbcfe8' },     // pink-200
        { name: 'Morado', value: '#e9d5ff' },   // purple-200
        { name: 'Sin Color', value: 'transparent' }
    ];

    return (
        <div className="relative">
            <button
                onMouseDown={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
                className={cn(
                    "p-2 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all active:scale-90",
                    isOpen ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"
                )}
                title="Resaltar Color"
            >
                <Highlighter className="w-4 h-4" strokeWidth={2.5} />
            </button>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 mt-2 p-2 bg-white border border-zinc-100 rounded-xl shadow-xl z-20 flex gap-1 animate-in zoom-in-95 duration-200 min-w-max">
                        {colors.map(c => (
                            <button
                                key={c.value}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    onSelect(c.value);
                                    setIsOpen(false);
                                }}
                                className="w-6 h-6 rounded-full border border-zinc-200 hover:scale-110 transition-transform relative"
                                style={{ backgroundColor: c.value === 'transparent' ? 'white' : c.value }}
                                title={c.name}
                            >
                                {c.value === 'transparent' && <div className="absolute inset-0 m-auto w-full h-[1px] bg-red-500 rotate-45" />}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
