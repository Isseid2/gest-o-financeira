import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  AppState, defaultState, ClientData, YearData, DREData, emptyYearData,
  createClient, LegacyAppState, defaultPremissas, defaultCenarios,
  Premissas, Scenarios, CompanyInfo,
} from '@/types/financial';

const STORAGE_KEY = 'fin-mgmt-v3';
const OLD_KEY = 'fin-mgmt-v2';

function migrateV2(old: LegacyAppState): AppState {
  const id = 'default';
  const ano = old.anoSelecionado || '2025';
  const client: ClientData = {
    id,
    empresa: old.empresa || { nome: '', segmento: '', moeda: 'R$' },
    premissas: old.premissas || { ...defaultPremissas },
    cenarios: old.cenarios || JSON.parse(JSON.stringify(defaultCenarios)),
    anos: {
      [ano]: {
        orcMes: old.orcMes || {},
        realMes: old.realMes || {},
      },
    },
  };
  return {
    clienteAtivo: id,
    anoSelecionado: ano,
    clientes: { [id]: client },
  };
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultState, ...JSON.parse(raw) };
    const oldRaw = localStorage.getItem(OLD_KEY);
    if (oldRaw) {
      const migrated = migrateV2(JSON.parse(oldRaw));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch {}
  return { ...defaultState };
}

interface Ctx {
  // Full state
  fullState: AppState;
  setFullState: React.Dispatch<React.SetStateAction<AppState>>;
  // Current client helpers
  cliente: ClientData;
  yearData: YearData;
  anoSelecionado: string;
  setAno: (ano: string) => void;
  // Client management
  clienteAtivo: string;
  setClienteAtivo: (id: string) => void;
  addCliente: (nome: string) => string;
  removeCliente: (id: string) => void;
  renameCliente: (id: string, nome: string) => void;
  // Convenience setters for current client
  updateEmpresa: (emp: Partial<CompanyInfo>) => void;
  updatePremissas: (p: Partial<Premissas>) => void;
  updateCenarios: (c: Scenarios) => void;
  updateYearData: (updater: (yd: YearData) => YearData) => void;
  // Access all years for current client (for cross-year comparisons)
  allAnos: Record<string, YearData>;
  allAnosKeys: string[];
}

const FinancialContext = createContext<Ctx | null>(null);

export function FinancialProvider({ children }: { children: React.ReactNode }) {
  const [fullState, setFullState] = useState<AppState>(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fullState));
  }, [fullState]);

  const cliente = useMemo(() => {
    return fullState.clientes[fullState.clienteAtivo] || Object.values(fullState.clientes)[0] || createClient('default');
  }, [fullState]);

  const yearData = useMemo(() => {
    return cliente.anos[fullState.anoSelecionado] || { ...emptyYearData };
  }, [cliente, fullState.anoSelecionado]);

  const setAno = useCallback((ano: string) => {
    setFullState(s => ({ ...s, anoSelecionado: ano }));
  }, []);

  const setClienteAtivo = useCallback((id: string) => {
    setFullState(s => ({ ...s, clienteAtivo: id }));
  }, []);

  const addCliente = useCallback((nome: string): string => {
    const id = `client_${Date.now()}`;
    setFullState(s => ({
      ...s,
      clienteAtivo: id,
      clientes: { ...s.clientes, [id]: createClient(id, nome) },
    }));
    return id;
  }, []);

  const removeCliente = useCallback((id: string) => {
    setFullState(s => {
      const newClientes = { ...s.clientes };
      delete newClientes[id];
      const keys = Object.keys(newClientes);
      if (keys.length === 0) {
        const def = createClient('default', '');
        newClientes['default'] = def;
      }
      return {
        ...s,
        clientes: newClientes,
        clienteAtivo: s.clienteAtivo === id ? Object.keys(newClientes)[0] : s.clienteAtivo,
      };
    });
  }, []);

  const renameCliente = useCallback((id: string, nome: string) => {
    setFullState(s => ({
      ...s,
      clientes: {
        ...s.clientes,
        [id]: { ...s.clientes[id], empresa: { ...s.clientes[id].empresa, nome } },
      },
    }));
  }, []);

  const updateEmpresa = useCallback((emp: Partial<CompanyInfo>) => {
    setFullState(s => {
      const c = s.clientes[s.clienteAtivo];
      return {
        ...s,
        clientes: { ...s.clientes, [s.clienteAtivo]: { ...c, empresa: { ...c.empresa, ...emp } } },
      };
    });
  }, []);

  const updatePremissas = useCallback((p: Partial<Premissas>) => {
    setFullState(s => {
      const c = s.clientes[s.clienteAtivo];
      return {
        ...s,
        clientes: { ...s.clientes, [s.clienteAtivo]: { ...c, premissas: { ...c.premissas, ...p } } },
      };
    });
  }, []);

  const updateCenarios = useCallback((cenarios: Scenarios) => {
    setFullState(s => {
      const c = s.clientes[s.clienteAtivo];
      return {
        ...s,
        clientes: { ...s.clientes, [s.clienteAtivo]: { ...c, cenarios } },
      };
    });
  }, []);

  const updateYearData = useCallback((updater: (yd: YearData) => YearData) => {
    setFullState(s => {
      const c = s.clientes[s.clienteAtivo];
      const ano = s.anoSelecionado;
      const current = c.anos[ano] || { orcMes: {}, realMes: {} };
      const updated = updater(current);
      return {
        ...s,
        clientes: {
          ...s.clientes,
          [s.clienteAtivo]: { ...c, anos: { ...c.anos, [ano]: updated } },
        },
      };
    });
  }, []);

  const allAnos = cliente.anos;
  const allAnosKeys = useMemo(() => Object.keys(cliente.anos).sort(), [cliente.anos]);

  const ctx: Ctx = {
    fullState, setFullState,
    cliente, yearData, anoSelecionado: fullState.anoSelecionado,
    setAno, clienteAtivo: fullState.clienteAtivo,
    setClienteAtivo, addCliente, removeCliente, renameCliente,
    updateEmpresa, updatePremissas, updateCenarios, updateYearData,
    allAnos, allAnosKeys,
  };

  return (
    <FinancialContext.Provider value={ctx}>
      {children}
    </FinancialContext.Provider>
  );
}

export function useFinancial() {
  const ctx = useContext(FinancialContext);
  if (!ctx) throw new Error('useFinancial must be used within FinancialProvider');
  return ctx;
}
