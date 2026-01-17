"use client";

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { Shield, ArrowRight, Lock, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const { supabase } = useAuth();
    const router = useRouter();

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
            setTimeout(() => {
                router.push('/');
            }, 2000);
        }
    };

    return (
        <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.03]"
                style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

            <div className="w-full max-w-[400px] relative z-10">
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center text-white mb-6 shadow-xl ring-4 ring-white">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <h1 className="text-2xl font-[900] text-zinc-900 tracking-tighter uppercase italic">Flow OS</h1>
                    </div>
                    <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-[0.2em]">Configuración de Cuenta</p>
                </div>

                {/* Card */}
                <div className="bg-white border border-zinc-200/60 p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    {success ? (
                        <div className="flex flex-col items-center py-8 text-center space-y-4">
                            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mb-2 border border-green-100">
                                <CheckCircle2 className="w-7 h-7 text-green-500" />
                            </div>
                            <h2 className="text-xl font-black text-zinc-900 tracking-tight">¡Todo listo!</h2>
                            <p className="text-zinc-500 text-[13px] leading-relaxed">Tu contraseña ha sido guardada con éxito.<br />Entrando en el laboratorio...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleUpdatePassword} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] ml-1">Nueva Contraseña</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-blue-600 transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-zinc-50 border border-zinc-200/60 focus:border-blue-500/50 focus:bg-white rounded-2xl py-3.5 pl-11 pr-4 text-[13px] text-zinc-900 placeholder:text-zinc-300 outline-none transition-all"
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] ml-1">Confirmar Contraseña</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-blue-600 transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-zinc-50 border border-zinc-200/60 focus:border-blue-500/50 focus:bg-white rounded-2xl py-3.5 pl-11 pr-4 text-[13px] text-zinc-900 placeholder:text-zinc-300 outline-none transition-all"
                                        placeholder="Repite tu clave"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 text-[11px] font-bold p-3.5 rounded-xl border border-red-100">
                                    {error}
                                </div>
                            )}

                            <button
                                disabled={loading}
                                className="w-full bg-zinc-900 hover:bg-black text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-50 group shadow-lg shadow-zinc-200"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <span className="text-[13px]">Configurar mi Cuenta</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>

                {/* Security Footer */}
                <div className="mt-12 flex flex-col items-center gap-3 animate-in fade-in duration-1000">
                    <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.3em] font-sans">
                        Flow OS · Secure Update
                    </p>
                </div>
            </div>
        </div>
    );
}
