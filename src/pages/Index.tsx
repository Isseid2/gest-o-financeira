import { useState } from 'react';
import { useFinancial } from '@/context/FinancialContext';
import { FinancialProvider } from '@/context/FinancialContext';
import { PlanejamentoTab } from '@/components/tabs/PlanejamentoTab';
import { MensalTab } from '@/components/tabs/MensalTab';
import { ComparativoTab } from '@/components/tabs/ComparativoTab';
import { EvolucaoTab } from '@/components/tabs/EvolucaoTab';

const TABS = [
  { key: 'planejamento', label: '📋 Planejamento' },
  { key: 'mensal', label: '📥 Lançamento Mensal' },
  { key: 'comparativo', label: '📊 Realizado vs. Orçado' },
  { key: 'evolucao', label: '📈 Evolução & YTD' },
];

const ANOS = ['2024', '2025', '2026', '2027', '2028'];

function ClientSidebar() {
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

  return (
    <div className="client-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">💼</div>
        <span className="sidebar-title">Gerencial Financeiro</span>
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
  const { cliente, anoSelecionado, setAno } = useFinancial();
  const [activeTab, setActiveTab] = useState('planejamento');

  const empresaLabel = cliente.empresa.nome || 'Configure a empresa na aba Planejamento';

  return (
    <div className="app-layout">
      <ClientSidebar />
      <div className="app-main">
        <div className="max-w-[1200px] mx-auto px-4 py-6" style={{ animation: 'fadeIn .4s ease' }}>
          {/* Topbar */}
          <div className="flex items-start justify-between flex-wrap gap-3 mb-7 pb-5" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
            <div>
              <h1 className="font-display text-[22px] font-normal tracking-tight" style={{ color: 'hsl(var(--slate-900))' }}>
                Gestão Financeira
              </h1>
              <p className="text-[11px] mt-0.5 font-normal" style={{ color: 'hsl(var(--text-muted))' }}>{empresaLabel}</p>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <select
                className="ano-sel"
                value={anoSelecionado}
                onChange={e => setAno(e.target.value)}
              >
                {ANOS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0.5 mb-6 rounded-[var(--radius)] p-[3px] overflow-x-auto" style={{ background: 'hsl(var(--slate-100))' }}>
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
            {activeTab === 'planejamento' && <PlanejamentoTab />}
            {activeTab === 'mensal' && <MensalTab />}
            {activeTab === 'comparativo' && <ComparativoTab />}
            {activeTab === 'evolucao' && <EvolucaoTab />}
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
