/**
 * Index.tsx — substitui src/pages/Index.tsx
 * Única diferença do original: import de BalancoTab + nova aba no array TABS.
 */

import { useState } from 'react';
import { CloudAlert, DatabaseZap, LogOut } from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { FinancialProvider } from '@/context/FinancialContext';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { LoadingScreen } from '@/components/auth/LoadingScreen';
import { SupabaseSetupScreen } from '@/components/auth/SupabaseSetupScreen';
import { PlanejamentoTab } from '@/components/tabs/PlanejamentoTab';
import { MensalTab } from '@/components/tabs/MensalTab';
import { ComparativoTab } from '@/components/tabs/ComparativoTab';
import { EvolucaoTab } from '@/components/tabs/EvolucaoTab';
import { BalancoTab } from '@/components/tabs/BalancoTab';
import { FluxoCaixaTab } from '@/components/tabs/FluxoCaixaTab';

const TABS = [
  { key: 'planejamento', label: '📋 Planejamento' },
  { key: 'mensal',       label: '📥 Lançamento Mensal' },
  { key: 'comparativo',  label: '📊 Realizado vs. Orçado' },
  { key: 'evolucao',     label: '📈 Evolução & YTD' },
  { key: 'balanco',      label: '🏦 Balanço Patrimonial' },
  { key: 'fluxo',        label: '💰 Fluxo de Caixa' },
];

const ANOS = ['2024', '2025', '2026', '2027', '2028'];

function ClientSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { fullState, clienteAtivo, setClienteAtivo, addCliente, removeCliente, renameCliente } = useFinancial();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const clientes = Object.values(fullState.clientes);

  const handleAdd = () => {
    const nome = newName.trim() || `Cliente ${clientes.length + 1}`;
    addCliente(nome);
    setNewName('');
  };

  const startEdit = (id: string, nome: string) => {
    setEditingId(id);
    setEditName(nome);
  };

  const saveEdit = () => {
    if (editingId) {
      renameCliente(editingId, editName.trim());
      setEditingId(null);
    }
  };

  if (collapsed) {
    return (
      <div className={`client-sidebar client-sidebar-collapsed`}>
        <div className="sb-header">
          <button className="hamburger-btn" onClick={onToggle}><span></span><span></span><span></span></button>
        </div>
        <div className="collapsed-clients">
          {clientes.map(c => (
            <div key={c.id} className={`col-avatar ${clienteAtivo === c.id ? 'col-avatar-active' : ''}`} title={c.empresa.nome || 'Sem nome'} onClick={() => setClienteAtivo(c.id)}>
              {(c.empresa.nome || 'C')[0].toUpperCase()}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="client-sidebar">
      <div className="sb-header">
        <button className="hamburger-btn" onClick={onToggle}><span></span><span></span><span></span></button>
        <div className="sb-logo-wrap">
          <div className="sidebar-logo">💼</div>
          <span className="sidebar-title">Gerencial Financeiro</span>
        </div>
      </div>

      <div className="sidebar-section-label">Clientes</div>

      <div className="sidebar-clients">
        {clientes.map(c => (
          <div
            key={c.id}
            className={`sidebar-client-item ${clienteAtivo === c.id ? 'sidebar-client-active' : ''}`}
            onClick={() => setClienteAtivo(c.id)}
          >
            {editingId === c.id ? (
              <div className="flex gap-1 w-full" onClick={e => e.stopPropagation()}>
                <input
                  className="sidebar-edit-input"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveEdit()}
                  onBlur={saveEdit}
                  autoFocus
                />
              </div>
            ) : (
              <>
                <div className="sidebar-client-avatar">
                  {(c.empresa.nome || 'C')[0].toUpperCase()}
                </div>
                <div className="sidebar-client-info">
                  <div className="sidebar-client-name">{c.empresa.nome || 'Sem nome'}</div>
                  {c.empresa.segmento && <div className="sidebar-client-seg">{c.empresa.segmento}</div>}
                </div>
                <div className="sidebar-client-actions" onClick={e => e.stopPropagation()}>
                  <button className="sidebar-action-btn" onClick={() => startEdit(c.id, c.empresa.nome)} title="Renomear">✏️</button>
                  {clientes.length > 1 && (
                    <button className="sidebar-action-btn" onClick={() => { if (confirm(`Excluir "${c.empresa.nome || 'Sem nome'}"?`)) removeCliente(c.id); }} title="Excluir">🗑</button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="sidebar-add-section">
        <input
          className="sidebar-add-input"
          placeholder="Nome do novo cliente..."
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button className="sidebar-add-btn" onClick={handleAdd}>+ Novo Cliente</button>
      </div>
    </div>
  );
}

function Dashboard() {
  const {
    authConfigured,
    authError,
    authLoading,
    authNotice,
    clearSyncError,
    dataLoading,
    dismissAuthFeedback,
    hasLocalDataToImport,
    importLocalData,
    signIn,
    signOut,
    signUp,
    syncError,
    user,
    cliente,
    anoSelecionado,
    setAno,
  } = useFinancial();
  const [activeTab, setActiveTab] = useState('planejamento');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (!authConfigured) {
    return <SupabaseSetupScreen />;
  }

  if (authLoading) {
    return <LoadingScreen label="Conferindo sua sessao com o Supabase..." />;
  }

  if (!user) {
    return (
      <AuthScreen
        error={authError}
        loading={authLoading}
        notice={authNotice}
        onSignIn={signIn}
        onSignUp={signUp}
        onDismissFeedback={dismissAuthFeedback}
      />
    );
  }

  if (dataLoading) {
    return <LoadingScreen label="Buscando seus clientes e historicos no banco..." />;
  }

  const empresaLabel = cliente.empresa.nome || 'Configure a empresa na aba Planejamento';

  return (
    <div className="app-layout">
      <ClientSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(v => !v)} />
      <div className="app-main">
        <div className="w-full px-4 py-6 md:px-6 lg:px-8" style={{ animation: 'fadeIn .4s ease' }}>
          {(hasLocalDataToImport || syncError) && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 rounded-2xl p-2 ${syncError ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  {syncError ? <CloudAlert className="h-4 w-4" /> : <DatabaseZap className="h-4 w-4" />}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {syncError ? 'Houve uma falha de sincronizacao' : 'Dados locais encontrados neste navegador'}
                  </div>
                  <div className="mt-1 text-xs leading-6 text-slate-600">
                    {syncError
                      ? syncError
                      : 'Posso importar seus clientes e historicos antigos para a conta atual do Supabase.'}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {hasLocalDataToImport && (
                  <button
                    className="btn"
                    onClick={() => void importLocalData()}
                    style={{ background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' }}
                  >
                    Importar dados locais
                  </button>
                )}
                {syncError && (
                  <button className="btn" onClick={clearSyncError}>
                    Fechar aviso
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Topbar */}
          <div className="flex items-start justify-between flex-wrap gap-3 mb-7 pb-5" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
            <div>
              <h1 className="font-display text-[22px] font-normal tracking-tight" style={{ color: 'hsl(var(--slate-900))' }}>
                Gestão Financeira
              </h1>
              <p className="text-[11px] mt-0.5 font-normal" style={{ color: 'hsl(var(--text-muted))' }}>
                {empresaLabel}
              </p>
            </div>
            {/* Oculta seletor de ano na aba de balanço (tem seletor próprio) */}
            <div className="flex gap-2 items-center flex-wrap">
              {activeTab !== 'balanco' && activeTab !== 'fluxo' && (
                <select
                  className="ano-sel"
                  value={anoSelecionado}
                  onChange={e => setAno(e.target.value)}
                >
                  {ANOS.map(a => <option key={a}>{a}</option>)}
                </select>
              )}
              <button
                className="btn"
                onClick={() => void signOut()}
                style={{ background: '#fff', border: '1px solid hsl(var(--border))' }}
              >
                <LogOut className="h-3.5 w-3.5" />
                Sair
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div
            className="flex gap-0.5 mb-6 rounded-[var(--radius)] p-[3px] overflow-x-auto"
            style={{ background: 'hsl(var(--slate-100))' }}
          >
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`tab-pill ${activeTab === tab.key ? 'tab-pill-active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panels */}
          <div style={{ animation: 'fadeUp .25s ease' }}>
            <div style={{ display: activeTab === 'planejamento' ? 'block' : 'none' }}><PlanejamentoTab /></div>
            <div style={{ display: activeTab === 'mensal'       ? 'block' : 'none' }}><MensalTab /></div>
            <div style={{ display: activeTab === 'comparativo'  ? 'block' : 'none' }}><ComparativoTab /></div>
            <div style={{ display: activeTab === 'evolucao'     ? 'block' : 'none' }}><EvolucaoTab /></div>
            <div style={{ display: activeTab === 'balanco'      ? 'block' : 'none' }}><BalancoTab /></div>
            <div style={{ display: activeTab === 'fluxo'        ? 'block' : 'none' }}><FluxoCaixaTab /></div>
          </div>

        </div>
      </div>
    </div>
  );
}

const Index = () => (
  <FinancialProvider>
    <Dashboard />
  </FinancialProvider>
);

export default Index;
