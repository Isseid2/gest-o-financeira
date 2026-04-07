import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import {
  AppState,
  ClientData,
  CompanyInfo,
  createClient,
  createClientWithYear,
  defaultCenarios,
  defaultPremissas,
  defaultState,
  emptyYearData,
  LegacyAppState,
  Premissas,
  Scenarios,
  YearData,
} from '@/types/financial';
import { signInWithEmail, signOutCurrentUser, signUpWithEmail } from '@/lib/supabase/auth';
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client';
import {
  createClientRecord,
  deleteClientRecord,
  ensureProfile,
  loadFinancialState,
  migrateLocalStateToRemote,
  upsertClientRecord,
  upsertYearDataRecord,
} from '@/lib/supabase/financialRepository';

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

function loadLocalState(): AppState | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultState, ...JSON.parse(raw) };

    const oldRaw = localStorage.getItem(OLD_KEY);
    if (oldRaw) {
      return migrateV2(JSON.parse(oldRaw));
    }
  } catch {
    return null;
  }

  return null;
}

function hasStoredLocalState() {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem(STORAGE_KEY) || localStorage.getItem(OLD_KEY));
}

function clearStoredLocalState() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(OLD_KEY);
}

function createDefaultRemoteState(year: string): AppState {
  return {
    ...defaultState,
    anoSelecionado: year,
    clientes: {
      default: createClientWithYear('default', year, ''),
    },
  };
}

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

interface Ctx {
  fullState: AppState;
  setFullState: React.Dispatch<React.SetStateAction<AppState>>;
  cliente: ClientData;
  yearData: YearData;
  anoSelecionado: string;
  setAno: (ano: string) => void;
  clienteAtivo: string;
  setClienteAtivo: (id: string) => void;
  addCliente: (nome: string) => string;
  removeCliente: (id: string) => void;
  renameCliente: (id: string, nome: string) => void;
  updateEmpresa: (emp: Partial<CompanyInfo>) => void;
  updatePremissas: (p: Partial<Premissas>) => void;
  updateCenarios: (c: Scenarios) => void;
  updateYearData: (updater: (yd: YearData) => YearData) => void;
  allAnos: Record<string, YearData>;
  allAnosKeys: string[];
  authConfigured: boolean;
  authLoading: boolean;
  dataLoading: boolean;
  user: User | null;
  session: Session | null;
  authError: string | null;
  authNotice: string | null;
  syncError: string | null;
  hasLocalDataToImport: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  importLocalData: () => Promise<void>;
  dismissAuthFeedback: () => void;
  clearSyncError: () => void;
}

const FinancialContext = createContext<Ctx | null>(null);

