"use client";

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { Shield, ArrowRight, Mail, Lock, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProInput } from '@/components/ui/ProInput';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [view, setView] = useState<'login' | 'forgot-password'>('login');
    const { supabase } = useAuth();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError('Credenciales no válidas. El acceso es restringido.');
            setLoading(false);
        } else {
            router.push('/');
            router.refresh();
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/update-password`,
        });

        if (error) {
            setError('Error al enviar el email de recuperación.');
            setLoading(false);
        } else {
            setSuccess('Instrucciones enviadas a tu email.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.03]"
                style={{ backgroundImage: 'radial-gradient(var(--color-primary) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

            <div className="w-full max-w-[400px] relative z-10">
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="w-20 h-20 mb-6 relative">
                        <img src="/logo_v4.png" alt="Flow OS Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl font-[900] text-[var(--color-primary)] tracking-tighter uppercase italic">Crea con Flow</span>
                    </div>
                    <p className="text-[var(--color-secondary)] text-[11px] font-bold uppercase tracking-[0.2em]">Plataforma privada para clientes</p>
                </div>

                {/* Main Card */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-[32px] shadow-[var(--shadow-raised)] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    {view === 'login' ? (
                        <form onSubmit={handleLogin} className="space-y-6">
                            <ProInput
                                label="Email"
                                icon={Mail}
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nombre@ejemplo.com"
                            />

                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1 mb-2">
                                    <label className="pro-label mb-0">Contraseña</label>
                                    <button
                                        type="button"
                                        onClick={() => setView('forgot-password')}
                                        className="text-[10px] font-bold text-[var(--color-brand)] hover:text-[var(--color-brand-dark)] uppercase tracking-widest transition-colors"
                                    >
                                        ¿Olvidaste la clave?
                                    </button>
                                </div>
                                <ProInput
                                    icon={Lock}
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 text-[11px] font-bold p-3.5 rounded-xl border border-red-100 animate-in shake">
                                    {error}
                                </div>
                            )}

                            <button
                                disabled={loading}
                                className="w-full bg-[var(--color-primary)] hover:bg-black text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-50 group shadow-lg shadow-zinc-200"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <span className="text-[13px]">Acceder al Espacio</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 ml-1 mb-4">
                                    <Sparkles className="w-3.5 h-3.5 text-[var(--color-brand)]" />
                                    <label className="pro-label mb-0 text-[var(--color-primary)]">Recuperar Acceso</label>
                                </div>
                                <ProInput
                                    icon={Mail}
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu@email.com"
                                />
                                <p className="text-[10px] text-[var(--color-tertiary)] mt-2 px-1 leading-relaxed">
                                    Te enviaremos un enlace mágico para que configures una nueva contraseña.
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 text-[11px] font-bold p-3.5 rounded-xl border border-red-100">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="bg-blue-50 text-blue-600 text-[11px] font-bold p-3.5 rounded-xl border border-blue-100">
                                    {success}
                                </div>
                            )}

                            <div className="space-y-3">
                                <button
                                    disabled={loading}
                                    className="w-full bg-[var(--color-primary)] hover:bg-black text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-zinc-200"
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <span className="text-[13px]">Enviar Instrucciones</span>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setView('login')}
                                    className="w-full text-[10px] font-black text-[var(--color-tertiary)] hover:text-[var(--color-primary)] uppercase tracking-[0.15em] transition-colors py-2"
                                >
                                    Volver atrás
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Security Footer */}
                <div className="mt-12 flex flex-col items-center gap-3 animate-in fade-in duration-1000">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-[var(--color-border)] rounded-full shadow-sm">
                        <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[9px] font-bold text-[var(--color-secondary)] uppercase tracking-widest leading-relaxed">Encrypted Session</span>
                    </div>
                    <p className="text-[10px] font-bold text-[var(--color-tertiary)] uppercase tracking-[0.3em] font-sans">
                        Flow OS · v1.0
                    </p>
                </div>
            </div>
        </div>
    );
}
