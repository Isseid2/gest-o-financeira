import type {
  AppState,
  BalancoPersistedData,
  ClientData,
  DREData,
  FluxoCaixaPersistedData,
  Premissas,
  Scenarios,
  YearData,
} from '@/types/financial';

export interface ProfileRow {
  id: string;
  email: string;
  created_at: string;
}

export interface ClientRow {
  id: string;
  user_id: string;
  nome: string;
  segmento: string;
  moeda: string;
  premissas: Premissas;
  cenarios: Scenarios;
  fluxo_data?: FluxoCaixaPersistedData | null;
  created_at: string;
  updated_at: string;
}

export interface ClientYearDataRow {
  id: string;
  client_id: string;
  user_id: string;
  year: string;
  orc_mes: Record<string, DREData>;
  real_mes: Record<string, DREData>;
  balanco_data?: BalancoPersistedData | null;
  created_at: string;
  updated_at: string;
}

export interface PersistedClientSnapshot {
  client: ClientData;
  years: ClientYearDataRow[];
}

export interface PersistedFinancialState {
  appState: AppState;
  clients: ClientRow[];
  years: ClientYearDataRow[];
}

export interface ClientInsertInput {
  id: string;
  user_id: string;
  nome: string;
  segmento: string;
  moeda: string;
  premissas: Premissas;
  cenarios: Scenarios;
  fluxo_data?: FluxoCaixaPersistedData | null;
}

export interface ClientYearDataUpsertInput {
  client_id: string;
  user_id: string;
  year: string;
  orc_mes: Record<string, DREData>;
  real_mes: Record<string, DREData>;
  balanco_data?: BalancoPersistedData | null;
}

export type ClientMetaPayload = Pick<
  ClientInsertInput,
  'id' | 'user_id' | 'nome' | 'segmento' | 'moeda' | 'premissas' | 'cenarios' | 'fluxo_data'
>;

export type LocalMigrationPayload = {
  state: AppState;
  clients: ClientInsertInput[];
  years: ClientYearDataUpsertInput[];
};
