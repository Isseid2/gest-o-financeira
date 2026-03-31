import { useState, useMemo } from 'react';
import { useFinancial } from '@/context/FinancialContext';
import { MESES, M3, INDIC_COLORS, INDIC_LABELS, COLORS, DREData } from '@/types/financial';
import { calcDRE, fmt, fmtK, fP, dP, toObj } from '@/utils/financial';
import { isDesvioFavoravel } from '@/utils/dreAnalysis';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';

export function ComparativoTab() {
  const { cliente, yearData, anoSelecionado: ano, allAnos, allAnosKeys } = useFinancial();
  const [subTab, setSubTab] = useState<'mensal' | 'anual'>('mensal');
  const moeda = cliente.empresa.moeda;

  return (
    <div style={{ animation: 'fadeUp .25s ease' }}>
      <div className="flex items-center gap-3 mb-5">
        <span className="text-[11px] font-semibold" style={{ color: 'hsl(var(--text-muted))' }}>Ano: {ano}</span>
        <div className="flex gap-1.5">
          <button className={`subtab-pill ${subTab === 'mensal' ? 'subtab-pill-active' : ''}`} onClick={() => setSubTab('mensal')}>Comparação Mensal</button>
          <button className={`subtab-pill ${subTab === 'anual' ? 'subtab-pill-active' : ''}`} onClick={() => setSubTab('anual')}>Consolidado Anual</button>
        </div>
      </div>
      {subTab === 'mensal' ? <CompMensal moeda={moeda} allAnos={allAnos} allAnosKeys={allAnosKeys} /> : <CompAnual moeda={moeda} ano={ano} yearData={yearData} />}
    </div>
  );
}

interface MonthYearOption {
  ano: string;
  mes: number;
  label: string;
}

