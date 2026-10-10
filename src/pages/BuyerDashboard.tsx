import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/authContext';
import { BrandLogo3D, BatchPlates3DIcon } from '../components/Brand3D';
import {
  getBatches,
  getPlatesByBatch,
  getAllPlates,
  createBatchWithPlates,
  updateQrTargetUrl,
  getModelCalibrations,
} from '../lib/firestoreService';
import {
  PlateBatch,
  PlateItem,
  ModelCalibration,
} from '../types';
import { OFFICIAL_MODELS } from '../lib/modelsData';
import {
  renderPlateToCanvas,
  exportPlatePng,
  exportBatchZip,
  exportBatchPdfA4,
  triggerFileDownload,
} from '../lib/plateEngine';
import {
  Layers,
  QrCode,
  FileDown,
  User,
  PlusCircle,
  Search,
  ExternalLink,
  Save,
  Check,
  AlertCircle,
  LogOut,
  RefreshCw,
  FolderArchive,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const BuyerDashboard: React.FC = () => {
  const { currentUser, userProfile, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'create' | 'batches' | 'qrcodes' | 'account'>('create');

  // Calibrations
  const [calibrations, setCalibrations] = useState<Record<string, ModelCalibration>>({});

  // Batches and plates
  const [batches, setBatches] = useState<PlateBatch[]>([]);
  const [plates, setPlates] = useState<PlateItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Batch Generation Form State
  const [selectedModelId, setSelectedModelId] = useState<string>('modelo-1');
  const [batchQuantity, setBatchQuantity] = useState<number>(5);
  const [batchName, setBatchName] = useState<string>('');
  const [defaultTargetUrl, setDefaultTargetUrl] = useState<string>('');
  const [generatingBatch, setGeneratingBatch] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<string>('');
  const [generationSuccessBatch, setGenerationSuccessBatch] = useState<PlateBatch | null>(null);

  // Search and Edit State in "Meus QR Codes"
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterBatchId, setFilterBatchId] = useState<string>('all');
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
  const [editingTargetUrl, setEditingTargetUrl] = useState<string>('');
  const [savingTarget, setSavingTarget] = useState<boolean>(false);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

  // Preview Modal / Slideout
  const [previewPlate, setPreviewPlate] = useState<PlateItem | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Export progress modal state
  const [exportingProgress, setExportingProgress] = useState<{
    type: 'PNG' | 'ZIP' | 'PDF';
    current: number;
    total: number;
  } | null>(null);

  const loadData = async () => {
    if (!currentUser) return;
    setLoadingData(true);
    try {
      const [cals, bList, pList] = await Promise.all([
        getModelCalibrations(),
        getBatches(currentUser.uid, false),
        getAllPlates(currentUser.uid, false),
      ]);
      setCalibrations(cals);
      setBatches(bList);
      setPlates(pList);
    } catch (e) {
      console.error('Erro ao carregar dados do comprador:', e);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Live render when preview modal opens
  useEffect(() => {
    if (previewPlate && previewCanvasRef.current) {
      const cal = calibrations[previewPlate.modelId] || OFFICIAL_MODELS[0];
      const redirectUrl = `${window.location.origin}/r/${previewPlate.qrCodeId}`;
      renderPlateToCanvas(cal, redirectUrl, previewPlate.formattedNumber, previewCanvasRef.current, 600);
    }
  }, [previewPlate, calibrations]);

  // Handle Generate Batch
  const handleGenerateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (batchQuantity <= 0 || batchQuantity > 200) {
      alert('Selecione uma quantidade entre 1 e 200 plaquinhas por lote.');
      return;
    }

    setGeneratingBatch(true);
    setGenerationProgress('Reservando numeração sequencial atômica no banco de dados...');

    try {
      setGenerationProgress('Criando plaquinhas e endpoints dinâmicos protegidos...');
      const { batch, plates: newPlates } = await createBatchWithPlates({
        buyerId: currentUser.uid,
        buyerEmail: currentUser.email || '',
        modelId: selectedModelId,
        quantity: batchQuantity,
        batchName: batchName.trim() || `Lote ${new Date().toLocaleDateString('pt-BR')}`,
        defaultTargetUrl: defaultTargetUrl.trim(),
      });

      setBatches((prev) => [batch, ...prev]);
      setPlates((prev) => [...newPlates, ...prev]);
      setGenerationSuccessBatch(batch);
      setBatchName('');
      setDefaultTargetUrl('');
    } catch (err: any) {
      alert(`Falha ao gerar lote: ${err.message}`);
    } finally {
      setGeneratingBatch(false);
      setGenerationProgress('');
    }
  };

  // Handle Save QR Destination URL
  const handleSaveTarget = async (plate: PlateItem) => {
    setSavingTarget(true);
    try {
      await updateQrTargetUrl(plate.qrCodeId, plate.id, editingTargetUrl);
      setPlates((prev) =>
        prev.map((p) => (p.id === plate.id ? { ...p, targetUrl: editingTargetUrl.trim() } : p))
      );
      setSavedSuccessId(plate.id);
      setEditingTargetId(null);
      setTimeout(() => setSavedSuccessId(null), 2500);
    } catch (err: any) {
      alert(`Erro ao salvar destino: ${err.message}`);
    } finally {
      setSavingTarget(false);
    }
  };

  // Handle Download Single PNG
  const handleDownloadSinglePng = async (plate: PlateItem) => {
    const cal = calibrations[plate.modelId] || OFFICIAL_MODELS[0];
    const redirectUrl = `${window.location.origin}/r/${plate.qrCodeId}`;

    setExportingProgress({ type: 'PNG', current: 1, total: 1 });
    try {
      const blob = await exportPlatePng(cal, redirectUrl, plate.formattedNumber);
      triggerFileDownload(blob, `PLACA-${plate.formattedNumber}.png`);
    } catch (err: any) {
      alert('Erro ao gerar PNG: ' + err.message);
    } finally {
      setExportingProgress(null);
    }
  };

  // Handle Download Batch ZIP (on demand)
  const handleDownloadBatchZip = async (batch: PlateBatch) => {
    const batchPlates = plates.filter((p) => p.batchId === batch.id);
    if (batchPlates.length === 0) {
      alert('Nenhuma plaquinha encontrada neste lote.');
      return;
    }

    const cal = calibrations[batch.modelId] || OFFICIAL_MODELS[0];
    const platesToExport = batchPlates.map((p) => ({
      formattedNumber: p.formattedNumber,
      qrRedirectUrl: `${window.location.origin}/r/${p.qrCodeId}`,
    }));

    setExportingProgress({ type: 'ZIP', current: 0, total: platesToExport.length });

    try {
      const zipBlob = await exportBatchZip(cal, platesToExport, (current, total) => {
        setExportingProgress({ type: 'ZIP', current, total });
      });
      triggerFileDownload(zipBlob, `LOTE-${batch.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.zip`);
    } catch (err: any) {
      alert('Erro ao gerar ZIP do lote: ' + err.message);
    } finally {
      setExportingProgress(null);
    }
  };

  // Handle Download Batch PDF A4 (on demand)
  const handleDownloadBatchPdf = async (batch: PlateBatch) => {
    const batchPlates = plates.filter((p) => p.batchId === batch.id);
    if (batchPlates.length === 0) {
      alert('Nenhuma plaquinha encontrada neste lote.');
      return;
    }

    const cal = calibrations[batch.modelId] || OFFICIAL_MODELS[0];
    const platesToExport = batchPlates.map((p) => ({
      formattedNumber: p.formattedNumber,
      qrRedirectUrl: `${window.location.origin}/r/${p.qrCodeId}`,
    }));

    setExportingProgress({ type: 'PDF', current: 0, total: platesToExport.length });

    try {
      const pdfBlob = await exportBatchPdfA4(cal, platesToExport, (current, total) => {
        setExportingProgress({ type: 'PDF', current, total });
      });
      triggerFileDownload(pdfBlob, `LOTE_IMPRESSAO_A4_${batch.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
    } catch (err: any) {
      alert('Erro ao gerar PDF para impressão: ' + err.message);
    } finally {
      setExportingProgress(null);
    }
  };

  // Filtered plates list
  const filteredPlates = plates.filter((p) => {
    if (filterBatchId !== 'all' && p.batchId !== filterBatchId) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.formattedNumber.includes(q) ||
      p.targetUrl.toLowerCase().includes(q) ||
      (p.title && p.title.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-red-500/20 bg-[#090a10]/90 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <BrandLogo3D size="sm" />

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#12131b] border border-zinc-800 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-white">{userProfile?.fullName}</span>
              <span className="text-zinc-500 font-mono text-[11px] truncate max-w-[150px]">
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

      {/* Main body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Navigation Tabs with 3D Depth */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#0c0d14] border border-zinc-800">
          <button
            onClick={() => {
              setActiveTab('create');
              setGenerationSuccessBatch(null);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'btn-3d-red text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <BatchPlates3DIcon className="w-4 h-4" /> Gerar Lote
          </button>

          <button
            onClick={() => setActiveTab('batches')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'batches'
                ? 'btn-3d-red text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <Layers className="w-4 h-4" /> Meus Lotes ({batches.length})
          </button>

          <button
            onClick={() => setActiveTab('qrcodes')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'qrcodes'
                ? 'btn-3d-red text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <QrCode className="w-4 h-4" /> Meus QR Codes & Destinos ({plates.length})
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'account'
                ? 'btn-3d-red text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <User className="w-4 h-4" /> Minha Conta
          </button>
        </div>

        {/* TAB 1: GERAR LOTE */}
        {activeTab === 'create' && (
          <div className="space-y-8">
            {generationSuccessBatch ? (
              /* Success Card after generation */
              <div className="surface-3d-elevated p-8 border border-emerald-500/40 text-center space-y-5 animate-fade-in">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-950/70 border border-emerald-500/50 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-wide">
                    Lote Gerado com Sucesso!
                  </h2>
                  <p className="text-emerald-400 font-semibold text-sm mt-1">
                    {generationSuccessBatch.quantity} plaquinhas numeradas de Nº{' '}
                    {String(generationSuccessBatch.startNumber).padStart(6, '0')} até Nº{' '}
                    {String(generationSuccessBatch.endNumber).padStart(6, '0')}
                  </p>
                </div>

                <p className="text-xs text-zinc-400 max-w-lg mx-auto">
                  Os números e QR Codes exclusivos já estão salvos e vinculados à sua conta. Agora você pode configurar os links ou baixar os arquivos sob demanda.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                  <button
                    onClick={() => {
                      setFilterBatchId(generationSuccessBatch.id);
                      setActiveTab('qrcodes');
                    }}
                    className="btn-3d-red px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white cursor-pointer"
                  >
                    Editar Destinos Deste Lote
                  </button>

                  <button
                    onClick={() => handleDownloadBatchPdf(generationSuccessBatch)}
                    className="btn-3d-graphite px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-zinc-200 hover:text-white cursor-pointer flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-red-500" /> Baixar PDF A4 para Impressão
                  </button>

                  <button
                    onClick={() => handleDownloadBatchZip(generationSuccessBatch)}
                    className="btn-3d-graphite px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-zinc-200 hover:text-white cursor-pointer flex items-center gap-2"
                  >
                    <FolderArchive className="w-4 h-4 text-red-500" /> Baixar ZIP (PNGs 300 DPI)
                  </button>

                  <button
                    onClick={() => setGenerationSuccessBatch(null)}
                    className="text-xs text-zinc-500 hover:text-zinc-300 font-semibold underline py-2 px-4 cursor-pointer"
                  >
                    Criar Outro Lote
                  </button>
                </div>
              </div>
            ) : (
              /* Generator Form */
              <form onSubmit={handleGenerateBatch} className="space-y-8">
                <div>
                  <h1 className="text-xl font-black uppercase tracking-wide text-white flex items-center gap-3">
                    <BatchPlates3DIcon className="w-6 h-6" />
                    Gerador de Lotes Dinâmico Pro
                  </h1>
                  <p className="text-xs text-zinc-400 mt-1">
                    Escolha um dos 8 modelos oficiais de plaquinhas 10 × 10 cm, defina a quantidade e gere instantaneamente sua numeração única.
                  </p>
                </div>

                {/* 1. Escolha do Modelo */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-red-400">
                    1. Escolha o Modelo da Plaquinha (10 × 10 cm)
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {OFFICIAL_MODELS.map((model, idx) => {
                      const isSelected = selectedModelId === model.modelId;
                      return (
                        <div
                          key={model.modelId}
                          onClick={() => setSelectedModelId(model.modelId)}
                          className={`surface-3d-card p-3 rounded-xl cursor-pointer transition-all border ${
                            isSelected
                              ? 'border-red-500 shadow-[0_0_20px_rgba(255,20,50,0.4)] scale-[1.02]'
                              : 'border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <div className="aspect-square rounded-lg overflow-hidden bg-black mb-2 relative border border-zinc-900">
                            <img
                              src={model.imageUrl}
                              alt={model.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            {isSelected && (
                              <div className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 shadow-md">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                          <div className="text-xs font-bold text-white truncate">
                            {model.name.split('—')[1] || model.name}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            Modelo {idx + 1}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Quantidade e Nome do Lote */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 surface-3d-card p-6 border border-zinc-800">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                        2. Quantidade de Plaquinhas
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {[1, 5, 10, 25, 50, 100].map((qty) => (
                          <button
                            key={qty}
                            type="button"
                            onClick={() => setBatchQuantity(qty)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              batchQuantity === qty
                                ? 'bg-red-600 text-white shadow-md border border-red-400'
                                : 'bg-[#12131c] text-zinc-400 hover:text-white border border-zinc-800'
                            }`}
                          >
                            {qty} {qty === 1 ? 'placa' : 'placas'}
                          </button>
                        ))}
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="200"
                          value={batchQuantity}
                          onChange={(e) => setBatchQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-[#0a0b10] border border-zinc-800 focus:border-red-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                          placeholder="Outra quantidade personalizada..."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                        Nome do Lote (Opcional)
                      </label>
                      <input
                        type="text"
                        value={batchName}
                        onChange={(e) => setBatchName(e.target.value)}
                        placeholder="Ex: Restaurante Centro - Mesa 1 a 10"
                        className="w-full bg-[#0a0b10] border border-zinc-800 focus:border-red-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                        Destino Inicial Dinâmico (Opcional)
                      </label>
                      <input
                        type="url"
                        value={defaultTargetUrl}
                        onChange={(e) => setDefaultTargetUrl(e.target.value)}
                        placeholder="https://instagram.com/seuperfil ou link Google"
                        className="w-full bg-[#0a0b10] border border-zinc-800 focus:border-red-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none"
                      />
                      <p className="text-[11px] text-zinc-500 mt-1.5">
                        Você poderá alterar este destino a qualquer momento mesmo após a plaquinha ter sido impressa!
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-black/60 border border-zinc-800/80 text-xs text-zinc-400 space-y-1.5">
                      <div className="font-semibold text-zinc-300">Garantias Automáticas Dinâmico Pro:</div>
                      <div>• Numeração 100% contínua e única sem duplicidades.</div>
                      <div>• Substituição perfeita da área do QR Code original.</div>
                      <div>• Geração de PDF e ZIP sob demanda para máximo desempenho.</div>
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  {generatingBatch ? (
                    <div className="flex items-center gap-3 text-sm text-red-400 font-bold">
                      <RefreshCw className="w-5 h-5 animate-spin text-red-500" />
                      <span>{generationProgress}</span>
                    </div>
                  ) : <div />}

                  <button
                    type="submit"
                    disabled={generatingBatch}
                    className="btn-3d-red w-full sm:w-auto px-10 py-4 rounded-xl font-black text-sm uppercase tracking-wider text-white shadow-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="w-5 h-5" /> GERAR LOTE DE {batchQuantity} PLAQUINHAS
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: MEUS LOTES */}
        {activeTab === 'batches' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-black uppercase tracking-wide text-white">
                  Histórico de Lotes
                </h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Seus lotes gerados continuam permanentemente salvos no Firebase.
                </p>
              </div>

              <button
                onClick={loadData}
                disabled={loadingData}
                className="btn-3d-graphite px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin text-red-500' : ''}`} />
                Atualizar
              </button>
            </div>

            {loadingData ? (
              <div className="p-12 text-center text-zinc-500 text-sm">Carregando seus lotes...</div>
            ) : batches.length === 0 ? (
              <div className="p-12 text-center surface-3d-card border border-zinc-800 text-zinc-500 text-sm space-y-4">
                <Layers className="w-10 h-10 text-zinc-600 mx-auto" />
                <p>Você ainda não gerou nenhum lote.</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="btn-3d-red px-5 py-2.5 rounded-xl text-xs font-bold uppercase text-white cursor-pointer"
                >
                  Gerar Meu Primeiro Lote
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {batches.map((batch) => {
                  const modelObj = OFFICIAL_MODELS.find((m) => m.modelId === batch.modelId);
                  return (
                    <div
                      key={batch.id}
                      className="surface-3d-card p-5 border border-zinc-800 hover:border-zinc-700 transition-all space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          {modelObj && (
                            <img
                              src={modelObj.imageUrl}
                              alt="Modelo"
                              className="w-14 h-14 rounded-xl object-cover border border-zinc-700 flex-shrink-0"
                            />
                          )}
                          <div>
                            <h3 className="font-bold text-white text-base">{batch.name}</h3>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-zinc-400">
                              <span className="font-mono text-red-400 font-bold bg-red-950/40 border border-red-500/20 px-2 py-0.5 rounded">
                                Nº {String(batch.startNumber).padStart(6, '0')} até Nº{' '}
                                {String(batch.endNumber).padStart(6, '0')}
                              </span>
                              <span>•</span>
                              <span>{batch.quantity} {batch.quantity === 1 ? 'plaquinha' : 'plaquinhas'}</span>
                              <span>•</span>
                              <span>{new Date(batch.createdAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                        </div>

                        {/* On demand Export buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => {
                              setFilterBatchId(batch.id);
                              setActiveTab('qrcodes');
                            }}
                            className="btn-3d-graphite px-3 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
                          >
                            <QrCode className="w-4 h-4 text-zinc-400" /> Ver Plaquinhas
                          </button>

                          <button
                            onClick={() => handleDownloadBatchPdf(batch)}
                            className="btn-3d-red px-3.5 py-2 rounded-xl text-xs font-bold uppercase text-white flex items-center gap-1.5 cursor-pointer shadow-md"
                            title="Gera e baixa PDF A4 com 4 plaquinhas por folha sob demanda"
                          >
                            <FileText className="w-4 h-4" /> Baixar PDF A4
                          </button>

                          <button
                            onClick={() => handleDownloadBatchZip(batch)}
                            className="btn-3d-graphite px-3.5 py-2 rounded-xl text-xs font-bold uppercase text-zinc-200 hover:text-white flex items-center gap-1.5 cursor-pointer"
                            title="Gera e baixa arquivo ZIP com todos os PNGs em 300 DPI"
                          >
                            <FolderArchive className="w-4 h-4 text-red-400" /> Baixar ZIP
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MEUS QR CODES & EDITAR DESTINOS */}
        {activeTab === 'qrcodes' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-black uppercase tracking-wide text-white">
                  Meus QR Codes Dinâmicos & Destinos
                </h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Pesquise por número, altere os links a qualquer momento e baixe os arquivos individuais.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={filterBatchId}
                  onChange={(e) => setFilterBatchId(e.target.value)}
                  className="bg-[#0a0b10] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="all">Todos os Lotes ({batches.length})</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.quantity} un)
                    </option>
                  ))}
                </select>

                <div className="relative w-full sm:w-60">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Buscar Nº 000001 ou link..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0a0b10] border border-zinc-800 focus:border-red-500 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {loadingData ? (
              <div className="p-12 text-center text-zinc-500 text-sm">Carregando plaquinhas...</div>
            ) : filteredPlates.length === 0 ? (
              <div className="p-12 text-center surface-3d-card border border-zinc-800 text-zinc-500 text-sm">
                Nenhuma plaquinha encontrada com os filtros aplicados.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPlates.map((plate) => {
                  const isEditing = editingTargetId === plate.id;
                  const isSavedSuccess = savedSuccessId === plate.id;
                  const permanentQrUrl = `${window.location.origin}/r/${plate.qrCodeId}`;

                  return (
                    <div
                      key={plate.id}
                      className="surface-3d-card p-5 border border-zinc-800 hover:border-zinc-700/80 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                          <span className="font-mono text-sm font-black text-red-400 bg-red-950/40 border border-red-500/30 px-2.5 py-1 rounded-lg">
                            Nº {plate.formattedNumber}
                          </span>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-zinc-500">
                              {plate.clickCount} {plate.clickCount === 1 ? 'leitura' : 'leituras'}
                            </span>
                            <button
                              onClick={() => setPreviewPlate(plate)}
                              className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-zinc-300 hover:text-white cursor-pointer"
                            >
                              Ver Placa
                            </button>
                          </div>
                        </div>

                        {/* Destination Editor */}
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                            Destino Dinâmico Atual:
                          </label>

                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                type="url"
                                value={editingTargetUrl}
                                onChange={(e) => setEditingTargetUrl(e.target.value)}
                                placeholder="https://instagram.com/seuperfil"
                                className="w-full bg-[#0a0b10] border border-red-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                                autoFocus
                              />
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingTargetId(null)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveTarget(plate)}
                                  disabled={savingTarget}
                                  className="btn-3d-red px-4 py-1.5 rounded-lg text-xs font-bold uppercase text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  {savingTarget ? 'Salvando...' : 'Salvar no Firestore'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-black/60 border border-zinc-800">
                              <span className="text-xs font-mono truncate text-zinc-300">
                                {plate.targetUrl || (
                                  <span className="text-zinc-500 italic">Sem destino configurado</span>
                                )}
                              </span>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  onClick={() => {
                                    setEditingTargetId(plate.id);
                                    setEditingTargetUrl(plate.targetUrl || '');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-semibold text-white cursor-pointer"
                                >
                                  Editar
                                </button>
                              </div>
                            </div>
                          )}

                          {isSavedSuccess && (
                            <div className="mt-1.5 text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Destino atualizado com sucesso!
                            </div>
                          )}
                        </div>

                        {/* Permanent dynamic URL link */}
                        <div className="text-[11px] text-zinc-500 flex items-center justify-between">
                          <span className="truncate">URL gravada no QR: <span className="font-mono text-zinc-400">/r/{plate.qrCodeId}</span></span>
                          <a
                            href={permanentQrUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-400 hover:underline flex items-center gap-0.5 ml-2 flex-shrink-0"
                          >
                            Testar <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      {/* Download PNG single */}
                      <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-end">
                        <button
                          onClick={() => handleDownloadSinglePng(plate)}
                          className="btn-3d-graphite px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-zinc-400" /> Baixar PNG (300 DPI)
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MINHA CONTA */}
        {activeTab === 'account' && (
          <div className="max-w-xl mx-auto surface-3d-elevated p-8 border border-zinc-800 space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-zinc-800">
              <div className="w-14 h-14 rounded-2xl bg-red-950/60 border border-red-500/40 flex items-center justify-center">
                <User className="w-7 h-7 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{userProfile?.fullName}</h2>
                <p className="text-xs font-mono text-zinc-400">{userProfile?.email}</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#090a10] border border-zinc-800">
                <span className="text-zinc-400">Tipo de Acesso</span>
                <span className="font-bold uppercase text-white">Comprador Oficial</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#090a10] border border-zinc-800">
                <span className="text-zinc-400">Status da Conta</span>
                <span className="font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Aprovado e Ativo
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#090a10] border border-zinc-800">
                <span className="text-zinc-400">Total de Plaquinhas Emitidas</span>
                <span className="font-bold text-white">{plates.length}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#090a10] border border-zinc-800">
                <span className="text-zinc-400">Total de Leituras Registradas</span>
                <span className="font-bold text-red-400">
                  {plates.reduce((sum, p) => sum + (p.clickCount || 0), 0)}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800">
              <button
                onClick={() => logout()}
                className="btn-3d-graphite w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300 border border-red-500/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Sair da Plataforma
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modal for Plate Preview */}
      {previewPlate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="surface-3d-elevated p-6 max-w-md w-full border border-red-500/40 relative">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono font-bold text-sm text-red-400">
                Plaquinha Nº {previewPlate.formattedNumber}
              </span>
              <button
                onClick={() => setPreviewPlate(null)}
                className="text-zinc-500 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-black border border-zinc-800 shadow-2xl aspect-square flex items-center justify-center mb-4">
              <canvas
                ref={previewCanvasRef}
                className="w-full h-full object-contain"
                width={600}
                height={600}
              />
            </div>

            <div className="space-y-3">
              <div className="text-xs text-zinc-400">
                <span className="text-zinc-500">Destino atual:</span>{' '}
                <span className="font-mono text-white truncate block">
                  {previewPlate.targetUrl || 'Não configurado'}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => handleDownloadSinglePng(previewPlate)}
                  className="btn-3d-red flex-1 py-2.5 rounded-xl font-bold text-xs uppercase text-white flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4" /> Baixar PNG 300 DPI
                </button>
                <button
                  onClick={() => setPreviewPlate(null)}
                  className="btn-3d-graphite px-4 py-2.5 rounded-xl font-bold text-xs text-zinc-300 hover:text-white cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export progress modal */}
      {exportingProgress && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="surface-3d-elevated p-8 max-w-sm w-full border border-red-500/50 text-center space-y-4">
            <RefreshCw className="w-10 h-10 text-red-500 animate-spin mx-auto" />
            <h3 className="text-base font-bold text-white uppercase">
              Gerando Arquivo {exportingProgress.type}...
            </h3>
            <p className="text-xs text-zinc-400">
              Renderizando em alta fidelidade com motor unificado.
            </p>
            <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800">
              <div
                className="bg-red-600 h-full transition-all duration-200"
                style={{
                  width: `${
                    exportingProgress.total > 0
                      ? (exportingProgress.current / exportingProgress.total) * 100
                      : 50
                  }%`,
                }}
              />
            </div>
            <div className="text-xs font-mono text-zinc-500">
              {exportingProgress.current} de {exportingProgress.total} plaquinhas
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
