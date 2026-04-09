import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BriefcaseBusiness,
  Building2,
  ChevronLeft,
  ChevronRight,
  CloudAlert,
  DatabaseZap,
  FileText,
  FolderKanban,
  Home,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Moon,
  Pencil,
  Plus,
  Settings,
  ShieldCheck,
  SquareCheckBig,
  Sun,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { FinancialProvider } from '@/context/FinancialContext';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { LoadingScreen } from '@/components/auth/LoadingScreen';
import { SupabaseSetupScreen } from '@/components/auth/SupabaseSetupScreen';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { PlanejamentoTab } from '@/components/tabs/PlanejamentoTab';
import { MensalTab } from '@/components/tabs/MensalTab';
import { ComparativoTab } from '@/components/tabs/ComparativoTab';
import { EvolucaoTab } from '@/components/tabs/EvolucaoTab';
import { BalancoTab } from '@/components/tabs/BalancoTab';
import { FluxoCaixaTab } from '@/components/tabs/FluxoCaixaTab';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { calcDRE, fmtK } from '@/utils/financial';
import { MESES, type ClientData, type DREData } from '@/types/financial';

const TABS = [
  { key: 'planejamento', label: 'Planejamento' },
  { key: 'mensal', label: 'Lancamento Mensal' },
  { key: 'comparativo', label: 'Realizado vs. Orcado' },
  { key: 'evolucao', label: 'Evolucao & YTD' },
  { key: 'balanco', label: 'Balanco Patrimonial' },
  { key: 'fluxo', label: 'Fluxo de Caixa' },
] as const;

const ANOS = ['2024', '2025', '2026', '2027', '2028'];

const SYSTEM_SECTIONS = [
  { key: 'home', label: 'Inicio', icon: Home, status: 'ready' },
  { key: 'financeiro', label: 'Dashboard Financeiro', icon: LayoutDashboard, status: 'ready' },
  { key: 'projetos', label: 'Projetos', icon: FolderKanban, status: 'soon' },
  { key: 'tarefas', label: 'Tarefas', icon: SquareCheckBig, status: 'soon' },
  { key: 'documentos', label: 'Documentos', icon: FileText, status: 'soon' },
  { key: 'configuracoes', label: 'Configuracoes', icon: Settings, status: 'soon' },
] as const;

type SectionKey = (typeof SYSTEM_SECTIONS)[number]['key'];
type DashboardTheme = 'light' | 'dark';

function ClientsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { fullState, clienteAtivo, setClienteAtivo, addCliente, removeCliente, renameCliente } = useFinancial();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [clientToDelete, setClientToDelete] = useState<ClientData | null>(null);

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
    if (!editingId) return;
    renameCliente(editingId, editName.trim());
    setEditingId(null);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="border-slate-200 bg-white p-0 sm:max-w-md">
        <div className="clients-sheet">
          <SheetHeader className="clients-sheet-head">
            <div className="clients-sheet-badge">Contexto financeiro</div>
            <SheetTitle>Gerenciar clientes</SheetTitle>
            <SheetDescription>
              Escolha o cliente ativo do dashboard e mantenha sua base organizada em um unico lugar.
            </SheetDescription>
          </SheetHeader>

          <div className="clients-sheet-body">
            <div className="clients-sheet-list">
              {clientes.map((client) => (
                <div
                  key={client.id}
                  className={`clients-sheet-item ${clienteAtivo === client.id ? 'clients-sheet-item-active' : ''}`}
                >
                  <button
                    className="clients-sheet-select"
                    onClick={() => {
                      setClienteAtivo(client.id);
                      onOpenChange(false);
                    }}
                    type="button"
                  >
                    <div className="clients-sheet-avatar">{(client.empresa.nome || 'C')[0].toUpperCase()}</div>
                    <div className="clients-sheet-copy">
                      {editingId === client.id ? (
                        <input
                          className="clients-sheet-input"
                          value={editName}
                          onChange={(event) => setEditName(event.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(event) => event.key === 'Enter' && saveEdit()}
                          autoFocus
                        />
                      ) : (
                        <>
                          <strong>{client.empresa.nome || 'Sem nome'}</strong>
                          <span>{client.empresa.segmento || 'Segmento nao informado'}</span>
                        </>
                      )}
                    </div>
                  </button>

                  <div className="clients-sheet-actions">
                    <button
                      className="clients-sheet-icon-btn"
                      onClick={() => startEdit(client.id, client.empresa.nome)}
                      title="Renomear"
                      type="button"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {clientes.length > 1 && (
                      <button
                        className="clients-sheet-icon-btn clients-sheet-icon-btn-danger"
                        onClick={() => setClientToDelete(client)}
                        title="Excluir"
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="clients-sheet-create">
              <label className="clients-sheet-label">Novo cliente</label>
              <input
                className="clients-sheet-input"
                placeholder="Nome da empresa ou conta"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleAdd()}
              />
              <button className="clients-sheet-add" onClick={handleAdd} type="button">
                <Plus className="h-4 w-4" />
                Adicionar cliente
              </button>
            </div>
          </div>
        </div>
        <ConfirmActionDialog
          open={!!clientToDelete}
          title={`Excluir "${clientToDelete?.empresa.nome || 'Sem nome'}"?`}
          description="Essa ação remove o cliente e todos os dados salvos dele na sua conta. Não dá para desfazer."
          confirmLabel="Excluir cliente"
          onConfirm={() => {
            if (!clientToDelete) return;
            removeCliente(clientToDelete.id);
            setClientToDelete(null);
          }}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setClientToDelete(null);
          }}
        />
      </SheetContent>
    </Sheet>
  );
}

function SidebarAccount({
  collapsed,
  displayName,
  email,
  onPasswordChange,
  onSignOut,
}: {
  collapsed: boolean;
  displayName: string;
  email: string;
  onPasswordChange: () => void;
  onSignOut: () => void;
}) {
  const [accountExpanded, setAccountExpanded] = useState(false);
  const [profileExpanded, setProfileExpanded] = useState(false);

  return (
    <div className="system-account-shell">
      <button className="system-account-summary" onClick={() => setAccountExpanded((value) => !value)} type="button">
        <div className="system-account-avatar">{(displayName || 'C')[0].toUpperCase()}</div>
        {!collapsed && (
          <div className="system-account-copy">
            <div className="system-account-name">{displayName}</div>
            <div className="system-account-email">{email}</div>
          </div>
        )}
        {!collapsed && <ChevronDown className={`h-4 w-4 transition ${accountExpanded ? 'rotate-180' : ''}`} />}
      </button>

      {accountExpanded && (
        <div className={`system-account-panel ${collapsed ? 'system-account-panel-floating' : ''}`}>
          <div className="system-account-meta">
            <div className="system-account-meta-row">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Sessao segura por aba</span>
            </div>
            <div className="system-account-meta-row">
              <UserRound className="h-4 w-4 text-indigo-300" />
              <span>Conta vinculada ao Supabase</span>
            </div>
          </div>

          <div className="system-account-actions">
            <button className="system-account-btn" onClick={() => setProfileExpanded((value) => !value)} type="button">
              <UserRound className="h-4 w-4" />
              {profileExpanded ? 'Ocultar perfil' : 'Meu perfil'}
            </button>
            <button className="system-account-btn" onClick={onPasswordChange} type="button">
              <KeyRound className="h-4 w-4" />
              Trocar senha
            </button>
            <button className="system-account-btn system-account-btn-danger" onClick={onSignOut} type="button">
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>

          {profileExpanded && (
            <div className="system-profile-card">
              <div className="system-profile-row">
                <span className="system-profile-label">Usuario</span>
                <strong>{displayName}</strong>
              </div>
              <div className="system-profile-row">
                <span className="system-profile-label">E-mail</span>
                <strong>{email}</strong>
              </div>
              <div className="system-profile-row">
                <span className="system-profile-label">Acesso</span>
                <strong>Membro</strong>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProductSidebar({
  collapsed,
  onToggle,
  activeSection,
  onSectionChange,
  theme,
  onToggleTheme,
}: {
  collapsed: boolean;
  onToggle: () => void;
  activeSection: SectionKey;
  onSectionChange: (section: SectionKey) => void;
  theme: DashboardTheme;
  onToggleTheme: () => void;
}) {
  const { user, startPasswordChange, signOut } = useFinancial();

  const displayName = useMemo(() => {
    const email = user?.email?.trim() || '';
    if (!email) return 'Conta protegida';
    return email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }, [user?.email]);

  return (
    <aside className={`system-sidebar ${collapsed ? 'system-sidebar-collapsed' : ''}`}>
      <div className="system-sidebar-head">
        <div className="system-brand">
          <div className="system-brand-mark">
            <div className="system-brand-monogram" aria-hidden="true">
              <span className="system-brand-monogram-light">JR</span>
              <span className="system-brand-monogram-accent">H</span>
            </div>
          </div>
          {!collapsed && (
            <div className="system-brand-copy">
              <strong>JRH Consultoria</strong>
              <span>Painel Gerencial</span>
            </div>
          )}
        </div>
        <button className="system-collapse-btn" onClick={onToggle} type="button">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="system-nav">
        {SYSTEM_SECTIONS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.key;

          return (
            <button
              key={item.key}
              className={`system-nav-item ${isActive ? 'system-nav-item-active' : ''}`}
              onClick={() => onSectionChange(item.key)}
              title={collapsed ? item.label : undefined}
              type="button"
            >
              <Icon className="h-4 w-4" />
              {!collapsed && (
                <>
                  <span>{item.label}</span>
                  {item.status === 'soon' && <small>Em breve</small>}
                </>
              )}
            </button>
          );
        })}
      </nav>

      <div className="system-sidebar-footer">
        {!collapsed && <div className="system-plan-pill">Vitalicio</div>}
        <button className="system-theme-toggle" onClick={onToggleTheme} type="button">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed && <span>{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>}
        </button>
        <SidebarAccount
          collapsed={collapsed}
          displayName={displayName}
          email={user?.email || 'Sem e-mail'}
          onPasswordChange={startPasswordChange}
          onSignOut={() => void signOut()}
        />
      </div>
    </aside>
  );
}

function HomePanel({
  clienteNome,
  onGoToFinanceiro,
  onOpenClients,
  onSelectTab,
}: {
  clienteNome: string;
  onGoToFinanceiro: () => void;
  onOpenClients: () => void;
  onSelectTab: (tab: (typeof TABS)[number]['key']) => void;
}) {
  return (
    <div className="module-stack">
      <section className="module-hero">
        <div>
          <div className="module-kicker">Inicio</div>
          <h2>Uma base mais limpa para operar o dashboard inteiro.</h2>
          <p>
            Você trabalha um cliente por vez, então o contexto principal fica no topo da página e a lateral vira a
            navegação do sistema.
          </p>
        </div>
        <div className="module-hero-actions">
          <button className="btn btn-primary" onClick={onGoToFinanceiro} type="button">
            Abrir financeiro
          </button>
          <button className="btn" onClick={onOpenClients} type="button">
            Gerenciar clientes
          </button>
        </div>
      </section>

      <section className="home-grid">
        <article className="home-card">
          <span>Cliente atual</span>
          <strong>{clienteNome || 'Cliente sem nome'}</strong>
          <p>Esse contexto acompanha você enquanto navega no módulo financeiro.</p>
        </article>
        <article className="home-card">
          <span>Atalho rápido</span>
          <strong>Planejamento</strong>
          <p>Revise premissas, metas e orçamento anual da empresa selecionada.</p>
          <button
            className="home-link"
            onClick={() => {
              onSelectTab('planejamento');
              onGoToFinanceiro();
            }}
            type="button"
          >
            Abrir aba
          </button>
        </article>
        <article className="home-card">
          <span>Atalho rápido</span>
          <strong>Fluxo de Caixa</strong>
          <p>Consulte importações, saldos e a visão operacional do caixa no ano ativo.</p>
          <button
            className="home-link"
            onClick={() => {
              onSelectTab('fluxo');
              onGoToFinanceiro();
            }}
            type="button"
          >
            Abrir aba
          </button>
        </article>
      </section>
    </div>
  );
}

function ConsultantHomePanel({
  clienteNome,
  cliente,
  clientesCount,
  anoSelecionado,
  onGoToFinanceiro,
  onOpenClients,
  onSelectTab,
}: {
  clienteNome: string;
  cliente: ClientData;
  clientesCount: number;
  anoSelecionado: string;
  onGoToFinanceiro: () => void;
  onOpenClients: () => void;
  onSelectTab: (tab: (typeof TABS)[number]['key']) => void;
}) {
  const yearData = cliente.anos[anoSelecionado] ?? { orcMes: {}, realMes: {} };

  const countFilledMonths = (dataset: Record<number, DREData>) =>
    Object.values(dataset).filter((month) => Object.values(month || {}).some((value) => Number(value || 0) !== 0)).length;

  const latestFilledMonth = (dataset: Record<number, DREData>) =>
    Object.keys(dataset)
      .map(Number)
      .filter((month) => Object.values(dataset[month] || {}).some((value) => Number(value || 0) !== 0))
      .sort((a, b) => b - a)[0] ?? null;

  const plannedMonths = countFilledMonths(yearData.orcMes);
  const actualMonths = countFilledMonths(yearData.realMes);
  const latestPlanningMonth = latestFilledMonth(yearData.orcMes);
  const latestActualMonth = latestFilledMonth(yearData.realMes);
  const latestPlanningResult = latestPlanningMonth ? calcDRE(yearData.orcMes[latestPlanningMonth]) : null;
  const latestActualResult = latestActualMonth ? calcDRE(yearData.realMes[latestActualMonth]) : null;
  const savedBalancePeriods =
    typeof window !== 'undefined' ? Object.keys(JSON.parse(window.localStorage.getItem('bpPeriods') || '{}')).length : 0;
  const savedCashflowYears = Object.keys(cliente.fluxoData?.periods || {}).length;

  const pendingItems = [
    !cliente.empresa.nome ? 'Definir o nome da empresa para o cliente atual.' : null,
    !cliente.empresa.segmento ? 'Preencher o segmento da empresa na aba Planejamento.' : null,
    plannedMonths === 0 ? `Importar ou preencher o orçamento de ${anoSelecionado}.` : null,
    actualMonths === 0 ? `Importar o realizado mensal de ${anoSelecionado}.` : null,
    plannedMonths > 0 && actualMonths === 0 ? 'Cruzar o realizado com o orçado para acompanhar desvios.' : null,
    savedBalancePeriods === 0 ? 'Salvar ao menos um período no Balanço Patrimonial.' : null,
    savedCashflowYears === 0 ? 'Importar ou montar a base do Fluxo de Caixa para começar os indicadores.' : null,
    clientesCount === 1 ? 'Cadastrar mais clientes para organizar sua carteira na mesma conta.' : null,
  ].filter(Boolean) as string[];

  const quickActions = [
    {
      title: 'Planejamento',
      description: 'Revisar premissas, metas e orçamento anual.',
      action: () => {
        onSelectTab('planejamento');
        onGoToFinanceiro();
      },
    },
    {
      title: 'Lançamento Mensal',
      description: 'Atualizar o realizado do mês e consolidar a execução.',
      action: () => {
        onSelectTab('mensal');
        onGoToFinanceiro();
      },
    },
    {
      title: 'Fluxo de Caixa',
      description: 'Verificar entradas, saídas e importações.',
      action: () => {
        onSelectTab('fluxo');
        onGoToFinanceiro();
      },
    },
    {
      title: 'Gerenciar clientes',
      description: 'Trocar o cliente ativo e cadastrar novas contas.',
      action: onOpenClients,
    },
  ];

  const recentActivity = [
    plannedMonths > 0
      ? `Orçamento preenchido até ${MESES[(latestPlanningMonth || 1) - 1]}.`
      : 'Nenhum mês do orçamento foi preenchido neste ano.',
    actualMonths > 0
      ? `Realizado importado até ${MESES[(latestActualMonth || 1) - 1]}.`
      : 'Nenhum realizado foi importado neste ano.',
    latestPlanningResult
      ? `Última receita líquida orçada: ${fmtK(latestPlanningResult.recLiq, cliente.empresa.moeda)}.`
      : 'Sem receita orçada consolidada ainda.',
    latestActualResult
      ? `Último lucro líquido realizado: ${fmtK(latestActualResult.lucLiq, cliente.empresa.moeda)}.`
      : 'Sem lucro líquido realizado consolidado ainda.',
  ];

  return (
    <div className="module-stack">
      <section className="module-hero">
        <div>
          <div className="module-kicker">Inicio</div>
          <h2>Painel operacional do consultor.</h2>
          <p>Acompanhe o que está pendente, o que já foi importado e qual cliente precisa da sua atenção agora.</p>
        </div>
        <div className="module-hero-actions">
          <button className="btn btn-primary" onClick={onGoToFinanceiro} type="button">
            Abrir financeiro
          </button>
          <button className="btn" onClick={onOpenClients} type="button">
            Gerenciar clientes
          </button>
        </div>
      </section>

      <section className="home-grid home-grid-operational">
        <article className="home-card">
          <span>Cliente atual</span>
          <strong>{clienteNome || 'Cliente sem nome'}</strong>
          <p>{cliente.empresa.segmento || 'Defina o segmento para dar mais contexto ao cliente atual.'}</p>
        </article>
        <article className="home-card">
          <span>Último orçamento</span>
          <strong>{latestPlanningResult ? fmtK(latestPlanningResult.recLiq, cliente.empresa.moeda) : 'Sem base'}</strong>
          <p>
            {latestPlanningMonth
              ? `Receita líquida orçada em ${MESES[(latestPlanningMonth || 1) - 1]}.`
              : 'Nenhum mês orçado consolidado neste ano.'}
          </p>
        </article>
        <article className="home-card">
          <span>Orçamento {anoSelecionado}</span>
          <strong>{plannedMonths}/12</strong>
          <p>Meses com orçamento preenchido ou importado para o cliente atual.</p>
        </article>
        <article className="home-card">
          <span>Realizado {anoSelecionado}</span>
          <strong>{actualMonths}/12</strong>
          <p>Meses já consolidados para análise e comparativo.</p>
        </article>
      </section>

      <section className="home-workspace">
        <article className="home-panel">
          <div className="home-panel-head">
            <div>
              <span className="home-panel-kicker">Fila de trabalho</span>
              <h3>Próximos passos do consultor</h3>
            </div>
          </div>
          <div className="home-checklist">
            {pendingItems.length ? (
              pendingItems.map((item) => (
                <div className="home-checklist-item" key={item}>
                  <SquareCheckBig className="h-4 w-4" />
                  <span>{item}</span>
                </div>
              ))
            ) : (
              <div className="home-empty-state">Tudo certo por aqui. O cliente atual já tem base suficiente para análise.</div>
            )}
          </div>
        </article>

        <article className="home-panel">
          <div className="home-panel-head">
            <div>
              <span className="home-panel-kicker">Alertas e contexto</span>
              <h3>Leitura rápida do ambiente</h3>
            </div>
          </div>
          <div className="home-alert-stack">
            <div className="home-alert-card">
              <BriefcaseBusiness className="h-4 w-4" />
              <div>
                <strong>Carteira ativa</strong>
                <p>{clientesCount === 1 ? '1 cliente ativo na conta atual.' : `${clientesCount} clientes ativos na conta atual.`}</p>
              </div>
            </div>
            <div className="home-alert-card">
              <Building2 className="h-4 w-4" />
              <div>
                <strong>Cliente em foco</strong>
                <p>{clienteNome || 'Cliente sem nome'} está no centro das próximas ações.</p>
              </div>
            </div>
            <div className="home-alert-card">
              <DatabaseZap className="h-4 w-4" />
              <div>
                <strong>Importações</strong>
                <p>{plannedMonths > 0 || actualMonths > 0 ? 'Há dados para revisar e consolidar.' : 'Nenhuma importação relevante registrada neste ano.'}</p>
              </div>
            </div>
            <div className="home-alert-card">
              <CloudAlert className="h-4 w-4" />
              <div>
                <strong>Gap operacional</strong>
                <p>{Math.max(plannedMonths - actualMonths, 0)} mês(es) de diferença entre orçamento e realizado.</p>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="home-workspace">
        <article className="home-panel">
          <div className="home-panel-head">
            <div>
              <span className="home-panel-kicker">Atalhos rápidos</span>
              <h3>Ações do dia</h3>
            </div>
          </div>
          <div className="home-actions-grid">
            {quickActions.map((action) => (
              <button className="home-action-card" key={action.title} onClick={action.action} type="button">
                <strong>{action.title}</strong>
                <p>{action.description}</p>
              </button>
            ))}
          </div>
        </article>

        <article className="home-panel">
          <div className="home-panel-head">
            <div>
              <span className="home-panel-kicker">Última atividade</span>
              <h3>O que já foi alimentado</h3>
            </div>
          </div>
          <div className="home-activity-list">
            {recentActivity.map((item) => (
              <div className="home-activity-item" key={item}>
                <LayoutDashboard className="h-4 w-4" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function PlaceholderPanel({ title }: { title: string }) {
  return (
    <div className="module-placeholder">
      <div className="module-kicker">Modulo em construcao</div>
      <h2>{title}</h2>
      <p>Deixei essa area preparada na navegação principal para o dashboard crescer sem precisar redesenhar tudo depois.</p>
      <div className="module-placeholder-tag">Em breve</div>
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
    passwordRecoveryMode,
    cancelPasswordRecovery,
    requestPasswordReset,
    signIn,
    signUp,
    syncError,
    updatePassword,
    user,
    cliente,
    clienteAtivo,
    fullState,
    setClienteAtivo,
    anoSelecionado,
    setAno,
  } = useFinancial();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['key']>('planejamento');
  const [activeSection, setActiveSection] = useState<SectionKey>('financeiro');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [clientsOpen, setClientsOpen] = useState(false);
  const [theme, setTheme] = useState<DashboardTheme>(() => {
    if (typeof window === 'undefined') return 'light';
    const savedTheme = window.localStorage.getItem('dashboard-theme');
    return savedTheme === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('dashboard-theme', theme);
  }, [theme]);

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
        forcedMode={passwordRecoveryMode ? 'reset-password' : null}
        loading={authLoading}
        notice={authNotice}
        onCancelRecovery={cancelPasswordRecovery}
        onRequestPasswordReset={requestPasswordReset}
        onSignIn={signIn}
        onSignUp={signUp}
        onUpdatePassword={updatePassword}
        onDismissFeedback={dismissAuthFeedback}
      />
    );
  }

  if (passwordRecoveryMode) {
    return (
      <AuthScreen
        error={authError}
        forcedMode="reset-password"
        loading={authLoading}
        notice={authNotice}
        onCancelRecovery={cancelPasswordRecovery}
        onRequestPasswordReset={requestPasswordReset}
        onSignIn={signIn}
        onSignUp={signUp}
        onUpdatePassword={updatePassword}
        onDismissFeedback={dismissAuthFeedback}
      />
    );
  }

  if (dataLoading) {
    return <LoadingScreen label="Buscando seus clientes e historicos no banco..." />;
  }

  const clientes = Object.values(fullState.clientes);
  const sectionTitleMap: Record<SectionKey, string> = {
    home: 'Inicio',
    financeiro: 'Dashboard Financeiro',
    projetos: 'Projetos',
    tarefas: 'Tarefas',
    documentos: 'Documentos',
    configuracoes: 'Configuracoes',
  };

  const empresaLabel = cliente.empresa.nome || 'Cliente sem nome';

  return (
    <div className="app-layout">
      <ProductSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((value) => !value)}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        theme={theme}
        onToggleTheme={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
      />

      <ClientsSheet open={clientsOpen} onOpenChange={setClientsOpen} />

      <div className="app-main">
        <div className="dashboard-shell">
          {(hasLocalDataToImport || syncError) && (
            <div className="dashboard-banner">
              <div className="dashboard-banner-copy">
                <div className={`dashboard-banner-icon ${syncError ? 'dashboard-banner-icon-danger' : ''}`}>
                  {syncError ? <CloudAlert className="h-4 w-4" /> : <DatabaseZap className="h-4 w-4" />}
                </div>
                <div>
                  <strong>{syncError ? 'Houve uma falha de sincronizacao' : 'Dados locais encontrados neste navegador'}</strong>
                  <span>
                    {syncError
                      ? syncError
                      : 'Posso importar seus clientes e historicos antigos para a conta atual do Supabase.'}
                  </span>
                </div>
              </div>

              <div className="dashboard-banner-actions">
                {hasLocalDataToImport && (
                  <button className="btn" onClick={() => void importLocalData()} type="button">
                    Importar dados locais
                  </button>
                )}
                {syncError && (
                  <button className="btn" onClick={clearSyncError} type="button">
                    Fechar aviso
                  </button>
                )}
              </div>
            </div>
          )}

          <header className="dashboard-topbar">
            <div>
              <div className="module-kicker">{sectionTitleMap[activeSection]}</div>
              <h1>{activeSection === 'financeiro' ? 'Gestao Financeira' : sectionTitleMap[activeSection]}</h1>
              <p>
                {activeSection === 'financeiro'
                  ? cliente.empresa.segmento || 'Trabalhando um cliente por vez com contexto no topo'
                  : 'Estrutura pronta para o dashboard crescer de forma organizada'}
              </p>
            </div>

            {(activeSection === 'financeiro' || activeSection === 'home') && (
              <div className="dashboard-context-bar">
                <div className="context-pill context-client-status">
                  <span className="context-pill-label">Cliente atual</span>
                  <div className="context-select context-select-static">
                    <span className="context-select-value">{empresaLabel}</span>
                  </div>
                </div>

                <button className="context-manage-btn" onClick={() => setClientsOpen(true)} type="button">
                  <Building2 className="h-4 w-4" />
                  Clientes
                </button>

                {activeSection === 'financeiro' && activeTab !== 'balanco' && activeTab !== 'fluxo' && (
                  <label className="context-pill context-pill-year">
                    <span>Ano</span>
                    <select className="context-select" value={anoSelecionado} onChange={(event) => setAno(event.target.value)}>
                      {ANOS.map((ano) => (
                        <option key={ano}>{ano}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            )}
          </header>

          {activeSection === 'home' && (
            <ConsultantHomePanel
              clienteNome={empresaLabel}
              cliente={cliente}
              clientesCount={clientes.length}
              anoSelecionado={anoSelecionado}
              onGoToFinanceiro={() => setActiveSection('financeiro')}
              onOpenClients={() => setClientsOpen(true)}
              onSelectTab={setActiveTab}
            />
          )}

          {activeSection === 'financeiro' && (
            <div className="module-stack">
              <div className="financial-tabs-bar">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    className={`financial-tab ${activeTab === tab.key ? 'financial-tab-active' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                    type="button"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ display: activeTab === 'planejamento' ? 'block' : 'none' }}><PlanejamentoTab /></div>
              <div style={{ display: activeTab === 'mensal' ? 'block' : 'none' }}><MensalTab /></div>
              <div style={{ display: activeTab === 'comparativo' ? 'block' : 'none' }}><ComparativoTab /></div>
              <div style={{ display: activeTab === 'evolucao' ? 'block' : 'none' }}><EvolucaoTab /></div>
              <div style={{ display: activeTab === 'balanco' ? 'block' : 'none' }}><BalancoTab theme={theme} /></div>
              <div style={{ display: activeTab === 'fluxo' ? 'block' : 'none' }}><FluxoCaixaTab theme={theme} /></div>
            </div>
          )}

          {activeSection === 'projetos' && <PlaceholderPanel title="Projetos" />}
          {activeSection === 'tarefas' && <PlaceholderPanel title="Tarefas" />}
          {activeSection === 'documentos' && <PlaceholderPanel title="Documentos" />}
          {activeSection === 'configuracoes' && <PlaceholderPanel title="Configuracoes" />}
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
