"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Shield, ArrowRight, Lock, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

export default function ProfilePage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const { supabase, session } = useAuth();

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            setError('Hubo un error al actualizar: ' + error.message);
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
            setPassword('');
            setConfirmPassword('');
            // Reset success message after a few seconds
            setTimeout(() => {
                setSuccess(false);
            }, 5000);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            {/* Header */}
            <div className="flex flex-col gap-2 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h1 className="text-3xl font-[900] text-zinc-900 tracking-tighter">Mi Perfil</h1>
                <p className="text-zinc-500 font-medium">Gestiona tu seguridad y preferencias</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Info Card */}
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                    <div className="bg-white border border-zinc-200/60 p-8 rounded-[32px] shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-blue-50/50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-xl border border-blue-100">
                                {session?.user?.email?.[0].toUpperCase() || 'U'}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-1">Usuario</p>
                                <p className="font-bold text-zinc-900">{session?.user?.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border border-zinc-200/50 rounded-full w-fit">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Cuenta Activa</span>
                        </div>
                    </div>
                </div>

                {/* Password Card */}
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                    <div className="bg-white border border-zinc-200/60 p-8 rounded-[32px] shadow-sm relative overflow-hidden">
                        <div className="mb-6 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-zinc-900" />
                            <h2 className="font-bold text-zinc-900">Cambiar Contraseña</h2>
                        </div>

                        {success ? (
                            <div className="flex flex-col items-center py-12 text-center space-y-4 animate-in zoom-in-95 duration-300">
                                <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mb-2 border border-green-100">
                                    <CheckCircle2 className="w-7 h-7 text-green-500" />
                                </div>
                                <h2 className="text-lg font-black text-zinc-900 tracking-tight">¡Contraseña Actualizada!</h2>
                                <p className="text-zinc-500 text-[13px] leading-relaxed">Tu cuenta está segura con tu nueva clave.</p>
                                <button
                                    onClick={() => setSuccess(false)}
                                    className="mt-4 text-[11px] font-bold text-zinc-400 hover:text-zinc-900 underline transition-colors"
                                >
                                    Volver al formulario
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleUpdatePassword} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] ml-1">Nueva Contraseña</label>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-zinc-50 border border-zinc-200/60 focus:border-blue-500/50 focus:bg-white rounded-2xl py-3.5 px-4 text-[13px] text-zinc-900 placeholder:text-zinc-300 outline-none transition-all"
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] ml-1">Confirmar</label>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-zinc-50 border border-zinc-200/60 focus:border-blue-500/50 focus:bg-white rounded-2xl py-3.5 px-4 text-[13px] text-zinc-900 placeholder:text-zinc-300 outline-none transition-all"
                                        placeholder="Repite la clave"
                                    />
                                </div>

                                {error && (
                                    <div className="bg-red-50 text-red-600 text-[11px] font-bold p-3.5 rounded-xl border border-red-100 animate-in shake">
                                        {error}
                                    </div>
                                )}

                                <div className="pt-2">
                                    <button
                                        disabled={loading}
                                        className="w-full bg-zinc-900 hover:bg-black text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-50 group shadow-lg shadow-zinc-200"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <span className="text-[12px]">Actualizar Clave</span>
                                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
