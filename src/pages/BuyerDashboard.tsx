import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/authContext';
import { BrandLogo3D, BatchPlates3DIcon } from '../components/Brand3D';
import {
  getBatches,
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
  User,
  PlusCircle,
  Search,
  ExternalLink,
  Save,
  Check,
  LogOut,
  RefreshCw,
  FolderArchive,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

// Plate Card with Live Rendered Canvas
const PlateCardPreview: React.FC<{
  plate: PlateItem;
  calibration: ModelCalibration;
  onEditTarget: (plate: PlateItem) => void;
  onDownloadPng: (plate: PlateItem) => void;
  isEditing: boolean;
  editingUrl: string;
  setEditingUrl: (val: string) => void;
  onSaveTarget: (plate: PlateItem) => void;
  onCancelEdit: () => void;
  savingTarget: boolean;
  isSavedSuccess: boolean;
}> = ({
  plate,
  calibration,
  onEditTarget,
  onDownloadPng,
  isEditing,
  editingUrl,
  setEditingUrl,
  onSaveTarget,
  onCancelEdit,
  savingTarget,
  isSavedSuccess,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const redirectUrl = `${window.location.origin}/r/${plate.qrCodeId}`;

  useEffect(() => {
    if (canvasRef.current && calibration) {
      renderPlateToCanvas(calibration, redirectUrl, plate.formattedNumber, canvasRef.current, 500);
    }
  }, [plate, calibration, redirectUrl]);

  return (
    <div className="surface-3d-card p-4 border border-slate-800 hover:border-sky-500/40 transition-all flex flex-col justify-between space-y-4">
      {/* Complete Artwork Preview with replaced QR code and discrete numbering */}
      <div className="relative rounded-xl overflow-hidden bg-black aspect-square w-full border border-slate-800 shadow-md">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain"
          width={500}
          height={500}
        />
      </div>

      {/* Info & Destination Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950/40 border border-sky-500/30 px-2 py-0.5 rounded-md">
            Nº {plate.formattedNumber}
          </span>

          <span className="text-[11px] text-slate-400">
            {plate.clickCount} {plate.clickCount === 1 ? 'leitura' : 'leituras'}
          </span>
        </div>

        {/* Destination Editor */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Destino Dinâmico:
          </label>

          {isEditing ? (
            <div className="space-y-2">
              <input
                type="url"
                value={editingUrl}
                onChange={(e) => setEditingUrl(e.target.value)}
                placeholder="https://instagram.com/seuperfil"
                className="w-full bg-[#070d1e] border border-sky-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => onSaveTarget(plate)}
                  disabled={savingTarget}
                  className="btn-3d-blue px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingTarget ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-black/60 border border-slate-800">
              <span className="text-xs font-mono truncate text-slate-300">
                {plate.targetUrl || <span className="text-slate-500 italic">Sem link configurado</span>}
              </span>

              <button
                onClick={() => onEditTarget(plate)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-white cursor-pointer flex-shrink-0"
              >
                Editar
              </button>
            </div>
          )}

          {isSavedSuccess && (
            <div className="mt-1 text-[11px] text-emerald-400 font-bold flex items-center gap-1">
              <Check className="w-3 h-3" /> Destino atualizado com sucesso!
            </div>
          )}
        </div>

        {/* QR Link & Download PNG */}
        <div className="flex items-center justify-between pt-1 text-[11px]">
          <a
            href={redirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 hover:underline flex items-center gap-1"
          >
            Testar QR <ExternalLink className="w-3 h-3" />
          </a>

          <button
            onClick={() => onDownloadPng(plate)}
            className="btn-3d-graphite px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <ImageIcon className="w-3 h-3 text-sky-400" /> Baixar PNG
          </button>
        </div>
      </div>
    </div>
  );
};

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
  
  // Newly generated batch or selected batch to view in detail
  const [viewingBatchId, setViewingBatchId] = useState<string | null>(null);

  // Destination editing
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
  const [editingTargetUrl, setEditingTargetUrl] = useState<string>('');
  const [savingTarget, setSavingTarget] = useState<boolean>(false);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // Handle Generate Batch
  const handleGenerateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (batchQuantity <= 0 || batchQuantity > 200) {
      alert('Selecione uma quantidade entre 1 e 200 plaquinhas por lote.');
      return;
    }

    setGeneratingBatch(true);
    setGenerationProgress('Reservando numeração única sequencial no banco...');

    try {
      setGenerationProgress('Gerando plaquinhas e endpoints dinâmicos...');
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
      setViewingBatchId(batch.id);
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

  // Handle Download Batch PDF A4 (ON DEMAND, 4 per sheet, centered 10x10 cm)
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
      triggerFileDownload(pdfBlob, `LOTE_A4_${batch.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
    } catch (err: any) {
      alert('Erro ao gerar PDF para impressão: ' + err.message);
    } finally {
      setExportingProgress(null);
    }
  };

  // Handle Download Batch ZIP (ON DEMAND)
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
      triggerFileDownload(zipBlob, `LOTE_ZIP_${batch.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.zip`);
    } catch (err: any) {
      alert('Erro ao gerar ZIP do lote: ' + err.message);
    } finally {
      setExportingProgress(null);
    }
  };

  const currentViewingBatch = viewingBatchId ? batches.find((b) => b.id === viewingBatchId) : null;
  const currentViewingPlates = viewingBatchId ? plates.filter((p) => p.batchId === viewingBatchId) : [];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-sky-500/25 bg-[#070d1e]/90 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <BrandLogo3D size="sm" />

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0b1428] border border-slate-800 text-xs">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span className="font-semibold text-white">{userProfile?.fullName}</span>
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

      {/* Main body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Navigation Tabs with 3D Depth */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#090f23] border border-slate-800">
          <button
            onClick={() => {
              setActiveTab('create');
              setViewingBatchId(null);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'create' && !viewingBatchId
                ? 'btn-3d-blue text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <BatchPlates3DIcon className="w-4 h-4" /> Gerar Lote
          </button>

          <button
            onClick={() => {
              setActiveTab('batches');
              setViewingBatchId(null);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'batches' || (activeTab === 'create' && viewingBatchId)
                ? 'btn-3d-blue text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Layers className="w-4 h-4" /> Meus Lotes ({batches.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('qrcodes');
              setViewingBatchId(null);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'qrcodes'
                ? 'btn-3d-blue text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <QrCode className="w-4 h-4" /> Todos os QR Codes ({plates.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('account');
              setViewingBatchId(null);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'account'
                ? 'btn-3d-blue text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <User className="w-4 h-4" /> Minha Conta
          </button>
        </div>

        {/* DETAILED BATCH VIEW (Shown either right after generating or when clicking 'Visualizar Lote') */}
        {viewingBatchId && currentViewingBatch ? (
          <div className="space-y-6">
            {/* Header with Prominent 'BAIXAR PDF A4' button at the TOP */}
            <div className="surface-3d-elevated p-6 border border-sky-500/40 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <button
                    onClick={() => setViewingBatchId(null)}
                    className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1.5 mb-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Voltar aos Meus Lotes
                  </button>
                  <h1 className="text-2xl font-black uppercase tracking-wide text-white">
                    {currentViewingBatch.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-300">
                    <span className="font-mono text-sky-400 font-bold bg-sky-950/40 border border-sky-500/30 px-2 py-0.5 rounded">
                      Nº {String(currentViewingBatch.startNumber).padStart(6, '0')} até Nº{' '}
                      {String(currentViewingBatch.endNumber).padStart(6, '0')}
                    </span>
                    <span>•</span>
                    <span>{currentViewingBatch.quantity} {currentViewingBatch.quantity === 1 ? 'plaquinha' : 'plaquinhas'}</span>
                    <span>•</span>
                    <span>Modelo: {currentViewingBatch.modelId}</span>
                  </div>
                </div>

                {/* PROMINENT TOP DOWNLOAD BUTTONS */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => handleDownloadBatchPdf(currentViewingBatch)}
                    className="btn-3d-blue px-6 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider text-white shadow-xl cursor-pointer flex items-center gap-2.5"
                    title="Baixar folha A4 com 4 plaquinhas por página (10x10 cm cada)"
                  >
                    <FileText className="w-5 h-5" /> BAIXAR PDF A4
                  </button>

                  <button
                    onClick={() => handleDownloadBatchZip(currentViewingBatch)}
                    className="btn-3d-graphite px-4 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-200 hover:text-white cursor-pointer flex items-center gap-2"
                    title="Baixar todas as artes individuais em alta resolução"
                  >
                    <FolderArchive className="w-4 h-4 text-sky-400" /> Baixar ZIP (300 DPI)
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                Plaquinhas com arte oficial completa, QR Codes dinâmicos perfeitamente integrados e numeração discreta nos cantos.
              </div>
            </div>

            {/* Grid of Complete Plates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentViewingPlates.map((plate) => {
                const cal = calibrations[plate.modelId] || OFFICIAL_MODELS[0];
                return (
                  <PlateCardPreview
                    key={plate.id}
                    plate={plate}
                    calibration={cal}
                    onEditTarget={(p) => {
                      setEditingTargetId(p.id);
                      setEditingTargetUrl(p.targetUrl || '');
                    }}
                    onDownloadPng={handleDownloadSinglePng}
                    isEditing={editingTargetId === plate.id}
                    editingUrl={editingTargetUrl}
                    setEditingUrl={setEditingTargetUrl}
                    onSaveTarget={handleSaveTarget}
                    onCancelEdit={() => setEditingTargetId(null)}
                    savingTarget={savingTarget}
                    isSavedSuccess={savedSuccessId === plate.id}
                  />
                );
              })}
            </div>
          </div>
        ) : null}

        {/* TAB 1: GERAR LOTE (Form) */}
        {activeTab === 'create' && !viewingBatchId && (
          <form onSubmit={handleGenerateBatch} className="space-y-8">
            <div>
              <h1 className="text-xl font-black uppercase tracking-wide text-white flex items-center gap-3">
                <BatchPlates3DIcon className="w-6 h-6" />
                Gerador de Lotes Dinâmico Pro
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Escolha o modelo oficial da sua plaquinha 10 × 10 cm, defina a quantidade e gere a numeração única no banco de dados.
              </p>
            </div>

            {/* 1. Escolha do Modelo */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-sky-400">
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
                          ? 'border-sky-500 shadow-[0_0_20px_rgba(56,189,248,0.4)] scale-[1.02]'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="aspect-square rounded-lg overflow-hidden bg-black mb-2 relative border border-slate-900">
                        <img
                          src={model.imageUrl}
                          alt={model.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-sky-500 text-white rounded-full p-1 shadow-md">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <div className="text-xs font-bold text-white truncate">
                        {model.name.split('—')[1] || model.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Modelo {idx + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Quantidade e Nome do Lote */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 surface-3d-card p-6 border border-slate-800">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
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
                            ? 'btn-3d-blue text-white shadow-md'
                            : 'bg-[#0f172a] text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {qty} {qty === 1 ? 'placa' : 'placas'}
                      </button>
                    ))}
                  </div>

                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={batchQuantity}
                    onChange={(e) => setBatchQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-[#070d1e] border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                    placeholder="Outra quantidade personalizada..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Nome do Lote (Opcional)
                  </label>
                  <input
                    type="text"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="Ex: Restaurante Centro - Mesas"
                    className="w-full bg-[#070d1e] border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Destino Inicial Dinâmico (Opcional)
                  </label>
                  <input
                    type="url"
                    value={defaultTargetUrl}
                    onChange={(e) => setDefaultTargetUrl(e.target.value)}
                    placeholder="https://instagram.com/seuperfil ou link WhatsApp"
                    className="w-full bg-[#070d1e] border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Você poderá alterar este destino a qualquer momento após a impressão. O QR Code físico não muda!
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black/60 border border-slate-800/80 text-xs text-slate-400 space-y-1.5">
                  <div className="font-semibold text-slate-300">Padrão de Precisão Dinâmico Pro:</div>
                  <div>• QR Code substituído exatamente na área correspondente da arte.</div>
                  <div>• Numeração única discreta no canto inferior, sem caixas escuras.</div>
                  <div>• PDF A4 sob demanda com 4 plaquinhas por página (10 × 10 cm cada).</div>
                </div>
              </div>
            </div>

            {/* Submit button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              {generatingBatch ? (
                <div className="flex items-center gap-3 text-sm text-sky-400 font-bold">
                  <RefreshCw className="w-5 h-5 animate-spin text-sky-400" />
                  <span>{generationProgress}</span>
                </div>
              ) : <div />}

              <button
                type="submit"
                disabled={generatingBatch}
                className="btn-3d-blue w-full sm:w-auto px-10 py-4 rounded-xl font-black text-sm uppercase tracking-wider text-white shadow-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-5 h-5" /> GERAR LOTE DE {batchQuantity} PLAQUINHAS
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: MEUS LOTES (List with true artwork thumbnails) */}
        {activeTab === 'batches' && !viewingBatchId && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-black uppercase tracking-wide text-white">
                  Histórico de Lotes
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Lotes salvos permanentemente no Firebase com visualização completa das artes.
                </p>
              </div>

              <button
                onClick={loadData}
                disabled={loadingData}
                className="btn-3d-graphite px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin text-sky-400' : ''}`} />
                Atualizar
              </button>
            </div>

            {loadingData ? (
              <div className="p-12 text-center text-slate-500 text-sm">Carregando seus lotes...</div>
            ) : batches.length === 0 ? (
              <div className="p-12 text-center surface-3d-card border border-slate-800 text-slate-500 text-sm space-y-4">
                <Layers className="w-10 h-10 text-slate-600 mx-auto" />
                <p>Você ainda não gerou nenhum lote.</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="btn-3d-blue px-5 py-2.5 rounded-xl text-xs font-bold uppercase text-white cursor-pointer"
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
                      className="surface-3d-card p-5 border border-slate-800 hover:border-slate-700 transition-all space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          {modelObj && (
                            <img
                              src={modelObj.imageUrl}
                              alt="Modelo"
                              className="w-16 h-16 rounded-xl object-cover border border-slate-700 shadow-md flex-shrink-0"
                            />
                          )}
                          <div>
                            <h3 className="font-bold text-white text-base">{batch.name}</h3>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                              <span className="font-mono text-sky-400 font-bold bg-sky-950/40 border border-sky-500/30 px-2 py-0.5 rounded">
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

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => setViewingBatchId(batch.id)}
                            className="btn-3d-blue px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5 cursor-pointer shadow-md"
                          >
                            <QrCode className="w-4 h-4" /> Visualizar Lote Completo
                          </button>

                          <button
                            onClick={() => handleDownloadBatchPdf(batch)}
                            className="btn-3d-graphite px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase text-slate-200 hover:text-white flex items-center gap-1.5 cursor-pointer"
                            title="Baixar PDF A4 com 4 plaquinhas por folha sob demanda"
                          >
                            <FileText className="w-4 h-4 text-sky-400" /> Baixar PDF A4
                          </button>

                          <button
                            onClick={() => handleDownloadBatchZip(batch)}
                            className="btn-3d-graphite px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase text-slate-200 hover:text-white flex items-center gap-1.5 cursor-pointer"
                            title="Baixar arquivo ZIP com todos os PNGs em 300 DPI"
                          >
                            <FolderArchive className="w-4 h-4 text-sky-400" /> Baixar ZIP
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

        {/* TAB 3: TODOS OS QR CODES (Search & edit) */}
        {activeTab === 'qrcodes' && !viewingBatchId && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-black uppercase tracking-wide text-white">
                  Todos os QR Codes Dinâmicos
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pesquise por número e altere destinos instantaneamente.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar Nº 000001 ou link..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#070d1e] border border-slate-800 focus:border-sky-500 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            {loadingData ? (
              <div className="p-12 text-center text-slate-500 text-sm">Carregando plaquinhas...</div>
            ) : plates.length === 0 ? (
              <div className="p-12 text-center surface-3d-card border border-slate-800 text-slate-500 text-sm">
                Nenhuma plaquinha gerada ainda.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {plates
                  .filter((p) => {
                    const q = searchQuery.toLowerCase().trim();
                    if (!q) return true;
                    return p.formattedNumber.includes(q) || p.targetUrl.toLowerCase().includes(q);
                  })
                  .map((plate) => {
                    const cal = calibrations[plate.modelId] || OFFICIAL_MODELS[0];
                    return (
                      <PlateCardPreview
                        key={plate.id}
                        plate={plate}
                        calibration={cal}
                        onEditTarget={(p) => {
                          setEditingTargetId(p.id);
                          setEditingTargetUrl(p.targetUrl || '');
                        }}
                        onDownloadPng={handleDownloadSinglePng}
                        isEditing={editingTargetId === plate.id}
                        editingUrl={editingTargetUrl}
                        setEditingUrl={setEditingTargetUrl}
                        onSaveTarget={handleSaveTarget}
                        onCancelEdit={() => setEditingTargetId(null)}
                        savingTarget={savingTarget}
                        isSavedSuccess={savedSuccessId === plate.id}
                      />
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MINHA CONTA */}
        {activeTab === 'account' && !viewingBatchId && (
          <div className="max-w-xl mx-auto surface-3d-elevated p-8 border border-slate-800 space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
              <div className="w-14 h-14 rounded-2xl bg-sky-950/60 border border-sky-500/40 flex items-center justify-center">
                <User className="w-7 h-7 text-sky-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{userProfile?.fullName}</h2>
                <p className="text-xs font-mono text-slate-400">{userProfile?.email}</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#070d1e] border border-slate-800">
                <span className="text-slate-400">Tipo de Acesso</span>
                <span className="font-bold uppercase text-white">Comprador Oficial</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#070d1e] border border-slate-800">
                <span className="text-slate-400">Status da Conta</span>
                <span className="font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Aprovado e Ativo
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#070d1e] border border-slate-800">
                <span className="text-slate-400">Total de Plaquinhas Emitidas</span>
                <span className="font-bold text-white">{plates.length}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#070d1e] border border-slate-800">
                <span className="text-slate-400">Total de Leituras Registradas</span>
                <span className="font-bold text-sky-400">
                  {plates.reduce((sum, p) => sum + (p.clickCount || 0), 0)}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => logout()}
                className="btn-3d-graphite w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-rose-400 hover:text-rose-300 border border-rose-500/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Sair da Plataforma
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Export progress modal */}
      {exportingProgress && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="surface-3d-elevated p-8 max-w-sm w-full border border-sky-500/50 text-center space-y-4">
            <RefreshCw className="w-10 h-10 text-sky-400 animate-spin mx-auto" />
            <h3 className="text-base font-bold text-white uppercase">
              Gerando {exportingProgress.type}...
            </h3>
            <p className="text-xs text-slate-400">
              Renderizando plaquinhas 10 × 10 cm com motor unificado.
            </p>
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-sky-500 h-full transition-all duration-200"
                style={{
                  width: `${
                    exportingProgress.total > 0
                      ? (exportingProgress.current / exportingProgress.total) * 100
                      : 50
                  }%`,
                }}
              />
            </div>
            <div className="text-xs font-mono text-slate-400">
              {exportingProgress.current} de {exportingProgress.total} plaquinhas
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
