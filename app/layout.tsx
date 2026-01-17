"use client";

import { useAuth } from '@/components/AuthProvider';
import { usePathname } from 'next/navigation';
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { AuthProvider } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} antialiased min-h-screen bg-[var(--color-background)]`}>
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const isUpdatePasswordPage = pathname === '/update-password';
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
      <Sidebar />
      <main className={cn(
        "min-h-screen transition-all duration-300",
        showSidebar ? "pl-[240px]" : "pl-0"
      )}>
        {children}
      </main>
    </>
  );
}
