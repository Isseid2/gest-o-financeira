import { useEffect, useState } from 'react';
import { buildBPDocument } from '@/lib/gestaoFinanceiraContent';

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
  return html.replace('</body>', script + '</body>');
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
          gap: 12, background: '#f4f6f9', zIndex: 10,
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
