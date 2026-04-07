import type { AppState, ClientData, DREData, Scenarios, Premissas, YearData } from '@/types/financial';

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
}

export interface ClientYearDataUpsertInput {
  client_id: string;
  user_id: string;
  year: string;
  orc_mes: Record<string, DREData>;
  real_mes: Record<string, DREData>;
}

export type ClientMetaPayload = Pick<ClientInsertInput, 'id' | 'user_id' | 'nome' | 'segmento' | 'moeda' | 'premissas' | 'cenarios'>;

export type LocalMigrationPayload = {
  state: AppState;
  clients: ClientInsertInput[];
  years: ClientYearDataUpsertInput[];
};
