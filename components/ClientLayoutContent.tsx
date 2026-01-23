"use client";

import { useAuth } from '@/components/AuthProvider';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from "@/components/Sidebar";
import { cn } from "@/lib/utils";
import { useEffect } from 'react';

export function ClientLayoutContent({ children }: { children: React.ReactNode }) {
    const { session, isLoading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    // Safe check for pathname (can be null in some edge cases during build)
    const safePathname = pathname || '';

    const isLoginPage = safePathname.startsWith('/login');
    const isUpdatePasswordPage = safePathname.startsWith('/update-password');
    const isPublicPing = safePathname.startsWith('/ping');

    // Logic: Show sidebar ONLY if we have a session AND we are NOT on auth pages
    const showSidebar = session && !isLoginPage && !isUpdatePasswordPage;

    useEffect(() => {
        if (isLoading) return;

        // 1. If NOT logged in and trying to access private page -> Redirect to /login
        if (!session && !isLoginPage && !isUpdatePasswordPage && !isPublicPing) {
            router.push('/login');
        }

        // 2. If logged in and trying to access /login -> Redirect to dashboard
        if (session && isLoginPage) {
            router.push('/');
        }
    }, [session, isLoading, isLoginPage, isUpdatePasswordPage, isPublicPing, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-[var(--color-brand)] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-bold text-[var(--color-tertiary)] uppercase tracking-widest">Iniciando Crea con Flow...</p>
                </div>
            </div>
        );
    }

    // While checking auth (and not loading), if we are about to redirect, 
    // we might want to return nothing or the loader to avoid flash of content.
    // However, since we use router.push, it's safer to just render.
    // If not logged in and not on login page, we effectively hide the sidebar via showSidebar=false 
    // until the redirect kicks in.

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
