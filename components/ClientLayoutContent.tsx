"use client";

import { useAuth } from '@/components/AuthProvider';
import { usePathname } from 'next/navigation';
import { Sidebar } from "@/components/Sidebar";
import { cn } from "@/lib/utils";

export function ClientLayoutContent({ children }: { children: React.ReactNode }) {
    const { session, isLoading } = useAuth();
    const pathname = usePathname();

    // Safe check for pathname (can be null in some edge cases during build)
    const safePathname = pathname || '';

    const isLoginPage = safePathname.startsWith('/login');
    const isUpdatePasswordPage = safePathname.startsWith('/update-password');

    // Logic: Show sidebar ONLY if we have a session AND we are NOT on auth pages
    const showSidebar = session && !isLoginPage && !isUpdatePasswordPage;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-[var(--color-brand)] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-bold text-[var(--color-tertiary)] uppercase tracking-widest">Iniciando Flow OS...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {showSidebar && <Sidebar />}
            <main className={cn(
                "min-h-screen transition-all duration-300",
                showSidebar ? "pl-[240px]" : "pl-0"
            )}>
                {children}
            </main>
        </>
    );
}