export function FinancialProvider({ children }: { children: React.ReactNode }) {
  const [fullState, setFullState] = useState<AppState>(defaultState);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const [dataLoading, setDataLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [hasLocalDataToImport, setHasLocalDataToImport] = useState(() => hasStoredLocalState());
  const clientPersistTimers = useRef<Record<string, number>>({});
  const yearPersistTimers = useRef<Record<string, number>>({});

  const clearTimers = useCallback(() => {
    Object.values(clientPersistTimers.current).forEach((timer) => window.clearTimeout(timer));
    Object.values(yearPersistTimers.current).forEach((timer) => window.clearTimeout(timer));
    clientPersistTimers.current = {};
    yearPersistTimers.current = {};
  }, []);

  const hydrateRemoteState = useCallback(async (nextUser: User, preferredYear: string) => {
    setDataLoading(true);

    try {
      await ensureProfile(nextUser);
      const state = await loadFinancialState(nextUser.id, preferredYear);
      setFullState(
        Object.keys(state.clientes).length > 0
          ? state
          : createDefaultRemoteState(preferredYear),
      );
      setSyncError(null);
    } catch (error) {
      setFullState(createDefaultRemoteState(preferredYear));
      setSyncError(toErrorMessage(error, 'Nao foi possivel carregar os dados do banco.'));
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthLoading(false);
      setDataLoading(false);
      return;
    }

    let active = true;

    const bootstrap = async () => {
      setAuthLoading(true);

      const { data, error } = await supabase.auth.getSession();
      if (!active) return;

      if (error) {
        setAuthError(error.message);
        setAuthLoading(false);
        return;
      }

      setSession(data.session);
      setUser(data.session?.user ?? null);
      setAuthLoading(false);

      if (data.session?.user) {
        await hydrateRemoteState(data.session.user, fullState.anoSelecionado);
      }
    };

    void bootstrap();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setAuthLoading(false);
      setAuthError(null);

      if (nextSession?.user) {
        void hydrateRemoteState(nextSession.user, fullState.anoSelecionado);
        return;
      }

      clearTimers();
      setDataLoading(false);
      setFullState(defaultState);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
      clearTimers();
    };
  }, [clearTimers, fullState.anoSelecionado, hydrateRemoteState]);

  const scheduleClientPersist = useCallback(
    (client: ClientData) => {
      if (!user || !isSupabaseConfigured) return;

      if (clientPersistTimers.current[client.id]) {
        window.clearTimeout(clientPersistTimers.current[client.id]);
      }

      clientPersistTimers.current[client.id] = window.setTimeout(async () => {
        try {
          await upsertClientRecord(user.id, client);
          setSyncError(null);
        } catch (error) {
          setSyncError(toErrorMessage(error, 'Nao foi possivel salvar os dados do cliente.'));
        }
      }, 450);
    },
    [user],
  );

  const scheduleYearPersist = useCallback(
    (clientId: string, year: string, yearData: YearData) => {
      if (!user || !isSupabaseConfigured) return;

      const timerKey = `${clientId}:${year}`;
      if (yearPersistTimers.current[timerKey]) {
        window.clearTimeout(yearPersistTimers.current[timerKey]);
      }

      yearPersistTimers.current[timerKey] = window.setTimeout(async () => {
        try {
          await upsertYearDataRecord(user.id, clientId, year, yearData);
          setSyncError(null);
        } catch (error) {
          setSyncError(toErrorMessage(error, 'Nao foi possivel salvar os dados anuais.'));
        }
      }, 450);
    },
    [user],
  );

  const cliente = useMemo(() => {
    return fullState.clientes[fullState.clienteAtivo] || Object.values(fullState.clientes)[0] || createClient('default');
  }, [fullState]);

  const yearData = useMemo(() => {
    return cliente.anos[fullState.anoSelecionado] || { ...emptyYearData };
  }, [cliente, fullState.anoSelecionado]);

  const setAno = useCallback((ano: string) => {
    setFullState((state) => ({ ...state, anoSelecionado: ano }));
  }, []);

  const setClienteAtivo = useCallback((id: string) => {
    setFullState((state) => ({ ...state, clienteAtivo: id }));
  }, []);

  const addCliente = useCallback(
    (nome: string): string => {
      const activeYear = fullState.anoSelecionado;
      const id = crypto.randomUUID?.() || `client_${Date.now()}`;
      const newClient = createClientWithYear(id, activeYear, nome);

      setFullState((state) => ({
        ...state,
        clienteAtivo: id,
        clientes: { ...state.clientes, [id]: newClient },
      }));

      if (user && isSupabaseConfigured) {
        void createClientRecord(user.id, newClient, activeYear).catch((error) => {
          setSyncError(toErrorMessage(error, 'Nao foi possivel criar o cliente no banco.'));
        });
      }

      return id;
    },
    [fullState.anoSelecionado, user],
  );

  const removeCliente = useCallback(
    (id: string) => {
      setFullState((state) => {
        const nextClients = { ...state.clientes };
        delete nextClients[id];

        if (Object.keys(nextClients).length === 0) {
          nextClients.default = createClientWithYear('default', state.anoSelecionado, '');
        }

        return {
          ...state,
          clientes: nextClients,
          clienteAtivo: state.clienteAtivo === id ? Object.keys(nextClients)[0] : state.clienteAtivo,
        };
      });

      if (user && isSupabaseConfigured) {
        void deleteClientRecord(id).catch((error) => {
          setSyncError(toErrorMessage(error, 'Nao foi possivel excluir o cliente no banco.'));
        });
      }
    },
    [user],
  );

  const renameCliente = useCallback(
    (id: string, nome: string) => {
      const nextClient = {
        ...fullState.clientes[id],
        empresa: { ...fullState.clientes[id].empresa, nome },
      };

      setFullState((state) => ({
        ...state,
        clientes: {
          ...state.clientes,
          [id]: nextClient,
        },
      }));

      scheduleClientPersist(nextClient);
    },
    [fullState.clientes, scheduleClientPersist],
  );

  const updateEmpresa = useCallback(
    (empresaPatch: Partial<CompanyInfo>) => {
      const nextClient = {
        ...cliente,
        empresa: { ...cliente.empresa, ...empresaPatch },
      };

      setFullState((state) => ({
        ...state,
        clientes: { ...state.clientes, [state.clienteAtivo]: nextClient },
      }));

      scheduleClientPersist(nextClient);
    },
    [cliente, scheduleClientPersist],
  );

  const updatePremissas = useCallback(
    (premissasPatch: Partial<Premissas>) => {
      const nextClient = {
        ...cliente,
        premissas: { ...cliente.premissas, ...premissasPatch },
      };

      setFullState((state) => ({
        ...state,
        clientes: { ...state.clientes, [state.clienteAtivo]: nextClient },
      }));

      scheduleClientPersist(nextClient);
    },
    [cliente, scheduleClientPersist],
  );

  const updateCenarios = useCallback(
    (cenarios: Scenarios) => {
      const nextClient = {
        ...cliente,
        cenarios,
      };

      setFullState((state) => ({
        ...state,
        clientes: { ...state.clientes, [state.clienteAtivo]: nextClient },
      }));

      scheduleClientPersist(nextClient);
    },
    [cliente, scheduleClientPersist],
  );

  const updateYearData = useCallback(
    (updater: (yd: YearData) => YearData) => {
      let nextYear = yearData;

      setFullState((state) => {
        const currentClient = state.clientes[state.clienteAtivo];
        const currentYear = currentClient.anos[state.anoSelecionado] || { ...emptyYearData };
        nextYear = updater(currentYear);

        return {
          ...state,
          clientes: {
            ...state.clientes,
            [state.clienteAtivo]: {
              ...currentClient,
              anos: {
                ...currentClient.anos,
                [state.anoSelecionado]: nextYear,
              },
            },
          },
        };
      });

      scheduleYearPersist(cliente.id, fullState.anoSelecionado, nextYear);
    },
    [cliente.id, fullState.anoSelecionado, scheduleYearPersist, yearData],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    setAuthNotice(null);
    setAuthLoading(true);

    try {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        setAuthError(error.message);
        setAuthLoading(false);
      }
    } catch (error) {
      setAuthError(toErrorMessage(error, 'Nao foi possivel entrar na conta.'));
      setAuthLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    setAuthNotice(null);
    setAuthLoading(true);

    try {
      const { data, error } = await signUpWithEmail(email, password);
      if (error) {
        setAuthError(error.message);
        setAuthLoading(false);
        return;
      }

      if (data.session) {
        setAuthNotice('Conta criada com sucesso. Agora vamos carregar seus dados.');
        return;
      }

      setAuthNotice('Conta criada. Verifique seu e-mail para confirmar o acesso.');
      setAuthLoading(false);
    } catch (error) {
      setAuthError(toErrorMessage(error, 'Nao foi possivel criar a conta.'));
      setAuthLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await signOutCurrentUser();
      clearTimers();
      setAuthError(null);
      setAuthNotice(null);
      setSyncError(null);
      setFullState(defaultState);
    } catch (error) {
      setSyncError(toErrorMessage(error, 'Nao foi possivel encerrar a sessao.'));
    }
  }, [clearTimers]);

  const importLocalData = useCallback(async () => {
    if (!user) return;

    const localState = loadLocalState();
    if (!localState) {
      setSyncError('Nao encontrei dados locais para importar.');
      return;
    }

    try {
      await migrateLocalStateToRemote(user.id, localState);
      clearStoredLocalState();
      setHasLocalDataToImport(false);
      await hydrateRemoteState(user, localState.anoSelecionado);
    } catch (error) {
      setSyncError(toErrorMessage(error, 'Nao foi possivel importar os dados locais.'));
    }
  }, [hydrateRemoteState, user]);

  const dismissAuthFeedback = useCallback(() => {
    setAuthError(null);
    setAuthNotice(null);
  }, []);

  const clearSyncError = useCallback(() => {
    setSyncError(null);
  }, []);

  const allAnos = cliente.anos;
  const allAnosKeys = useMemo(() => Object.keys(cliente.anos).sort(), [cliente.anos]);

  const ctx: Ctx = {
    fullState,
    setFullState,
    cliente,
    yearData,
    anoSelecionado: fullState.anoSelecionado,
    setAno,
    clienteAtivo: fullState.clienteAtivo,
    setClienteAtivo,
    addCliente,
    removeCliente,
    renameCliente,
    updateEmpresa,
    updatePremissas,
    updateCenarios,
    updateYearData,
    allAnos,
    allAnosKeys,
    authConfigured: isSupabaseConfigured,
    authLoading,
    dataLoading,
    user,
    session,
    authError,
    authNotice,
    syncError,
    hasLocalDataToImport,
    signIn,
    signUp,
    signOut,
    importLocalData,
    dismissAuthFeedback,
    clearSyncError,
  };

  return <FinancialContext.Provider value={ctx}>{children}</FinancialContext.Provider>;
}

export function useFinancial() {
  const ctx = useContext(FinancialContext);
  if (!ctx) throw new Error('useFinancial must be used within FinancialProvider');
  return ctx;
}
