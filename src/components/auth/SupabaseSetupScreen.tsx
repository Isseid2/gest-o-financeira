import { Database, ExternalLink, KeySquare, ShieldEllipsis } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SupabaseSetupScreen() {
  return (
    <div className="min-h-screen bg-[linear-gradient(160deg,#f8fafc,#eef2ff_55%,#ffffff)] px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl rounded-[36px] border border-slate-200 bg-white/90 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur md:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section>
            <div className="inline-flex items-center gap-3 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Configuracao necessaria
            </div>

            <h1 className="mt-6 font-display text-4xl leading-none tracking-tight text-slate-950 md:text-5xl">
              O app ja esta pronto para o Supabase. Falta ligar o projeto.
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600">
              Eu preparei o fluxo de autenticacao, a camada de persistencia e o schema SQL. Agora voce so precisa
              criar um projeto no Supabase, copiar a URL e a chave publica para as variaveis de ambiente.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: Database,
                  title: '1. Crie o projeto',
                  description: 'Abra o painel do Supabase e crie um projeto Postgres.',
                },
                {
                  icon: ShieldEllipsis,
                  title: '2. Rode o SQL',
                  description: 'Cole o arquivo supabase/schema.sql no SQL Editor do projeto.',
                },
                {
                  icon: KeySquare,
                  title: '3. Configure o app',
                  description: 'Preencha .env.local com a URL e a anon key do projeto.',
                },
              ].map((item) => (
                <article key={item.title} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                  <item.icon className="h-5 w-5 text-indigo-600" />
                  <h2 className="mt-4 text-sm font-semibold text-slate-900">{item.title}</h2>
                  <p className="mt-2 text-xs leading-6 text-slate-600">{item.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-slate-950 p-7 text-white shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-200">
              Variaveis esperadas
            </p>

            <div className="mt-6 space-y-4 rounded-[24px] border border-white/10 bg-white/5 p-5">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">.env.local</div>
                <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-900/80 p-4 text-xs leading-6 text-indigo-100">
{`VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica`}
                </pre>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm text-slate-300">
              <p>Arquivos prontos no projeto:</p>
              <ul className="space-y-2 text-xs leading-6 text-slate-400">
                <li>`supabase/schema.sql` com tabelas, triggers e politicas RLS</li>
                <li>`src/lib/supabase/*` com cliente, auth e repositorio</li>
                <li>`docs/superpowers/specs/...` com o desenho da arquitetura</li>
              </ul>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="rounded-2xl bg-white text-slate-950 hover:bg-indigo-50">
                <a href="https://supabase.com/dashboard" rel="noreferrer" target="_blank">
                  Abrir Supabase
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
