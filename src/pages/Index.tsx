/**
 * BalancoTab.tsx
 * Place at: src/components/tabs/BalancoTab.tsx
 */

import { useEffect, useRef, useState } from 'react';
import { buildBPDocument } from '@/lib/gestaoFinanceiraContent';

export function BalancoTab() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded]   = useState(false);
  const [srcDoc, setSrcDoc]   = useState('');

  useEffect(() => {
    // Build the complete self-contained HTML once
    setSrcDoc(buildBPDocument());
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 160px)',
        minHeight: '700px',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
      }}
    >
      {/* Loading spinner */}
      {!loaded && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 12, background: '#f4f6f9', zIndex: 10,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            border: '2px solid #6366f1', borderTopColor: 'transparent',
            animation: 'spin 0.7s linear infinite',
          }} />
          <span style={{ fontSize: 12, color: '#9ca3af' }}>
            Carregando módulo financeiro...
          </span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Iframe with full HTML injected via srcDoc */}
      {srcDoc && (
        <iframe
          ref={iframeRef}
          srcDoc={srcDoc}
          title="Balanço Patrimonial e Fluxo de Caixa"
          onLoad={() => setLoaded(true)}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-modals"
        />
      )}
    </div>
  );
}
