"use client";

import { useAuth } from "@/components/AuthProvider";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    Video,
    Layers,
    Globe,
    X,
    Check,
    Calendar as CalendarIcon,
    Trash2,
    Loader2,
    Zap,
    Search,
    FileText,
    Layout,
    ExternalLink,
    Edit
} from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";

type EventType = 'video' | 'carousel' | 'personal';

interface CalendarEvent {
    id: string;
    date: string;
    title: string;
    type: EventType;
    user_id?: string;
    script_id?: string; // If linked to a script
}

interface ScriptSimple {
    id: string;
    title: string;
    type: EventType;
    status: string;
    scheduled_date?: string;
}

interface ScriptFull extends ScriptSimple {
    hook?: string;
    body?: string;
    slides?: any[];
    strategy_message?: string;
}

export default function CalendarPage() {
    const { session } = useAuth();
    const supabase = createClient();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'personal' | 'admin'>('personal');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [newEventTitle, setNewEventTitle] = useState("");
    const [newEventType, setNewEventType] = useState<EventType>('personal');

    // Script Management State
    const [availableScripts, setAvailableScripts] = useState<ScriptSimple[]>([]);
    const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
    const [isCreatingScript, setIsCreatingScript] = useState(false);
    const [scriptSearch, setScriptSearch] = useState("");

    // Time Management State
    const [selectedTime, setSelectedTime] = useState("12:00");

    // Preview Modal State
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewScript, setPreviewScript] = useState<ScriptFull | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    // Fetch scripts for the selector
    useEffect(() => {
        if (isModalOpen && (newEventType === 'video' || newEventType === 'carousel')) {
            fetchAvailableScripts();
        }
    }, [isModalOpen, newEventType]);

    const fetchAvailableScripts = async () => {
        const { data } = await supabase
            .from('scripts')
            .select('id, title, type, status, scheduled_date')
            .eq('user_id', session?.user?.id)
            .is('deleted_at', null)
            .eq('type', newEventType) // Filter by selected type
            .order('updated_at', { ascending: false });

        if (data) {
            setAvailableScripts(data as any[]);
        }
    };

    const fetchScriptDetails = async (id: string) => {
        setLoadingPreview(true);
        const { data } = await supabase
            .from('scripts')
            .select(`*, slides (*)`)
            .eq('id', id)
            .single();

        if (data) {
            setPreviewScript({
                ...data,
                slides: data.slides?.sort((a: any, b: any) => a.position - b.position)
            });
            setShowPreviewModal(true);
        }
        setLoadingPreview(false);
    };

    useEffect(() => {
        if (session?.user?.id) {
            fetchEvents();
        }
    }, [session, viewMode]);

    const fetchEvents = async () => {
        setLoading(true);

        if (viewMode === 'personal') {
            // Fetch custom calendar events
            const { data: calendarData } = await supabase
                .from('calendar_events')
                .select('*')
                .eq('user_id', session?.user?.id)
                .is('deleted_at', null);

            // Fetch scheduled scripts
            const { data: scriptData } = await supabase
                .from('scripts')
                .select('id, title, type, scheduled_date')
                .eq('user_id', session?.user?.id)
                .is('deleted_at', null)
                .not('scheduled_date', 'is', null);

            let combinedEvents: CalendarEvent[] = [];

            if (calendarData) {
                combinedEvents = calendarData.map(e => ({
                    id: e.id,
                    date: e.date,
                    title: e.title,
                    type: e.type as EventType,
                    user_id: e.user_id
                }));
            }

            if (scriptData) {
                const scriptEvents = scriptData.map(s => ({
                    id: s.id,
                    date: s.scheduled_date!,
                    title: s.title,
                    type: s.type as EventType,
                    user_id: session?.user?.id
                }));
                combinedEvents = [...combinedEvents, ...scriptEvents];
            }

            setEvents(combinedEvents);
        } else {
            // Fetch admin events (read-only for all users)
            const { data: adminData } = await supabase
                .from('admin_events')
                .select('*')
                .is('deleted_at', null);

            if (adminData) {
                setEvents(adminData.map(e => ({
                    id: e.id,
                    date: e.date,
                    title: e.title,
                    type: e.type as EventType
                })));
            }
        }

        setLoading(false);
    };

    const handleAddEvent = async () => {
        console.log('handleAddEvent triggered', { selectedDate, newEventType, newEventTitle, selectedTime });

        if (!selectedDate) {
            alert("Error: No selected date");
            return;
        }

        // Combine Date + Time
        const dateTimeString = `${selectedDate}T${selectedTime}:00`;
        const dateTime = new Date(dateTimeString);

        if (isNaN(dateTime.getTime())) {
            alert(`Error: Invalid Date Time generated: ${dateTimeString}`);
            return;
        }

        const dateTimeIso = dateTime.toISOString();
        console.log('Date payload:', dateTimeIso);

        if (newEventType === 'personal') {
            if (!newEventTitle) return;
            const { data, error } = await supabase
                .from('calendar_events')
                .insert({
                    user_id: session?.user?.id,
                    title: newEventTitle,
                    type: newEventType,
                    date: dateTimeIso
                })
                .select()
                .single();

            if (data) {
                setEvents([...events, data]);
                setIsModalOpen(false);
                setNewEventTitle("");
            } else if (error) {
                console.error("Error creating event:", error);
                alert("Error al crear el evento. Inténtalo de nuevo.");
            }
        } else {
            // Logic for Video/Carousel (Scripts)
            if (isCreatingScript) {
                // Create NEW script and schedule it
                if (!newEventTitle) return;
                const { data: newScript } = await supabase
                    .from('scripts')
                    .insert({
                        user_id: session?.user?.id,
                        title: newEventTitle,
                        type: newEventType,
                        status: 'scheduled',
                        scheduled_date: dateTimeIso,
                        body: '<div><br></div>'
                    })
                    .select('id, title, type, scheduled_date')
                    .single();

                if (newScript) {
                    // Redirect to editor immediately
                    window.location.href = `/scripts?id=${newScript.id}`;
                }

            } else {
                // Link EXISTING script
                if (!selectedScriptId) return;
                const { error } = await supabase
                    .from('scripts')
                    .update({ scheduled_date: dateTimeIso, status: 'scheduled' })
                    .eq('id', selectedScriptId);

                if (!error) {
                    const linkedScript = availableScripts.find(s => s.id === selectedScriptId);
                    if (linkedScript) {
                        setEvents([...events, {
                            id: linkedScript.id,
                            title: linkedScript.title,
                            type: linkedScript.type as EventType,
                            date: dateTimeIso,
                            user_id: session?.user?.id
                        }]);
                    }
                    setIsModalOpen(false);
                    setSelectedScriptId(null);
                }
            }
        }
    };

    const handleDeleteEvent = async (id: string, type: EventType) => {
        if (type === 'personal') {
            const { error } = await supabase
                .from('calendar_events')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

            if (!error) {
                setEvents(events.filter(e => e.id !== id));
            }
        } else {
            // Unschedule script (don't delete)
            const { error } = await supabase
                .from('scripts')
                .update({ scheduled_date: null, status: 'draft' })
                .eq('id', id);

            if (!error) {
                setEvents(events.filter(e => e.id !== id));
            }
        }
    };

    const daysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const days = new Date(year, month + 1, 0).getDate();

        const daysArray = [];
        // Fill empty days for previous month
        for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
            daysArray.push(null);
        }
        for (let i = 1; i <= days; i++) {
            daysArray.push(new Date(year, month, i));
        }
        return daysArray;
    }, [currentDate]);

    // Helper to get local date string YYYY-MM-DD
    const getLocalDateKey = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });
    const year = currentDate.getFullYear();

    const changeMonth = (offset: number) => {
        setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + offset)));
    };

    return (
        <div className="max-w-[1600px] mx-auto h-[100vh] flex flex-col pt-8 pb-4 px-6 font-sans text-zinc-900 bg-transparent overflow-hidden">

            <div className="shrink-0 mb-6">
                <PageHeader
                    title="Calendario"
                    breadcrumb={[
                        { label: 'Zona Creador', href: '#' },
                        { label: 'Calendario' }
                    ]}
                    action={
                        <div className="flex bg-white border border-zinc-200 p-1 rounded-xl shadow-sm">
                            <button
                                onClick={() => setViewMode('personal')}
                                className={cn(
                                    "px-6 py-2 rounded-lg text-xs font-semibold transition-all duration-200",
                                    viewMode === 'personal' ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                                )}
                            >
                                Mi Calendario
                            </button>
                            <button
                                onClick={() => setViewMode('admin')}
                                className={cn(
                                    "px-6 py-2 rounded-lg text-xs font-semibold transition-all duration-200",
                                    viewMode === 'admin' ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                                )}
                            >
                                Novedades
                            </button>
                        </div>
                    }
                />
            </div>

            <div className="flex-1 flex gap-8 min-h-0 animate-in fade-in duration-700">
                {/* CALENDAR MAIN */}
                <div className="flex-1 flex flex-col bg-white border border-zinc-200 rounded-[32px] shadow-sm overflow-hidden min-h-0">
                    <div className="bg-zinc-50/50 border-b border-zinc-100 px-10 py-6 flex items-center justify-between shrink-0">
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-zinc-900 capitalize">{monthName} {year}</h2>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mt-0.5">Vista Mensual Estratégica</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => changeMonth(-1)} className="p-2.5 rounded-xl hover:bg-white hover:shadow-md transition-all text-zinc-400 hover:text-zinc-900 border border-transparent hover:border-zinc-100"><ChevronLeft className="w-5 h-5" /></button>
                            <button onClick={() => setCurrentDate(new Date())} className="px-5 py-2.5 rounded-xl bg-white border border-zinc-200 text-xs font-bold text-zinc-600 hover:border-zinc-900 transition-all">Hoy</button>
                            <button onClick={() => changeMonth(1)} className="p-2.5 rounded-xl hover:bg-white hover:shadow-md transition-all text-zinc-400 hover:text-zinc-900 border border-transparent hover:border-zinc-100"><ChevronRight className="w-5 h-5" /></button>
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-7 min-h-0">
                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                            <div key={day} className="bg-zinc-50/30 border-b border-zinc-100 py-3 text-center text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{day}</div>
                        ))}

                        {loading ? (
                            <div className="col-span-7 flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-zinc-200" /></div>
                        ) : daysInMonth.map((date, i) => {
                            if (!date) return <div key={i} className="border-r border-b border-zinc-50 bg-zinc-50/10" />;

                            const dateStr = getLocalDateKey(date);
                            const dayEvents = events.filter(e => {
                                const eventDateStr = getLocalDateKey(new Date(e.date));
                                return eventDateStr === dateStr;
                            });
                            const isToday = getLocalDateKey(new Date()) === dateStr;

                            return (
                                <div
                                    key={i}
                                    onClick={() => {
                                        if (viewMode === 'personal') {
                                            setSelectedDate(dateStr);
                                            // Reset modal state
                                            setNewEventTitle("");
                                            setNewEventType('personal');
                                            setSelectedScriptId(null);
                                            setIsCreatingScript(false);
                                            setSelectedTime("12:00");
                                            setIsModalOpen(true);
                                        }
                                    }}
                                    className={cn(
                                        "border-r border-b border-zinc-100 p-2 min-h-[100px] transition-colors flex flex-col",
                                        viewMode === 'personal' && "hover:bg-zinc-50/50 cursor-pointer group",
                                        viewMode === 'admin' && "cursor-default",
                                        isToday && "bg-blue-50/30"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={cn(
                                            "text-xs font-black w-7 h-7 flex items-center justify-center rounded-lg transition-all",
                                            isToday ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-zinc-400 group-hover:text-zinc-900"
                                        )}>
                                            {date.getDate()}
                                        </span>
                                    </div>
                                    <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 pr-1">
                                        {dayEvents.map(event => (
                                            <div
                                                key={event.id}
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent opening adding modal
                                                    if (event.type === 'video' || event.type === 'carousel') {
                                                        fetchScriptDetails(event.id);
                                                    }
                                                }}
                                                className={cn(
                                                    "group/event relative px-2 py-1.5 rounded-lg text-[9px] font-bold truncate flex items-center gap-1.5 shadow-sm border transition-all hover:scale-[1.02]",
                                                    event.type === 'video' ? "bg-blue-50 text-blue-700 border-blue-100 cursor-pointer hover:bg-blue-100" :
                                                        event.type === 'carousel' ? "bg-purple-50 text-purple-700 border-purple-100 cursor-pointer hover:bg-purple-100" :
                                                            "bg-zinc-900 text-white border-zinc-800"
                                                )}
                                            >
                                                {event.type === 'video' ? <Video className="w-2.5 h-2.5" /> :
                                                    event.type === 'carousel' ? <Layers className="w-2.5 h-2.5" /> :
                                                        <Globe className="w-2.5 h-2.5" />}
                                                <span className="truncate flex-1">{event.title}</span>
                                                <span className="text-[7px] opacity-60 font-normal shrink-0 group-hover/event:hidden">
                                                    {new Date(event.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {viewMode === 'personal' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteEvent(event.id, event.type);
                                                        }}
                                                        className="hidden group-hover/event:flex absolute right-1 top-1/2 -translate-y-1/2 p-1 bg-white/20 hover:bg-white/40 rounded-full transition-all"
                                                    >
                                                        <Trash2 className="w-3 h-3 text-current" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* SIDEBAR STATUS */}
                <div className="w-80 flex flex-col gap-6 shrink-0 min-h-0">
                    <div className="bg-white border border-zinc-200 rounded-[24px] p-6 relative overflow-hidden shadow-xl shadow-zinc-200/50 group shrink-0 h-40 flex flex-col justify-center">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 blur-[50px] group-hover:bg-blue-100/50 transition-all duration-700" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400">Status Semanal</span>
                            </div>
                            <h3 className="text-3xl font-black tracking-tighter mb-1 text-zinc-900">3 Posts</h3>
                            <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">Algoritmo optimizado. <span className="text-blue-600 font-bold">¡Bien!</span></p>
                        </div>
                    </div>

                    <div className="flex-1 bg-white border border-zinc-200 rounded-[32px] p-8 shadow-sm flex flex-col min-h-0">
                        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-6 shrink-0">Próximos Eventos</h4>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                            {events.length === 0 ? (
                                <div className="text-center py-10 opacity-20">
                                    <CalendarIcon className="w-8 h-8 mx-auto mb-2" />
                                    <p className="text-[10px] font-black uppercase">Sin planes</p>
                                </div>
                            ) : events
                                .filter(e => new Date(e.date) >= new Date())
                                .sort((a, b) => a.date.localeCompare(b.date))
                                .map(event => (
                                    <div key={event.id} className="group flex items-start gap-4 p-4 rounded-2xl hover:bg-zinc-50 border border-transparent hover:border-zinc-100 transition-all">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border",
                                            event.type === 'video' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                event.type === 'carousel' ? "bg-purple-50 text-purple-700 border-purple-100" :
                                                    "bg-zinc-900 text-white border-zinc-800"
                                        )}>
                                            {event.type === 'video' ? <Video className="w-5 h-5" /> :
                                                event.type === 'carousel' ? <Layers className="w-5 h-5" /> :
                                                    <Globe className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-zinc-900 truncate mb-0.5">{event.title}</p>
                                            <p className="text-[10px] font-bold text-zinc-400">
                                                {new Date(event.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} • {new Date(event.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        {viewMode === 'personal' && event.user_id && (
                                            <button onClick={() => handleDeleteEvent(event.id, event.type)} className="opacity-0 group-hover:opacity-100 p-2 text-zinc-300 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                                        )}
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL NUEVO EVENTO */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                        <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                        <div className="relative bg-white border border-zinc-200 w-full max-w-sm rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95 duration-400 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full" />

                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <h3 className="text-2xl font-black tracking-tighter text-zinc-900">Nuevo Evento</h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-zinc-50 rounded-2xl transition-all text-zinc-300 hover:text-zinc-950"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="space-y-6 relative z-10">
                                {/* Type Selector */}
                                <div className="flex bg-zinc-100 p-1 rounded-xl mb-4">
                                    <button
                                        onClick={() => { setNewEventType('video'); setIsCreatingScript(false); setSelectedScriptId(null); }}
                                        className={cn("flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2", newEventType === 'video' ? "bg-white text-blue-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}
                                    >
                                        <Video className="w-3.5 h-3.5" /> Video
                                    </button>
                                    <button
                                        onClick={() => { setNewEventType('carousel'); setIsCreatingScript(false); setSelectedScriptId(null); }}
                                        className={cn("flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2", newEventType === 'carousel' ? "bg-white text-purple-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}
                                    >
                                        <Layers className="w-3.5 h-3.5" /> Carousel
                                    </button>
                                    <button
                                        onClick={() => { setNewEventType('personal'); setIsCreatingScript(false); setSelectedScriptId(null); }}
                                        className={cn("flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2", newEventType === 'personal' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}
                                    >
                                        <Globe className="w-3.5 h-3.5" /> Evento
                                    </button>
                                </div>

                                {/* Dynamic Input based on Type */}
                                {newEventType === 'personal' ? (
                                    <div className="space-y-2">
                                        <input
                                            className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all placeholder:text-zinc-200"
                                            placeholder="Título del evento..."
                                            value={newEventTitle}
                                            onChange={(e) => setNewEventTitle(e.target.value)}
                                            autoFocus
                                        />
                                        <div className="flex bg-zinc-50 border border-zinc-100 p-1 rounded-2xl">
                                            <div className="px-4 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider border-r border-zinc-200 flex items-center gap-2">
                                                <Clock className="w-4 h-4" /> Hora
                                            </div>
                                            <input
                                                type="time"
                                                className="flex-1 bg-transparent px-4 py-3 text-sm font-bold text-zinc-900 outline-none text-center"
                                                value={selectedTime}
                                                onChange={(e) => setSelectedTime(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex bg-zinc-100 p-1 rounded-xl">
                                            <button
                                                onClick={() => setIsCreatingScript(false)}
                                                className={cn("flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all", !isCreatingScript ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600")}
                                            >
                                                Existente
                                            </button>
                                            <button
                                                onClick={() => setIsCreatingScript(true)}
                                                className={cn("flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all", isCreatingScript ? "bg-white text-blue-600 shadow-sm" : "text-zinc-400 hover:text-zinc-600")}
                                            >
                                                Nuevo
                                            </button>
                                        </div>

                                        {isCreatingScript ? (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <input
                                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all placeholder:text-zinc-300"
                                                    placeholder="Título del guion..."
                                                    value={newEventTitle}
                                                    onChange={(e) => setNewEventTitle(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>
                                        ) : (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="relative">
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                                    <input
                                                        className="w-full pl-11 bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-xs font-bold text-zinc-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all placeholder:text-zinc-300"
                                                        placeholder="Buscar guion..."
                                                        value={scriptSearch}
                                                        onChange={(e) => setScriptSearch(e.target.value)}
                                                    />
                                                </div>
                                                <div className="max-h-[150px] overflow-y-auto custom-scrollbar border border-zinc-100 rounded-xl bg-zinc-50/50 p-1">
                                                    {availableScripts.filter(s => s.title.toLowerCase().includes(scriptSearch.toLowerCase())).length === 0 ? (
                                                        <div className="p-4 text-center text-[10px] text-zinc-400 font-bold uppercase">Sin resultados</div>
                                                    ) : (
                                                        availableScripts
                                                            .filter(s => s.title.toLowerCase().includes(scriptSearch.toLowerCase()))
                                                            .map(script => (
                                                                <button
                                                                    key={script.id}
                                                                    onClick={() => setSelectedScriptId(script.id)}
                                                                    className={cn(
                                                                        "w-full text-left p-3 rounded-lg text-xs font-bold flex items-center gap-3 transition-all mb-0.5",
                                                                        selectedScriptId === script.id ? "bg-zinc-900 text-white shadow-md scale-[1.02]" : "hover:bg-white hover:text-zinc-900 text-zinc-500",
                                                                        script.scheduled_date && "opacity-50"
                                                                    )}
                                                                >
                                                                    <div className="flex-1 flex items-center gap-3 min-w-0">
                                                                        {script.type === 'video' ? <Video className="w-3 h-3 opacity-70 shrink-0" /> : <Layers className="w-3 h-3 opacity-70 shrink-0" />}
                                                                        <span className="truncate">{script.title}</span>
                                                                    </div>
                                                                    {script.scheduled_date && (
                                                                        <span className="text-[8px] font-black uppercase tracking-wider bg-zinc-200 text-zinc-500 px-1.5 py-0.5 rounded-md shrink-0">Agendado</span>
                                                                    )}
                                                                </button>
                                                            ))
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex bg-zinc-50 border border-zinc-100 p-1 rounded-2xl mt-4">
                                            <div className="px-4 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider border-r border-zinc-200 flex items-center gap-2">
                                                <Clock className="w-4 h-4" /> Hora
                                            </div>
                                            <input
                                                type="time"
                                                className="flex-1 bg-transparent px-4 py-3 text-sm font-bold text-zinc-900 outline-none text-center"
                                                value={selectedTime}
                                                onChange={(e) => setSelectedTime(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleAddEvent}
                                    disabled={newEventType !== 'personal' && !isCreatingScript && !selectedScriptId}
                                    className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all mt-4 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Check className="w-4 h-4" /> {isCreatingScript ? "Crear y Agendar" : "Agendar"}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* SCRIPT PREVIEW MODAL */}
            {
                showPreviewModal && previewScript && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                        <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-md" onClick={() => setShowPreviewModal(false)} />
                        <div className="relative bg-white border border-zinc-200 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-400 flex flex-col max-h-[85vh]">

                            {/* Header */}
                            <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between shrink-0 bg-white relative z-20">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border",
                                        previewScript.type === 'video' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-purple-50 text-purple-600 border-purple-100"
                                    )}>
                                        {previewScript.type === 'video' ? <Video className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black tracking-tight text-zinc-900">{previewScript.title}</h3>
                                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{previewScript.type}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <a
                                        href={`/scripts?id=${previewScript.id}`}
                                        className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-zinc-900/20"
                                    >
                                        <Edit className="w-4 h-4" /> Editar en Studio
                                    </a>
                                    <button onClick={() => setShowPreviewModal(false)} className="p-3 hover:bg-zinc-50 rounded-xl transition-all text-zinc-300 hover:text-zinc-900 border border-transparent hover:border-zinc-100"><X className="w-5 h-5" /></button>
                                </div>
                            </div>

                            {/* Content Scrollable */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 bg-zinc-50/30 relative">
                                {/* Abstract Decorative */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/40 to-purple-100/40 blur-3xl opacity-50 pointer-events-none" />

                                {previewScript.strategy_message && (
                                    <div className="bg-white border border-zinc-200 p-6 rounded-[24px] relative overflow-hidden">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                                            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Objetivo Estratégico</h4>
                                        </div>
                                        <p className="text-sm font-medium text-zinc-700 leading-relaxed italic">"{previewScript.strategy_message}"</p>
                                    </div>
                                )}

                                {previewScript.type === 'video' ? (
                                    <div className="space-y-6">
                                        <div className="bg-white border border-zinc-200 p-6 rounded-[24px]">
                                            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Hook</h4>
                                            <p className="text-lg font-black text-zinc-900 leading-tight">{previewScript.hook || <span className="text-zinc-300 font-normal">Sin hook definido...</span>}</p>
                                        </div>
                                        <div className="bg-white border border-zinc-200 p-8 rounded-[24px]">
                                            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Contenido</h4>
                                            <div className="prose prose-sm prose-zinc max-w-none text-zinc-600" dangerouslySetInnerHTML={{ __html: previewScript.body || '<p class="text-zinc-300 italic">Sin contenido...</p>' }} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {previewScript.slides?.map((slide: any, i: number) => (
                                            <div key={slide.id} className="flex gap-4">
                                                <div className="flex flex-col items-center gap-2 pt-2">
                                                    <span className="text-xl font-black text-zinc-300">{String(i + 1).padStart(2, '0')}</span>
                                                </div>
                                                <div className="flex-1 bg-white border border-zinc-200 p-6 rounded-[24px] shadow-sm">
                                                    <div dangerouslySetInnerHTML={{ __html: slide.content }} className="text-sm text-zinc-700 leading-relaxed" />
                                                </div>
                                            </div>
                                        ))}
                                        {(!previewScript.slides || previewScript.slides.length === 0) && (
                                            <div className="text-center py-10 text-zinc-400 font-medium italic">Sin slides...</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E5E5; border-radius: 20px; }
            `}</style>
        </div >
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
