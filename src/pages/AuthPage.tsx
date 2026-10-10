import React, { useState } from 'react';
import { useAuth, EXCLUSIVE_ADMIN_EMAIL } from '../lib/authContext';
import { BrandLogo3D } from '../components/Brand3D';
import { Eye, EyeOff, Lock, Mail, User, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, signup, resetPassword } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetState = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();

    if (!email || !password) {
      setErrorMsg('Informe seu e-mail e senha.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setErrorMsg('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/too-many-requests') {
        setErrorMsg('Muitas tentativas sem sucesso. Tente novamente em alguns minutos.');
      } else {
        setErrorMsg(err.message || 'Falha ao autenticar.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();

    if (!fullName.trim()) {
      setErrorMsg('Preencha seu nome completo.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Insira um e-mail válido.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await signup(fullName, email, password);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Este e-mail já está cadastrado.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('A senha fornecida é muito fraca.');
      } else {
        setErrorMsg(err.message || 'Erro ao realizar cadastro.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Digite um e-mail válido para recuperação.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSuccessMsg('Link de redefinição de senha enviado com sucesso! Verifique sua caixa de entrada.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao enviar e-mail de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#040406] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* 3D Atmospheric Red Background Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-red-600/12 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-red-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Central 3D Premium Card */}
      <div className="w-full max-w-md surface-3d-elevated p-8 sm:p-10 relative z-10">
        {/* Header with 3D Logo */}
        <div className="flex flex-col items-center justify-center mb-8 text-center">
          <BrandLogo3D size="lg" />
        </div>

        {/* Feedback messages */}
        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-sm flex items-start gap-2.5 shadow-[0_0_15px_rgba(255,20,50,0.2)]">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="leading-tight">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-sm flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span className="leading-tight">{successMsg}</span>
          </div>
        )}

        {/* MODE: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full bg-[#0a0b10] border border-zinc-800 focus:border-red-500/80 rounded-xl pl-11 pr-4 py-3 text-white placeholder-zinc-600 outline-none transition-all focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#0a0b10] border border-zinc-800 focus:border-red-500/80 rounded-xl pl-11 pr-11 py-3 text-white placeholder-zinc-600 outline-none transition-all focus:ring-2 focus:ring-red-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-3d-red py-3.5 rounded-xl font-bold tracking-wide uppercase text-white shadow-lg cursor-pointer mt-2 disabled:opacity-50"
            >
              {loading ? 'Acessando...' : 'ENTRAR'}
            </button>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => {
                  resetState();
                  setMode('signup');
                }}
                className="text-zinc-300 hover:text-red-400 font-semibold transition-colors cursor-pointer"
              >
                CRIAR CONTA
              </button>

              <button
                type="button"
                onClick={() => {
                  resetState();
                  setMode('forgot');
                }}
                className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                ESQUECI MINHA SENHA
              </button>
            </div>
          </form>
        )}

        {/* MODE: SIGNUP */}
        {mode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Nome completo
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome ou empresa"
                  required
                  className="w-full bg-[#0a0b10] border border-zinc-800 focus:border-red-500/80 rounded-xl pl-11 pr-4 py-3 text-white placeholder-zinc-600 outline-none transition-all focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full bg-[#0a0b10] border border-zinc-800 focus:border-red-500/80 rounded-xl pl-11 pr-4 py-3 text-white placeholder-zinc-600 outline-none transition-all focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full bg-[#0a0b10] border border-zinc-800 focus:border-red-500/80 rounded-xl pl-11 pr-11 py-3 text-white placeholder-zinc-600 outline-none transition-all focus:ring-2 focus:ring-red-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Confirmar senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita sua senha"
                  required
                  className="w-full bg-[#0a0b10] border border-zinc-800 focus:border-red-500/80 rounded-xl pl-11 pr-4 py-3 text-white placeholder-zinc-600 outline-none transition-all focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-3d-red py-3.5 rounded-xl font-bold tracking-wide uppercase text-white shadow-lg cursor-pointer mt-2 disabled:opacity-50"
            >
              {loading ? 'Cadastrando...' : 'CADASTRAR'}
            </button>

            <div className="pt-4 text-center border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => {
                  resetState();
                  setMode('login');
                }}
                className="text-zinc-400 hover:text-white font-semibold transition-colors flex items-center justify-center gap-2 mx-auto cursor-pointer text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> VOLTAR AO LOGIN
              </button>
            </div>
          </form>
        )}

        {/* MODE: FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-5">
            <p className="text-sm text-zinc-400">
              Insira o e-mail cadastrado para receber instruções de redefinição de senha.
            </p>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full bg-[#0a0b10] border border-zinc-800 focus:border-red-500/80 rounded-xl pl-11 pr-4 py-3 text-white placeholder-zinc-600 outline-none transition-all focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-3d-red py-3.5 rounded-xl font-bold tracking-wide uppercase text-white shadow-lg cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'ENVIAR LINK DE RECUPERAÇÃO'}
            </button>

            <div className="pt-4 text-center border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => {
                  resetState();
                  setMode('login');
                }}
                className="text-zinc-400 hover:text-white font-semibold transition-colors flex items-center justify-center gap-2 mx-auto cursor-pointer text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> VOLTAR AO LOGIN
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
