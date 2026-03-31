/**
 * BalancoTab.tsx
 *
 * Tab de Balanço Patrimonial + Fluxo de Caixa para o sistema Gerencial Financeiro.
 * Renderiza o módulo HTML isolado via iframe com comunicação bidirecional.
 *
 * Place at: src/components/tabs/BalancoTab.tsx
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { buildBPDocument } from '@/lib/gestaoFinanceiraContent';

export function BalancoTab() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // Build iframe content once on mount
  useEffect(() => {
    const html = buildBPDocument();
    const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, []);

  const handleLoad = useCallback(() => setLoaded(true), []);

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 180px)', minHeight: 600 }}>
      {/* Loading state */}
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#f4f6f9] rounded-lg z-10">
          <div className="w-7 h-7 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-[12px] text-gray-400">Carregando módulo financeiro...</span>
        </div>
      )}

      {/* Iframe isolado — sem conflito de estilos com o projeto */}
      {blobUrl && (
        <iframe
          ref={iframeRef}
          src={blobUrl}
          title="Balanço Patrimonial e Fluxo de Caixa"
          onLoad={handleLoad}
          className="w-full h-full rounded-lg border-0"
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-modals"
        />
      )}
    </div>
  );
}
