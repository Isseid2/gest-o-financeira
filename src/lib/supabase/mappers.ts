import {
  type AppState,
  type ClientData,
  type DREData,
  defaultCenarios,
  defaultPremissas,
  defaultState,
  emptyYearData,
} from '@/types/financial';
import type {
  ClientInsertInput,
  ClientMetaPayload,
  ClientRow,
  ClientYearDataRow,
  ClientYearDataUpsertInput,
  LocalMigrationPayload,
  PersistedFinancialState,
} from './types';

function normalizeMonthMap(source: Record<string, DREData> | null | undefined) {
  if (!source) return {};

  return Object.entries(source).reduce<Record<number, DREData>>((acc, [month, value]) => {
    const monthIndex = Number(month);
    acc[Number.isNaN(monthIndex) ? 0 : monthIndex] = value;
    return acc;
  }, {});
}

export function buildAppStateFromRows(
  clients: ClientRow[],
  yearRows: ClientYearDataRow[],
  preferredYear = defaultState.anoSelecionado,
): PersistedFinancialState {
  if (clients.length === 0) {
    return {
      appState: {
        ...defaultState,
        anoSelecionado: preferredYear,
      },
      clients: [],
      years: [],
    };
  }

  const yearsByClient = yearRows.reduce<Record<string, ClientYearDataRow[]>>((acc, row) => {
    acc[row.client_id] = acc[row.client_id] || [];
    acc[row.client_id].push(row);
    return acc;
  }, {});

  const stateClients = clients.reduce<Record<string, ClientData>>((acc, row) => {
    const rowsForClient = yearsByClient[row.id] || [];

    acc[row.id] = {
      id: row.id,
      empresa: {
        nome: row.nome || '',
        segmento: row.segmento || '',
        moeda: row.moeda || 'R$',
      },
      premissas: row.premissas || { ...defaultPremissas },
      cenarios: row.cenarios || JSON.parse(JSON.stringify(defaultCenarios)),
      anos: rowsForClient.reduce<Record<string, typeof emptyYearData>>((yearAcc, yearRow) => {
        yearAcc[yearRow.year] = {
          orcMes: normalizeMonthMap(yearRow.orc_mes),
          realMes: normalizeMonthMap(yearRow.real_mes),
        };
        return yearAcc;
      }, {}),
    };

    return acc;
  }, {});

  const firstClientId = clients[0].id;

  return {
    appState: {
      clienteAtivo: firstClientId,
      anoSelecionado: preferredYear,
      clientes: stateClients,
    },
    clients,
    years: yearRows,
  };
}

export function toClientInsertInput(userId: string, client: ClientData): ClientInsertInput {
  return {
    id: client.id,
    user_id: userId,
    nome: client.empresa.nome || '',
    segmento: client.empresa.segmento || '',
    moeda: client.empresa.moeda || 'R$',
    premissas: client.premissas,
    cenarios: client.cenarios,
  };
}

export function toClientMetaPayload(userId: string, client: ClientData): ClientMetaPayload {
  return toClientInsertInput(userId, client);
}

export function toYearDataUpsertInput(
  userId: string,
  clientId: string,
  year: string,
  yearData: ClientData['anos'][string],
): ClientYearDataUpsertInput {
  return {
    client_id: clientId,
    user_id: userId,
    year,
    orc_mes: yearData?.orcMes || {},
    real_mes: yearData?.realMes || {},
  };
}

export function toLocalMigrationPayload(userId: string, state: AppState): LocalMigrationPayload {
  const clients = Object.values(state.clientes).map((client) => toClientInsertInput(userId, client));
  const years = Object.values(state.clientes).flatMap((client) =>
    Object.entries(client.anos).map(([year, yearData]) => toYearDataUpsertInput(userId, client.id, year, yearData)),
  );

  return { state, clients, years };
}
