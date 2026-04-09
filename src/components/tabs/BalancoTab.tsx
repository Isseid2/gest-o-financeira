import { useEffect, useRef, useState } from 'react';
import { buildBPDocument } from '@/lib/gestaoFinanceiraContent';
import { useFinancial } from '@/context/FinancialContext';

type EmbeddedTheme = 'light' | 'dark';
type BalancoPayload = {
  currentState: Record<string, unknown>;
  financialHistory: Record<string, unknown>;
};

function buildBalancoBridgeScript() {
  return `<script>
(function() {
  var syncTimer = null;
  var hydrating = false;

  function clonePayload() {
    return {
      currentState: structuredClone(currentState),
      financialHistory: structuredClone(financialHistory),
    };
  }

  function postSync(reason) {
    if (hydrating) return;
    window.parent.postMessage({ type: 'bp-sync', reason: reason, payload: clonePayload() }, '*');
  }

  function scheduleSync(reason) {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(function() { postSync(reason); }, 250);
  }

  function toDisplayDate(value) {
    if (!value) return '';
    if (/^\\d{2}\\/\\d{2}\\/\\d{4}$/.test(value)) return value;
    if (/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) {
      var parts = value.split('-');
      return parts[2] + '/' + parts[1] + '/' + parts[0];
    }
    return value;
  }

  function toStorageDate(value) {
    if (!value) return '';
    var clean = String(value).trim();
    if (/^\\d{4}-\\d{2}-\\d{2}$/.test(clean)) return clean;
    var digits = clean.replace(/\\D/g, '').slice(0, 8);
    if (digits.length !== 8) return clean;
    return digits.slice(4, 8) + '-' + digits.slice(2, 4) + '-' + digits.slice(0, 2);
  }

  function applyDateMask(input) {
    var digits = input.value.replace(/\\D/g, '').slice(0, 8);
    var parts = [];
    if (digits.length > 0) parts.push(digits.slice(0, 2));
    if (digits.length > 2) parts.push(digits.slice(2, 4));
    if (digits.length > 4) parts.push(digits.slice(4, 8));
    input.value = parts.join('/');
  }

  function installFreeDateInput() {
    var input = document.getElementById('edit-date');
    if (!input || input.dataset.freeDate === '1') return;
    input.type = 'text';
    input.inputMode = 'numeric';
    input.placeholder = 'dd/mm/aaaa';
    input.dataset.freeDate = '1';
    input.value = toDisplayDate(input.value);
    input.addEventListener('input', function() {
      applyDateMask(input);
      currentState.date = toStorageDate(input.value);
      scheduleSync('date-input');
    });
    input.addEventListener('blur', function() {
      input.value = toDisplayDate(input.value);
    });
  }

  function syncEntryInputsFromState() {
    var dateInput = document.getElementById('edit-date');
    if (dateInput) dateInput.value = toDisplayDate(currentState.date || '');
    var labelInput = document.getElementById('edit-period-label');
    if (labelInput) labelInput.value = currentState.periodLabel || '';
  }

  function hydrate(payload) {
    hydrating = true;
    currentState = payload && payload.currentState ? structuredClone(payload.currentState) : structuredClone(INITIAL_STATE);
    Object.keys(financialHistory).forEach(function(key) { delete financialHistory[key]; });
    if (payload && payload.financialHistory) {
      Object.assign(financialHistory, structuredClone(payload.financialHistory));
    }
    renderEdit();
    renderView();
    refreshPeriodSelects();
    renderPeriodList();
    checkCompNoData();
    installFreeDateInput();
    syncEntryInputsFromState();
    hydrating = false;
  }

  function wrapAction(name, after) {
    var original = window[name];
    if (typeof original !== 'function') return;
    window[name] = function() {
      var dateInput = document.getElementById('edit-date');
      if (dateInput) dateInput.value = toStorageDate(dateInput.value);
      var result = original.apply(this, arguments);
      installFreeDateInput();
      syncEntryInputsFromState();
      after();
      return result;
    };
  }

  var originalFormatDateLabel = window.formatDateLabel;
  if (typeof originalFormatDateLabel === 'function') {
    window.formatDateLabel = function(value) {
      return originalFormatDateLabel(toStorageDate(value));
    };
  }

  var originalRenderEdit = window.renderEdit;
  if (typeof originalRenderEdit === 'function') {
    window.renderEdit = function() {
      var result = originalRenderEdit.apply(this, arguments);
      installFreeDateInput();
      syncEntryInputsFromState();
      return result;
    };
  }

  document.addEventListener('input', function(event) {
    if (hydrating) return;
    var target = event.target;
    if (!target || !(target instanceof HTMLElement)) return;
    if (!target.closest('#panel-entry')) return;
    if (target.id === 'edit-period-label') {
      currentState.periodLabel = target.value || '';
    }
    scheduleSync('draft-input');
  });

  wrapAction('saveAndView', function() { postSync('save-and-view'); });
  wrapAction('saveToHistoryFromView', function() { postSync('save-history-view'); });
  wrapAction('applyImport', function() { postSync('apply-import'); });
  wrapAction('resetData', function() { postSync('reset-data'); });
  wrapAction('deletePeriod', function() { postSync('delete-period'); });

  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'bp-hydrate') {
      hydrate(event.data.payload || null);
    }
  });

  document.addEventListener('DOMContentLoaded', function() {
    var entrySaveButton = document.querySelector('.header-actions button[onclick="saveToHistory()"]');
    if (entrySaveButton) entrySaveButton.remove();
    installFreeDateInput();
    syncEntryInputsFromState();
    postSync('bp-ready');
  });
})();
</script>`;
}

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
  .card-header-title,
  .kpi-value,
  .ind-value { color: #f8fbff !important; }
  .page-header p,
  .kpi-label,
  .kpi-sub,
  .ind-desc,
  .ind-formula { color: #a1a1aa !important; }
  .card,
  .chart-box,
  .cx-ind-card,
  .cx-cmp-ind-card,
  .cmp-card,
  .ind-card {
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
  .period-row {
    background: #222222 !important;
  }
  .bp-table tr.tr-item:hover td,
  .cmp-table tr.cmp-item:hover td,
  .bp-table tr.tr-block-total td,
  .bp-table tr.tr-passivo-total td {
    background: #252525 !important;
  }
  .bp-table tr.tr-total td,
  .cmp-table tr.cmp-block-total td,
  .cmp-table tr.cmp-grand-total td,
  .cmp-table tr.cmp-passivo-sep td,
  .cmp-table tr.cmp-section td,
  .cx-cmp-table tr.cmp-total td,
  .cx-cmp-table tr.cmp-section td {
    background: #252525 !important;
    color: #f4f4f5 !important;
    border-color: #303030 !important;
  }
  .cmp-table td.lbl,
  .cmp-table tr.cmp-block td,
  .cmp-table tr.cmp-group td,
  .cmp-table tr.cmp-grand-total td:first-child,
  .cmp-table tr.cmp-block-total td:first-child,
  .cx-cmp-table td.lbl,
  .cx-cmp-table tr.cmp-total td.lbl {
    color: #f4f4f5 !important;
  }
  .cmp-table tr.cmp-passivo-sep td {
    color: #f87171 !important;
    background: rgba(127, 29, 29, 0.28) !important;
  }
  .bp-table td,
  .cmp-table td,
  .col-map-table td,
  .preview-table td { color: #e4e4e7 !important; border-color: #303030 !important; }
  .import-zone,
  .edit-date-row input[type="date"],
  .period-selector select,
  input,
  select,
  textarea {
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
  .panel { background: transparent !important; }
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

export function BalancoTab({ theme = 'light' }: { theme?: EmbeddedTheme }) {
  const { yearData, updateYearData, clienteAtivo, anoSelecionado } = useFinancial();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [srcDoc, setSrcDoc] = useState('');

  useEffect(() => {
    setLoaded(false);
    setSrcDoc(injectEmbeddedTheme(buildBPDocument(), theme).replace('</body>', `${buildBalancoBridgeScript()}</body>`));
  }, [theme]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.type !== 'bp-sync') return;

      const payload = event.data.payload as BalancoPayload | undefined;
      if (!payload) return;

      updateYearData((currentYear) => ({
        ...currentYear,
        balancoData: payload,
      }));
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [updateYearData]);

  useEffect(() => {
    if (!loaded || !iframeRef.current?.contentWindow) return;

    iframeRef.current.contentWindow.postMessage(
      {
        type: 'bp-hydrate',
        payload: yearData.balancoData ?? null,
        clienteAtivo,
        anoSelecionado,
      },
      '*',
    );
  }, [loaded, yearData.balancoData, clienteAtivo, anoSelecionado]);

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
            Carregando módulo financeiro...
          </span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
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
          sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-modals allow-popups allow-popups-to-escape-sandbox"
        />
      )}
    </div>
  );
}
