import { useMemo } from 'react';
import { useFinancial } from '@/context/FinancialContext';
import { MESES, M3, COLORS, DREData } from '@/types/financial';
import { calcDRE, fmt, fmtK, fP, toObj } from '@/utils/financial';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';

export function EvolucaoTab() {
  const { yearData, anoSelecionado: ano, cliente } = useFinancial();
  const moeda = cliente.empresa.moeda;

  const msReal = Object.keys(yearData.realMes).map(Number).sort((a, b) => a - b);
  const msOrc = Object.keys(yearData.orcMes).map(Number).sort((a, b) => a - b);
  const allMs = Array.from(new Set([...msReal, ...msOrc])).sort((a, b) => a - b);

  const labels = allMs.map(m => M3[m]);

  const monthData = useMemo(() => allMs.map(m => {
    const hasReal = yearData.realMes[m] != null;
    const hasOrc = yearData.orcMes[m] != null;
    const real = hasReal ? calcDRE(toObj(yearData.realMes[m])) : null;
    const orc = hasOrc ? calcDRE(toObj(yearData.orcMes[m])) : null;
    const realRaw = hasReal ? toObj(yearData.realMes[m]) : null;
    const orcRaw = hasOrc ? toObj(yearData.orcMes[m]) : null;
    return { m, real, orc, realRaw, orcRaw, hasReal, hasOrc };
  }), [yearData.realMes, yearData.orcMes, allMs.join(',')]);

  const ytd = useMemo(() => {
    let r = { recLiq: 0, lucBruto: 0, ebitda: 0, lucLiq: 0 };
    monthData.forEach(d => {
      if (d.real) {
        r.recLiq += d.real.recLiq;
        r.lucBruto += d.real.lucBruto;
        r.ebitda += d.real.ebitda;
        r.lucLiq += d.real.lucLiq;
      }
    });
    return r;
  }, [monthData]);

  // Meta anual from orcMes totals
  const meta = useMemo(() => {
    const total: DREData = { recBruta: 0, deducoes: 0, cpv: 0, despOp: 0, depAmort: 0, resFinanc: 0, ir: 0 };
    Object.values(yearData.orcMes).forEach(m => {
      (Object.keys(total) as (keyof DREData)[]).forEach(k => { total[k] += (m[k] || 0); });
    });
    return calcDRE(total);
  }, [yearData.orcMes]);

  const cpvData = useMemo(() => monthData.map((d, i) => ({
    month: labels[i],
    CPV: d.realRaw?.cpv || 0,
    'Margem Contribuição': d.real ? d.real.lucBruto : 0,
    'MC %': d.real && d.real.recLiq ? parseFloat((d.real.lucBruto / d.real.recLiq * 100).toFixed(1)) : 0,
    'CPV Orç': d.orcRaw?.cpv || 0,
  })), [monthData]);

  if (!allMs.length) {
    return (
      <div className="sec" style={{ textAlign: 'center', padding: 40 }}>
        <p style={{ color: 'hsl(var(--text-muted))', fontSize: 12 }}>Nenhum mês lançado ainda. Lance dados na aba "Lançamento Mensal".</p>
      </div>
    );
  }

  const ytdColors = [COLORS.indigo, COLORS.emerald, COLORS.amber, COLORS.violet];
  const ytdItems = [
    { lbl: 'Rec. Líq. YTD', val: ytd.recLiq, mt: meta.recLiq, c: 0 },
    { lbl: 'Lucro Bruto YTD', val: ytd.lucBruto, mt: meta.lucBruto, c: 1 },
    { lbl: 'EBITDA YTD', val: ytd.ebitda, mt: meta.ebitda, c: 2 },
    { lbl: 'Lucro Líq. YTD', val: ytd.lucLiq, mt: meta.lucLiq, c: 3 },
  ];

  const progressItems = [
    { label: 'Receita Líquida', val: ytd.recLiq, mt: meta.recLiq, c: COLORS.indigo },
    { label: 'EBITDA', val: ytd.ebitda, mt: meta.ebitda, c: COLORS.amber },
    { label: 'Lucro Líquido', val: ytd.lucLiq, mt: meta.lucLiq, c: COLORS.violet },
  ];

  const recLiqChart = monthData.map((d, i) => ({
    month: labels[i],
    Realizado: d.real?.recLiq ?? null,
    Orçado: d.orc?.recLiq ?? null,
  }));

  const ebitdaChart = monthData.map((d, i) => ({
    month: labels[i],
    EBITDA: d.real?.ebitda ?? null,
  }));

  const lucLiqChart = monthData.map((d, i) => ({
    month: labels[i],
    'Lucro Líq.': d.real?.lucLiq ?? null,
  }));

  return (
    <div style={{ animation: 'fadeUp .25s ease' }}>
      <div className="text-[11px] font-semibold mb-4" style={{ color: 'hsl(var(--text-muted))' }}>Ano: {ano}</div>

      <div className="grid gap-[10px] mb-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
        {ytdItems.map(({ lbl, val, mt, c }) => (
          <div key={lbl} className="kpi-card" style={{ '--kpi-accent': ytdColors[c] } as React.CSSProperties}>
            <div className="kpi-label">{lbl}</div>
            <div className="kpi-value" style={{ fontSize: 15 }}>{fmt(val, moeda)}</div>
            {mt ? <div className="kpi-sub">{fP(val, mt)} da meta</div> : null}
            {c > 0 && <div className="kpi-sub" style={{ color: ytdColors[c], fontWeight: 600 }}>{fP(val, ytd.recLiq)} margem</div>}
          </div>
        ))}
      </div>

      <div className="sec">
        <div className="sec-title">Receita Líquida — Realizado vs. Orçado — {ano}</div>
        <div className="chart-legend">
          <span><span className="legend-dot" style={{ background: COLORS.indigo }} />Realizado</span>
          <span><span className="legend-dot" style={{ background: COLORS.rose, border: `1px dashed ${COLORS.rose}` }} />Orçado</span>
        </div>
        <div style={{ height: 170 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={recLiqChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 9, fontFamily: 'DM Mono' }} tickFormatter={v => fmtK(v as number, moeda)} />
              <Tooltip formatter={(v: number) => fmt(v, moeda)} />
              <Line type="monotone" dataKey="Realizado" stroke={COLORS.indigo} strokeWidth={2} dot={{ r: 4, fill: COLORS.indigo, strokeWidth: 2, stroke: '#fff' }} connectNulls={false} />
              <Line type="monotone" dataKey="Orçado" stroke={COLORS.rose} strokeDasharray="5 4" strokeWidth={1.5} dot={{ r: 3, fill: COLORS.rose }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="sec">
          <div className="sec-title">EBITDA Mensal — {ano}</div>
          <div style={{ height: 150 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ebitdaChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 9, fontFamily: 'DM Mono' }} tickFormatter={v => fmtK(v as number, moeda)} />
                <Tooltip formatter={(v: number) => fmt(v, moeda)} />
                <Line type="monotone" dataKey="EBITDA" stroke={COLORS.amber} strokeWidth={2} dot={{ r: 4, fill: COLORS.amber, strokeWidth: 2, stroke: '#fff' }} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="sec">
          <div className="sec-title">Lucro Líquido Mensal — {ano}</div>
          <div style={{ height: 150 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lucLiqChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 9, fontFamily: 'DM Mono' }} tickFormatter={v => fmtK(v as number, moeda)} />
                <Tooltip formatter={(v: number) => fmt(v, moeda)} />
                <Line type="monotone" dataKey="Lucro Líq." stroke={COLORS.violet} strokeWidth={2} dot={{ r: 4, fill: COLORS.violet, strokeWidth: 2, stroke: '#fff' }} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="sec">
          <div className="sec-title">CPV — Realizado vs. Orçado — {ano}</div>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cpvData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 9, fontFamily: 'DM Mono' }} tickFormatter={v => fmtK(v as number, moeda)} />
                <Tooltip formatter={(v: number) => fmt(v, moeda)} />
                <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
                <Bar dataKey="CPV" fill={COLORS.rose + '44'} stroke={COLORS.rose} strokeWidth={2} radius={[6, 6, 0, 0]} />
                <Bar dataKey="CPV Orç" fill={COLORS.slate + '22'} stroke={COLORS.slate} strokeWidth={1} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="sec">
          <div className="sec-title">Margem de Contribuição (Lucro Bruto) — {ano}</div>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cpvData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="val" tick={{ fontSize: 9, fontFamily: 'DM Mono' }} tickFormatter={v => fmtK(v as number, moeda)} />
                <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 9, fontFamily: 'DM Mono' }} tickFormatter={v => `${(v as number).toFixed(0)}%`} />
                <Tooltip formatter={(v: number, name: string) => name === 'MC %' ? `${v.toFixed(1)}%` : fmt(v, moeda)} />
                <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
                <Bar yAxisId="val" dataKey="Margem Contribuição" fill={COLORS.emerald + '33'} stroke={COLORS.emerald} strokeWidth={2} radius={[6, 6, 0, 0]} />
                <Line yAxisId="pct" type="monotone" dataKey="MC %" stroke={COLORS.amber} strokeWidth={2} dot={{ r: 3, fill: COLORS.amber }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="sec">
        <div className="sec-title">Progresso YTD vs. Meta Anual — {ano}</div>
        {progressItems.map(p => {
          const prog = p.mt > 0 ? Math.min(100, p.val / p.mt * 100) : 0;
          const col = prog >= 100 ? COLORS.emerald : prog >= 70 ? COLORS.amber : COLORS.rose;
          return (
            <div key={p.label} style={{ marginBottom: 16 }}>
              <div className="flex justify-between items-baseline mb-1.5">
                <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--text-primary))' }}>{p.label}</span>
                <span style={{ fontSize: 11, color: 'hsl(var(--text-muted))' }}>
                  {fmt(p.val, moeda)} <span style={{ color: 'hsl(var(--text-muted))' }}>/</span> {p.mt ? fmt(p.mt, moeda) : 'meta n/d'} &nbsp;
                  <strong style={{ color: col, fontFamily: 'DM Mono' }}>{prog.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</strong>
                </span>
              </div>
              <div className="prog-bar">
                <div className="prog-fill" style={{ width: `${prog}%`, background: col }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
