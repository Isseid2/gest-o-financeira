import { useMemo, useState } from 'react';
import { useFinancial } from '@/context/FinancialContext';
import { COLORS, DREData, INDIC_COLORS, INDIC_LABELS, M3, MESES } from '@/types/financial';
import { calcDRE, dP, fP, fmt, fmtK, toObj } from '@/utils/financial';
import { isDesvioFavoravel } from '@/utils/dreAnalysis';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type YearBucket = {
  orcMes: Record<number, DREData>;
  realMes: Record<number, DREData>;
};

type AnnualCompareMode = 'orcado' | 'resultado_anual';

interface MonthYearOption {
  ano: string;
  mes: number;
  label: string;
}

function emptyDRE(): DREData {
  return { recBruta: 0, deducoes: 0, cpv: 0, despOp: 0, depAmort: 0, resFinanc: 0, ir: 0 };
}

function sumYearData(data: Record<number, DREData>) {
  const total = emptyDRE();
  Object.keys(data || {}).map(Number).forEach((mes) => {
    const current = toObj(data[mes]);
    (Object.keys(total) as (keyof DREData)[]).forEach((key) => {
      total[key] += current[key];
    });
  });
  return total;
}

export function ComparativoTab() {
  const { cliente, yearData, anoSelecionado: ano, allAnos, allAnosKeys } = useFinancial();
  const [subTab, setSubTab] = useState<'mensal' | 'anual'>('mensal');
  const moeda = cliente.empresa.moeda;

  return (
    <div style={{ animation: 'fadeUp .25s ease' }}>
      <div className="flex items-center gap-3 mb-5">
        <span className="text-[11px] font-semibold" style={{ color: 'hsl(var(--text-muted))' }}>
          Ano: {ano}
        </span>
        <div className="flex gap-1.5">
          <button className={`subtab-pill ${subTab === 'mensal' ? 'subtab-pill-active' : ''}`} onClick={() => setSubTab('mensal')}>
            Comparação Mensal
          </button>
          <button className={`subtab-pill ${subTab === 'anual' ? 'subtab-pill-active' : ''}`} onClick={() => setSubTab('anual')}>
            Consolidado Anual
          </button>
        </div>
      </div>
      {subTab === 'mensal' ? (
        <CompMensal moeda={moeda} allAnos={allAnos} allAnosKeys={allAnosKeys} />
      ) : (
        <CompAnual moeda={moeda} ano={ano} yearData={yearData} allAnos={allAnos} allAnosKeys={allAnosKeys} />
      )}
    </div>
  );
}

