"use client";

import { useAuth } from '@/components/AuthProvider';
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    BarChart2,
    Settings,
    FileText,
    PenTool,
    LayoutDashboard,
    Users,
    Sparkles,
    Calendar as CalendarIcon,
    Search,
    LogOut,
    Trash2
} from "lucide-react";

const mainNav = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
];

const creatorNav = [
    { icon: FileText, label: "Estrategia", href: "/strategy" },
    { icon: PenTool, label: "Guiones", href: "/scripts" },
    { icon: CalendarIcon, label: "Calendario", href: "/calendar" },
    // { icon: BarChart2, label: "Análisis", href: "/analytics" },
];

const researchNav = [
    { icon: Users, label: "Competencia", href: "/competencia" },
    // { icon: Sparkles, label: "Inspiración", href: "/inspiration" },
    // ...(process.env.NODE_ENV === 'development' ? [{ icon: BarChart2, label: "Análisis", href: "/analytics" }] : []),
];

const configNav: { icon: any; label: string; href: string }[] = [];

export function Sidebar() {
    const pathname = usePathname();
    const { session, supabase } = useAuth();
    const router = useRouter();

    // No mostrar el sidebar si no hay sesión o si estamos en login/update-password
    if (!session || pathname === '/login' || pathname === '/update-password') return null;

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <aside className="w-[240px] h-screen bg-[#FBFBFB] border-r border-zinc-200/60 flex flex-col fixed left-0 top-0 z-50">

            {/* Header */}
            <div className="h-14 flex items-center px-4 mb-2">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 relative">
                        <img src="/logo_v4.png" alt="Crea con Flow" className="w-full h-full object-contain" />
                    </div>
                    <span className="font-extrabold text-sm tracking-tight text-zinc-900">Crea con Flow</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto px-3 space-y-6">

                {/* Search removed as requested */}

                <div className="space-y-1">
                    {mainNav.map(item => (
                        <NavItem key={item.href} item={item} pathname={pathname} />
                    ))}
                </div>

                <div className="space-y-1">
                    <div className="px-3 pb-1 pt-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em]">Espacio Creativo</span>
                    </div>
                    {creatorNav.map(item => (
                        <NavItem key={item.href} item={item} pathname={pathname} />
                    ))}
                </div>

                <div className="space-y-1">
                    <div className="px-3 pb-1 pt-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em]">Investigación</span>
                    </div>
                    {researchNav.map(item => (
                        <NavItem key={item.href} item={item} pathname={pathname} />
                    ))}
                </div>

                {/* Config section removed */}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-200/60 space-y-2">
                <Link href="/profile" className="flex items-center gap-3 w-full p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-zinc-200/60 rounded-xl transition-all group">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-600 font-bold text-[10px] shadow-inner">
                        {session.user?.email?.[0].toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 text-left overflow-hidden">
                        <p className="text-[11px] font-bold text-zinc-900 truncate">{session.user?.email}</p>
                        <p className="text-[10px] text-zinc-400 truncate font-medium">Plan Creator Pro</p>
                    </div>
                    <Settings className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                </Link>

                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all text-[11px] font-bold"
                >
                    <LogOut className="w-3.5 h-3.5" />
                    Cerrar Sesión
                </button>
            </div>
        </aside>
    );
}

function NavItem({ item, pathname }: any) {
    const isActive = pathname === item.href;

    return (
        <Link
            href={item.href}
            className={cn(
                "group flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-all duration-300 relative active:scale-95",
                isActive
                    ? "text-[#2563EB] bg-blue-50/40 font-bold"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-white hover:shadow-sm"
            )}
        >
            {isActive && (
                <div className="absolute left-0 w-1 h-4 bg-[#2563EB] rounded-r-full" />
            )}
            <item.icon
                className={cn(
                    "w-4 h-4 transition-all duration-300",
                    isActive ? "text-[#2563EB] scale-110" : "text-zinc-400 group-hover:text-zinc-600"
                )}
                strokeWidth={2.5}
            />
            <span>{item.label}</span>
        </Link>
    )
}
