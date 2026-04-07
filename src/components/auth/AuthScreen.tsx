import { useState } from 'react';
import { ArrowRight, KeyRound, LineChart, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AuthScreenProps {
  loading?: boolean;
  error?: string | null;
  notice?: string | null;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
  onDismissFeedback?: () => void;
}

export function AuthScreen({
  loading = false,
  error,
  notice,
  onSignIn,
  onSignUp,
  onDismissFeedback,
}: AuthScreenProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      setLocalError('Preencha e-mail e senha.');
      return;
    }

    setLocalError('');
    if (mode === 'signin') {
      await onSignIn(email, password);
      return;
    }

    await onSignUp(email, password);
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
              Seus clientes, metas e importacoes em uma unica conta.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-slate-600">
              Agora o dashboard pode sair do navegador local e passar a viver em um banco seguro, com login,
              backup e separacao total dos dados de cada usuario.
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
                  {mode === 'signin' ? 'Entrar na sua conta' : 'Criar sua conta'}
                </h2>
              </div>

              <div className="rounded-full border border-white/10 bg-white/5 p-1">
                <button
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    mode === 'signin' ? 'bg-white text-slate-950' : 'text-indigo-100'
                  }`}
                  onClick={() => setMode('signin')}
                  type="button"
                >
                  Entrar
                </button>
                <button
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    mode === 'signup' ? 'bg-white text-slate-950' : 'text-indigo-100'
                  }`}
                  onClick={() => setMode('signup')}
                  type="button"
                >
                  Criar conta
                </button>
              </div>
            </div>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-100/80">
                  E-mail
                </label>
                <Input
                  autoComplete="email"
                  className="h-12 rounded-2xl border-white/10 bg-white/5 px-4 text-white placeholder:text-slate-400 focus-visible:ring-indigo-400"
                  placeholder="voce@empresa.com"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-100/80">
                  Senha
                </label>
                <Input
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  className="h-12 rounded-2xl border-white/10 bg-white/5 px-4 text-white placeholder:text-slate-400 focus-visible:ring-indigo-400"
                  placeholder="Minimo de 6 caracteres"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

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
                {loading ? 'Processando...' : mode === 'signin' ? 'Entrar agora' : 'Criar conta e continuar'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <p className="mt-5 text-xs leading-6 text-indigo-100/75">
              {mode === 'signin'
                ? 'Use o e-mail da sua conta para acessar seus clientes e historicos salvos.'
                : 'Ao criar a conta, o app ja fica pronto para receber seus clientes e importar os dados locais deste navegador.'}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
