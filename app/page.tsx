import { createClient } from "@/lib/supabase-server";
import { PenTool, Calendar, Users, Layout, ChevronRight, Clock, ArrowUpRight, FileText } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";

// Helper to get current month range
function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
  return { start, end, monthName: now.toLocaleString('es-ES', { month: 'long' }) };
}

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  const { start, end, monthName } = getMonthRange();

  // 1. Fetch Latest Scripts (Limit 5)
  const { data: recentScripts } = await supabase
    .from('scripts')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(5);

  // 2. Fetch Monthly Events
  const { data: calendarEvents } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', start)
    .lte('date', end)
    .is('deleted_at', null);

  const { data: scheduledScripts } = await supabase
    .from('scripts')
    .select('id, title, type, scheduled_date')
    .eq('user_id', user.id)
    .gte('scheduled_date', start)
    .lte('scheduled_date', end)
    .is('deleted_at', null)
    .not('scheduled_date', 'is', null);

  const events = [
    ...(calendarEvents || []).map((e: any) => ({ ...e, source: 'event' })),
    ...(scheduledScripts || []).map((s: any) => ({
      id: s.id,
      title: s.title,
      date: s.scheduled_date!,
      type: s.type,
      source: 'script'
    }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


  return (
    <div className="max-w-[1400px] mx-auto min-h-screen p-8 pt-12 animate-in fade-in duration-700 font-sans text-zinc-900">

      {/* Header */}
      <header className="mb-12 flex items-end justify-between border-b border-zinc-100 pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Hola, {user.user_metadata?.name || 'Creador'}
          </h1>
          <p className="text-zinc-500 font-medium">
            Resumen de tu actividad.
          </p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
      </header>

      {/* Main Grid: 12 Cols */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

        {/* COL 1: Navigation (3 Cols) */}
        <div className="lg:col-span-3 space-y-8">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-2">Menú</h3>
          <div className="flex flex-col gap-2">
            <NavItem href="/strategy" icon={Layout} label="Estrategia" />
            <NavItem href="/scripts" icon={PenTool} label="Studio" />
            <NavItem href="/calendar" icon={Calendar} label="Calendario" />
            <NavItem href="/competencia" icon={Users} label="Competencia" />
          </div>

          <div className="pt-8 border-t border-zinc-100">
            <Link href="/scripts/new" className="flex items-center justify-center w-full py-3 bg-zinc-900 text-white rounded-lg font-bold text-sm hover:bg-zinc-800 transition-colors">
              Nuevo Guion
            </Link>
          </div>
        </div>

        {/* COL 2: Recent Scripts (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Últimos Guiones</h3>
            <Link href="/scripts" className="text-xs font-medium text-zinc-400 hover:text-zinc-900 flex items-center gap-1 transition-colors">
              Ver todos <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
            {(recentScripts || []).length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm text-zinc-400 font-medium">No hay guiones recientes.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {recentScripts?.map((script) => (
                  <Link key={script.id} href={`/scripts?id=${script.id}`} className="block p-4 hover:bg-zinc-50 transition-colors group">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-sm text-zinc-900 group-hover:text-blue-600 transition-colors truncate">{script.title || "Sin título"}</h4>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 uppercase tracking-wide">{script.type}</span>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-1">
                      {new Date(script.updated_at).toLocaleDateString()} · {script.status === 'draft' ? 'Borrador' : 'Publicado'}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COL 3: Monthly Events (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Agenda {monthName}</h3>
            <Link href="/calendar" className="p-1 hover:bg-zinc-100 rounded-md text-zinc-400 transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-zinc-50/50 rounded-xl p-6 min-h-[400px] border border-zinc-100">
            {events.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-40">
                <div className="w-10 h-10 rounded-full bg-zinc-200/50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-zinc-400" />
                </div>
                <p className="text-xs font-medium text-zinc-500">Nada programado para este mes.</p>
              </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-zinc-200">
                {events.map((event) => (
                  <div key={`${event.source}-${event.id}`} className="relative pl-6">
                    <div className="absolute left-[3px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-zinc-300 ring-1 ring-zinc-100" />
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide block">
                        {new Date(event.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}
                      </span>
                      <p className="text-sm font-bold text-zinc-800 leading-tight">
                        {event.title}
                      </p>
                      <p className="text-[10px] text-zinc-500 capitalize flex items-center gap-1.5">
                        {event.source === 'script' ? <FileText className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                        {event.type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function NavItem({ href, icon: Icon, label }: any) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-zinc-50 transition-all border border-transparent hover:border-zinc-200/60"
    >
      <Icon className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
      <span className="text-sm font-medium text-zinc-600 group-hover:text-zinc-900">{label}</span>
      <ChevronRight className="w-4 h-4 text-zinc-300 ml-auto opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
    </Link>
  )
}
