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
  createEmptyYearData,
  createClientWithYear,
  defaultCenarios,
  defaultPremissas,
  defaultState,
  LegacyAppState,
  Premissas,
  Scenarios,
  FluxoCaixaPersistedData,
  YearData,
} from '@/types/financial';
import {
  sendPasswordReset,
  signInWithEmail,
  signOutCurrentUser,
  signUpWithEmail,
  updateCurrentUserPassword,
} from '@/lib/supabase/auth';
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
const LOCAL_IMPORT_BANNER_DISMISSED_KEY = 'fin-mgmt-local-import-banner-dismissed';
const DASHBOARD_CONTEXT_KEY = 'fin-mgmt-dashboard-context';

type DashboardContextPrefs = {
  clienteAtivo?: string;
  anoSelecionado?: string;
};

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
  localStorage.removeItem(LOCAL_IMPORT_BANNER_DISMISSED_KEY);
}

function isLocalImportBannerDismissed() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(LOCAL_IMPORT_BANNER_DISMISSED_KEY) === 'true';
}

function setLocalImportBannerDismissed(dismissed: boolean) {
  if (typeof window === 'undefined') return;
  if (dismissed) {
    localStorage.setItem(LOCAL_IMPORT_BANNER_DISMISSED_KEY, 'true');
    return;
  }
  localStorage.removeItem(LOCAL_IMPORT_BANNER_DISMISSED_KEY);
}

function loadDashboardContextPrefs(): DashboardContextPrefs {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(DASHBOARD_CONTEXT_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveDashboardContextPrefs(prefs: DashboardContextPrefs) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DASHBOARD_CONTEXT_KEY, JSON.stringify(prefs));
}

function applyDashboardContextPrefs(state: AppState, prefs: DashboardContextPrefs): AppState {
  const fallbackClientId = state.clienteAtivo || Object.keys(state.clientes)[0] || 'default';
  const nextClientId =
    prefs.clienteAtivo && state.clientes[prefs.clienteAtivo] ? prefs.clienteAtivo : fallbackClientId;
  const nextClient = state.clientes[nextClientId] || state.clientes[fallbackClientId];
  const availableYears = Object.keys(nextClient?.anos || {});
  const nextYear =
    prefs.anoSelecionado && availableYears.includes(prefs.anoSelecionado)
      ? prefs.anoSelecionado
      : state.anoSelecionado;

  return {
    ...state,
    clienteAtivo: nextClientId,
    anoSelecionado: nextYear,
  };
}

function createDefaultRemoteState(year: string): AppState {
  return applyDashboardContextPrefs(
    {
    ...defaultState,
    anoSelecionado: year,
    clientes: {
      default: createClientWithYear('default', year, ''),
    },
    },
    loadDashboardContextPrefs(),
  );
}

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function getAuthParams() {
  if (typeof window === 'undefined') {
    return { hash: new URLSearchParams(), search: new URLSearchParams() };
  }

  const hashValue = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
  return {
    hash: new URLSearchParams(hashValue),
    search: new URLSearchParams(window.location.search),
  };
}

function hasRecoveryIntent() {
  const { hash, search } = getAuthParams();
  return (
    hash.get('type') === 'recovery' ||
    search.get('type') === 'recovery' ||
    Boolean(hash.get('access_token') && hash.get('refresh_token'))
  );
}

function readAuthUrlError() {
  const { hash, search } = getAuthParams();
  const error = hash.get('error') || search.get('error');
  const description = hash.get('error_description') || search.get('error_description');

  if (!error) return null;

  if (description) {
    return decodeURIComponent(description.replace(/\+/g, ' '));
  }

  return error;
}