function CompMensal({ moeda, allAnos, allAnosKeys }: { moeda: string; allAnos: Record<string, { orcMes: Record<number, DREData>; realMes: Record<number, DREData> }>; allAnosKeys: string[] }) {
  // Build list of all available month/year combos
  const options = useMemo<MonthYearOption[]>(() => {
    const opts: MonthYearOption[] = [];
    allAnosKeys.forEach(ano => {
      const yd = allAnos[ano];
      const months = new Set([
        ...Object.keys(yd.realMes || {}).map(Number),
        ...Object.keys(yd.orcMes || {}).map(Number),
      ]);
      Array.from(months).sort((a, b) => a - b).forEach(m => {
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
  const rA = dataA.result, rB = dataB.result;
  const dA = dataA.raw, dB = dataB.raw;

  const keys: (keyof typeof rA)[] = ['recLiq', 'lucBruto', 'ebitda', 'lucLiq'];

  const linhas: [string, number, number, boolean?][] = [
    ['Receita Bruta', dA?.recBruta || 0, dB?.recBruta || 0],
    ['(−) Deduções', dA?.deducoes || 0, dB?.deducoes || 0],
    ['= Rec. Líquida', rA.recLiq, rB.recLiq, true],
    ['(−) CPV', dA?.cpv || 0, dB?.cpv || 0],
    ['= Lucro Bruto', rA.lucBruto, rB.lucBruto, true],
    ['(−) Desp. Op.', dA?.despOp || 0, dB?.despOp || 0],
    ['= EBITDA', rA.ebitda, rB.ebitda, true],
    ['(−) Deprec.', dA?.depAmort || 0, dB?.depAmort || 0],
    ['(+/−) Res. Fin.', dA?.resFinanc || 0, dB?.resFinanc || 0],
    ['(−) IR/CSLL', dA?.ir || 0, dB?.ir || 0],
    ['= Lucro Líquido', rA.lucLiq, rB.lucLiq, true],
  ];

  const labelA = optA?.label || '—';
  const labelB = optB?.label || '—';

  if (options.length === 0) {
    return <div className="sec"><p className="text-[11px]" style={{ color: 'hsl(var(--text-muted))', padding: 16 }}>Nenhum mês lançado ainda em nenhum ano.</p></div>;
  }

  return (
    <>
      <div className="sec">
        <div className="sec-title">Selecione os períodos para comparação</div>
        <div className="flex gap-3 items-end flex-wrap mb-4">
          <div>
            <label className="field-label">Período A</label>
            <select className="field-select" style={{ width: 'auto', padding: '7px 12px' }} value={selA} onChange={e => setSelA(Number(e.target.value))}>
              {options.map((o, i) => <option key={i} value={i}>{o.label}</option>)}
            </select>
          </div>
          <div className="pb-1.5 text-muted-foreground">↔</div>
          <div>
            <label className="field-label">Período B</label>
            <select className="field-select" style={{ width: 'auto', padding: '7px 12px' }} value={selB} onChange={e => setSelB(Number(e.target.value))}>
              {options.map((o, i) => <option key={i} value={i}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid gap-[10px] mb-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
          {INDIC_LABELS.map((lbl, i) => {
            const k = keys[i];
            const va = rA[k], vb = rB[k];
            const v = dP(vb, va), ok = vb >= va;
            const pA = i > 0 ? fP(rA[k], rA.recLiq) : '';
            const pB = i > 0 ? fP(rB[k], rB.recLiq) : '';
            return (
              <div key={lbl} className="indic" style={{ '--indic-color': INDIC_COLORS[i] } as React.CSSProperties}>
                <div className="indic-label">{lbl}</div>
                <div className="text-[10px] mb-1" style={{ color: 'hsl(var(--text-muted))' }}>
                  {labelA}: <strong style={{ color: 'hsl(var(--text-secondary))' }}>{fmt(va, moeda)}</strong>{pA ? ` (${pA})` : ''}
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="indic-val" style={{ fontSize: 13 }}>{fmt(vb, moeda)}</span>
                  {pB && <span className="indic-pct" style={{ color: INDIC_COLORS[i] }}>{pB}</span>}
                </div>
                <div className="text-[10px] mt-1.5" style={{ color: 'hsl(var(--text-muted))' }}>
                  <strong style={{ color: ok ? '#059669' : '#e11d48' }}>{ok ? '▲' : '▼'} {Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%</strong> vs {labelA}
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
                    <td className="cell-right"><span className={`pill ${favoravel ? 'pill-positive' : 'pill-negative'}`}>{dev >= 0 ? '+' : ''}{fmt(dev, moeda)}</span></td>
                    <td className="cell-right">
                      <span style={{ fontSize: 10, fontWeight: 600, color: favoravel ? '#059669' : '#e11d48' }}>{favoravel ? '▲' : '▼'}{Math.abs(vp).toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function CompAnual({ moeda, ano, yearData }: { moeda: string; ano: string; yearData: { orcMes: Record<number, DREData>; realMes: Record<number, DREData> } }) {
  const ms = Object.keys(yearData.realMes).map(Number).sort((a, b) => a - b);

  if (!ms.length) {
    return <div className="sec"><p className="text-[11px]" style={{ color: 'hsl(var(--text-muted))', padding: 16 }}>Nenhum mês lançado ainda.</p></div>;
  }

  let tR: DREData = { recBruta: 0, deducoes: 0, cpv: 0, despOp: 0, depAmort: 0, resFinanc: 0, ir: 0 };
  let tO: DREData = { recBruta: 0, deducoes: 0, cpv: 0, despOp: 0, depAmort: 0, resFinanc: 0, ir: 0 };
  ms.forEach(m => {
    const r = toObj(yearData.realMes[m]), o = toObj(yearData.orcMes[m]);
    (Object.keys(tR) as (keyof DREData)[]).forEach(k => { tR[k] += r[k]; tO[k] += o[k]; });
  });
  const resR = calcDRE(tR), resO = calcDRE(tO);

  const linhas: [string, number, number, boolean?][] = [
    ['Receita Bruta', tR.recBruta, tO.recBruta],
    ['(−) Deduções', tR.deducoes, tO.deducoes],
    ['= Receita Líquida', resR.recLiq, resO.recLiq, true],
    ['(−) CPV / CMV', tR.cpv, tO.cpv],
    ['= Lucro Bruto', resR.lucBruto, resO.lucBruto, true],
    ['(−) Desp. Op.', tR.despOp, tO.despOp],
    ['= EBITDA', resR.ebitda, resO.ebitda, true],
    ['(−) Deprec./Amort.', tR.depAmort, tO.depAmort],
    ['(+/−) Res. Financ.', tR.resFinanc, tO.resFinanc],
    ['(−) IR / CSLL', tR.ir, tO.ir],
    ['= Lucro Líquido', resR.lucLiq, resO.lucLiq, true],
  ];

  const labels = ms.map(m => M3[m]);
  const margBrutaR = ms.map(m => { const r = calcDRE(toObj(yearData.realMes[m])); return r.recLiq ? r.lucBruto / r.recLiq * 100 : 0; });
  const margBrutaO = ms.map(m => { const o = calcDRE(toObj(yearData.orcMes[m])); return o.recLiq ? o.lucBruto / o.recLiq * 100 : 0; });
  const margEbitdaR = ms.map(m => { const r = calcDRE(toObj(yearData.realMes[m])); return r.recLiq ? r.ebitda / r.recLiq * 100 : 0; });
  const margEbitdaO = ms.map(m => { const o = calcDRE(toObj(yearData.orcMes[m])); return o.recLiq ? o.ebitda / o.recLiq * 100 : 0; });
  const margLiqR = ms.map(m => { const r = calcDRE(toObj(yearData.realMes[m])); return r.recLiq ? r.lucLiq / r.recLiq * 100 : 0; });
  const margLiqO = ms.map(m => { const o = calcDRE(toObj(yearData.orcMes[m])); return o.recLiq ? o.lucLiq / o.recLiq * 100 : 0; });
  const rlR = ms.map(m => calcDRE(toObj(yearData.realMes[m])).recLiq);
  const rlO = ms.map(m => calcDRE(toObj(yearData.orcMes[m])).recLiq);

  const chartMargData = (real: number[], orc: number[]) => labels.map((l, i) => ({ month: l, Realizado: parseFloat(real[i].toFixed(1)), Orçado: parseFloat(orc[i].toFixed(1)) }));

  const keys: (keyof typeof resR)[] = ['recLiq', 'lucBruto', 'ebitda', 'lucLiq'];

  return (
    <>
      <div className="sec">
        <div className="sec-title">Consolidado Anual — {ano}</div>
        <div className="grid gap-[10px] mb-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
          {INDIC_LABELS.map((lbl, i) => {
            const k = keys[i];
            const val = resR[k], orcVal = resO[k];
            const v = dP(val, orcVal), ok = val >= orcVal;
            const pReal = i > 0 ? fP(val, resR.recLiq) : '';
            const pOrc = i > 0 ? fP(orcVal, resO.recLiq) : '';
            return (
              <div key={lbl} className="indic" style={{ '--indic-color': INDIC_COLORS[i] } as React.CSSProperties}>
                <div className="indic-label">{lbl}</div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="indic-val">{fmt(val, moeda)}</span>
                  {pReal && <span className="indic-pct" style={{ color: INDIC_COLORS[i] }}>{pReal}</span>}
                </div>
                {orcVal ? (
                  <div className="text-[10px] mt-1.5" style={{ color: 'hsl(var(--text-muted))' }}>
                    Orç: {fmt(orcVal, moeda)}{pOrc ? ` (${pOrc})` : ''} &nbsp;
                    <strong style={{ color: ok ? '#059669' : '#e11d48' }}>{ok ? '▲' : '▼'} {Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%</strong>
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
                <th style={{ textAlign: 'right' }}>Orçado</th>
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
                    <td className="cell-dim">{fP(rv, resR.recLiq)}</td>
                    <td className="cell-right">{fmt(ov, moeda)}</td>
                    <td className="cell-dim">{fP(ov, resO.recLiq)}</td>
                    <td className="cell-right"><span className={`pill ${favoravel ? 'pill-positive' : 'pill-negative'}`}>{dev >= 0 ? '+' : ''}{fmt(dev, moeda)}</span></td>
                    <td className="cell-right"><span style={{ fontSize: 10, fontWeight: 600, color: favoravel ? '#059669' : '#e11d48' }}>{favoravel ? '▲' : '▼'}{Math.abs(vp).toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MarginChart title="Margem Bruta mensal (%)" data={chartMargData(margBrutaR, margBrutaO)} color={COLORS.emerald} />
        <MarginChart title="Margem EBITDA mensal (%)" data={chartMargData(margEbitdaR, margEbitdaO)} color={COLORS.amber} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MarginChart title="Margem Líquida mensal (%)" data={chartMargData(margLiqR, margLiqO)} color={COLORS.violet} />
        <div className="sec">
          <div className="sec-title">Receita Líquida — realizado vs. orçado</div>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={labels.map((l, i) => ({ month: l, Realizado: rlR[i], Orçado: rlO[i] }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 9, fontFamily: 'DM Mono' }} tickFormatter={v => fmtK(v as number, moeda)} />
                <Tooltip formatter={(v: number) => fmt(v, moeda)} />
                <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
                <Bar dataKey="Realizado" fill={COLORS.indigo + '44'} stroke={COLORS.indigo} strokeWidth={2} radius={[6, 6, 0, 0]} />
                <Bar dataKey="Orçado" fill={COLORS.rose + '22'} stroke={COLORS.rose} strokeWidth={2} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}

function MarginChart({ title, data, color }: { title: string; data: any[]; color: string }) {
  return (
    <div className="sec">
      <div className="sec-title">{title}</div>
      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 9, fontFamily: 'DM Mono' }} tickFormatter={v => `${(v as number).toFixed(0)}%`} />
            <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
            <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
            <Line type="monotone" dataKey="Realizado" stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} />
            <Line type="monotone" dataKey="Orçado" stroke={COLORS.slate} strokeDasharray="5 4" strokeWidth={1.5} dot={{ r: 2, fill: COLORS.slate }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
