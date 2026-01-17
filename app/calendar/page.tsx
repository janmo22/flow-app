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
    Zap
} from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";

type EventType = 'video' | 'carousel' | 'personal';

interface CalendarEvent {
    id: string;
    date: string;
    title: string;
    type: EventType;
    user_id?: string;
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
                    type: s.type as EventType
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
        if (!newEventTitle || !selectedDate) return;

        const { data, error } = await supabase
            .from('calendar_events')
            .insert({
                user_id: session?.user?.id,
                title: newEventTitle,
                type: newEventType,
                date: selectedDate
            })
            .select()
            .single();

        if (data) {
            setEvents([...events, data]);
            setIsModalOpen(false);
            setNewEventTitle("");
        }
    };

    const handleDeleteEvent = async (id: string) => {
        const { error } = await supabase
            .from('calendar_events')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (!error) {
            setEvents(events.filter(e => e.id !== id));
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

                            const dateStr = date.toISOString().split('T')[0];
                            const dayEvents = events.filter(e => e.date === dateStr);
                            const isToday = new Date().toISOString().split('T')[0] === dateStr;

                            return (
                                <div
                                    key={i}
                                    onClick={() => {
                                        if (viewMode === 'personal') {
                                            setSelectedDate(dateStr);
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
                                                className={cn(
                                                    "px-2 py-1.5 rounded-lg text-[9px] font-bold truncate flex items-center gap-1.5 shadow-sm border",
                                                    event.type === 'video' ? "bg-blue-50 text-blue-700 border-blue-100" :
                                                        event.type === 'carousel' ? "bg-purple-50 text-purple-700 border-purple-100" :
                                                            "bg-zinc-900 text-white border-zinc-800"
                                                )}
                                            >
                                                {event.type === 'video' ? <Video className="w-2.5 h-2.5" /> :
                                                    event.type === 'carousel' ? <Layers className="w-2.5 h-2.5" /> :
                                                        <Globe className="w-2.5 h-2.5" />}
                                                {event.title}
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
                    <div className="bg-white border border-zinc-200 rounded-[32px] p-8 relative overflow-hidden shadow-xl shadow-zinc-200/50 group shrink-0">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50/50 blur-[60px] group-hover:bg-blue-100/50 transition-all duration-700" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                    <Zap className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">Status Semanal</span>
                            </div>
                            <h3 className="text-4xl font-black tracking-tighter mb-2 text-zinc-900">3 Publicaciones</h3>
                            <p className="text-xs text-zinc-500 font-medium leading-relaxed">Tu calendario está optimizado para el algoritmo actual. <span className="text-blue-600 font-bold">¡Buen trabajo!</span></p>
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
                                            <p className="text-[10px] font-bold text-zinc-400">{new Date(event.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</p>
                                        </div>
                                        {viewMode === 'personal' && event.user_id && (
                                            <button onClick={() => handleDeleteEvent(event.id)} className="opacity-0 group-hover:opacity-100 p-2 text-zinc-300 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                                        )}
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL NUEVO EVENTO */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white border border-zinc-200 w-full max-w-sm rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95 duration-400 overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full" />

                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <h3 className="text-2xl font-black tracking-tighter text-zinc-900">Nuevo Evento</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-zinc-50 rounded-2xl transition-all text-zinc-300 hover:text-zinc-950"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Título de la Pieza</label>
                                <input
                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all placeholder:text-zinc-200"
                                    placeholder="Nombre del contenido..."
                                    value={newEventTitle}
                                    onChange={(e) => setNewEventTitle(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Tipo de Contenido</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'video', label: 'Vídeo', icon: Video },
                                        { id: 'carousel', label: 'Carrusel', icon: Layers },
                                        { id: 'personal', label: 'Hito', icon: Globe }
                                    ].map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => setNewEventType(type.id as EventType)}
                                            className={cn(
                                                "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all",
                                                newEventType === type.id
                                                    ? "bg-zinc-900 border-zinc-900 text-white shadow-xl scale-[1.05]"
                                                    : "bg-white border-zinc-100 text-zinc-400 hover:border-zinc-200"
                                            )}
                                        >
                                            <type.icon className="w-5 h-5" />
                                            <span className="text-[8px] font-black uppercase tracking-widest">{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleAddEvent}
                                className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all mt-4 flex items-center justify-center gap-3"
                            >
                                <Check className="w-4 h-4" /> Guardar en Calendario
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E5E5; border-radius: 20px; }
            `}</style>
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
