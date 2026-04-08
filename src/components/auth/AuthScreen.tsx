import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, KeyRound, LineChart, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type AuthMode = 'signin' | 'signup' | 'recovery' | 'reset-password';

interface AuthScreenProps {
  loading?: boolean;
  error?: string | null;
  notice?: string | null;
  forcedMode?: AuthMode | null;
  onCancelRecovery?: () => void;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
  onRequestPasswordReset: (email: string) => Promise<void>;
  onUpdatePassword: (password: string) => Promise<void>;
  onDismissFeedback?: () => void;
}

export function AuthScreen({
  loading = false,
  error,
  notice,
  forcedMode,
  onCancelRecovery,
  onSignIn,
  onSignUp,
  onRequestPasswordReset,
  onUpdatePassword,
  onDismissFeedback,
}: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>(forcedMode ?? 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (forcedMode) {
      setMode(forcedMode);
    }
  }, [forcedMode]);

  const activeMode = forcedMode ?? mode;

  const setNextMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setLocalError('');
    setPassword('');
    setPasswordConfirm('');
    if (nextMode !== 'reset-password') {
      setEmail('');
    }
    onDismissFeedback?.();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if ((activeMode === 'signin' || activeMode === 'signup') && (!email || !password)) {
      setLocalError('Preencha e-mail e senha.');
      return;
    }

    if (activeMode === 'recovery' && !email) {
      setLocalError('Informe o e-mail da conta.');
      return;
    }

    if (activeMode === 'reset-password') {
      if (!password || !passwordConfirm) {
        setLocalError('Preencha e confirme a nova senha.');
        return;
      }

      if (password.length < 6) {
        setLocalError('A nova senha precisa ter pelo menos 6 caracteres.');
        return;
      }

      if (password !== passwordConfirm) {
        setLocalError('As senhas nao conferem.');
        return;
      }
    }

    setLocalError('');

    if (activeMode === 'signin') {
      await onSignIn(email, password);
      return;
    }

    if (activeMode === 'signup') {
      await onSignUp(email, password);
      return;
    }

    if (activeMode === 'recovery') {
      await onRequestPasswordReset(email);
      return;
    }

    await onUpdatePassword(password);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(79,70,229,0.12),_transparent_35%),linear-gradient(135deg,_#f8fafc,_#eef2ff_45%,_#ffffff)] px-4 py-8 text-slate-900">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/85 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur lg:p-10">
          <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-700">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            Gestao financeira conectada
          </div>

          <div className="max-w-xl">
            <h1 className="font-display text-4xl leading-none tracking-tight text-slate-950 md:text-5xl">
              Seus clientes, metas e importações em uma única conta.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-slate-600">
              Agora o dashboard pode sair do navegador local e passar a viver em um banco seguro, com login,
              backup e separação total dos dados de cada usuário.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: 'Seguranca por usuario',
                description: 'Cada conta enxerga apenas os proprios clientes com protecao no banco.',
              },
              {
                icon: LineChart,
                title: 'Mesmos dados em qualquer lugar',
                description: 'Planejamento, lancamentos e historico sincronizados entre dispositivos.',
              },
              {
                icon: KeyRound,
                title: 'Base para crescer',
                description: 'Estrutura pronta para backup, auditoria e futuras automacoes.',
              },
            ].map((item) => (
              <article
                key={item.title}
                className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
              >
                <item.icon className="h-5 w-5 text-indigo-600" />
                <h2 className="mt-4 text-sm font-semibold text-slate-900">{item.title}</h2>
                <p className="mt-2 text-xs leading-6 text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-slate-950 p-1 shadow-[0_24px_80px_rgba(15,23,42,0.14)]">
          <div className="rounded-[28px] bg-[linear-gradient(180deg,#0f172a,#111827_48%,#172554)] p-7 text-white md:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-200">
                  acesso seguro
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  {activeMode === 'signin' && 'Entrar na sua conta'}
                  {activeMode === 'signup' && 'Criar sua conta'}
                  {activeMode === 'recovery' && 'Recuperar acesso'}
                  {activeMode === 'reset-password' && 'Definir nova senha'}
                </h2>
              </div>

              {activeMode === 'signin' || activeMode === 'signup' ? (
                <div className="rounded-full border border-white/10 bg-white/5 p-1">
                  <button
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      activeMode === 'signin' ? 'bg-white text-slate-950' : 'text-indigo-100'
                    }`}
                    onClick={() => setNextMode('signin')}
                    type="button"
                  >
                    Entrar
                  </button>
                  <button
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      activeMode === 'signup' ? 'bg-white text-slate-950' : 'text-indigo-100'
                    }`}
                    onClick={() => setNextMode('signup')}
                    type="button"
                  >
                    Criar conta
                  </button>
                </div>
              ) : (
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-indigo-100 transition hover:bg-white/10"
                  onClick={() => {
                    if (forcedMode) {
                      onCancelRecovery?.();
                      return;
                    }
                    setNextMode('signin');
                  }}
                  type="button"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Voltar ao login
                </button>
              )}
            </div>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-100/80">
                  E-mail
                </label>
                <Input
                  autoComplete="email"
                  className="h-12 rounded-2xl border-white/10 bg-white/5 px-4 text-white placeholder:text-slate-400 focus-visible:ring-indigo-400"
                  disabled={activeMode === 'reset-password'}
                  placeholder={activeMode === 'recovery' ? 'Digite o e-mail da conta' : 'voce@empresa.com'}
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              {activeMode !== 'recovery' && (
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-100/80">
                    {activeMode === 'reset-password' ? 'Nova senha' : 'Senha'}
                  </label>
                  <Input
                    autoComplete={activeMode === 'signin' ? 'current-password' : 'new-password'}
                    className="h-12 rounded-2xl border-white/10 bg-white/5 px-4 text-white placeholder:text-slate-400 focus-visible:ring-indigo-400"
                    placeholder="Minimo de 6 caracteres"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
              )}

              {activeMode === 'reset-password' && (
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-100/80">
                    Confirmar nova senha
                  </label>
                  <Input
                    autoComplete="new-password"
                    className="h-12 rounded-2xl border-white/10 bg-white/5 px-4 text-white placeholder:text-slate-400 focus-visible:ring-indigo-400"
                    placeholder="Repita a nova senha"
                    type="password"
                    value={passwordConfirm}
                    onChange={(event) => setPasswordConfirm(event.target.value)}
                  />
                </div>
              )}

              {(localError || error || notice) && (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    localError || error
                      ? 'border border-rose-400/25 bg-rose-500/10 text-rose-100'
                      : 'border border-emerald-300/20 bg-emerald-500/10 text-emerald-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span>{localError || error || notice}</span>
                    {onDismissFeedback && (
                      <button
                        className="text-[11px] font-semibold uppercase tracking-[0.16em] text-current/80"
                        onClick={onDismissFeedback}
                        type="button"
                      >
                        Fechar
                      </button>
                    )}
                  </div>
                </div>
              )}

              <Button
                className="h-12 w-full rounded-2xl bg-white text-slate-950 hover:bg-indigo-50"
                disabled={loading}
                type="submit"
              >
                {loading && 'Processando...'}
                {!loading && activeMode === 'signin' && 'Entrar agora'}
                {!loading && activeMode === 'signup' && 'Criar conta e continuar'}
                {!loading && activeMode === 'recovery' && 'Enviar link de recuperacao'}
                {!loading && activeMode === 'reset-password' && 'Salvar nova senha'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            {activeMode === 'signin' && (
              <div className="mt-5 flex items-center justify-between gap-3">
                <p className="text-xs leading-6 text-indigo-100/75">
                  Use o e-mail da sua conta para acessar seus clientes e historicos salvos.
                </p>
                <button
                  className="text-xs font-medium text-indigo-100 underline decoration-white/20 underline-offset-4 transition hover:text-white"
                  onClick={() => setNextMode('recovery')}
                  type="button"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}

            {activeMode === 'signup' && (
              <p className="mt-5 text-xs leading-6 text-indigo-100/75">
                Se este e-mail ainda nao tiver cadastro, vamos preparar o acesso. Se a conta ja existir, entre ou use a recuperacao de senha.
              </p>
            )}

            {activeMode === 'recovery' && (
              <p className="mt-5 text-xs leading-6 text-indigo-100/75">
                Vamos enviar um link de recuperacao para o e-mail informado. Se a conta existir, voce recebe as instrucoes para redefinir a senha.
              </p>
            )}

            {activeMode === 'reset-password' && (
              <p className="mt-5 text-xs leading-6 text-indigo-100/75">
                Defina sua nova senha para concluir a recuperacao. Depois disso, vamos pedir login novamente por seguranca.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
