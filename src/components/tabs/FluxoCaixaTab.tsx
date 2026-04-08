import { useEffect, useState } from 'react';
import { buildBPDocument } from '@/lib/gestaoFinanceiraContent';

function injectEmbeddedTheme(html: string): string {
  const themeOverrides = `<style>
  :root {
    --bg: #eef4ff !important;
    --white: #ffffff !important;
    --border: #d9e4f3 !important;
    --border-light: #e9eff8 !important;
    --blue-light: #edf3ff !important;
    --shadow: 0 10px 28px rgba(15, 23, 42, .05), 0 2px 6px rgba(15, 23, 42, .03) !important;
    --shadow-md: 0 16px 42px rgba(15, 23, 42, .08), 0 4px 12px rgba(15, 23, 42, .04) !important;
  }
  html, body {
    background: linear-gradient(180deg, #eef4ff 0%, #f7fbff 36%, #eef3f8 100%) !important;
  }
  .tabs-bar {
    background: rgba(255,255,255,.88) !important;
    border-bottom: 1px solid #dce6f4 !important;
    box-shadow: 0 10px 26px rgba(15, 23, 42, .04) !important;
  }
  .panel {
    background: transparent !important;
  }
  .card,
  .chart-box,
  .cx-ind-card,
  .cx-cmp-ind-card {
    background: rgba(255,255,255,.94) !important;
    border: 1px solid #dce6f4 !important;
    box-shadow: 0 12px 30px rgba(15, 23, 42, .05) !important;
  }
  .card-header,
  .bp-table thead th,
  .preview-table th,
  .col-map-table th,
  .cmp-table thead th {
    background: #f4f8ff !important;
  }
  .bp-table tr.tr-block-total td,
  .bp-table tr.tr-passivo-total td,
  .cmp-card,
  .ind-card {
    background: #fbfdff !important;
  }
  .import-zone,
  .period-row,
  .edit-date-row input[type="date"],
  .period-selector select {
    background: rgba(255,255,255,.92) !important;
    border-color: #dce6f4 !important;
  }
  </style>`;

  return html.replace('</head>', `${themeOverrides}</head>`);
}

function injectFluxoScript(html: string): string {
  const script = `<script>
document.addEventListener('DOMContentLoaded', function() {
  // Hide all other panels
  ['entry','view','comp'].forEach(function(id) {
    var panel = document.getElementById('panel-' + id);
    if(panel) panel.style.display='none';
  });
  // Hide the entire tabs bar (redundant subcategory)
  var tabsBar = document.querySelector('.tabs-bar');
  if(tabsBar) tabsBar.style.display='none';
  // Activate caixa panel directly
  var caixaPanel = document.getElementById('panel-caixa');
  if(caixaPanel) { caixaPanel.style.display='block'; caixaPanel.classList.add('active'); }
});
</script>`;
  return injectEmbeddedTheme(html).replace('</body>', script + '</body>');
}

export function FluxoCaixaTab() {
  const [srcDoc, setSrcDoc] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const html = buildBPDocument();
    setSrcDoc(injectFluxoScript(html));
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
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
          gap: 12, background: 'linear-gradient(180deg, #eef4ff 0%, #f7fbff 36%, #eef3f8 100%)', zIndex: 10,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            border: '2px solid #6366f1', borderTopColor: 'transparent',
            animation: 'spin 0.7s linear infinite',
          }} />
          <span style={{ fontSize: 12, color: '#9ca3af' }}>Carregando...</span>
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
          sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-modals allow-popups allow-popups-to-escape-sandbox"
        />
      )}
    </div>
  );
}
