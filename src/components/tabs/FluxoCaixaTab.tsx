import { useEffect, useState } from 'react';
import { buildBPDocument } from '@/lib/gestaoFinanceiraContent';

type EmbeddedTheme = 'light' | 'dark';

function injectEmbeddedTheme(html: string, theme: EmbeddedTheme): string {
  const themeOverrides =
    theme === 'dark'
      ? `<style>
  :root {
    --bg: #111111 !important;
    --white: #1b1b1b !important;
    --border: #303030 !important;
    --border-light: #242424 !important;
    --text: #f5f5f5 !important;
    --text-2: #d4d4d8 !important;
    --text-3: #a1a1aa !important;
    --text-4: #71717a !important;
    --blue-light: rgba(255, 255, 255, .04) !important;
    --shadow: 0 16px 32px rgba(0, 0, 0, .34), 0 4px 14px rgba(0, 0, 0, .2) !important;
    --shadow-md: 0 22px 48px rgba(0, 0, 0, .46), 0 8px 22px rgba(0, 0, 0, .26) !important;
  }
  html, body {
    background: linear-gradient(180deg, #111111 0%, #151515 38%, #121212 100%) !important;
    color: #f5f5f5 !important;
  }
  .tabs-bar {
    background: rgba(21,21,21,.94) !important;
    border-bottom: 1px solid #303030 !important;
    box-shadow: 0 14px 28px rgba(0, 0, 0, .24) !important;
  }
  .tab-btn { color: #a1a1aa !important; }
  .tab-btn:hover,
  .tab-btn.active { color: #f8fbff !important; }
  .panel { background: transparent !important; }
  .page-header h1,
  .page-header p,
  .card-header-title,
  .cx-subtitle,
  .cx-cmp-subtitle,
  .cx-kpi-label,
  .cx-ind-label,
  .cx-cmp-ind-label,
  .cx-input-wrap label,
  .cx-mini-label,
  .cx-feedback { color: #f5f5f5 !important; }
  .cx-kpi-value,
  .cx-ind-value,
  .cx-cmp-ind-value,
  .card-header,
  .cx-main-tabs button { color: #f8fbff !important; }
  .cx-kpi-sub,
  .cx-note,
  .cx-ind-desc,
  .cx-cmp-ind-desc,
  .cx-table td,
  .cx-table th,
  .bp-table td,
  .cmp-table td,
  .preview-table td,
  .col-map-table td { color: #e4e4e7 !important; }
  .card,
  .chart-box,
  .cx-ind-card,
  .cx-cmp-ind-card,
  .cmp-card,
  .ind-card,
  .cx-kpi-card,
  .cx-table-wrap,
  .cx-import-card {
    background: rgba(28,28,28,.96) !important;
    border: 1px solid #303030 !important;
    box-shadow: 0 18px 34px rgba(0, 0, 0, .28) !important;
  }
  .card-header,
  .bp-table thead th,
  .preview-table th,
  .col-map-table th,
  .cmp-table thead th,
  .kpi-card,
  .period-row,
  .cx-table thead th {
    background: #222222 !important;
  }
  .bp-table tr.tr-item:hover td,
  .cmp-table tr.cmp-item:hover td,
  .bp-table tr.tr-block-total td,
  .bp-table tr.tr-passivo-total td,
  .cx-table tbody tr:hover td {
    background: #252525 !important;
  }
  .bp-table td,
  .cmp-table td,
  .col-map-table td,
  .preview-table td,
  .cx-table td,
  .cx-table th {
    border-color: #303030 !important;
  }
  .import-zone,
  .edit-date-row input[type="date"],
  .period-selector select,
  .cx-month-pill,
  input,
  select,
  textarea,
  button.cx-btn-secondary {
    background: #161616 !important;
    color: #f5f5f5 !important;
    border-color: #353535 !important;
  }
  </style>`
      : `<style>
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
  .cx-cmp-ind-card,
  .cx-kpi-card,
  .cx-table-wrap,
  .cx-import-card {
    background: rgba(255,255,255,.94) !important;
    border: 1px solid #dce6f4 !important;
    box-shadow: 0 12px 30px rgba(15, 23, 42, .05) !important;
  }
  .card-header,
  .bp-table thead th,
  .preview-table th,
  .col-map-table th,
  .cmp-table thead th,
  .cx-table thead th {
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

function injectFluxoScript(html: string, theme: EmbeddedTheme): string {
  const script = `<script>
document.addEventListener('DOMContentLoaded', function() {
  ['entry','view','comp'].forEach(function(id) {
    var panel = document.getElementById('panel-' + id);
    if (panel) panel.style.display = 'none';
  });
  var tabsBar = document.querySelector('.tabs-bar');
  if (tabsBar) tabsBar.style.display = 'none';
  var caixaPanel = document.getElementById('panel-caixa');
  if (caixaPanel) {
    caixaPanel.style.display = 'block';
    caixaPanel.classList.add('active');
  }
});
</script>`;

  return injectEmbeddedTheme(html, theme).replace('</body>', script + '</body>');
}

export function FluxoCaixaTab({ theme = 'light' }: { theme?: EmbeddedTheme }) {
  const [srcDoc, setSrcDoc] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setSrcDoc(injectFluxoScript(buildBPDocument(), theme));
  }, [theme]);

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
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            background:
              theme === 'dark'
                ? 'linear-gradient(180deg, #111111 0%, #151515 38%, #121212 100%)'
                : 'linear-gradient(180deg, #eef4ff 0%, #f7fbff 36%, #eef3f8 100%)',
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: '2px solid #6366f1',
              borderTopColor: 'transparent',
              animation: 'spin 0.7s linear infinite',
            }}
          />
          <span style={{ fontSize: 12, color: theme === 'dark' ? '#a1a1aa' : '#9ca3af' }}>
            Carregando módulo de fluxo...
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
            width: '100%',
            height: '100%',
            border: 'none',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-modals allow-popups allow-popups-to-escape-sandbox"
        />
      )}
    </div>
  );
}
