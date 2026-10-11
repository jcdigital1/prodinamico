import React, { useEffect, useState } from 'react';
import { resolveAndRecordQrRead } from '../lib/firestoreService';
import { DynamicQrRecord } from '../types';
import { BrandLogo3D } from '../components/Brand3D';
import { ExternalLink, Radio, AlertTriangle, ShieldCheck } from 'lucide-react';

export const PublicRedirectPage: React.FC<{ qrId: string }> = ({ qrId }) => {
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<DynamicQrRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function handleRedirect() {
      try {
        const qrData = await resolveAndRecordQrRead(qrId);
        if (!active) return;

        if (!qrData) {
          setError('Plaquinha NFC ou QR Code não localizado em nossa base de dados.');
          setLoading(false);
          return;
        }

        setRecord(qrData);
        setLoading(false);

        const target = qrData.targetUrl?.trim();
        if (target) {
          const finalUrl = target.startsWith('http://') || target.startsWith('https://')
            ? target
            : `https://${target}`;

          // Brief delay so user sees authentic redirection brand, then forward
          setTimeout(() => {
            window.location.replace(finalUrl);
          }, 800);
        }
      } catch (err: any) {
        if (!active) return;
        console.error(err);
        setError('Ocorreu um erro ao consultar o destino dinâmico.');
        setLoading(false);
      }
    }

    handleRedirect();

    return () => {
      active = false;
    };
  }, [qrId]);

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 sm:p-6 text-white relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-500/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md surface-3d-elevated p-8 sm:p-10 text-center relative z-10 border border-sky-500/30">
        <div className="flex justify-center mb-6">
          <BrandLogo3D size="md" />
        </div>

        {loading && (
          <div className="space-y-4 py-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-sky-950/60 border border-sky-500/50 flex items-center justify-center">
              <Radio className="w-8 h-8 text-sky-400 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold tracking-wide">Lendo Plaquinha NFC / QR Code...</h2>
            <p className="text-sm text-slate-400">Verificando destino dinâmico seguro.</p>
          </div>
        )}

        {!loading && error && (
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-950/80 border border-red-600/60 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-red-400">Plaquinha Não Encontrada</h2>
            <p className="text-sm text-slate-400">{error}</p>
          </div>
        )}

        {!loading && record && record.targetUrl && (
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center">
              <ExternalLink className="w-8 h-8 text-emerald-400 animate-bounce" />
            </div>
            <div>
              <span className="text-xs uppercase font-mono tracking-widest text-slate-500">
                Plaquinha Nº {record.formattedNumber}
              </span>
              <h2 className="text-xl font-bold text-white mt-1">Redirecionando...</h2>
            </div>
            <p className="text-xs font-mono text-slate-400 truncate bg-black/60 px-3 py-2 rounded-lg border border-slate-800">
              {record.targetUrl}
            </p>
            <div className="pt-2">
              <a
                href={record.targetUrl.startsWith('http') ? record.targetUrl : `https://${record.targetUrl}`}
                className="btn-3d-blue inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm"
              >
                Clique aqui se não redirecionar <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {!loading && record && !record.targetUrl && (
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-950/60 border border-amber-500/50 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <span className="text-xs uppercase font-mono tracking-widest text-slate-500">
                Plaquinha Nº {record.formattedNumber}
              </span>
              <h2 className="text-xl font-bold text-white mt-1">Plaquinha NFC Ativa</h2>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Esta plaquinha é oficial e foi registrada com sucesso, mas o destino do link dinâmico ainda não foi configurado pelo proprietário.
            </p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-[11px] text-slate-500 tracking-wider uppercase">
          Plataforma Segura Dinâmico Pro
        </div>
      </div>
    </div>
  );
};
