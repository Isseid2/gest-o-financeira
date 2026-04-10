import { useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { buildBPDocument } from '@/lib/gestaoFinanceiraContent';
import { useFinancial } from '@/context/FinancialContext';
import type { FluxoCaixaPersistedData } from '@/types/financial';

type EmbeddedTheme = 'light' | 'dark';
type EmbeddedConfirmRequest = {
  requestId: string;
  title: string;
  description: string;
  confirmLabel?: string;
};

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
  .cx-matrix th,
  .cx-matrix th.col-label,
  .cx-matrix th.col-total,
  .cx-table thead th,
  .cx-table tfoot td {
    background: #222222 !important;
    color: #f4f4f5 !important;
    border-color: #303030 !important;
  }
  .cx-matrix tr.row-saldo-inicial td,
  .cx-matrix tr.row-sub td,
  .cx-matrix tr.row-imported td,
  .cx-matrix tr.row-resultado td,
  .cx-matrix tr.row-ajuste td,
  .cx-matrix tr.row-disponivel td {
    color: #f4f4f5 !important;
    border-color: #303030 !important;
  }
  .cx-matrix tr.row-saldo-inicial td { background: #1f1f1f !important; }
  .cx-matrix tr.row-sub td { background: #1b1b1b !important; }
  .cx-matrix tr.row-sub:hover td { background: #252525 !important; }
  .cx-matrix tr.row-imported td { background: rgba(6, 95, 70, 0.18) !important; }
  .cx-matrix tr.row-imported td.col-label,
  .cx-matrix tr.row-imported td:not(.col-label) { color: #6ee7b7 !important; }
  .cx-matrix tr.row-resultado td {
    background: rgba(120, 53, 15, 0.28) !important;
    color: #fde68a !important;
  }
  .cx-matrix tr.row-ajuste td {
    background: rgba(120, 53, 15, 0.22) !important;
    color: #fbbf24 !important;
    border-bottom-color: rgba(245, 158, 11, 0.42) !important;
  }
  .cx-matrix tr.row-disponivel td {
    background: rgba(6, 78, 59, 0.24) !important;
    color: #86efac !important;
    border-top-color: rgba(16, 185, 129, 0.48) !important;
  }
  .cx-matrix tr.row-disponivel td.neg-val {
    color: #fda4af !important;
    background: rgba(127, 29, 29, 0.28) !important;
  }
  .cx-matrix td.col-total { background: #202020 !important; }
  .cx-matrix td.col-label,
  .cx-table tbody td,
  .cx-table tfoot td,
  .cx-kpi-value,
  .cx-kpi-sub { color: #f4f4f5 !important; }
  .cx-matrix td.val-zero,
  .cx-table tbody td.saldo-neu { color: #71717a !important; }
  .cx-table tbody td.entrada-val,
  .cx-matrix td.val-pos { color: #6ee7b7 !important; }
  .cx-table tbody td.saida-val,
  .cx-matrix td.val-neg { color: #fda4af !important; }
  .bp-table td,
  .cmp-table td,
  .col-map-table td,
  .preview-table td,
  .cx-table td,
  .cx-table th {
    border-color: #303030 !important;
  }
  .cx-cmp-table thead th {
    background: #202020 !important;
    color: #a1a1aa !important;
    border-color: #303030 !important;
  }
  .cx-cmp-table td {
    color: #e4e4e7 !important;
    border-color: #303030 !important;
    background: transparent !important;
  }
  .cx-cmp-table tr.cmp-row td.lbl,
  .cx-cmp-table tr.cmp-total td.lbl,
  .cx-cmp-table tr.cmp-section td {
    color: #f4f4f5 !important;
  }
  .cx-cmp-table tr.cmp-row:hover td {
    background: rgba(255,255,255,.025) !important;
  }
  .cx-cmp-table tr.cmp-section td {
    background: #1b1b1b !important;
    border-top: 1px solid #303030 !important;
    border-bottom: 1px solid #2a2a2a !important;
    font-weight: 700 !important;
    letter-spacing: .08em !important;
    text-transform: uppercase !important;
  }
  .cx-cmp-table tr.cmp-total td {
    background: #232323 !important;
    border-top: 1px solid #3a3a3a !important;
    border-bottom: 1px solid #3a3a3a !important;
    font-weight: 700 !important;
  }
  .cx-cmp-table .cx-var-pos,
  .cx-cmp-table .cx-var-new {
    color: #34d399 !important;
    font-weight: 700 !important;
  }
  .cx-cmp-table .cx-var-neg {
    color: #f87171 !important;
    font-weight: 700 !important;
  }
  .cx-cmp-table .cx-var-neu {
    color: #d4d4d8 !important;
    font-weight: 600 !important;
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
var __cxConfirmCallbacks = {};
var __cxHasHydratedFromParent = false;

function __cxRequestConfirm(config, onConfirm) {
  var requestId = 'cx-confirm-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  __cxConfirmCallbacks[requestId] = onConfirm;
  window.parent.postMessage(
    {
      type: 'cx-request-confirm',
      requestId: requestId,
      payload: config || {},
    },
    '*',
  );
}

function __cxEmitPersistState() {
  if (!__cxHasHydratedFromParent) return;
  try {
    window.parent.postMessage({
      type: 'cx-persist-state',
      payload: {
        periods: typeof cxPeriods === 'object' && cxPeriods ? cxPeriods : {},
        activeYear: typeof cxActiveYear !== 'undefined' && cxActiveYear ? cxActiveYear : null,
      },
    }, '*');
  } catch (err) {
    console.warn('Falha ao persistir estado do fluxo no host:', err);
  }
}

function __cxRefreshActiveYearView() {
  try {
    if (typeof cxActiveYear !== 'undefined' && cxActiveYear && typeof cxSelectYear === 'function' && cxPeriods && cxPeriods[cxActiveYear]) {
      cxSelectYear(cxActiveYear);
      return;
    }
    if (typeof cxRender === 'function') cxRender();
    if (typeof cxRenderIndicators === 'function') {
      cxRenderIndicators(typeof cxActiveYear !== 'undefined' ? cxActiveYear : null);
    }
  } catch (err) {
    console.warn('Falha ao restaurar visualizacao do fluxo:', err);
  }
}

function __cxHydrateFromParent(payload) {
  try {
    cxPeriods = payload && payload.periods && typeof payload.periods === 'object' ? payload.periods : {};
    cxActiveYear = payload && payload.activeYear && cxPeriods[payload.activeYear] ? payload.activeYear : null;
    __cxHasHydratedFromParent = true;

    if (typeof cxRenderPeriodTabs === 'function') cxRenderPeriodTabs();
    if (typeof cxRenderYearSelect === 'function') cxRenderYearSelect();
    if (typeof cxUpdateCCSelect === 'function') cxUpdateCCSelect();
    if (typeof cxRefreshCmpSelects === 'function') cxRefreshCmpSelects();

    var saldoInput = document.getElementById('cx-saldo-inicial');
    if (saldoInput) {
      saldoInput.value = cxActiveYear && cxPeriods[cxActiveYear] && cxPeriods[cxActiveYear].saldoInicial
        ? toMask(cxPeriods[cxActiveYear].saldoInicial)
        : '';
    }

    requestAnimationFrame(__cxRefreshActiveYearView);
  } catch (err) {
    console.warn('Falha ao hidratar fluxo do cliente:', err);
  }
}

if (typeof cxLoadStorage === 'function') {
  cxLoadStorage = function() {
    cxPeriods = {};
    cxActiveYear = null;
  };
}

if (typeof cxPersist === 'function') {
  cxPersist = function() {
    __cxEmitPersistState();
  };
}

if (typeof cxDeletePeriod === 'function') {
  cxDeletePeriod = function(year) {
    __cxRequestConfirm(
      {
        title: 'Excluir período ' + year + '?',
        description: 'Essa ação remove os dados salvos desse período e não pode ser desfeita.',
        confirmLabel: 'Excluir período',
      },
      function() {
        delete cxPeriods[year];
        if (cxActiveYear === year) {
          var keys = Object.keys(cxPeriods);
          cxActiveYear = keys.length ? keys[keys.length - 1] : null;
        }
        if (typeof cxRenderPeriodTabs === 'function') cxRenderPeriodTabs();
        if (typeof cxRenderYearSelect === 'function') cxRenderYearSelect();
        if (typeof cxRender === 'function') cxRender();
        __cxEmitPersistState();
      },
    );
  };
}

window.addEventListener('message', function(event) {
  if (event?.data?.type === 'cx-confirm-result') {
    var resolver = __cxConfirmCallbacks[event.data.requestId];
    if (resolver) {
      delete __cxConfirmCallbacks[event.data.requestId];
      if (event.data.confirmed) resolver();
    }
    return;
  }
  if (event?.data?.type === 'cx-refresh-active-year') {
    requestAnimationFrame(__cxRefreshActiveYearView);
  }
  if (event?.data?.type === 'cx-hydrate') {
    __cxHydrateFromParent(event.data.payload);
  }
});

window.addEventListener('focus', __cxRefreshActiveYearView);

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
  setTimeout(__cxRefreshActiveYearView, 0);
  window.parent.postMessage({ type: 'cx-ready' }, '*');
});
</script>`;

  return injectEmbeddedTheme(html, theme).replace('</body>', script + '</body>');
}

export function FluxoCaixaTab({ theme = 'light' }: { theme?: EmbeddedTheme }) {
  const { cliente, updateFluxoData } = useFinancial();
  const [confirmRequest, setConfirmRequest] = useState<EmbeddedConfirmRequest | null>(null);
  const [srcDoc, setSrcDoc] = useState('');
  const [loaded, setLoaded] = useState(false);
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const confirmHandledRef = useRef(false);

  const fluxoPayload = useMemo<FluxoCaixaPersistedData>(
    () => ({
      periods: cliente.fluxoData?.periods || {},
      activeYear: cliente.fluxoData?.activeYear || null,
    }),
    [cliente.id, cliente.fluxoData],
  );

  const fluxoPayloadSerialized = useMemo(() => JSON.stringify(fluxoPayload), [fluxoPayload]);

  const requestEmbeddedRefresh = () => {
    frameRef.current?.contentWindow?.postMessage({ type: 'cx-refresh-active-year' }, '*');
  };

  const hydrateEmbeddedFlow = () => {
    frameRef.current?.contentWindow?.postMessage(
      {
        type: 'cx-hydrate',
        payload: fluxoPayload,
      },
      '*',
    );
  };

  useEffect(() => {
    setLoaded(false);
    setSrcDoc(injectFluxoScript(buildBPDocument(), theme));
  }, [cliente.id, theme]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    let rafId = 0;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width <= 0 || height <= 0) return;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        requestEmbeddedRefresh();
      });
    });

    observer.observe(container);
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [loaded]);

  useEffect(() => {
    if (!loaded || !frameRef.current?.contentWindow) return;

    hydrateEmbeddedFlow();
    const timerId = window.setTimeout(requestEmbeddedRefresh, 50);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [loaded, fluxoPayloadSerialized]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;

      if (event.data?.type === 'cx-ready') {
        hydrateEmbeddedFlow();
        setTimeout(() => {
          requestEmbeddedRefresh();
          setLoaded(true);
        }, 50);
        return;
      }

      if (event.data?.type === 'cx-request-confirm') {
        confirmHandledRef.current = false;
        setConfirmRequest({
          requestId: event.data.requestId,
          title: event.data?.payload?.title || 'Confirmar exclusão?',
          description:
            event.data?.payload?.description ||
            'Essa ação remove dados salvos e não pode ser desfeita.',
          confirmLabel: event.data?.payload?.confirmLabel || 'Excluir',
        });
        return;
      }

      if (event.data?.type !== 'cx-persist-state') return;

      const nextPayload: FluxoCaixaPersistedData = {
        periods:
          event.data?.payload?.periods && typeof event.data.payload.periods === 'object'
            ? event.data.payload.periods
            : {},
        activeYear: event.data?.payload?.activeYear || null,
      };

      if (JSON.stringify(nextPayload) === fluxoPayloadSerialized) return;
      updateFluxoData(nextPayload);
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [fluxoPayloadSerialized, updateFluxoData]);

  return (
    <div
      ref={containerRef}
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
      <ConfirmActionDialog
        open={!!confirmRequest}
        title={confirmRequest?.title || 'Confirmar exclusão?'}
        description={
          confirmRequest?.description || 'Essa ação remove dados salvos e não pode ser desfeita.'
        }
        confirmLabel={confirmRequest?.confirmLabel || 'Excluir'}
        onConfirm={() => {
          if (!confirmRequest) return;
          confirmHandledRef.current = true;
          frameRef.current?.contentWindow?.postMessage(
            {
              type: 'cx-confirm-result',
              requestId: confirmRequest.requestId,
              confirmed: true,
            },
            '*',
          );
          setConfirmRequest(null);
        }}
        onOpenChange={(nextOpen) => {
          if (nextOpen) return;
          if (confirmHandledRef.current) {
            confirmHandledRef.current = false;
            setConfirmRequest(null);
            return;
          }
          if (confirmRequest) {
            frameRef.current?.contentWindow?.postMessage(
              {
                type: 'cx-confirm-result',
                requestId: confirmRequest.requestId,
                confirmed: false,
              },
              '*',
            );
          }
          setConfirmRequest(null);
        }}
      />
      {srcDoc && (
        <iframe
          ref={frameRef}
          srcDoc={srcDoc}
          title="Fluxo de Caixa"
          onLoad={() => undefined}
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
