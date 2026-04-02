import { useEffect, useState } from 'react';
import { buildFluxoCaixaDocument } from '@/lib/fluxoCaixaContent';

export function FluxoCaixaTab() {
  const [srcDoc, setSrcDoc] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSrcDoc(buildFluxoCaixaDocument());
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        height: 'calc(100vh - 120px)',
        minHeight: '700px',
        overflow: 'hidden',
      }}
    >
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
            Carregando Fluxo de Caixa...
          </span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      {srcDoc && (
        <iframe
          srcDoc={srcDoc}
          title="Fluxo de Caixa"
          onLoad={() => setLoaded(true)}
          style={{
            width: '100%', height: '100%', border: 'none',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
          sandbox="allow-scripts allow-forms allow-downloads allow-modals allow-popups"
        />
      )}
    </div>
  );
}
