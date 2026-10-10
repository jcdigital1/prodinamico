import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/authContext';
import { BrandLogo3D } from '../components/Brand3D';
import {
  getAdminRealStats,
  subscribeToUsers,
  updateUserStatus,
  getModelCalibrations,
  getBatches,
  getAllPlates,
} from '../lib/firestoreService';
import { UserProfile, UserStatus, ModelCalibration, PlateBatch, PlateItem } from '../types';
import { ModelCalibrator } from '../components/ModelCalibrator';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Layers,
  QrCode,
  Eye,
  Sliders,
  LogOut,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  Radio,
  FileSpreadsheet,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { userProfile, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'stats' | 'buyers' | 'batches' | 'calibrator'>('stats');

  // Real stats
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

  // Users list with real-time sync
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Batches & plates across platform
  const [allBatches, setAllBatches] = useState<PlateBatch[]>([]);
  const [allPlates, setAllPlates] = useState<PlateItem[]>([]);
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
      setStatsError(err.message || 'Erro ao carregar métricas reais do Firestore.');
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    refreshStats();

    // Subscribe to users collection in real time!
    const unsub = subscribeToUsers(
      (usersList) => {
        setUsers(usersList);
        setUsersLoading(false);
      },
      (err) => {
        setUsersError(err.message || 'Erro ao escutar compradores em tempo real.');
        setUsersLoading(false);
      }
    );

    // Load calibrations
    getModelCalibrations().then(setCalibrations);

    return () => unsub();
  }, []);

  // When switching to Batches tab, fetch platform-wide batches
  useEffect(() => {
    if (activeTab === 'batches') {
      setBatchesLoading(true);
      Promise.all([getBatches('', true), getAllPlates('', true)])
        .then(([bList, pList]) => {
          setAllBatches(bList);
          setAllPlates(pList);
        })
        .catch((e) => console.error('Erro ao carregar lotes do admin:', e))
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
    if (u.role === 'admin') return false; // Hide master admin from buyer list
    const q = userSearch.toLowerCase();
    return u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100 flex flex-col">
      {/* Top Navigation Bar with 3D Depth */}
      <header className="border-b border-red-500/20 bg-[#090a10]/90 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <BrandLogo3D size="sm" />

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs">
              <Shield className="w-4 h-4 text-red-500" />
              <span className="font-semibold text-white">Painel Master Admin</span>
              <span className="text-zinc-500 font-mono text-[11px] truncate max-w-[140px]">
                {userProfile?.email}
              </span>
            </div>

            <button
              onClick={() => logout()}
              className="btn-3d-graphite px-3.5 py-1.5 rounded-xl text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#0c0d14] border border-zinc-800">
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'stats'
                ? 'btn-3d-red text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <Radio className="w-4 h-4" /> Estatísticas Reais
          </button>

          <button
            onClick={() => setActiveTab('buyers')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer relative ${
              activeTab === 'buyers'
                ? 'btn-3d-red text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <Users className="w-4 h-4" /> Compradores
            {stats && stats.buyersPending > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-red-500 text-white font-extrabold animate-pulse">
                {stats.buyersPending}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('batches')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'batches'
                ? 'btn-3d-red text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <Layers className="w-4 h-4" /> Lotes da Plataforma
          </button>

          <button
            onClick={() => setActiveTab('calibrator')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'calibrator'
                ? 'btn-3d-red text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <Sliders className="w-4 h-4" /> Calibrador dos 8 Modelos
          </button>
        </div>

        {/* TAB 1: REAL METRICS */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-black uppercase tracking-wide text-white">
                  Indicadores da Plataforma Dinâmico Pro
                </h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Métricas sincronizadas diretamente com as coleções reais do Firestore.
                </p>
              </div>

              <button
                onClick={refreshStats}
                disabled={statsLoading}
                className="btn-3d-graphite px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${statsLoading ? 'animate-spin text-red-500' : ''}`} />
                Atualizar
              </button>
            </div>

            {statsError && (
              <div className="p-4 rounded-xl bg-red-950/70 border border-red-500 text-red-200 text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{statsError}</span>
              </div>
            )}

            {/* Grid of Real Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Compradores Cadastrados */}
              <div className="surface-3d-card p-5 border border-zinc-800 relative overflow-hidden group">
                <div className="flex items-center justify-between text-zinc-400 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider">Compradores Cadastrados</span>
                  <div className="p-2 rounded-xl bg-red-950/40 text-red-400 border border-red-500/20">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-white tracking-tight">
                  {statsLoading ? '—' : stats?.buyersTotal ?? 0}
                </div>
                <div className="text-[11px] text-zinc-500 mt-2 flex items-center gap-2">
                  <span>{stats?.buyersApproved ?? 0} aprovados</span>
                  <span>•</span>
                  <span>{stats?.buyersPending ?? 0} pendentes</span>
                </div>
              </div>

              {/* Compradores Pendentes */}
              <div className="surface-3d-card p-5 border border-amber-500/30 relative overflow-hidden group">
                <div className="flex items-center justify-between text-amber-400 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider">Compradores Pendentes</span>
                  <div className="p-2 rounded-xl bg-amber-950/40 text-amber-400 border border-amber-500/20">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-amber-400 tracking-tight">
                  {statsLoading ? '—' : stats?.buyersPending ?? 0}
                </div>
                <div className="text-[11px] text-zinc-400 mt-2">
                  Aguardando liberação de acesso
                </div>
              </div>

              {/* Plaquinhas Geradas */}
              <div className="surface-3d-card p-5 border border-zinc-800 relative overflow-hidden group">
                <div className="flex items-center justify-between text-zinc-400 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider">Plaquinhas Geradas</span>
                  <div className="p-2 rounded-xl bg-red-950/40 text-red-400 border border-red-500/20">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-white tracking-tight">
                  {statsLoading ? '—' : stats?.platesCount ?? 0}
                </div>
                <div className="text-[11px] text-zinc-500 mt-2">
                  Em {stats?.batchesCount ?? 0} lotes criados
                </div>
              </div>

              {/* Leituras Reais Registradas */}
              <div className="surface-3d-card p-5 border border-red-500/40 relative overflow-hidden group">
                <div className="flex items-center justify-between text-red-400 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider">Leituras Reais Registradas</span>
                  <div className="p-2 rounded-xl bg-red-950/50 text-red-400 border border-red-500/30">
                    <Eye className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-red-400 tracking-tight">
                  {statsLoading ? '—' : stats?.totalReads ?? 0}
                </div>
                <div className="text-[11px] text-zinc-400 mt-2">
                  Scans e aproximações NFC dinâmicos
                </div>
              </div>
            </div>

            {/* Quick Actions and Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="surface-3d-card p-6 border border-zinc-800">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  Status da Base de Usuários
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#090a10] border border-zinc-800">
                    <span className="text-xs text-zinc-300">Aprovados e Ativos</span>
                    <span className="text-sm font-bold text-emerald-400">{stats?.buyersApproved ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#090a10] border border-zinc-800">
                    <span className="text-xs text-zinc-300">Pendentes de Aprovação</span>
                    <span className="text-sm font-bold text-amber-400">{stats?.buyersPending ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#090a10] border border-zinc-800">
                    <span className="text-xs text-zinc-300">Bloqueados</span>
                    <span className="text-sm font-bold text-red-400">{stats?.buyersBlocked ?? 0}</span>
                  </div>
                </div>
              </div>

              <div className="surface-3d-card p-6 border border-zinc-800">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-red-400" />
                  Ecossistema NFC & QR Dinâmicos
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#090a10] border border-zinc-800">
                    <span className="text-xs text-zinc-300">Endpoints Dinâmicos Emitidos</span>
                    <span className="text-sm font-bold text-white">{stats?.qrcodesCount ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#090a10] border border-zinc-800">
                    <span className="text-xs text-zinc-300">Total de Lotes Produzidos</span>
                    <span className="text-sm font-bold text-white">{stats?.batchesCount ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#090a10] border border-zinc-800">
                    <span className="text-xs text-zinc-300">Média de Leituras por Plaquinha</span>
                    <span className="text-sm font-bold text-red-400">
                      {stats && stats.platesCount > 0
                        ? (stats.totalReads / stats.platesCount).toFixed(1)
                        : '0'}
                    </span>
                  </div>
                </div>
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
                <p className="text-xs text-zinc-400 mt-0.5">
                  Aprovação, bloqueio e liberação de compradores em tempo real.
                </p>
              </div>

              {/* Search box */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Buscar comprador ou e-mail..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-[#0a0b10] border border-zinc-800 focus:border-red-500 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 outline-none"
                />
              </div>
            </div>

            {usersError && (
              <div className="p-4 rounded-xl bg-red-950/70 border border-red-500 text-red-200 text-sm">
                {usersError}
              </div>
            )}

            {usersLoading ? (
              <div className="p-12 text-center text-zinc-500 text-sm">
                Carregando lista de compradores...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center surface-3d-card border border-zinc-800 text-zinc-500 text-sm">
                Nenhum comprador encontrado com o termo pesquisado.
              </div>
            ) : (
              <div className="surface-3d-card border border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-[#090a10] text-zinc-400 font-bold uppercase tracking-wider">
                        <th className="py-3.5 px-4">Nome</th>
                        <th className="py-3.5 px-4">E-mail</th>
                        <th className="py-3.5 px-4">Data Cadastro</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Ações Administrativas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {filteredUsers.map((buyer) => {
                        const isBusy = actionInProgress === buyer.uid;
                        return (
                          <tr key={buyer.uid} className="hover:bg-zinc-900/40 transition-colors">
                            <td className="py-3 px-4 font-semibold text-white">
                              {buyer.fullName}
                            </td>
                            <td className="py-3 px-4 font-mono text-zinc-300">
                              {buyer.email}
                            </td>
                            <td className="py-3 px-4 text-zinc-400">
                              {new Date(buyer.createdAt).toLocaleDateString('pt-BR')} às{' '}
                              {new Date(buyer.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-3 px-4">
                              {buyer.status === 'pending' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px] bg-amber-950/80 border border-amber-500/50 text-amber-300">
                                  <Clock className="w-3 h-3 text-amber-400" />
                                  Pendente
                                </span>
                              )}
                              {buyer.status === 'approved' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px] bg-emerald-950/80 border border-emerald-500/50 text-emerald-300">
                                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                                  Aprovado
                                </span>
                              )}
                              {buyer.status === 'blocked' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px] bg-red-950/80 border border-red-500/50 text-red-300">
                                  <XCircle className="w-3 h-3 text-red-400" />
                                  Bloqueado
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {buyer.status === 'pending' && (
                                  <button
                                    onClick={() => handleUpdateStatus(buyer.uid, 'approved')}
                                    disabled={isBusy}
                                    className="btn-3d-red px-3 py-1.5 rounded-lg font-bold text-[11px] uppercase text-white flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" /> Aprovar
                                  </button>
                                )}

                                {buyer.status === 'approved' && (
                                  <button
                                    onClick={() => handleUpdateStatus(buyer.uid, 'blocked')}
                                    disabled={isBusy}
                                    className="btn-3d-graphite px-3 py-1.5 rounded-lg font-bold text-[11px] uppercase text-red-400 hover:text-red-300 border-red-500/30 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  >
                                    <UserX className="w-3.5 h-3.5" /> Bloquear
                                  </button>
                                )}

                                {buyer.status === 'blocked' && (
                                  <button
                                    onClick={() => handleUpdateStatus(buyer.uid, 'approved')}
                                    disabled={isBusy}
                                    className="btn-3d-red px-3 py-1.5 rounded-lg font-bold text-[11px] uppercase text-white flex items-center gap-1 cursor-pointer disabled:opacity-50"
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
              <p className="text-xs text-zinc-400 mt-0.5">
                Auditoria de lotes, numeração e plaquinhas geradas por todos os compradores.
              </p>
            </div>

            {batchesLoading ? (
              <div className="p-12 text-center text-zinc-500 text-sm">Carregando lotes...</div>
            ) : allBatches.length === 0 ? (
              <div className="p-12 text-center surface-3d-card border border-zinc-800 text-zinc-500 text-sm">
                Nenhum lote foi gerado na plataforma até o momento.
              </div>
            ) : (
              <div className="space-y-4">
                {allBatches.map((batch) => (
                  <div key={batch.id} className="surface-3d-card p-5 border border-zinc-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/60 pb-3">
                      <div>
                        <div className="font-bold text-white text-base">{batch.name}</div>
                        <div className="text-xs text-zinc-400 font-mono mt-0.5">
                          Comprador: <span className="text-zinc-200">{batch.buyerEmail}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <span className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
                          {batch.quantity} {batch.quantity === 1 ? 'plaquinha' : 'plaquinhas'}
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-red-950/40 border border-red-500/30 text-red-300 font-mono font-bold">
                          Nº {String(batch.startNumber).padStart(6, '0')} até Nº {String(batch.endNumber).padStart(6, '0')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
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
