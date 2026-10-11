import React, { useState, useEffect, useRef } from 'react';
import { ModelCalibration } from '../types';
import { renderPlateToCanvas, exportPlatePng, triggerFileDownload } from '../lib/plateEngine';
import { saveModelCalibration } from '../lib/firestoreService';
import { Check, Sliders, Download, RotateCcw, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { OFFICIAL_MODELS } from '../lib/modelsData';

interface ModelCalibratorProps {
  calibrations: Record<string, ModelCalibration>;
  onCalibrationSaved: (updated: ModelCalibration) => void;
}

export const ModelCalibrator: React.FC<ModelCalibratorProps> = ({ calibrations, onCalibrationSaved }) => {
  const [selectedModelId, setSelectedModelId] = useState<string>('modelo-1');
  const [currentConfig, setCurrentConfig] = useState<ModelCalibration>(
    calibrations['modelo-1'] || OFFICIAL_MODELS[0]
  );
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [exportingTest, setExportingTest] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync when selected model changes or calibrations reload
  useEffect(() => {
    if (calibrations[selectedModelId]) {
      setCurrentConfig(JSON.parse(JSON.stringify(calibrations[selectedModelId])));
    }
  }, [selectedModelId, calibrations]);

  // Live render on canvas whenever config changes
  useEffect(() => {
    let active = true;

    async function updateCanvas() {
      if (!canvasRef.current || !currentConfig) return;
      try {
        const dummyUrl = `${window.location.origin}/r/dp-demo01`;
        await renderPlateToCanvas(currentConfig, dummyUrl, '000015', canvasRef.current, 600);
      } catch (err: any) {
        console.error('Erro na renderização do calibrador:', err);
      }
    }

    updateCanvas();

    return () => {
      active = false;
    };
  }, [currentConfig]);

  const handleQrChange = (field: keyof ModelCalibration['qrBox'], value: any) => {
    setCurrentConfig((prev) => ({
      ...prev,
      qrBox: {
        ...prev.qrBox,
        [field]: value,
      },
    }));
    setSavedSuccess(false);
  };

  const handleNumChange = (field: keyof ModelCalibration['numberBox'], value: any) => {
    setCurrentConfig((prev) => ({
      ...prev,
      numberBox: {
        ...prev.numberBox,
        [field]: value,
      },
    }));
    setSavedSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      await saveModelCalibration(currentConfig);
      onCalibrationSaved(currentConfig);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao gravar calibração no Firestore.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    const defaultModel = OFFICIAL_MODELS.find((m) => m.modelId === selectedModelId);
    if (defaultModel) {
      setCurrentConfig(JSON.parse(JSON.stringify(defaultModel)));
      setSavedSuccess(false);
    }
  };

  const handleDownloadTestPng = async () => {
    setExportingTest(true);
    try {
      const dummyUrl = `${window.location.origin}/r/dp-demo01`;
      const blob = await exportPlatePng(currentConfig, dummyUrl, '000015');
      triggerFileDownload(blob, `TESTE_CALIBRACAO_${currentConfig.modelId}.png`);
    } catch (err: any) {
      alert('Erro ao gerar PNG de teste: ' + err.message);
    } finally {
      setExportingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 surface-3d-card border border-sky-500/25">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-400" />
            Calibrador de Precisão dos 8 Modelos Oficiais
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Substituição exata do QR Code ilustrativo original e posicionamento discreto da numeração única nos cantos.
          </p>
        </div>

        {/* Model selector buttons */}
        <div className="flex flex-wrap gap-1.5">
          {OFFICIAL_MODELS.map((m, idx) => {
            const isSelected = selectedModelId === m.modelId;
            return (
              <button
                key={m.modelId}
                onClick={() => setSelectedModelId(m.modelId)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'btn-3d-blue text-white shadow-[0_0_12px_rgba(56,189,248,0.5)] border border-sky-400'
                    : 'bg-[#0f172a] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                M{idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/70 border border-red-500 text-red-200 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Main calibrator workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Live High-Def Canvas Preview */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="surface-3d-card p-4 border border-slate-800 w-full flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">
              <span>{currentConfig.name}</span>
              <span className="text-sky-400 font-mono">10 × 10 cm</span>
            </div>

            {/* 3D Frame around canvas */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-sky-500/40 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(14,165,233,0.2)] bg-black max-w-[360px] w-full aspect-square flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
                width={600}
                height={600}
              />
            </div>

            <div className="mt-4 flex items-center gap-3 w-full">
              <button
                onClick={handleDownloadTestPng}
                disabled={exportingTest}
                className="btn-3d-graphite flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-200 flex items-center justify-center gap-2 cursor-pointer hover:text-white"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                {exportingTest ? 'Gerando...' : 'Baixar PNG Teste (300 DPI)'}
              </button>

              <button
                onClick={handleResetToDefault}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                title="Restaurar padrão deste modelo"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Fine calibration controls */}
        <div className="lg:col-span-7 space-y-5">
          {/* QR Code Calibration Section */}
          <div className="surface-3d-card p-5 border border-slate-800">
            <h3 className="text-sm font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4" /> 1. Posição Exata do QR Code Dinâmico
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#070d1e] border border-slate-800/80">
                <div>
                  <div className="text-xs font-bold text-white">Limpar fundo sob o QR Code original</div>
                  <div className="text-[11px] text-slate-400">Garante contraste perfeito e apaga 100% dos resquícios do QR antigo</div>
                </div>
                <input
                  type="checkbox"
                  checked={currentConfig.qrBox.clearBg}
                  onChange={(e) => handleQrChange('clearBg', e.target.checked)}
                  className="w-5 h-5 accent-sky-500 rounded cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Posição X: {currentConfig.qrBox.x}%
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="85"
                    step="0.5"
                    value={currentConfig.qrBox.x}
                    onChange={(e) => handleQrChange('x', parseFloat(e.target.value))}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Posição Y: {currentConfig.qrBox.y}%
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="85"
                    step="0.5"
                    value={currentConfig.qrBox.y}
                    onChange={(e) => handleQrChange('y', parseFloat(e.target.value))}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Tamanho: {currentConfig.qrBox.size}%
                  </label>
                  <input
                    type="range"
                    min="15"
                    max="45"
                    step="0.5"
                    value={currentConfig.qrBox.size}
                    onChange={(e) => handleQrChange('size', parseFloat(e.target.value))}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Cor de Fundo do QR
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentConfig.qrBox.bgColor}
                      onChange={(e) => handleQrChange('bgColor', e.target.value)}
                      className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={currentConfig.qrBox.bgColor}
                      onChange={(e) => handleQrChange('bgColor', e.target.value)}
                      className="w-full bg-[#070d1e] border border-slate-800 rounded px-2 py-1 text-xs text-white uppercase font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Arredondamento: {currentConfig.qrBox.borderRadius}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={currentConfig.qrBox.borderRadius}
                    onChange={(e) => handleQrChange('borderRadius', parseInt(e.target.value))}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Margem Interna: {currentConfig.qrBox.padding}px
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="18"
                    value={currentConfig.qrBox.padding}
                    onChange={(e) => handleQrChange('padding', parseInt(e.target.value))}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Plate Number Calibration Section */}
          <div className="surface-3d-card p-5 border border-slate-800">
            <h3 className="text-sm font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4" /> 2. Numeração Discreta (Sem caixa, sem borda)
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Posição X: {currentConfig.numberBox.x}%
                  </label>
                  <input
                    type="range"
                    min="4"
                    max="96"
                    step="0.5"
                    value={currentConfig.numberBox.x}
                    onChange={(e) => handleNumChange('x', parseFloat(e.target.value))}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Posição Y: {currentConfig.numberBox.y}%
                  </label>
                  <input
                    type="range"
                    min="70"
                    max="98"
                    step="0.5"
                    value={currentConfig.numberBox.y}
                    onChange={(e) => handleNumChange('y', parseFloat(e.target.value))}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Tamanho da Fonte: {currentConfig.numberBox.fontSize}px
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="24"
                    value={currentConfig.numberBox.fontSize}
                    onChange={(e) => handleNumChange('fontSize', parseInt(e.target.value))}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Alinhamento
                  </label>
                  <select
                    value={currentConfig.numberBox.align}
                    onChange={(e) => handleNumChange('align', e.target.value as any)}
                    className="w-full bg-[#070d1e] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="left">Esquerda (Canto inferior)</option>
                    <option value="center">Centralizado</option>
                    <option value="right">Direita (Canto inferior)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Prefixo
                  </label>
                  <input
                    type="text"
                    value={currentConfig.numberBox.prefix}
                    onChange={(e) => handleNumChange('prefix', e.target.value)}
                    placeholder="Nº "
                    className="w-full bg-[#070d1e] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Cor do Texto
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentConfig.numberBox.color}
                      onChange={(e) => handleNumChange('color', e.target.value)}
                      className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={currentConfig.numberBox.color}
                      onChange={(e) => handleNumChange('color', e.target.value)}
                      className="w-full bg-[#070d1e] border border-slate-800 rounded px-2 py-1 text-xs text-white uppercase font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {savedSuccess && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 animate-fade-in">
                <Check className="w-4 h-4 text-emerald-400" /> Calibração salva com sucesso no Firestore!
              </span>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-3d-blue px-7 py-3 rounded-xl font-bold uppercase tracking-wider text-xs text-white flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Gravando no Firestore...' : 'Salvar Calibração Oficial'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
