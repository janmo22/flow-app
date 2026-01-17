import { FileText, Clock, Plus, Zap, ArrowUpRight, Play, PenTool, Layout as LayoutIcon, TrendingUp, Calendar } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="max-w-[1400px] mx-auto p-8 animate-in fade-in duration-500">

      {/* Page Title & Actions */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
          <LayoutIcon className="w-5 h-5 text-zinc-400" />
          Control Center
        </h1>
        <div className="flex items-center gap-4 text-sm text-zinc-500">
          <span>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* COL 1: Main Focus (Span 8) */}
        <div className="md:col-span-8 flex flex-col gap-6">

          {/* KPI Cards Row */}
          <div className="grid grid-cols-3 gap-4">
            <KpiCard title="Guiones Activos" value="3" icon={FileText} />
            <KpiCard title="Ideas Banco" value="28" icon={Zap} />
            <KpiCard title="Engagement" value="+12%" icon={TrendingUp} trend />
          </div>

          {/* Active Projects Large Card */}
          <div className="flex-1 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-zinc-900">Producción en Curso</h2>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">Ver Calendario</button>
            </div>

            <div className="space-y-4">
              <ProjectRow
                title="Cómo usar IA para guiones"
                status="Escribiendo"
                date="Jue, 16 Ene"
                progress={45}
              />
              <ProjectRow
                title="Estrategia 2026: Deep Dive"
                status="Grabación"
                date="Lun, 20 Ene"
                progress={80}
              />
              <ProjectRow
                title="Tutorial Flow OS"
                status="Edición"
                date="Mañna"
                progress={90}
              />
            </div>
          </div>

        </div>

        {/* COL 2: Quick Actions & Sidebar Widgets (Span 4) */}
        <div className="md:col-span-4 flex flex-col gap-6">

          {/* Quick Action: New Idea (Highlight Widget) */}
          <button className="w-full bg-zinc-900 text-white rounded-2xl p-6 shadow-lg shadow-zinc-900/10 hover:bg-zinc-800 hover:scale-[1.02] transition-all duration-200 text-left group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-zinc-700 transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-1">Capturar Idea</h3>
              <p className="text-zinc-400 text-sm">Guardar rápido en el inbox.</p>
            </div>
          </button>

          {/* Quick Links / Shortcuts */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-zinc-900 mb-4 text-sm uppercase tracking-wider">Accesos Directos</h3>
            <div className="grid grid-cols-2 gap-3">
              <QuickShortcut href="/strategy" icon={ArrowUpRight} label="Estrategia" />
              <QuickShortcut href="/scripts" icon={FileText} label="Editor" />
              <QuickShortcut href="/calendar" icon={Calendar} label="Agenda" />
              <QuickShortcut href="/inspiration" icon={Play} label="Inspiración" />
            </div>
          </div>

          {/* Mini Notification / Update */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">Recordatorio Semanal</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Revisar métricas de la semana pasada antes de la reunión de mañana.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, trend }: any) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{title}</span>
        <Icon className="w-4 h-4 text-zinc-300 group-hover:text-blue-500 transition-colors" />
      </div>
      <div className="text-2xl font-bold text-zinc-900">{value}</div>
    </div>
  )
}

function ProjectRow({ title, status, date, progress }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 transition-colors group cursor-pointer border border-transparent hover:border-zinc-200">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 group-hover:bg-white group-hover:text-blue-600 border border-transparent group-hover:border-zinc-200 transition-all font-bold text-xs">
          EP
        </div>
        <div>
          <h4 className="font-semibold text-zinc-900 text-sm">{title}</h4>
          <p className="text-xs text-zinc-500">{status} • {date}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-24 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
          <div className="h-full bg-zinc-800 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    </div>
  )
}

function QuickShortcut({ href, icon: Icon, label }: any) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-zinc-50 hover:bg-blue-50 border border-zinc-100 hover:border-blue-200 transition-all group">
      <Icon className="w-5 h-5 text-zinc-400 group-hover:text-blue-600 transition-colors" />
      <span className="text-xs font-medium text-zinc-600 group-hover:text-blue-700">{label}</span>
    </Link>
  )
}