function clearAuthUrlParams() {
  if (typeof window === 'undefined') return;
  const cleanUrl = `${window.location.origin}${window.location.pathname}`;
  window.history.replaceState({}, document.title, cleanUrl);
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
  updateFluxoData: (fluxoData: FluxoCaixaPersistedData | null) => void;
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
  showLocalImportBanner: boolean;
  passwordRecoveryMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  startPasswordChange: () => void;
  cancelPasswordRecovery: () => void;
  signOut: () => Promise<void>;
  importLocalData: () => Promise<void>;
  dismissLocalImportBanner: () => void;
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
  const [showLocalImportBanner, setShowLocalImportBanner] = useState(
    () => hasStoredLocalState() && !isLocalImportBannerDismissed(),
  );
  const [passwordRecoveryMode, setPasswordRecoveryMode] = useState(false);
  const [passwordRecoveryLocked, setPasswordRecoveryLocked] = useState(false);
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
          ? applyDashboardContextPrefs(state, loadDashboardContextPrefs())
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
      const urlError = readAuthUrlError();
      const recoveryIntent = hasRecoveryIntent();

      const { data, error } = await supabase.auth.getSession();
      if (!active) return;

      if (error) {
        setAuthError(error.message);
        setAuthLoading(false);
        return;
      }

      if (urlError) {
        setAuthError(urlError === 'Email link is invalid or has expired' ? 'O link de recuperacao e invalido ou expirou. Gere um novo link para continuar.' : urlError);
        setPasswordRecoveryMode(false);
        setPasswordRecoveryLocked(false);
        clearAuthUrlParams();
      }

      setSession(data.session);
      setUser(data.session?.user ?? null);
      setAuthLoading(false);

      if (recoveryIntent) {
        setPasswordRecoveryMode(true);
        setPasswordRecoveryLocked(true);
        return;
      }

      if (data.session?.user) {
        await hydrateRemoteState(data.session.user, fullState.anoSelecionado);
      }
    };

    void bootstrap();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setAuthLoading(false);
      setAuthError(null);
      const urlError = readAuthUrlError();
      const recoveryIntent = hasRecoveryIntent();

      if (urlError) {
        setAuthError(urlError === 'Email link is invalid or has expired' ? 'O link de recuperacao e invalido ou expirou. Gere um novo link para continuar.' : urlError);
        setPasswordRecoveryMode(false);
        setPasswordRecoveryLocked(false);
        clearAuthUrlParams();
        return;
      }

      if (event === 'PASSWORD_RECOVERY' || recoveryIntent) {
        setPasswordRecoveryMode(true);
        setPasswordRecoveryLocked(true);
        return;
      }

      if (nextSession?.user && ['SIGNED_IN', 'INITIAL_SESSION', 'USER_UPDATED'].includes(event)) {
        if (!passwordRecoveryLocked) {
          setPasswordRecoveryMode(false);
        }
        void hydrateRemoteState(nextSession.user, fullState.anoSelecionado);
        return;
      }

      clearTimers();
      setDataLoading(false);
      setPasswordRecoveryMode(false);
      setPasswordRecoveryLocked(false);
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
    return cliente.anos[fullState.anoSelecionado] || createEmptyYearData();
  }, [cliente, fullState.anoSelecionado]);

  const setAno = useCallback((ano: string) => {
    setFullState((state) => {
      const nextState = { ...state, anoSelecionado: ano };
      saveDashboardContextPrefs({ clienteAtivo: nextState.clienteAtivo, anoSelecionado: nextState.anoSelecionado });
      return nextState;
    });
  }, []);

  const setClienteAtivo = useCallback((id: string) => {
    setFullState((state) => {
      const nextState = { ...state, clienteAtivo: id };
      saveDashboardContextPrefs({ clienteAtivo: nextState.clienteAtivo, anoSelecionado: nextState.anoSelecionado });
      return nextState;
    });
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

      saveDashboardContextPrefs({ clienteAtivo: id, anoSelecionado: activeYear });

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

        const nextState = {
          ...state,
          clientes: nextClients,
          clienteAtivo: state.clienteAtivo === id ? Object.keys(nextClients)[0] : state.clienteAtivo,
        };
        saveDashboardContextPrefs({
          clienteAtivo: nextState.clienteAtivo,
          anoSelecionado: nextState.anoSelecionado,
        });
        return nextState;
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

  const updateFluxoData = useCallback(
    (fluxoData: FluxoCaixaPersistedData | null) => {
      const nextClient = {
        ...cliente,
        fluxoData,
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
        const currentYear = currentClient.anos[state.anoSelecionado] || createEmptyYearData();
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

      setAuthNotice('Se este e-mail ainda nao tiver cadastro, enviamos as proximas instrucoes. Se a conta ja existir, tente entrar ou redefinir a senha.');
      setAuthLoading(false);
    } catch (error) {
      setAuthError(toErrorMessage(error, 'Nao foi possivel criar a conta.'));
      setAuthLoading(false);
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    setAuthError(null);
    setAuthNotice(null);
    setAuthLoading(true);

    try {
      const { error } = await sendPasswordReset(email);
      if (error) {
        setAuthError(error.message);
        setAuthLoading(false);
        return;
      }

      setAuthNotice('Se a conta existir, enviamos um link para redefinir sua senha no e-mail informado.');
      setAuthLoading(false);
    } catch (error) {
      setAuthError(toErrorMessage(error, 'Nao foi possivel enviar o link de recuperacao.'));
      setAuthLoading(false);
    }
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    setAuthError(null);
    setAuthNotice(null);
    setAuthLoading(true);

    try {
      const { error } = await updateCurrentUserPassword(password);
      if (error) {
        setAuthError(error.message);
        setAuthLoading(false);
        return;
      }

      setPasswordRecoveryMode(false);
      setPasswordRecoveryLocked(false);
      await signOutCurrentUser();
      setAuthNotice('Senha atualizada com sucesso. Entre novamente com a nova senha.');
      clearAuthUrlParams();
      setAuthLoading(false);
    } catch (error) {
      setAuthError(toErrorMessage(error, 'Nao foi possivel atualizar a senha.'));
      setAuthLoading(false);
    }
  }, []);

  const startPasswordChange = useCallback(() => {
    setAuthError(null);
    setAuthNotice(null);
    setPasswordRecoveryLocked(false);
    setPasswordRecoveryMode(true);
  }, []);

  const cancelPasswordRecovery = useCallback(() => {
    const exitRecovery = async () => {
      setAuthError(null);
      setAuthNotice(null);
      clearAuthUrlParams();

      if (passwordRecoveryLocked) {
        setAuthLoading(true);
        try {
          await signOutCurrentUser();
        } catch (error) {
          setAuthError(toErrorMessage(error, 'Nao foi possivel sair do modo de recuperacao com seguranca.'));
        } finally {
          setPasswordRecoveryMode(false);
          setPasswordRecoveryLocked(false);
          setAuthLoading(false);
        }
        return;
      }

      setPasswordRecoveryMode(false);
      setPasswordRecoveryLocked(false);
    };

    void exitRecovery();
  }, [passwordRecoveryLocked]);

  const signOut = useCallback(async () => {
    try {
      await signOutCurrentUser();
      clearTimers();
      setAuthError(null);
      setAuthNotice(null);
      setSyncError(null);
      setPasswordRecoveryMode(false);
      setPasswordRecoveryLocked(false);
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
      setShowLocalImportBanner(false);
      await hydrateRemoteState(user, localState.anoSelecionado);
    } catch (error) {
      setSyncError(toErrorMessage(error, 'Nao foi possivel importar os dados locais.'));
    }
  }, [hydrateRemoteState, user]);

  const dismissLocalImportBanner = useCallback(() => {
    setLocalImportBannerDismissed(true);
    setShowLocalImportBanner(false);
  }, []);

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
    updateFluxoData,
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
    showLocalImportBanner,
    passwordRecoveryMode,
    signIn,
    signUp,
    requestPasswordReset,
    updatePassword,
    startPasswordChange,
    cancelPasswordRecovery,
    signOut,
    importLocalData,
    dismissLocalImportBanner,
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
