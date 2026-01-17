"use client";

import {
    Users, Target, Lightbulb, Layout,
    Fingerprint, MessageSquare, Box, Award,
    Plus, ChevronRight, Loader2, Trash2, Link as LinkIconLucide, X,
    Maximize2, ChevronLeft, PlayCircle, Image as ImageIcon, FileText, ChevronDown, Globe
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase";
import { debounce } from "lodash";
import { ProTextarea } from "@/components/ui/ProTextarea";
import { ProInput } from "@/components/ui/ProInput";

// --- Types ---
type SectionId =
    | 'avatar' | 'problem' | 'solution'
    | 'character' | 'personality' | 'product' | 'positioning'
    | 'formats';

interface MenuItem {
    id: SectionId;
    label: string;
    icon: any;
    description?: string;
}

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
    const [activeSection, setActiveSection] = useState<SectionId>('avatar');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [inputs, setInputs] = useState<Record<string, string>>({});
    const [formats, setFormats] = useState<Format[]>([]);
    const [selectedFormatId, setSelectedFormatId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ 'Video': true, 'Carrusel': true, 'Post': true });

    // UI State
    const [showCreateFormatModal, setShowCreateFormatModal] = useState(false);
    const [focusField, setFocusField] = useState<{
        label: string;
        value: string;
        onChange: (val: string) => void;
        placeholder?: string;
    } | null>(null);

    // Initial Fetch
    useEffect(() => {
        if (session?.user?.id) {
            Promise.all([fetchStrategyInputs(), fetchFormats()]).then(() => setLoading(false));

            // Check localStorage for sidebar preference
            const collapsed = localStorage.getItem('flow_sidebar_collapsed') === 'true';
            setSidebarCollapsed(collapsed);
        }
    }, [session]);

    const toggleSidebar = () => {
        const newState = !sidebarCollapsed;
        setSidebarCollapsed(newState);
        localStorage.setItem('flow_sidebar_collapsed', String(newState));
    };

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

        // Update focus field if it's open
        if (focusField) {
            setFocusField(prev => prev ? { ...prev, value } : null);
        }
    };

    // Auto-save logic for Formats
    const debouncedSaveFormat = useCallback(
        debounce(async (id: string, updates: Partial<Format>) => {
            setSaving(true);
            try {
                await supabase.from('formats').update({
                    ...updates,
                    updated_at: new Date().toISOString()
                }).eq('id', id);
            } finally {
                setSaving(false);
            }
        }, 1000),
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

    // --- Render Helpers ---



    const openFocus = (label: string, value: string, placeholder: string, onChange: (val: string) => void) => {
        setFocusField({ label, value, placeholder, onChange });
    };

    const ExpandableTextarea = ({ label, value, onChange, placeholder, rows = 3, className }: any) => (
        <div className="group relative space-y-2">
            <div className="flex items-center justify-between">
                <label className="pro-label mb-0">{label}</label>
                <button
                    onClick={() => openFocus(label, value, placeholder, onChange)}
                    className="p-1.5 rounded-md text-zinc-300 hover:text-[var(--color-brand)] hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
                    title="Maximizar (Modo Enfoque)"
                >
                    <Maximize2 className="w-3.5 h-3.5" />
                </button>
            </div>
            <ProTextarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className={cn("text-sm resize-y min-h-[100px]", className)}
            />
        </div>
    );

    const renderContent = () => {
        const contentPadding = "p-8 md:p-12 lg:p-16"; // Standard padding for content pages

        switch (activeSection) {
            // CORE
            case 'avatar': return (
                <div className={cn("space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto", contentPadding)}>
                    <Header title="¿A quién le hablas?" subtitle="Define tu avatar real, no demográfico." />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ProInput label="Edad Aprox." placeholder="Ej: 25-35 años" value={inputs['propuesta_avatar_edad'] || ''} onChange={(e) => handleInputChange('propuesta', 'avatar_edad', e.target.value)} />
                        <ProInput label="Género" placeholder="Ej: Mayoría mujeres" value={inputs['propuesta_avatar_genero'] || ''} onChange={(e) => handleInputChange('propuesta', 'avatar_genero', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ProInput label="Ciudad / Entorno" placeholder="Ej: Grandes ciudades, ritmo rápido" value={inputs['propuesta_avatar_ciudad'] || ''} onChange={(e) => handleInputChange('propuesta', 'avatar_ciudad', e.target.value)} />
                        <ProInput label="Nivel Económico / Momento" placeholder="Ej: Primeros trabajos, buscando estabilidad" value={inputs['propuesta_avatar_economia'] || ''} onChange={(e) => handleInputChange('propuesta', 'avatar_economia', e.target.value)} />
                    </div>
                    <ExpandableTextarea label="Intereses Reales" placeholder="¿Qué le interesa de verdad? (Miedos, deseos ocultos...)" rows={4} value={inputs['propuesta_avatar_intereses'] || ''} onChange={(val: string) => handleInputChange('propuesta', 'avatar_intereses', val)} />
                    <ExpandableTextarea label="Consumo de Contenido" placeholder="¿Qué ve en TikTok/IG a diario?" rows={3} value={inputs['propuesta_avatar_consumo'] || ''} onChange={(val: string) => handleInputChange('propuesta', 'avatar_consumo', val)} />
                </div>
            );
            case 'problem': return (
                <div className={cn("space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto", contentPadding)}>
                    <Header title="El Problema" subtitle="Diagnóstico profundo de tu audiencia." />
                    <div className="grid grid-cols-1 gap-8">
                        <ExpandableTextarea label="Problema Aparente (Superficial)" placeholder="Lo que 'creen' que les pasa..." rows={3} value={inputs['propuesta_problema_aparente'] || ''} onChange={(val: string) => handleInputChange('propuesta', 'problema_aparente', val)} />
                        <ExpandableTextarea label="Problema Real (Profundo)" placeholder="Lo que realmente les impide avanzar..." rows={4} className="border-blue-200 focus:border-blue-500 bg-blue-50/10" value={inputs['propuesta_problema_real'] || ''} onChange={(val: string) => handleInputChange('propuesta', 'problema_real', val)} />
                    </div>
                    <div className="p-6 bg-zinc-50 rounded-2xl space-y-6 border border-zinc-100">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest text-center">Viaje de Transformación</h4>
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <ProInput containerClassName="w-full" placeholder="Punto X (Dolor actual)" value={inputs['propuesta_punto_x'] || ''} onChange={(e) => handleInputChange('propuesta', 'punto_x', e.target.value)} />
                            <ChevronRight className="w-5 h-5 text-zinc-300 rotate-90 md:rotate-0 shrink-0" />
                            <ProInput containerClassName="w-full" placeholder="Punto Y (Deseo)" value={inputs['propuesta_punto_y'] || ''} onChange={(e) => handleInputChange('propuesta', 'punto_y', e.target.value)} />
                        </div>
                        <ExpandableTextarea placeholder="¿Qué cambia en ellos después de verte?" rows={2} value={inputs['propuesta_transformacion'] || ''} onChange={(val: string) => handleInputChange('propuesta', 'transformacion', val)} />
                    </div>
                </div>
            );
            case 'solution': return (
                <div className={cn("space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto", contentPadding)}>
                    <Header title="Tu Solución" subtitle="Tu papel en la historia." />
                    <ExpandableTextarea label="Propuesta de Valor Única" placeholder="¿Qué aportas de forma clara y diferente?" rows={5} className="text-base" value={inputs['propuesta_solucion_que'] || ''} onChange={(val: string) => handleInputChange('propuesta', 'solucion_que', val)} />
                    <ExpandableTextarea label="El Mecanismo" placeholder="¿Cuál es tu método o vehículo?" rows={3} value={inputs['propuesta_solucion_porque'] || ''} onChange={(val: string) => handleInputChange('propuesta', 'solucion_porque', val)} />
                    <ExpandableTextarea label="La Promesa" placeholder="¿Qué pueden esperar si te siguen?" rows={2} value={inputs['propuesta_solucion_esperanza'] || ''} onChange={(val: string) => handleInputChange('propuesta', 'solucion_esperanza', val)} />
                </div>
            );

            // IDENTITY (4Ps)
            case 'character': return <IdentityBlock title="Personaje" subtitle="¿Quién protagoniza tu contenido? Arquetipos y roles." propKey="personaje" inputs={inputs} onChange={handleInputChange} openFocus={openFocus} className={contentPadding} />;
            case 'personality': return <IdentityBlock title="Personalidad" subtitle="¿Qué tono vas a proyectar? (Serio, Divertido, Rebelde...)" propKey="personalidad" inputs={inputs} onChange={handleInputChange} openFocus={openFocus} className={contentPadding} />;
            case 'product': return <IdentityBlock title="Producto" subtitle="¿Qué estás ofreciendo o vendiendo al final?" propKey="producto" inputs={inputs} onChange={handleInputChange} openFocus={openFocus} className={contentPadding} />;
            case 'positioning': return <IdentityBlock title="Posicionamiento" subtitle="¿Qué lugar ocupas en su mente frente a la competencia?" propKey="posicionamiento" inputs={inputs} onChange={handleInputChange} openFocus={openFocus} className={contentPadding} />;

            // LIBRARY
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

                return (
                    <div className="flex h-full animate-in fade-in duration-500">
                        {/* Custom Sidebar for Formats - Extended Look */}
                        <div className="w-72 flex flex-col shrink-0 border-r border-zinc-100 bg-[var(--color-surface)]/30 backdrop-blur-sm">
                            <div className="p-6 border-b border-zinc-100/50 flex items-center justify-between sticky top-0 z-10">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                                    <Layout className="w-3.5 h-3.5" />
                                    Biblioteca
                                </h3>
                                <button
                                    onClick={() => setShowCreateFormatModal(true)}
                                    className="p-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-95"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
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
                        <div className="flex-1 overflow-hidden flex flex-col bg-white">
                            {!currentFormat ? (
                                <div className="flex flex-col items-center justify-center h-full text-zinc-300 gap-6 animate-in zoom-in-95 duration-500">
                                    <div className="w-24 h-24 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100">
                                        <Layout className="w-10 h-10 text-zinc-200" />
                                    </div>
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-300">Selecciona un formato</p>
                                </div>
                            ) : (
                                <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                                                    <button
                                                        onClick={() => openFocus("Estructura", currentFormat.structure, "Paso 1...", (val) => handleUpdateFormat(currentFormat.id, { structure: val }))}
                                                        className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 hover:text-blue-600 transition-colors uppercase tracking-wider"
                                                    >
                                                        <Maximize2 className="w-3 h-3" /> Ampliar
                                                    </button>
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

    // --- Refined Render Helpers ---
    const renderSidebarItem = (item: MenuItem, isSubItem = false) => {
        const isActive = activeSection === item.id;
        return (
            <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                    "w-full flex items-center justify-between group transition-all duration-300 relative overflow-hidden outline-none",
                    isSubItem ? "py-2 px-3 pl-8" : "p-3 mb-1",
                    isActive ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-600"
                )}
            >
                {/* Background active indicator */}
                {isActive && (
                    <div className="absolute inset-0 bg-white rounded-lg shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-zinc-100/50 animate-in fade-in zoom-in-95 duration-200" />
                )}

                {/* Hover effect */}
                {!isActive && (
                    <div className="absolute inset-0 bg-zinc-50/0 group-hover:bg-zinc-50/50 rounded-lg transition-all duration-300" />
                )}

                <div className="flex items-center gap-3 relative z-10 w-full">
                    <div className={cn(
                        "transition-all duration-300 p-1.5 rounded-md",
                        isActive
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20 rotate-[-4deg]"
                            : "bg-transparent group-hover:bg-white group-hover:shadow-sm"
                    )}>
                        <item.icon className={cn("w-4 h-4 transition-transform", isActive && "scale-110")} />
                    </div>
                    <span className={cn(
                        "text-xs font-medium tracking-wide transition-all",
                        isActive ? "font-bold text-zinc-900 translate-x-1" : "group-hover:translate-x-1"
                    )}>
                        {item.label}
                    </span>

                    {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    )}
                </div>
            </button>
        );
    };

    return (
        <div className="flex flex-col h-screen w-full bg-[var(--color-background)]">
            {/* Top Bar (if needed, currently managed in layout) */}

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Navigation */}
                <div
                    className={cn(
                        "flex flex-col border-r border-zinc-100 bg-[var(--color-surface)]/50 backdrop-blur-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                        sidebarCollapsed ? "w-0 -ml-4 opacity-0 overflow-hidden" : "w-64 opacity-100"
                    )}
                >
                    <div className="flex-1 overflow-y-auto px-4 py-8 space-y-8 custom-scrollbar">

                        {/* CORE SECTION */}
                        <div className="space-y-2 animate-in slide-in-from-left-4 duration-500 delay-100">
                            <h4 className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 mb-4 flex items-center gap-2">
                                <Box className="w-3 h-3" /> Core
                            </h4>
                            {[
                                { id: 'avatar', label: 'Avatar', icon: Users },
                                { id: 'problem', label: 'Problema', icon: Fingerprint },
                                { id: 'solution', label: 'Solución', icon: Lightbulb }
                            ].map((item: any) => renderSidebarItem(item))}
                        </div>

                        {/* SEPARATOR */}
                        <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent w-full opacity-60" />

                        {/* IDENTITY SECTION */}
                        <div className="space-y-2 animate-in slide-in-from-left-4 duration-500 delay-200">
                            <h4 className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 mb-4 flex items-center gap-2">
                                <Award className="w-3 h-3" /> Identidad
                            </h4>
                            {[
                                { id: 'character', label: 'Personaje', icon: Users },
                                { id: 'personality', label: 'Personalidad', icon: MessageSquare },
                                { id: 'product', label: 'Producto', icon: Box },
                                { id: 'positioning', label: 'Posicionamiento', icon: Target }
                            ].map((item: any) => renderSidebarItem(item))}
                        </div>

                        {/* SEPARATOR */}
                        <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent w-full opacity-60" />

                        {/* LIBRARY SECTION */}
                        <div className="space-y-2 animate-in slide-in-from-left-4 duration-500 delay-300">
                            <h4 className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 mb-4 flex items-center gap-2">
                                <Layout className="w-3 h-3" /> Biblioteca
                            </h4>
                            {renderSidebarItem({ id: 'formats', label: 'Formatos', icon: Layout })}
                        </div>

                    </div>

                    {/* Collapser Toggle */}
                    <div className="p-4 border-t border-zinc-100 bg-white/50 backdrop-blur-sm flex justify-center">
                        <button
                            onClick={toggleSidebar}
                            className="p-2 rounded-full text-zinc-300 hover:text-zinc-600 hover:bg-zinc-100 transition-all active:scale-95"
                            title="Contraer Menú"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-w-0 bg-white/40 relative flex flex-col">
                    {/* Floating Toggle Button (Visible when sidebar is collapsed) */}
                    {sidebarCollapsed && (
                        <div className="absolute top-6 left-6 z-20 animate-in fade-in slide-in-from-left-4 duration-300">
                            <button
                                onClick={toggleSidebar}
                                className="bg-zinc-900 hover:bg-black text-white p-3 rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all group"
                            >
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    )}

                    <div className="flex-1 h-full overflow-y-auto custom-scrollbar">
                        {renderContent()}
                    </div>
                </div>
            </div>

            {/* Modals & Portals */}
            {/* Create Format Modal */}
            {showCreateFormatModal && (
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
            )}

            {/* Focus Field Modal */}
            {focusField && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-xl" onClick={() => setFocusField(null)} />
                    <div className="relative bg-white border border-zinc-200 w-full max-w-4xl h-[85vh] rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                            <div>
                                <h3 className="text-lg font-black tracking-tight text-zinc-900 flex items-center gap-2">
                                    <Maximize2 className="w-4 h-4 text-blue-600" />
                                    {focusField.label}
                                </h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5 uppercase tracking-wider">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Guardado
                                </span>
                                <button
                                    onClick={() => setFocusField(null)}
                                    className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-zinc-400 hover:text-zinc-900" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 p-0 overflow-hidden relative">
                            <textarea
                                autoFocus
                                className="w-full h-full p-8 md:p-12 text-lg md:text-xl font-medium text-zinc-800 focus:outline-none resize-none leading-relaxed bg-transparent font-serif placeholder:font-sans placeholder:text-zinc-200"
                                value={focusField.value}
                                onChange={(e) => focusField.onChange(e.target.value)}
                                placeholder={focusField.placeholder}
                            />
                            <div className="absolute bottom-6 right-6 text-[10px] font-mono text-zinc-300 pointer-events-none">Flow OS Editor v2.0</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
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

function IdentityBlock({ title, subtitle, propKey, inputs, onChange, openFocus, className }: any) {
    const val = inputs[`esqueleto_${propKey}`] || '';
    return (
        <div className={cn("space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto", className)}>
            <Header title={title} subtitle={subtitle} />
            <div className="block">
                <div className="flex items-center justify-between mb-2">
                    <label className="pro-label mb-0">Definición de {title}</label>
                    <button
                        onClick={() => openFocus(title, val, `Define tu estrategia de ${title.toLowerCase()} aquí...`, (v: string) => onChange('esqueleto', propKey, v))}
                        className="flex items-center gap-2 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:underline uppercase tracking-wider"
                    >
                        <Maximize2 className="w-3 h-3" /> Pantalla Completa
                    </button>
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
