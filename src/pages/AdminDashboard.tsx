import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/authContext';
import { BrandLogo3D } from '../components/Brand3D';
import {
  getAdminRealStats,
  subscribeToUsers,
  updateUserStatus,
  getModelCalibrations,
  getBatches,
} from '../lib/firestoreService';
import { UserProfile, UserStatus, ModelCalibration, PlateBatch } from '../types';
import { ModelCalibrator } from '../components/ModelCalibrator';
import {
  Users,
  Clock,
  Layers,
  Eye,
  Sliders,
  LogOut,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  UserCheck,
  UserX,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { userProfile, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'metrics' | 'buyers' | 'batches' | 'calibrator'>('metrics');

  // Real Essential Metrics
  const [stats, setStats] = useState<{
    buyersTotal: number;
    buyersPending: number;
    buyersApproved: number;
    buyersBlocked: number;
    batchesCount: number;
    platesCount: number;
    qrcodesCount: number;
    totalReads: number;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Users with real-time Firestore sync
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Batches
  const [allBatches, setAllBatches] = useState<PlateBatch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);

  // Model calibrations
  const [calibrations, setCalibrations] = useState<Record<string, ModelCalibration>>({});

  const refreshStats = async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const data = await getAdminRealStats();
      setStats(data || null);
    } catch (err: any) {
      setStatsError(err.message || 'Erro ao carregar dados do Firestore.');
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    refreshStats();

    // Real-time listener for buyer approval
    const unsub = subscribeToUsers(
      (usersList) => {
        setUsers(usersList);
        setUsersLoading(false);
      },
      (err) => {
        setUsersError(err.message || 'Erro ao escutar usuários.');
        setUsersLoading(false);
      }
    );

    getModelCalibrations().then(setCalibrations);

    return () => unsub();
  }, []);

  useEffect(() => {
    if (activeTab === 'batches') {
      setBatchesLoading(true);
      getBatches('', true)
        .then(setAllBatches)
        .catch(console.error)
        .finally(() => setBatchesLoading(false));
    }
  }, [activeTab]);

  const handleUpdateStatus = async (uid: string, newStatus: UserStatus) => {
    setActionInProgress(uid);
    try {
      await updateUserStatus(uid, newStatus);
      await refreshStats();
    } catch (err: any) {
      alert(`Falha ao alterar status: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (u.role === 'admin') return false;
    const q = userSearch.toLowerCase();
    return u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-sky-500/25 bg-[#070d1e]/90 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <BrandLogo3D size="sm" />

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-950/40 border border-sky-500/30 text-xs">
              <Shield className="w-4 h-4 text-sky-400" />
              <span className="font-semibold text-white">Painel Master Admin</span>
              <span className="text-slate-400 font-mono text-[11px] truncate max-w-[150px]">
                {userProfile?.email}
              </span>
            </div>

            <button
              onClick={() => logout()}
              className="btn-3d-graphite px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#090f23] border border-slate-800">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'metrics'
                ? 'btn-3d-blue text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Users className="w-4 h-4" /> Visão Geral & Métricas
          </button>

          <button
            onClick={() => setActiveTab('buyers')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer relative ${
              activeTab === 'buyers'
                ? 'btn-3d-blue text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <UserCheck className="w-4 h-4" /> Compradores
            {stats && stats.buyersPending > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-sky-500 text-white font-extrabold animate-pulse">
                {stats.buyersPending}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('batches')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'batches'
                ? 'btn-3d-blue text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Layers className="w-4 h-4" /> Lotes Gerados
          </button>

          <button
            onClick={() => setActiveTab('calibrator')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'calibrator'
                ? 'btn-3d-blue text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Sliders className="w-4 h-4" /> Calibrador dos 8 Modelos
          </button>
        </div>

        {/* TAB 1: ESSENTIAL METRICS */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-black uppercase tracking-wide text-white">
                  Indicadores Essenciais
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dados reais sincronizados diretamente com o Firestore.
                </p>
              </div>

              <button
                onClick={refreshStats}
                disabled={statsLoading}
                className="btn-3d-graphite px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${statsLoading ? 'animate-spin text-sky-400' : ''}`} />
                Atualizar
              </button>
            </div>

            {statsError && (
              <div className="p-4 rounded-xl bg-red-950/70 border border-red-500 text-red-200 text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{statsError}</span>
              </div>
            )}

            {/* Essential Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Cadastros Pendentes */}
              <div className="surface-3d-card p-5 border border-amber-500/30">
                <div className="flex items-center justify-between text-amber-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Cadastros Pendentes</span>
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <div className="text-3xl font-black text-amber-400">
                  {statsLoading ? '—' : stats?.buyersPending ?? 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Aguardando aprovação</div>
              </div>

              {/* Compradores Aprovados */}
              <div className="surface-3d-card p-5 border border-emerald-500/30">
                <div className="flex items-center justify-between text-emerald-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Compradores Aprovados</span>
                  <UserCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-3xl font-black text-emerald-400">
                  {statsLoading ? '—' : stats?.buyersApproved ?? 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Acesso ativo à plataforma</div>
              </div>

              {/* Compradores Bloqueados */}
              <div className="surface-3d-card p-5 border border-slate-700">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Compradores Bloqueados</span>
                  <UserX className="w-5 h-5 text-slate-400" />
                </div>
                <div className="text-3xl font-black text-slate-300">
                  {statsLoading ? '—' : stats?.buyersBlocked ?? 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Acesso suspenso</div>
              </div>

              {/* Total Real de Plaquinhas */}
              <div className="surface-3d-card p-5 border border-sky-500/30">
                <div className="flex items-center justify-between text-sky-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Total de Plaquinhas</span>
                  <Layers className="w-5 h-5 text-sky-400" />
                </div>
                <div className="text-3xl font-black text-white">
                  {statsLoading ? '—' : stats?.platesCount ?? 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Plaquinhas únicas emitidas</div>
              </div>

              {/* Total Real de Lotes */}
              <div className="surface-3d-card p-5 border border-sky-500/30">
                <div className="flex items-center justify-between text-sky-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Total de Lotes</span>
                  <Layers className="w-5 h-5 text-sky-400" />
                </div>
                <div className="text-3xl font-black text-white">
                  {statsLoading ? '—' : stats?.batchesCount ?? 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Lotes produzidos</div>
              </div>

              {/* Leituras Reais dos QR Codes */}
              <div className="surface-3d-card p-5 border border-sky-500/40">
                <div className="flex items-center justify-between text-sky-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Leituras dos QR Codes</span>
                  <Eye className="w-5 h-5 text-sky-400" />
                </div>
                <div className="text-3xl font-black text-sky-400">
                  {statsLoading ? '—' : stats?.totalReads ?? 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Scans dinâmicos registrados</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BUYERS MANAGEMENT */}
        {activeTab === 'buyers' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-black uppercase tracking-wide text-white">
                  Gerenciamento de Compradores
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Aprovação, bloqueio e liberação de compradores em tempo real.
                </p>
              </div>

              {/* Search box */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar comprador..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-[#070d1e] border border-slate-800 focus:border-sky-500 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            {usersError && (
              <div className="p-4 rounded-xl bg-red-950/70 border border-red-500 text-red-200 text-sm">
                {usersError}
              </div>
            )}

            {usersLoading ? (
              <div className="p-12 text-center text-slate-500 text-sm">Carregando lista de compradores...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center surface-3d-card border border-slate-800 text-slate-500 text-sm">
                Nenhum comprador encontrado.
              </div>
            ) : (
              <div className="surface-3d-card border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-[#070d1e] text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-3.5 px-4">Nome</th>
                        <th className="py-3.5 px-4">E-mail</th>
                        <th className="py-3.5 px-4">Data Cadastro</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredUsers.map((buyer) => {
                        const isBusy = actionInProgress === buyer.uid;
                        return (
                          <tr key={buyer.uid} className="hover:bg-slate-900/40 transition-colors">
                            <td className="py-3 px-4 font-semibold text-white">
                              {buyer.fullName}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-300">
                              {buyer.email}
                            </td>
                            <td className="py-3 px-4 text-slate-400">
                              {new Date(buyer.createdAt).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="py-3 px-4">
                              {buyer.status === 'pending' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px] bg-amber-950/80 border border-amber-500/50 text-amber-300">
                                  <Clock className="w-3 h-3 text-amber-400" /> Pendente
                                </span>
                              )}
                              {buyer.status === 'approved' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px] bg-emerald-950/80 border border-emerald-500/50 text-emerald-300">
                                  <CheckCircle className="w-3 h-3 text-emerald-400" /> Aprovado
                                </span>
                              )}
                              {buyer.status === 'blocked' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px] bg-slate-900 border border-slate-700 text-slate-400">
                                  <XCircle className="w-3 h-3 text-slate-400" /> Bloqueado
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {buyer.status === 'pending' && (
                                  <button
                                    onClick={() => handleUpdateStatus(buyer.uid, 'approved')}
                                    disabled={isBusy}
                                    className="btn-3d-blue px-3 py-1.5 rounded-lg font-bold text-[11px] uppercase text-white flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" /> Aprovar
                                  </button>
                                )}

                                {buyer.status === 'approved' && (
                                  <button
                                    onClick={() => handleUpdateStatus(buyer.uid, 'blocked')}
                                    disabled={isBusy}
                                    className="btn-3d-graphite px-3 py-1.5 rounded-lg font-bold text-[11px] uppercase text-rose-400 hover:text-rose-300 border-rose-500/30 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  >
                                    <UserX className="w-3.5 h-3.5" /> Bloquear
                                  </button>
                                )}

                                {buyer.status === 'blocked' && (
                                  <button
                                    onClick={() => handleUpdateStatus(buyer.uid, 'approved')}
                                    disabled={isBusy}
                                    className="btn-3d-blue px-3 py-1.5 rounded-lg font-bold text-[11px] uppercase text-white flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" /> Reativar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PLATFORM BATCHES */}
        {activeTab === 'batches' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-black uppercase tracking-wide text-white">
                Lotes Gerados na Plataforma
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Auditoria de numeração e lotes criados pelos compradores.
              </p>
            </div>

            {batchesLoading ? (
              <div className="p-12 text-center text-slate-500 text-sm">Carregando lotes...</div>
            ) : allBatches.length === 0 ? (
              <div className="p-12 text-center surface-3d-card border border-slate-800 text-slate-500 text-sm">
                Nenhum lote foi gerado na plataforma até o momento.
              </div>
            ) : (
              <div className="space-y-4">
                {allBatches.map((batch) => (
                  <div key={batch.id} className="surface-3d-card p-5 border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                      <div>
                        <div className="font-bold text-white text-base">{batch.name}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          Comprador: <span className="text-slate-200">{batch.buyerEmail}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
                          {batch.quantity} {batch.quantity === 1 ? 'plaquinha' : 'plaquinhas'}
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-sky-950/40 border border-sky-500/30 text-sky-300 font-mono font-bold">
                          Nº {String(batch.startNumber).padStart(6, '0')} até Nº {String(batch.endNumber).padStart(6, '0')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>Modelo: {batch.modelId}</span>
                      <span>Criado em: {new Date(batch.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CALIBRATOR OF THE 8 MODELS */}
        {activeTab === 'calibrator' && (
          <ModelCalibrator
            calibrations={calibrations}
            onCalibrationSaved={(updated) => {
              setCalibrations((prev) => ({
                ...prev,
                [updated.modelId]: updated,
              }));
            }}
          />
        )}
      </main>
    </div>
  );
};
