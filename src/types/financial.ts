export interface DREData {
  recBruta: number;
  deducoes: number;
  cpv: number;
  despOp: number;
  depAmort: number;
  resFinanc: number;
  ir: number;
}

export interface DREResult {
  recLiq: number;
  lucBruto: number;
  ebitda: number;
  lucLiq: number;
}

export interface ScenarioInput {
  revenueVar: number;
  cogsVar: number;
  opexVar: number;
}

export interface Scenarios {
  pessimista: ScenarioInput;
  realista: ScenarioInput;
  otimista: ScenarioInput;
}

export interface CompanyInfo {
  nome: string;
  segmento: string;
  moeda: string;
}

export interface Premissas {
  crescRec: number;
  inflCusto: number;
  margBruta: number;
  margEbitda: number;
  margLiq: number;
  deducoes: number;
}

export interface BalancoPersistedData {
  currentState: Record<string, unknown>;
  financialHistory: Record<string, unknown>;
}

export interface FluxoCaixaPersistedData {
  periods: Record<string, unknown>;
  activeYear: string | null;
}

export interface YearData {
  orcMes: Record<number, DREData>;
  realMes: Record<number, DREData>;
  balancoData?: BalancoPersistedData | null;
}

export interface ClientData {
  id: string;
  empresa: CompanyInfo;
  premissas: Premissas;
  cenarios: Scenarios;
  fluxoData?: FluxoCaixaPersistedData | null;
  anos: Record<string, YearData>;
}

export interface AppState {
  clienteAtivo: string;
  anoSelecionado: string;
  clientes: Record<string, ClientData>;
}

export const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
export const M3 = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

export const COLORS = {
  indigo: '#4f46e5',
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
  violet: '#8b5cf6',
  slate: '#64748b',
};

export const INDIC_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#8b5cf6'];
export const INDIC_LABELS = ['Receita Líquida', 'Lucro Bruto', 'EBITDA', 'Lucro Líquido'];

export const emptyDRE: DREData = {
  recBruta: 0, deducoes: 0, cpv: 0, despOp: 0, depAmort: 0, resFinanc: 0, ir: 0,
};

export const defaultPremissas: Premissas = {
  crescRec: 10, inflCusto: 5, margBruta: 40, margEbitda: 15, margLiq: 8, deducoes: 12,
};

export const defaultCenarios: Scenarios = {
  pessimista: { revenueVar: -15, cogsVar: 8, opexVar: 5 },
  realista: { revenueVar: 5, cogsVar: 2, opexVar: 2 },
  otimista: { revenueVar: 20, cogsVar: -5, opexVar: -3 },
};

export function createEmptyYearData(): YearData {
  return { orcMes: {}, realMes: {}, balancoData: null };
}

export const emptyYearData: YearData = createEmptyYearData();

export function createClient(id: string, nome?: string): ClientData {
  return {
    id,
    empresa: { nome: nome || '', segmento: '', moeda: 'R$' },
    premissas: { ...defaultPremissas },
    cenarios: JSON.parse(JSON.stringify(defaultCenarios)),
    fluxoData: null,
    anos: {},
  };
}

export function createClientWithYear(id: string, ano: string, nome?: string): ClientData {
  return {
    ...createClient(id, nome),
    anos: {
      [ano]: createEmptyYearData(),
    },
  };
}

const defaultClientId = 'default';

export const defaultState: AppState = {
  clienteAtivo: defaultClientId,
  anoSelecionado: '2025',
  clientes: {
    [defaultClientId]: createClientWithYear(defaultClientId, '2025', ''),
  },
};

// Legacy migration types
export interface LegacyAppState {
  empresa?: CompanyInfo;
  premissas?: Premissas;
  metaAnual?: DREData;
  orcMes?: Record<number, DREData>;
  realMes?: Record<number, DREData>;
  cenarios?: Scenarios;
  anoSelecionado?: string;
}
