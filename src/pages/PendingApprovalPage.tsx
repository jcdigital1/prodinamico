import React from 'react';
import { useAuth, EXCLUSIVE_ADMIN_EMAIL } from '../lib/authContext';
import { BrandLogo3D } from '../components/Brand3D';
import { Clock, ShieldCheck, LogOut, RefreshCw } from 'lucide-react';

export const PendingApprovalPage: React.FC = () => {
  const { userProfile, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg surface-3d-elevated p-8 sm:p-10 text-center relative z-10 border border-sky-500/30">
        <div className="flex justify-center mb-6">
          <BrandLogo3D size="md" />
        </div>

        {/* 3D Status Indicator */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-sky-500/20 via-blue-950 to-slate-950 border border-sky-500/40 flex items-center justify-center shadow-[0_0_25px_rgba(14,165,233,0.25)]">
          <Clock className="w-10 h-10 text-sky-400 animate-pulse" />
        </div>

        <h1 className="text-2xl font-black uppercase tracking-wide text-white mb-2">
          Cadastro em Análise
        </h1>
        <p className="text-sky-400 font-semibold text-sm tracking-wider uppercase mb-6">
          Aguardando Aprovação Administrativa
        </p>

        <div className="bg-[#070d1e] border border-slate-800 rounded-xl p-5 text-left text-sm text-slate-300 space-y-3 mb-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-slate-500">Comprador:</span>
            <span className="font-semibold text-white">{userProfile?.fullName}</span>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-slate-500">E-mail:</span>
            <span className="font-mono text-slate-300 text-xs">{userProfile?.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Status atual:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950/80 border border-amber-500/50 text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Pendente
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mb-6">
          Sua solicitação de acesso foi registrada no banco de dados e já está visível em tempo real no painel do administrador exclusivo ({EXCLUSIVE_ADMIN_EMAIL}). Assim que aprovada, seu acesso ao gerador de lotes será desbloqueado automaticamente.
        </p>

        <div className="flex items-center justify-center gap-2 text-xs text-sky-400 font-medium mb-8 bg-sky-950/30 border border-sky-500/20 py-2.5 px-4 rounded-xl">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
          <span>Monitorando liberação em tempo real (sem necessidade de recarregar a página)</span>
        </div>

        <button
          onClick={() => logout()}
          className="btn-3d-graphite w-full py-3 rounded-xl font-bold uppercase tracking-wider text-sm text-slate-300 flex items-center justify-center gap-2 cursor-pointer hover:text-white"
        >
          <LogOut className="w-4 h-4 text-slate-400" /> Sair da Conta
        </button>
      </div>
    </div>
  );
};

export const BlockedPage: React.FC = () => {
  const { logout, userProfile } = useAuth();

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="w-full max-w-md surface-3d-elevated p-8 sm:p-10 text-center relative z-10 border border-slate-700">
        <div className="flex justify-center mb-6">
          <BrandLogo3D size="md" />
        </div>

        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center">
          <ShieldCheck className="w-8 h-8 text-slate-400" />
        </div>

        <h1 className="text-xl font-bold text-white mb-2 uppercase">Acesso Bloqueado</h1>
        <p className="text-sm text-slate-400 mb-6">
          A conta associada ao e-mail <span className="text-white font-semibold">{userProfile?.email}</span> foi suspensa pela administração. Seus registros permanecem salvos com segurança.
        </p>

        <button
          onClick={() => logout()}
          className="btn-3d-graphite w-full py-3 rounded-xl font-bold uppercase tracking-wider text-sm text-slate-300 flex items-center justify-center gap-2 cursor-pointer hover:text-white"
        >
          <LogOut className="w-4 h-4 text-slate-400" /> Sair
        </button>
      </div>
    </div>
  );
};
