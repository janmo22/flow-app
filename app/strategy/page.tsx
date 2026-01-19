"use client";

import {
    Users, Target, Lightbulb, Layout,
    Fingerprint, MessageSquare, Box, Award,
    Plus, ChevronRight, Trash2, Link as LinkIconLucide, X,
    PlayCircle, FileText, ChevronDown, Globe, Search,
    PanelLeftClose, PanelLeftOpen, Zap
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase";
import { debounce } from "lodash";
import { ProTextarea } from "@/components/ui/ProTextarea";
import { ProInput } from "@/components/ui/ProInput";

// --- Types ---
type SectionId =
    | 'general' | 'avatar' | 'problem' | 'solution'
    | 'character' | 'personality' | 'product' | 'positioning'
    | 'formats';

interface MenuItem {
    id: SectionId;
    label: string;
    icon: any;
    description?: string;
}

const menuItems: MenuItem[] = [
    { id: 'general', label: 'General', icon: Zap, description: 'Nicho y Propósito' },
    { id: 'avatar', label: 'Avatar', icon: Users, description: 'Tu cliente ideal' },
    { id: 'problem', label: 'Problema', icon: Fingerprint, description: 'Puntos de dolor' },
    { id: 'solution', label: 'Solución', icon: Lightbulb, description: 'Tu propuesta de valor' },
    { id: 'character', label: 'Personaje', icon: Users, description: 'Arquetipo de marca' },
    { id: 'personality', label: 'Personalidad', icon: MessageSquare, description: 'Tono y voz' },
    { id: 'product', label: 'Producto', icon: Box, description: 'Oferta principal' },
    { id: 'positioning', label: 'Posicionamiento', icon: Target, description: 'Lugar en el mercado' },
];

interface Format {
    id: string;
    title: string;
    tag: 'Video' | 'Carrusel' | 'Post';
    description: string;
    structure: string;
    references: string[];
}

export default function StrategyPage() {
    const { session } = useAuth();
    const supabase = createClient();

    // State
    const [activeSection, setActiveSection] = useState<SectionId>('general');
    const [inputs, setInputs] = useState<Record<string, string>>({});
    const [formats, setFormats] = useState<Format[]>([]);
    const [selectedFormatId, setSelectedFormatId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ 'Video': true, 'Carrusel': true, 'Post': true });

    // Sidebar State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Effect to auto-collapse on Formats
    // Removed to avoid type error since 'formats' is no longer in SectionId main union
    /* 
    useEffect(() => {
       // Logic removed
    }, [activeSection]);
    */

    // UI State
    const [showCreateFormatModal, setShowCreateFormatModal] = useState(false);

    // Initial Fetch
    useEffect(() => {
        if (session?.user?.id) {
            Promise.all([fetchStrategyInputs(), fetchFormats()]).then(() => setLoading(false));
        }
    }, [session]);

    const fetchStrategyInputs = async () => {
        const { data } = await supabase
            .from('strategy_inputs')
            .select('*')
            .eq('user_id', session?.user?.id);

        if (data) {
            const inputMap: Record<string, string> = {};
            data.forEach((item: any) => {
                inputMap[`${item.type}_${item.key}`] = item.value;
            });
            setInputs(inputMap);
        }
    };

    const fetchFormats = async () => {
        const { data } = await supabase
            .from('formats')
            .select('*')
            .eq('user_id', session?.user?.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: true });

        if (data) {
            setFormats(data);
            if (data.length > 0 && !selectedFormatId) {
                setSelectedFormatId(data[0].id);
            }
        }
    };

    // Auto-save logic for Inputs
    const debouncedSaveInput = useCallback(
        debounce(async (type: string, key: string, value: string) => {
            if (!session?.user?.id) return;
            setSaving(true);
            try {
                await supabase.from('strategy_inputs').upsert({
                    user_id: session.user.id,
                    type,
                    key,
                    value,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id,type,key' });
            } finally {
                setSaving(false);
            }
        }, 1000),
        [session]
    );

    const handleInputChange = (type: string, key: string, value: string) => {
        setInputs(prev => ({ ...prev, [`${type}_${key}`]: value }));
        debouncedSaveInput(type, key, value);
    };

    // Auto-save logic for Formats
    const debouncedSaveFormat = useCallback(
        debounce(async (id: string, updates: Partial<Format>) => {
            setSaving(true);
            try {
                const { error } = await supabase.from('formats').update({
                    ...updates,
                    updated_at: new Date().toISOString()
                }).eq('id', id);

                if (error) console.error("Error saving format:", error);
            } catch (e) {
                console.error("Exception saving format:", e);
            } finally {
                setSaving(false);
            }
        }, 500),
        []
    );

    const handleUpdateFormat = (id: string, updates: Partial<Format>) => {
        setFormats(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
        debouncedSaveFormat(id, updates);
    };

    const handleCreateFormat = async (type: 'Video' | 'Carrusel' | 'Post') => {
        if (!session?.user?.id) return;
        setShowCreateFormatModal(false);

        const { data } = await supabase.from('formats').insert({
            user_id: session.user.id,
            title: `Nuevo ${type}`,
            tag: type,
            description: "",
            structure: "",
            references: []
        }).select().single();

        if (data) {
            setFormats(prev => [...prev, data]);
            setSelectedFormatId(data.id);
            setActiveSection('formats');
        }
    };

    const handleDeleteFormat = async (id: string) => {
        await supabase.from('formats').update({ deleted_at: new Date().toISOString() }).eq('id', id);
        const remaining = formats.filter(f => f.id !== id);
        setFormats(remaining);
        if (selectedFormatId === id) {
            setSelectedFormatId(remaining.length > 0 ? remaining[0].id : null);
        }
    };

    const renderContent = () => {
        const contentPadding = "p-8 md:p-12 max-w-5xl mx-auto";

        switch (activeSection) {
            // CORE
            case 'general': return (
                <div className={cn("space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500", contentPadding)}>
                    <Header title="General" subtitle="Los cimientos de tu estrategia." />

                    <ProTextarea
                        label="Tu Nicho"
                        placeholder="Ej: Marketing para dentistas, Fitness para mamás ocupadas..."
                        rows={2}
                        value={inputs['general_niche'] || ''}
                        onChange={(e) => handleInputChange('general', 'niche', e.target.value)}
                    />

                    <div className="space-y-4">
                        <label className="block text-xs font-bold text-zinc-900 uppercase tracking-widest pl-1">
                            Propósito Principal
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {['Educar', 'Inspirar', 'Entretener'].map((type) => {
                                const isSelected = inputs['general_content_type'] === type;
                                return (
                                    <button
                                        key={type}
                                        onClick={() => handleInputChange('general', 'content_type', type)}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 gap-3 group relative overflow-hidden",
                                            isSelected
                                                ? "bg-blue-50/50 border-blue-200 text-blue-700 shadow-sm ring-1 ring-blue-100"
                                                : "bg-white border-zinc-200 text-zinc-400 hover:border-blue-100 hover:bg-blue-50/30"
                                        )}
                                    >
                                        <span className={cn(
                                            "text-lg font-bold tracking-tight transition-colors",
                                            isSelected ? "text-blue-700" : "text-zinc-500 group-hover:text-blue-600"
                                        )}>
                                            {type}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                        <p className="text-xs text-zinc-400 font-medium px-1">
                            *Selecciona tu pilar principal.
                        </p>
                    </div>
                </div>
            );
            case 'avatar': return (
                <div className={cn("space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500", contentPadding)}>
                    <Header title="¿A quién le hablas?" subtitle="Define tu avatar real, no demográfico." />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ProInput label="Edad Aprox." placeholder="Ej: 25-35 años" value={inputs['propuesta_avatar_edad'] || ''} onChange={(e) => handleInputChange('propuesta', 'avatar_edad', e.target.value)} />
                        <ProInput label="Género" placeholder="Ej: Mayoría mujeres" value={inputs['propuesta_avatar_genero'] || ''} onChange={(e) => handleInputChange('propuesta', 'avatar_genero', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ProInput label="Ciudad / Entorno" placeholder="Ej: Grandes ciudades, ritmo rápido" value={inputs['propuesta_avatar_ciudad'] || ''} onChange={(e) => handleInputChange('propuesta', 'avatar_ciudad', e.target.value)} />
                        <ProInput label="Nivel Económico / Momento" placeholder="Ej: Primeros trabajos, buscando estabilidad" value={inputs['propuesta_avatar_economia'] || ''} onChange={(e) => handleInputChange('propuesta', 'avatar_economia', e.target.value)} />
                    </div>
                    <ProTextarea label="Intereses Reales" placeholder="¿Qué le interesa de verdad? (Miedos, deseos ocultos...)" rows={4} value={inputs['propuesta_avatar_intereses'] || ''} onChange={(e) => handleInputChange('propuesta', 'avatar_intereses', e.target.value)} />
                    <ProTextarea label="Consumo de Contenido" placeholder="¿Qué ve en TikTok/IG a diario?" rows={3} value={inputs['propuesta_avatar_consumo'] || ''} onChange={(e) => handleInputChange('propuesta', 'avatar_consumo', e.target.value)} />
                </div>
            );
            case 'problem': return (
                <div className={cn("space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500", contentPadding)}>
                    <Header title="El Problema" subtitle="Diagnóstico profundo de tu audiencia." />
                    <div className="grid grid-cols-1 gap-8">
                        <ProTextarea label="Problema Aparente (Superficial)" placeholder="Lo que 'creen' que les pasa..." rows={4} value={inputs['propuesta_problema_aparente'] || ''} onChange={(e) => handleInputChange('propuesta', 'problema_aparente', e.target.value)} />
                        <ProTextarea label="Problema Real (Profundo)" placeholder="Lo que realmente les impide avanzar..." rows={5} className="border-blue-200 focus:border-blue-500 bg-blue-50/10" value={inputs['propuesta_problema_real'] || ''} onChange={(e) => handleInputChange('propuesta', 'problema_real', e.target.value)} />
                    </div>
                    <div className="p-6 bg-zinc-50 rounded-2xl space-y-6 border border-zinc-100">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest text-center">Viaje de Transformación</h4>
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <ProInput containerClassName="w-full" placeholder="Punto X (Dolor actual)" value={inputs['propuesta_punto_x'] || ''} onChange={(e) => handleInputChange('propuesta', 'punto_x', e.target.value)} />
                            <ChevronRight className="w-5 h-5 text-zinc-300 rotate-90 md:rotate-0 shrink-0" />
                            <ProInput containerClassName="w-full" placeholder="Punto Y (Deseo)" value={inputs['propuesta_punto_y'] || ''} onChange={(e) => handleInputChange('propuesta', 'punto_y', e.target.value)} />
                        </div>
                        <ProTextarea placeholder="¿Qué cambia en ellos después de verte?" rows={2} value={inputs['propuesta_transformacion'] || ''} onChange={(e) => handleInputChange('propuesta', 'transformacion', e.target.value)} />
                    </div>
                </div>
            );
            case 'solution': return (
                <div className={cn("space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500", contentPadding)}>
                    <Header title="Tu Solución" subtitle="Tu papel en la historia." />
                    <ProTextarea label="Propuesta de Valor Única" placeholder="¿Qué aportas de forma clara y diferente?" rows={5} className="text-base" value={inputs['propuesta_solucion_que'] || ''} onChange={(e) => handleInputChange('propuesta', 'solucion_que', e.target.value)} />
                    <ProTextarea label="El Mecanismo" placeholder="¿Cuál es tu método o vehículo?" rows={3} value={inputs['propuesta_solucion_porque'] || ''} onChange={(e) => handleInputChange('propuesta', 'solucion_porque', e.target.value)} />
                    <ProTextarea label="La Promesa" placeholder="¿Qué pueden esperar si te siguen?" rows={2} value={inputs['propuesta_solucion_esperanza'] || ''} onChange={(e) => handleInputChange('propuesta', 'solucion_esperanza', e.target.value)} />
                </div>
            );

            // IDENTITY (4Ps)
            case 'character': return <IdentityBlock title="Personaje" subtitle="¿Quién protagoniza tu contenido? Arquetipos y roles." propKey="personaje" inputs={inputs} onChange={handleInputChange} className={contentPadding} />;
            case 'personality': return <IdentityBlock title="Personalidad" subtitle="¿Qué tono vas a proyectar? (Serio, Divertido, Rebelde...)" propKey="personalidad" inputs={inputs} onChange={handleInputChange} className={contentPadding} />;
            case 'product': return <IdentityBlock title="Producto" subtitle="¿Qué estás ofreciendo o vendiendo al final?" propKey="producto" inputs={inputs} onChange={handleInputChange} className={contentPadding} />;
            case 'positioning': return <IdentityBlock title="Posicionamiento" subtitle="¿Qué lugar ocupas en su mente frente a la competencia?" propKey="posicionamiento" inputs={inputs} onChange={handleInputChange} className={contentPadding} />;

            // LIBRARY (FORMATS)
            case 'formats':
                const currentFormat = formats.find(f => f.id === selectedFormatId);

                // Grouping Logic
                const groupedFormats = {
                    'Video': formats.filter(f => f.tag === 'Video'),
                    'Carrusel': formats.filter(f => f.tag === 'Carrusel'),
                    'Post': formats.filter(f => f.tag === 'Post')
                };

                const FormatGroup = ({ label, items, icon: Icon }: any) => {
                    const isExpanded = expandedGroups[label] ?? true;
                    if (items.length === 0) return null;

                    return (
                        <div className="mb-4">
                            <button
                                onClick={() => setExpandedGroups((prev: Record<string, boolean>) => ({ ...prev, [label]: !isExpanded }))}
                                className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors mb-2"
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {label}
                                {isExpanded ? <ChevronDown className="w-3 h-3 ml-auto opacity-50" /> : <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
                            </button>

                            {isExpanded && (
                                <div className="space-y-1 animate-in slide-in-from-left-2 duration-300 pl-2 border-l border-zinc-200 ml-2">
                                    {items.map((f: Format) => (
                                        <button
                                            key={f.id}
                                            onClick={() => setSelectedFormatId(f.id)}
                                            className={cn(
                                                "w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-3 group relative overflow-hidden",
                                                selectedFormatId === f.id
                                                    ? "bg-white shadow-sm ring-1 ring-zinc-200 text-zinc-900"
                                                    : "text-zinc-500 hover:bg-white/50 hover:text-zinc-900"
                                            )}
                                        >
                                            <span className={cn(
                                                "text-xs font-medium truncate transition-all relative z-10",
                                                selectedFormatId === f.id ? "font-bold" : ""
                                            )}>
                                                {f.title}
                                            </span>
                                            {selectedFormatId === f.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-blue-500 rounded-r-full" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                };

                // NOTE: Formats Sub-Sidebar logic is handled in the main sidebar structure
                // But for the right side (content), we render the editor
                return (
                    <div className="flex h-full animate-in fade-in duration-500">
                        {/* Sub-Sidebar for Formats List (Visible ONLY in Formats section) */}
                        <div className="w-72 flex flex-col shrink-0 border-r border-zinc-200/60 bg-[#FBFBFB]">
                            <div className="p-4 border-b border-zinc-200/60 flex items-center justify-between sticky top-0 z-10">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                                    <Layout className="w-3.5 h-3.5" />
                                    Biblioteca
                                </h3>
                                <button
                                    onClick={() => setShowCreateFormatModal(true)}
                                    className="p-1.5 rounded-md text-zinc-400 hover:text-blue-600 hover:bg-white hover:shadow-sm transition-all active:scale-95"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
                                {formats.length === 0 && (
                                    <div className="text-center py-20 space-y-4 px-6 opacity-50">
                                        <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-300">
                                            <Layout className="w-6 h-6" />
                                        </div>
                                        <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">Sin formatos.</p>
                                    </div>
                                )}
                                <FormatGroup label="Video" items={groupedFormats['Video']} icon={PlayCircle} />
                                <FormatGroup label="Carrusel" items={groupedFormats['Carrusel']} icon={Layout} />
                                <FormatGroup label="Post" items={groupedFormats['Post']} icon={FileText} />
                            </div>
                        </div>

                        {/* Editor Area */}
                        <div className="flex-1 overflow-hidden flex flex-col bg-white/40">
                            {!currentFormat ? (
                                <div className="flex flex-col items-center justify-center h-full text-zinc-300 gap-6 animate-in zoom-in-95 duration-500">
                                    <div className="w-24 h-24 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100">
                                        <Layout className="w-10 h-10 text-zinc-200" />
                                    </div>
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-300">Selecciona un formato</p>
                                </div>
                            ) : (
                                <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white">
                                    {/* Editor Header */}
                                    <div className="px-12 py-8 border-b border-zinc-100 flex items-start justify-between bg-white shrink-0">
                                        <div className="w-full max-w-3xl space-y-4">
                                            <input
                                                className="text-4xl font-black bg-transparent border-none p-0 focus:ring-0 text-zinc-900 w-full tracking-tight placeholder:text-zinc-200 outline-none"
                                                value={currentFormat.title}
                                                onChange={(e) => handleUpdateFormat(currentFormat.id, { title: e.target.value })}
                                                placeholder="Título del Formato"
                                            />
                                            <div className="flex items-center gap-4">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                                    currentFormat.tag === 'Video' ? "bg-purple-50 text-purple-600 border-purple-100" :
                                                        currentFormat.tag === 'Carrusel' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                            "bg-zinc-100 text-zinc-600 border-zinc-200"
                                                )}>
                                                    {currentFormat.tag}
                                                </span>
                                                <div className="h-4 w-px bg-zinc-200" />
                                                <input
                                                    className="bg-transparent text-sm text-zinc-500 border-none p-0 focus:ring-0 w-full placeholder:text-zinc-300"
                                                    placeholder="Añade una descripción breve..."
                                                    value={currentFormat.description}
                                                    onChange={(e) => handleUpdateFormat(currentFormat.id, { description: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteFormat(currentFormat.id)}
                                            className="p-3 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all group"
                                            title="Eliminar formato"
                                        >
                                            <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        </button>
                                    </div>

                                    {/* Editor Body */}
                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-12">
                                        <div className="max-w-3xl mx-auto space-y-12">
                                            {/* References Section */}
                                            <div className="space-y-4">
                                                <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">
                                                    <LinkIconLucide className="w-3.5 h-3.5" /> Referencias Inspiradoras
                                                </label>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {currentFormat.references?.map((ref, i) => (
                                                        <div key={i} className="flex items-center gap-3 p-2 pl-4 bg-zinc-50 rounded-lg group focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                                            <Globe className="w-4 h-4 text-zinc-300" />
                                                            <input
                                                                type="text"
                                                                value={ref}
                                                                onChange={(e) => {
                                                                    const newRefs = [...currentFormat.references];
                                                                    newRefs[i] = e.target.value;
                                                                    handleUpdateFormat(currentFormat.id, { references: newRefs });
                                                                }}
                                                                placeholder="https://..."
                                                                className="flex-1 bg-transparent border-none p-0 text-sm font-medium text-blue-600 focus:ring-0 placeholder:text-zinc-300"
                                                            />
                                                            <button onClick={() => {
                                                                const newRefs = currentFormat.references.filter((_, idx) => idx !== i);
                                                                handleUpdateFormat(currentFormat.id, { references: newRefs });
                                                            }} className="p-2 text-zinc-300 hover:text-zinc-500 hover:bg-zinc-200 rounded-md transition-all"><X className="w-3.5 h-3.5" /></button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => handleUpdateFormat(currentFormat.id, { references: [...(currentFormat.references || []), ""] })}
                                                        className="text-xs font-bold text-zinc-400 hover:text-blue-600 flex items-center gap-2 px-2 py-1 transition-colors w-fit"
                                                    >
                                                        <Plus className="w-3 h-3" /> Añadir Link
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="h-px bg-zinc-100 w-full" />

                                            {/* Structure Editor */}
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Estructura del Guion</label>
                                                </div>
                                                <div className="relative group">
                                                    <textarea
                                                        className="w-full bg-white text-base leading-relaxed text-zinc-700 min-h-[500px] font-medium resize-none focus:outline-none placeholder:text-zinc-200"
                                                        value={currentFormat.structure}
                                                        onChange={(e) => handleUpdateFormat(currentFormat.id, { structure: e.target.value })}
                                                        placeholder={`Define la estructura paso a paso...\n\n1. Gancho (0-3s)\n2. Problema\n3. Solución...`}
                                                        spellCheck={false}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
        }
    };

    // --- Sidebar Item (Styled like Main Sidebar) ---
    const renderSidebarItem = (item: MenuItem, isSubItem = false) => {
        const isActive = activeSection === item.id;
        return (
            <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-all duration-300 relative group active:scale-95",
                    isActive
                        ? "text-[#2563EB] bg-blue-50/40 font-bold"
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-white hover:shadow-sm",
                    !isSidebarOpen && "justify-center px-2"
                )}
                title={!isSidebarOpen ? item.label : undefined}
            >
                {isActive && (
                    <div className={cn("absolute left-0 w-1 h-4 bg-[#2563EB] rounded-r-full", !isSidebarOpen && "left-0.5")} />
                )}

                <item.icon
                    className={cn(
                        "w-4 h-4 transition-all duration-300",
                        isActive ? "text-[#2563EB] scale-110" : "text-zinc-400 group-hover:text-zinc-600"
                    )}
                    strokeWidth={2.5}
                />
                {isSidebarOpen && <span className="truncate animate-in fade-in duration-200">{item.label}</span>}
            </button>
        );
    };

    return (
        <div className="flex flex-row h-screen w-full bg-[var(--color-background)]">

            {/* Strategy Sub-Sidebar (Fixed Width, Styled like Main Sidebar) */}
            {/* Sidebar Redesign - Bento Style / Full Height */}
            <div className={cn(
                "flex flex-col shrink-0 bg-white border-r border-zinc-200 h-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden relative",
                isSidebarOpen ? "w-80" : "w-[72px]"
            )}>
                {/* Toggle Button */}
                <div className="absolute top-4 right-4 z-20">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-900 bg-white/50 hover:bg-white rounded-full transition-all"
                    >
                        {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
                    </button>
                </div>

                {/* CONTENT CONTAINER */}
                <div className="flex flex-col h-full p-4 overflow-y-auto custom-scrollbar">

                    {/* HEADER */}
                    <div className={cn("shrink-0 px-2 py-2 mb-6 transition-all flex items-center justify-between", !isSidebarOpen && "justify-center")}>
                        {isSidebarOpen ? (
                            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Estrategia</h2>
                        ) : (
                            <div className="w-1 h-4 bg-zinc-200 rounded-full" />
                        )}
                    </div>

                    {/* GROUP 0: GENERAL */}
                    <div className="mb-2">
                        <div className="flex flex-col gap-1">
                            {menuItems.slice(0, 1).map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className={cn(
                                        "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 w-full",
                                        activeSection === item.id
                                            ? "bg-blue-50/50 text-blue-600 font-medium"
                                            : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                                    )}
                                    title={!isSidebarOpen ? item.label : undefined}
                                >
                                    <div className={cn("shrink-0 flex items-center justify-center", !isSidebarOpen && "w-full")}>
                                        <item.icon className={cn(
                                            "w-4 h-4 transition-colors",
                                            activeSection === item.id ? "text-blue-600" : "text-zinc-400 group-hover:text-zinc-600"
                                        )} />
                                    </div>

                                    {isSidebarOpen && (
                                        <span className="text-sm truncate">{item.label}</span>
                                    )}

                                    {activeSection === item.id && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-full" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-zinc-100 mx-4 mb-6" />

                    {/* GROUP 1: CORE */}
                    <div className="mb-8">
                        {isSidebarOpen && (
                            <h3 className="px-3 text-[10px] uppercase font-bold text-zinc-400 tracking-[0.2em] mb-3 flex items-center gap-2">
                                <Box className="w-3 h-3" /> Core
                            </h3>
                        )}
                        <div className="flex flex-col gap-1">
                            {menuItems.slice(1, 4).map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className={cn(
                                        "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 w-full",
                                        activeSection === item.id
                                            ? "bg-blue-50/50 text-blue-600 font-medium"
                                            : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                                    )}
                                    title={!isSidebarOpen ? item.label : undefined}
                                >
                                    <div className={cn("shrink-0 flex items-center justify-center", !isSidebarOpen && "w-full")}>
                                        <item.icon className={cn(
                                            "w-4 h-4 transition-colors",
                                            activeSection === item.id ? "text-blue-600" : "text-zinc-400 group-hover:text-zinc-600"
                                        )} />
                                    </div>

                                    {isSidebarOpen && (
                                        <span className="text-sm truncate">{item.label}</span>
                                    )}

                                    {activeSection === item.id && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-full" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* GROUP 2: IDENTIDAD */}
                    <div className="mb-8">
                        {isSidebarOpen && (
                            <h3 className="px-3 text-[10px] uppercase font-bold text-zinc-400 tracking-[0.2em] mb-3 flex items-center gap-2">
                                <Fingerprint className="w-3 h-3" /> Identidad
                            </h3>
                        )}
                        <div className="flex flex-col gap-1">
                            {menuItems.slice(4, 8).map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className={cn(
                                        "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 w-full",
                                        activeSection === item.id
                                            ? "bg-blue-50/50 text-blue-600 font-medium"
                                            : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                                    )}
                                    title={!isSidebarOpen ? item.label : undefined}
                                >
                                    <div className={cn("shrink-0 flex items-center justify-center", !isSidebarOpen && "w-full")}>
                                        <item.icon className={cn(
                                            "w-4 h-4 transition-colors",
                                            activeSection === item.id ? "text-blue-600" : "text-zinc-400 group-hover:text-zinc-600"
                                        )} />
                                    </div>

                                    {isSidebarOpen && (
                                        <span className="text-sm truncate">{item.label}</span>
                                    )}

                                    {activeSection === item.id && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-full" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* GROUP 3: BIBLIOTECA */}
                    <div>
                        {isSidebarOpen && (
                            <h3 className="px-3 text-[10px] uppercase font-bold text-zinc-400 tracking-[0.2em] mb-3 flex items-center gap-2">
                                <Layout className="w-3 h-3" /> Biblioteca
                            </h3>
                        )}
                        <div className="flex flex-col gap-1">
                            <button
                                onClick={() => setActiveSection('formats')}
                                className={cn(
                                    "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 w-full",
                                    activeSection === 'formats'
                                        ? "bg-blue-50/50 text-blue-600 font-medium"
                                        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                                )}
                                title={!isSidebarOpen ? "Formatos" : undefined}
                            >
                                <div className={cn("shrink-0 flex items-center justify-center", !isSidebarOpen && "w-full")}>
                                    <Layout className={cn(
                                        "w-4 h-4 transition-colors",
                                        activeSection === 'formats' ? "text-blue-600" : "text-zinc-400 group-hover:text-zinc-600"
                                    )} />
                                </div>

                                {isSidebarOpen && (
                                    <span className="text-sm truncate">Formatos</span>
                                )}

                                {activeSection === 'formats' && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-full" />
                                )}
                            </button>
                        </div>
                    </div>

                </div>
            </div >


            {/* Main Content Area */}
            {
                activeSection === 'formats' ? (
                    // Formats has its own "sub-sidebar + content" layout inside renderContent
                    <div className="flex-1 min-w-0 bg-white/40">
                        {renderContent()}
                    </div>
                ) : (
                    // Standard Strategy Info Content
                    <div className="flex-1 min-w-0 bg-white/40 flex flex-col">
                        <div className="flex-1 h-full overflow-y-auto custom-scrollbar">
                            {renderContent()}
                        </div>
                    </div>
                )
            }

            {/* Create Format Modal */}
            {
                showCreateFormatModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="p-8 pb-6 text-center">
                                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Plus className="w-8 h-8 text-blue-600" />
                                </div>
                                <h3 className="text-2xl font-black text-zinc-900 mb-2">Nuevo Formato</h3>
                                <p className="text-sm text-zinc-500 font-medium">¿Qué tipo de contenido vas a estructurar hoy?</p>
                            </div>
                            <div className="p-6 pt-0 space-y-3">
                                {[
                                    { id: 'Video', icon: PlayCircle, desc: 'Estructura para Reels, TikToks...' },
                                    { id: 'Carrusel', icon: Layout, desc: 'Secuencia de imágenes deslizables.' },
                                    { id: 'Post', icon: FileText, desc: 'Imagen estática o texto simple.' }
                                ].map((opt: any) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleCreateFormat(opt.id)}
                                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-zinc-100 hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-md transition-all group text-left"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-white border border-zinc-100 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                            <opt.icon className="w-5 h-5 text-zinc-400 group-hover:text-blue-600 transition-colors" />
                                        </div>
                                        <div>
                                            <span className="block text-sm font-bold text-zinc-900 group-hover:text-blue-700 transition-colors">{opt.id}</span>
                                            <span className="block text-xs text-zinc-400">{opt.desc}</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 ml-auto text-zinc-200 group-hover:text-blue-400" />
                                    </button>
                                ))}
                            </div>
                            <div className="p-4 bg-zinc-50 border-t border-zinc-100 text-center">
                                <button onClick={() => setShowCreateFormatModal(false)} className="text-xs font-bold text-zinc-400 hover:text-zinc-600">Cancelar</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

// --- Helper Components ---

function Header({ title, subtitle }: { title: string, subtitle: string }) {
    return (
        <div className="mb-8 pb-6 border-b border-zinc-100">
            <h2 className="text-4xl font-black text-zinc-900 tracking-tighter mb-2">{title}</h2>
            <p className="text-lg text-zinc-500 font-medium">{subtitle}</p>
        </div>
    )
}

function IdentityBlock({ title, subtitle, propKey, inputs, onChange, className }: any) {
    const val = inputs[`esqueleto_${propKey}`] || '';
    return (
        <div className={cn("space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500", className)}>
            <Header title={title} subtitle={subtitle} />
            <div className="block">
                <div className="flex items-center justify-between mb-2">
                    <label className="pro-label mb-0">Definición de {title}</label>
                </div>
                <ProTextarea
                    placeholder={`Define tu estrategia de ${title.toLowerCase()} aquí...`}
                    className="min-h-[400px] text-sm leading-relaxed p-6 border-zinc-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl"
                    value={val}
                    onChange={(e) => onChange('esqueleto', propKey, e.target.value)}
                />
            </div>
        </div>
    )
}