function CompMensal({
  moeda,
  allAnos,
  allAnosKeys,
}: {
  moeda: string;
  allAnos: Record<string, YearBucket>;
  allAnosKeys: string[];
}) {
  const options = useMemo<MonthYearOption[]>(() => {
    const opts: MonthYearOption[] = [];
    allAnosKeys.forEach((ano) => {
      const yd = allAnos[ano];
      const months = new Set([
        ...Object.keys(yd.realMes || {}).map(Number),
        ...Object.keys(yd.orcMes || {}).map(Number),
      ]);
      Array.from(months)
        .sort((a, b) => a - b)
        .forEach((m) => {
          opts.push({ ano, mes: m, label: `${MESES[m]} ${ano}` });
        });
    });
    return opts;
  }, [allAnos, allAnosKeys]);

  const [selA, setSelA] = useState(0);
  const [selB, setSelB] = useState(Math.min(1, options.length - 1));

  const optA = options[selA] || options[0];
  const optB = options[selB] || options[Math.min(1, options.length - 1)];

  const getMonthData = (opt: MonthYearOption | undefined) => {
    if (!opt) return { raw: null, result: { recLiq: 0, lucBruto: 0, ebitda: 0, lucLiq: 0 } };
    const yd = allAnos[opt.ano];
    const raw = yd?.realMes?.[opt.mes] ? toObj(yd.realMes[opt.mes]) : null;
    return { raw, result: raw ? calcDRE(raw) : { recLiq: 0, lucBruto: 0, ebitda: 0, lucLiq: 0 } };
  };

  const dataA = getMonthData(optA);
  const dataB = getMonthData(optB);
  const rA = dataA.result;
  const rB = dataB.result;
  const dA = dataA.raw;
  const dB = dataB.raw;

  const keys: (keyof typeof rA)[] = ['recLiq', 'lucBruto', 'ebitda', 'lucLiq'];

  const linhas: [string, number, number, boolean?][] = [
    ['Receita Bruta', dA?.recBruta || 0, dB?.recBruta || 0],
    ['(-) Deduções', dA?.deducoes || 0, dB?.deducoes || 0],
    ['= Rec. Líquida', rA.recLiq, rB.recLiq, true],
    ['(-) CPV', dA?.cpv || 0, dB?.cpv || 0],
    ['= Lucro Bruto', rA.lucBruto, rB.lucBruto, true],
    ['(-) Desp. Op.', dA?.despOp || 0, dB?.despOp || 0],
    ['= EBITDA', rA.ebitda, rB.ebitda, true],
    ['(-) Deprec.', dA?.depAmort || 0, dB?.depAmort || 0],
    ['(+/-) Res. Fin.', dA?.resFinanc || 0, dB?.resFinanc || 0],
    ['(-) IR/CSLL', dA?.ir || 0, dB?.ir || 0],
    ['= Lucro Líquido', rA.lucLiq, rB.lucLiq, true],
  ];

  const labelA = optA?.label || '—';
  const labelB = optB?.label || '—';

  if (options.length === 0) {
    return (
      <div className="sec">
        <p className="text-[11px]" style={{ color: 'hsl(var(--text-muted))', padding: 16 }}>
          Nenhum mês lançado ainda em nenhum ano.
        </p>
      </div>
    );
  }

  return (
    <div className="sec">
      <div className="sec-title">Selecione os períodos para comparação</div>
      <div className="flex gap-3 items-end flex-wrap mb-4">
        <div>
          <label className="field-label">Período A</label>
          <select className="field-select" style={{ width: 'auto', padding: '7px 12px' }} value={selA} onChange={(e) => setSelA(Number(e.target.value))}>
            {options.map((o, i) => (
              <option key={i} value={i}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="pb-1.5 text-muted-foreground">↔</div>
        <div>
          <label className="field-label">Período B</label>
          <select className="field-select" style={{ width: 'auto', padding: '7px 12px' }} value={selB} onChange={(e) => setSelB(Number(e.target.value))}>
            {options.map((o, i) => (
              <option key={i} value={i}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-[10px] mb-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
        {INDIC_LABELS.map((lbl, i) => {
          const k = keys[i];
          const va = rA[k];
          const vb = rB[k];
          const v = dP(vb, va);
          const ok = vb >= va;
          const pA = i > 0 ? fP(rA[k], rA.recLiq) : '';
          const pB = i > 0 ? fP(rB[k], rB.recLiq) : '';
          return (
            <div key={lbl} className="indic" style={{ '--indic-color': INDIC_COLORS[i] } as React.CSSProperties}>
              <div className="indic-label">{lbl}</div>
              <div className="text-[10px] mb-1" style={{ color: 'hsl(var(--text-muted))' }}>
                {labelA}: <strong style={{ color: 'hsl(var(--text-secondary))' }}>{fmt(va, moeda)}</strong>
                {pA ? ` (${pA})` : ''}
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="indic-val" style={{ fontSize: 13 }}>
                  {fmt(vb, moeda)}
                </span>
                {pB && <span className="indic-pct" style={{ color: INDIC_COLORS[i] }}>{pB}</span>}
              </div>
              <div className="text-[10px] mt-1.5" style={{ color: 'hsl(var(--text-muted))' }}>
                <strong style={{ color: ok ? '#059669' : '#e11d48' }}>
                  {ok ? '▲' : '▼'} {Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%
                </strong>{' '}
                vs {labelA}
              </div>
            </div>
          );
        })}
      </div>

      <div className="overflow-x-auto">
        <table className="dre-table">
          <thead>
            <tr>
              <th>Linha DRE</th>
              <th style={{ textAlign: 'right' }}>{labelA}</th>
              <th style={{ textAlign: 'right' }}>% RL</th>
              <th style={{ textAlign: 'right' }}>{labelB}</th>
              <th style={{ textAlign: 'right' }}>% RL</th>
              <th style={{ textAlign: 'right' }}>Variação</th>
              <th style={{ textAlign: 'right' }}>Var. %</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map(([label, va, vb, sub]) => {
              const dev = vb - va;
              const favoravel = isDesvioFavoravel(label, dev);
              const vp = dP(vb, va);
              return (
                <tr key={label} className={sub ? 'sub-row' : ''}>
                  <td>{label}</td>
                  <td className="cell-right">{fmt(va, moeda)}</td>
                  <td className="cell-dim">{fP(va, rA.recLiq)}</td>
                  <td className="cell-right">{fmt(vb, moeda)}</td>
                  <td className="cell-dim">{fP(vb, rB.recLiq)}</td>
                  <td className="cell-right">
                    <span className={`pill ${favoravel ? 'pill-positive' : 'pill-negative'}`}>{dev >= 0 ? '+' : ''}{fmt(dev, moeda)}</span>
                  </td>
                  <td className="cell-right">
                    <span style={{ fontSize: 10, fontWeight: 600, color: favoravel ? '#059669' : '#e11d48' }}>
                      {favoravel ? '▲' : '▼'}{Math.abs(vp).toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompAnual({
  moeda,
  ano,
  yearData,
  allAnos,
  allAnosKeys,
}: {
  moeda: string;
  ano: string;
  yearData: YearBucket;
  allAnos: Record<string, YearBucket>;
  allAnosKeys: string[];
}) {
  const [compareMode, setCompareMode] = useState<AnnualCompareMode>('orcado');
  const availableAnnualYears = useMemo(
    () =>
      allAnosKeys.filter((key) => {
        if (key === ano) return false;
        return Object.keys(allAnos[key]?.realMes || {}).length > 0;
      }),
    [allAnos, allAnosKeys, ano],
  );
  const [compareYear, setCompareYear] = useState('');

  const effectiveCompareYear =
    compareMode === 'resultado_anual'
      ? (availableAnnualYears.includes(compareYear) ? compareYear : availableAnnualYears[0] || '')
      : '';

  const ms = Object.keys(yearData.realMes).map(Number).sort((a, b) => a - b);
  if (!ms.length) {
    return (
      <div className="sec">
        <p className="text-[11px]" style={{ color: 'hsl(var(--text-muted))', padding: 16 }}>
          Nenhum mês lançado ainda.
        </p>
      </div>
    );
  }

  const tRealizado = sumYearData(yearData.realMes);
  const tOrcado = sumYearData(yearData.orcMes);
  const comparisonBucket = compareMode === 'resultado_anual' && effectiveCompareYear ? allAnos[effectiveCompareYear] : yearData;
  const tComparacao = compareMode === 'resultado_anual' ? sumYearData(comparisonBucket?.realMes || {}) : tOrcado;
  const resRealizado = calcDRE(tRealizado);
  const resComparacao = calcDRE(tComparacao);
  const comparisonLabel = compareMode === 'resultado_anual' ? `Resultado ${effectiveCompareYear || 'sem ano'}` : 'Orçado';

  const linhas: [string, number, number, boolean?][] = [
    ['Receita Bruta', tRealizado.recBruta, tComparacao.recBruta],
    ['(-) Deduções', tRealizado.deducoes, tComparacao.deducoes],
    ['= Receita Líquida', resRealizado.recLiq, resComparacao.recLiq, true],
    ['(-) CPV / CMV', tRealizado.cpv, tComparacao.cpv],
    ['= Lucro Bruto', resRealizado.lucBruto, resComparacao.lucBruto, true],
    ['(-) Desp. Op.', tRealizado.despOp, tComparacao.despOp],
    ['= EBITDA', resRealizado.ebitda, resComparacao.ebitda, true],
    ['(-) Deprec./Amort.', tRealizado.depAmort, tComparacao.depAmort],
    ['(+/-) Res. Financ.', tRealizado.resFinanc, tComparacao.resFinanc],
    ['(-) IR / CSLL', tRealizado.ir, tComparacao.ir],
    ['= Lucro Líquido', resRealizado.lucLiq, resComparacao.lucLiq, true],
  ];

  const labels = ms.map((m) => M3[m]);
  const comparisonMonths = compareMode === 'resultado_anual'
    ? Object.keys(comparisonBucket?.realMes || {}).map(Number).sort((a, b) => a - b)
    : ms;

  const getComparisonMonthResult = (index: number) => {
    const month = comparisonMonths[index];
    if (!month) return calcDRE(emptyDRE());
    if (compareMode === 'resultado_anual') return calcDRE(toObj(comparisonBucket?.realMes?.[month]));
    return calcDRE(toObj(yearData.orcMes[month]));
  };

  const margBrutaR = ms.map((m) => {
    const r = calcDRE(toObj(yearData.realMes[m]));
    return r.recLiq ? (r.lucBruto / r.recLiq) * 100 : 0;
  });
  const margBrutaC = ms.map((_, i) => {
    const c = getComparisonMonthResult(i);
    return c.recLiq ? (c.lucBruto / c.recLiq) * 100 : 0;
  });
  const margEbitdaR = ms.map((m) => {
    const r = calcDRE(toObj(yearData.realMes[m]));
    return r.recLiq ? (r.ebitda / r.recLiq) * 100 : 0;
  });
  const margEbitdaC = ms.map((_, i) => {
    const c = getComparisonMonthResult(i);
    return c.recLiq ? (c.ebitda / c.recLiq) * 100 : 0;
  });
  const margLiqR = ms.map((m) => {
    const r = calcDRE(toObj(yearData.realMes[m]));
    return r.recLiq ? (r.lucLiq / r.recLiq) * 100 : 0;
  });
  const margLiqC = ms.map((_, i) => {
    const c = getComparisonMonthResult(i);
    return c.recLiq ? (c.lucLiq / c.recLiq) * 100 : 0;
  });
  const rlR = ms.map((m) => calcDRE(toObj(yearData.realMes[m])).recLiq);
  const rlC = ms.map((_, i) => getComparisonMonthResult(i).recLiq);
  const keys: (keyof typeof resRealizado)[] = ['recLiq', 'lucBruto', 'ebitda', 'lucLiq'];
  const chartMargData = (real: number[], comparacao: number[]) =>
    labels.map((month, i) => ({
      month,
      Realizado: parseFloat((real[i] || 0).toFixed(1)),
      Comparacao: parseFloat((comparacao[i] || 0).toFixed(1)),
    }));

  return (
    <>
      <div className="sec">
        <div className="sec-title">Consolidado Anual — {ano}</div>
        <div className="flex gap-2 items-end flex-wrap mb-4">
          <div className="flex gap-1.5">
            <button className={`subtab-pill ${compareMode === 'orcado' ? 'subtab-pill-active' : ''}`} onClick={() => setCompareMode('orcado')}>
              Orçado anual
            </button>
            <button className={`subtab-pill ${compareMode === 'resultado_anual' ? 'subtab-pill-active' : ''}`} onClick={() => setCompareMode('resultado_anual')}>
              Resultado anual lançado
            </button>
          </div>
          {compareMode === 'resultado_anual' ? (
            <div>
              <label className="field-label">Ano para comparar</label>
              <select
                className="field-select"
                style={{ width: 'auto', padding: '7px 12px' }}
                value={effectiveCompareYear}
                onChange={(e) => setCompareYear(e.target.value)}
                disabled={!availableAnnualYears.length}
              >
                {!availableAnnualYears.length ? (
                  <option value="">Nenhum ano lançado</option>
                ) : (
                  availableAnnualYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))
                )}
              </select>
            </div>
          ) : null}
        </div>

        <div className="grid gap-[10px] mb-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
          {INDIC_LABELS.map((lbl, i) => {
            const k = keys[i];
            const val = resRealizado[k];
            const compareVal = resComparacao[k];
            const v = dP(val, compareVal);
            const ok = val >= compareVal;
            const pReal = i > 0 ? fP(val, resRealizado.recLiq) : '';
            const pCompare = i > 0 ? fP(compareVal, resComparacao.recLiq) : '';
            return (
              <div key={lbl} className="indic" style={{ '--indic-color': INDIC_COLORS[i] } as React.CSSProperties}>
                <div className="indic-label">{lbl}</div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="indic-val">{fmt(val, moeda)}</span>
                  {pReal && <span className="indic-pct" style={{ color: INDIC_COLORS[i] }}>{pReal}</span>}
                </div>
                {compareVal ? (
                  <div className="text-[10px] mt-1.5" style={{ color: 'hsl(var(--text-muted))' }}>
                    {comparisonLabel}: {fmt(compareVal, moeda)}
                    {pCompare ? ` (${pCompare})` : ''} &nbsp;
                    <strong style={{ color: ok ? '#059669' : '#e11d48' }}>
                      {ok ? '▲' : '▼'} {Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%
                    </strong>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="sec">
        <div className="sec-title">DRE Consolidado — {ano}</div>
        <div className="overflow-x-auto">
          <table className="dre-table">
            <thead>
              <tr>
                <th>Linha DRE</th>
                <th style={{ textAlign: 'right' }}>Realizado</th>
                <th style={{ textAlign: 'right' }}>% RL</th>
                <th style={{ textAlign: 'right' }}>{comparisonLabel}</th>
                <th style={{ textAlign: 'right' }}>% RL</th>
                <th style={{ textAlign: 'right' }}>Desvio R$</th>
                <th style={{ textAlign: 'right' }}>Desvio %</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map(([label, rv, ov, sub]) => {
                const dev = rv - ov;
                const favoravel = isDesvioFavoravel(label, dev);
                const vp = dP(rv, ov);
                return (
                  <tr key={label} className={sub ? 'sub-row' : ''}>
                    <td>{label}</td>
                    <td className="cell-right">{fmt(rv, moeda)}</td>
                    <td className="cell-dim">{fP(rv, resRealizado.recLiq)}</td>
                    <td className="cell-right">{fmt(ov, moeda)}</td>
                    <td className="cell-dim">{fP(ov, resComparacao.recLiq)}</td>
                    <td className="cell-right">
                      <span className={`pill ${favoravel ? 'pill-positive' : 'pill-negative'}`}>{dev >= 0 ? '+' : ''}{fmt(dev, moeda)}</span>
                    </td>
                    <td className="cell-right">
                      <span style={{ fontSize: 10, fontWeight: 600, color: favoravel ? '#059669' : '#e11d48' }}>
                        {favoravel ? '▲' : '▼'}{Math.abs(vp).toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MarginChart title="Margem Bruta mensal (%)" data={chartMargData(margBrutaR, margBrutaC)} color={COLORS.emerald} comparisonLabel={comparisonLabel} />
        <MarginChart title="Margem EBITDA mensal (%)" data={chartMargData(margEbitdaR, margEbitdaC)} color={COLORS.amber} comparisonLabel={comparisonLabel} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MarginChart title="Margem Líquida mensal (%)" data={chartMargData(margLiqR, margLiqC)} color={COLORS.violet} comparisonLabel={comparisonLabel} />
        <div className="sec">
          <div className="sec-title">Receita Líquida — realizado vs. {comparisonLabel.toLowerCase()}</div>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={labels.map((month, i) => ({ month, Realizado: rlR[i], Comparacao: rlC[i] }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 9, fontFamily: 'DM Mono' }} tickFormatter={(v) => fmtK(v as number, moeda)} />
                <Tooltip formatter={(v: number) => fmt(v, moeda)} />
                <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
                <Bar dataKey="Realizado" fill={COLORS.indigo + '44'} stroke={COLORS.indigo} strokeWidth={2} radius={[6, 6, 0, 0]} />
                <Bar dataKey="Comparacao" name={comparisonLabel} fill={COLORS.rose + '22'} stroke={COLORS.rose} strokeWidth={2} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}

function MarginChart({
  title,
  data,
  color,
  comparisonLabel,
}: {
  title: string;
  data: Array<{ month: string; Realizado: number; Comparacao: number }>;
  color: string;
  comparisonLabel: string;
}) {
  return (
    <div className="sec">
      <div className="sec-title">{title}</div>
      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 9, fontFamily: 'DM Mono' }} tickFormatter={(v) => `${(v as number).toFixed(0)}%`} />
            <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
            <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
            <Line type="monotone" dataKey="Realizado" stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} />
            <Line type="monotone" dataKey="Comparacao" name={comparisonLabel} stroke={COLORS.slate} strokeDasharray="5 4" strokeWidth={1.5} dot={{ r: 2, fill: COLORS.slate }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
