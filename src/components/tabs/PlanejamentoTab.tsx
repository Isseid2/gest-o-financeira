import { useEffect, useMemo, useState } from 'react';
import { useFinancial } from '@/context/FinancialContext';
import { MoneyField, PctField, PlainField, SelectField } from '@/components/fields/FormFields';
import { MESES, M3, DREData, COLORS, emptyDRE } from '@/types/financial';
import { calcDRE, fmt, fmtK } from '@/utils/financial';
import { ImportPlanilha } from '@/components/financial/ImportPlanilha';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const DRE_FIELDS: { key: keyof DREData; label: string }[] = [
  { key: 'recBruta', label: 'Receita Bruta' },
  { key: 'deducoes', label: 'Deduções' },
  { key: 'cpv', label: 'CPV / CMV' },
  { key: 'despOp', label: 'Despesas Op.' },
  { key: 'depAmort', label: 'Depreciação' },
  { key: 'resFinanc', label: 'Res. Financeiro' },
  { key: 'ir', label: 'IR / CSLL' },
];

export function PlanejamentoTab() {
  const { cliente, yearData, anoSelecionado: ano, clienteAtivo, updateEmpresa, updatePremissas, updateCenarios, updateYearData } = useFinancial();
  const [planMesAtivo, setPlanMesAtivo] = useState(0);
  const [orcSalvo, setOrcSalvo] = useState('');
  const [importMsg, setImportMsg] = useState('');

  const moeda = cliente.empresa.moeda;

  // Meta anual computed from monthly budgets
  const metaAnual = useMemo(() => {
    const total: DREData = { ...emptyDRE };
    Object.values(yearData.orcMes).forEach(m => {
      (Object.keys(total) as (keyof DREData)[]).forEach(k => { total[k] += (m[k] || 0); });
    });
    return total;
  }, [yearData.orcMes]);

  const metaResult = useMemo(() => calcDRE(metaAnual), [metaAnual]);
  const hasOrcamento = Object.keys(yearData.orcMes).length > 0;

  // Cenários
  const calcScenario = (rc: number, cc: number, dc: number) => {
    return calcDRE({
      ...metaAnual,
      recBruta: metaAnual.recBruta * (1 + rc / 100),
      cpv: metaAnual.cpv * (1 + cc / 100),
      despOp: metaAnual.despOp * (1 + dc / 100),
    });
  };

  const cenPess = calcScenario(cliente.cenarios.pessimista.revenueVar, cliente.cenarios.pessimista.cogsVar, cliente.cenarios.pessimista.opexVar);
  const cenReal = calcScenario(cliente.cenarios.realista.revenueVar, cliente.cenarios.realista.cogsVar, cliente.cenarios.realista.opexVar);
  const cenOtim = calcScenario(cliente.cenarios.otimista.revenueVar, cliente.cenarios.otimista.cogsVar, cliente.cenarios.otimista.opexVar);

  const scenarioChartData = [
    { name: 'Rec. Líq.', Pessimista: cenPess.recLiq, Realista: cenReal.recLiq, Otimista: cenOtim.recLiq },
    { name: 'Lucro Bruto', Pessimista: cenPess.lucBruto, Realista: cenReal.lucBruto, Otimista: cenOtim.lucBruto },
    { name: 'EBITDA', Pessimista: cenPess.ebitda, Realista: cenReal.ebitda, Otimista: cenOtim.ebitda },
    { name: 'Lucro Líq.', Pessimista: cenPess.lucLiq, Realista: cenReal.lucLiq, Otimista: cenOtim.lucLiq },
  ];

  const orcMesData = yearData.orcMes[planMesAtivo] || { ...emptyDRE };

  useEffect(() => {
    setPlanMesAtivo(0);
    setOrcSalvo('');
    setImportMsg('');
  }, [clienteAtivo, ano]);

  const updateOrcMes = (key: keyof DREData, val: number) => {
    updateYearData(yd => ({
      ...yd,
      orcMes: { ...yd.orcMes, [planMesAtivo]: { ...(yd.orcMes[planMesAtivo] || { ...emptyDRE }), [key]: val } as DREData },
    }));
  };

  const salvarOrcMes = () => {
    setOrcSalvo(`✓ Orçamento de ${MESES[planMesAtivo]} salvo!`);
    setTimeout(() => setOrcSalvo(''), 5000);
  };

  const apagarOrcMes = () => {
    updateYearData(yd => {
      const newOrc = { ...yd.orcMes };
      delete newOrc[planMesAtivo];
      return { ...yd, orcMes: newOrc };
    });
    setOrcSalvo(`🗑 Orçamento de ${MESES[planMesAtivo]} apagado`);
    setTimeout(() => setOrcSalvo(''), 4000);
  };

  const updateCenario = (tipo: 'pessimista' | 'realista' | 'otimista', key: 'revenueVar' | 'cogsVar' | 'opexVar', val: number) => {
    updateCenarios({ ...cliente.cenarios, [tipo]: { ...cliente.cenarios[tipo], [key]: val } });
  };

  return (
    <div style={{ animation: 'fadeUp .25s ease' }}>
      {/* Identificação + Premissas side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="sec">
          <div className="sec-title">Identificação</div>
          <div className="space-y-2">
            <PlainField label="Nome da empresa" value={cliente.empresa.nome} placeholder="Ex: Empresa ABC Ltda"
              onChange={v => updateEmpresa({ nome: v })} />
            <PlainField label="Segmento" value={cliente.empresa.segmento} placeholder="Ex: Varejo, Serviços..."
              onChange={v => updateEmpresa({ segmento: v })} />
            <SelectField label="Moeda" value={cliente.empresa.moeda}
              options={[{ value: 'R$', label: 'R$ — Real Brasileiro' }, { value: '$', label: '$ — Dólar' }, { value: '€', label: '€ — Euro' }]}
              onChange={v => updateEmpresa({ moeda: v })} />
          </div>
        </div>
        <div className="sec">
          <div className="sec-title">Premissas e Taxas</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <PctField label="Crescimento receita" value={cliente.premissas.crescRec}
              onChange={v => updatePremissas({ crescRec: v })} />
            <PctField label="Inflação de custos" value={cliente.premissas.inflCusto}
              onChange={v => updatePremissas({ inflCusto: v })} />
            <PctField label="Margem bruta alvo" value={cliente.premissas.margBruta}
              onChange={v => updatePremissas({ margBruta: v })} />
            <PctField label="Margem EBITDA alvo" value={cliente.premissas.margEbitda}
              onChange={v => updatePremissas({ margEbitda: v })} />
            <PctField label="Margem líquida alvo" value={cliente.premissas.margLiq}
              onChange={v => updatePremissas({ margLiq: v })} />
            <PctField label="Deduções s/ receita" value={cliente.premissas.deducoes}
              onChange={v => updatePremissas({ deducoes: v })} />
          </div>
        </div>
      </div>

      {/* Orçamento Mensal */}
      <div className="sec">
        <div className="sec-title">Orçamento Mensal Detalhado — {ano}</div>

        <div className="mb-4">
          <ImportPlanilha
            target="orcMes"
            onDone={(r) => {
              setImportMsg(`✅ Orçamento importado: ${r.imported} mês(es) — ${r.months.join(', ')}`);
              setTimeout(() => setImportMsg(''), 8000);
            }}
          />
          {importMsg && <div className="text-[12px] mt-2" style={{ color: '#059669', fontWeight: 500 }}>{importMsg}</div>}
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {M3.map((m, i) => (
            <button key={i}
              onClick={() => setPlanMesAtivo(i)}
              className={`mth-btn ${planMesAtivo === i ? 'mth-btn-active' : ''} ${yearData.orcMes[i] ? (planMesAtivo === i ? 'mth-btn-active mth-btn-saved' : 'mth-btn-saved') : ''}`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4 mb-3">
          {DRE_FIELDS.map(f => (
            <MoneyField key={f.key} label={f.label} value={orcMesData[f.key] || 0} prefix={moeda}
              onChange={v => updateOrcMes(f.key, v)} />
          ))}
          <div>
            <label className="field-label">Mês selecionado</label>
            <input className="plain-input" value={MESES[planMesAtivo]} disabled style={{ opacity: 0.5 }} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-primary" onClick={salvarOrcMes}>Salvar orçamento do mês</button>
          {yearData.orcMes[planMesAtivo] && (
            <button className="btn" onClick={apagarOrcMes} style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', fontSize: 11 }}>
              🗑 Apagar orçamento deste mês
            </button>
          )}
          {orcSalvo && <span style={{ fontSize: 11, color: '#059669', fontWeight: 500 }}>{orcSalvo}</span>}
        </div>
      </div>

      {/* Meta Anual — computed from monthly budgets */}
      {hasOrcamento && (
        <div className="sec">
          <div className="sec-title">Meta Anual {ano} — Consolidado do Orçamento</div>
          <div className="text-[11px] mb-3" style={{ color: 'hsl(var(--text-muted))' }}>
            Valores consolidados automaticamente a partir do orçamento mensal detalhado ({Object.keys(yearData.orcMes).length} meses lançados).
          </div>
          <div className="grid gap-[10px] mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            {[
              { label: 'Receita Bruta', val: metaAnual.recBruta, color: COLORS.indigo },
              { label: 'Receita Líquida', val: metaResult.recLiq, color: COLORS.indigo },
              { label: 'Lucro Bruto', val: metaResult.lucBruto, color: COLORS.emerald },
              { label: 'EBITDA', val: metaResult.ebitda, color: COLORS.amber },
              { label: 'Lucro Líquido', val: metaResult.lucLiq, color: COLORS.violet },
            ].map(item => (
              <div key={item.label} className="kpi-card" style={{ '--kpi-accent': item.color } as React.CSSProperties}>
                <div className="kpi-label">{item.label}</div>
                <div className="kpi-value" style={{ fontSize: 14 }}>{fmt(item.val, moeda)}</div>
                {item.label !== 'Receita Bruta' && metaResult.recLiq > 0 && (
                  <div className="kpi-sub" style={{ color: item.color, fontWeight: 600 }}>
                    {(item.val / metaResult.recLiq * 100).toFixed(1)}% s/ Rec. Líq.
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="dre-table">
              <thead>
                <tr>
                  <th>Linha DRE</th>
                  <th style={{ textAlign: 'right' }}>Valor Anual</th>
                  <th style={{ textAlign: 'right' }}>% Rec. Líquida</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Receita Bruta', metaAnual.recBruta, false],
                  ['(−) Deduções', metaAnual.deducoes, false],
                  ['= Receita Líquida', metaResult.recLiq, true],
                  ['(−) CPV / CMV', metaAnual.cpv, false],
                  ['= Lucro Bruto', metaResult.lucBruto, true],
                  ['(−) Despesas Op.', metaAnual.despOp, false],
                  ['= EBITDA', metaResult.ebitda, true],
                  ['(−) Deprec./Amort.', metaAnual.depAmort, false],
                  ['(+/−) Res. Financ.', metaAnual.resFinanc, false],
                  ['(−) IR / CSLL', metaAnual.ir, false],
                  ['= Lucro Líquido', metaResult.lucLiq, true],
                ].map(([label, val, sub]) => (
                  <tr key={label as string} className={(sub as boolean) ? 'sub-row' : ''}>
                    <td>{label as string}</td>
                    <td className="cell-right">{fmt(val as number, moeda)}</td>
                    <td className="cell-dim">{metaResult.recLiq ? ((val as number) / metaResult.recLiq * 100).toFixed(1) + '%' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cenários */}
      <div className="sec">
        <div className="sec-title">🎯 Cenários Anuais — {ano}</div>
        <div className="text-[11px] mb-4" style={{ color: 'hsl(var(--text-muted))' }}>
          Simule variações sobre o orçamento para projetar resultados em diferentes cenários econômicos.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Pessimista */}
          <div className="scenario-card scenario-pessimista">
            <div className="scenario-header" style={{ color: COLORS.rose }}>
              <span className="scenario-icon">📉</span>
              <span>Pessimista</span>
            </div>
            <div className="scenario-fields">
              <PctField label="Receita (var. %)" value={cliente.cenarios.pessimista.revenueVar} onChange={v => updateCenario('pessimista', 'revenueVar', v)} />
              <PctField label="CPV (var. %)" value={cliente.cenarios.pessimista.cogsVar} onChange={v => updateCenario('pessimista', 'cogsVar', v)} />
              <PctField label="Desp. Op. (var. %)" value={cliente.cenarios.pessimista.opexVar} onChange={v => updateCenario('pessimista', 'opexVar', v)} />
            </div>
            <div className="scenario-results">
              <div className="scenario-result-item">
                <span>Receita Líq.</span>
                <strong>{fmt(cenPess.recLiq, moeda)}</strong>
              </div>
              <div className="scenario-result-item">
                <span>EBITDA</span>
                <strong>{fmt(cenPess.ebitda, moeda)}</strong>
              </div>
              <div className="scenario-result-item scenario-result-highlight" style={{ color: cenPess.lucLiq >= 0 ? COLORS.emerald : COLORS.rose }}>
                <span>Lucro Líquido</span>
                <strong>{fmt(cenPess.lucLiq, moeda)}</strong>
              </div>
            </div>
          </div>
          {/* Realista */}
          <div className="scenario-card scenario-realista">
            <div className="scenario-header" style={{ color: COLORS.amber }}>
              <span className="scenario-icon">📊</span>
              <span>Realista</span>
            </div>
            <div className="scenario-fields">
              <PctField label="Receita (var. %)" value={cliente.cenarios.realista.revenueVar} onChange={v => updateCenario('realista', 'revenueVar', v)} />
              <PctField label="CPV (var. %)" value={cliente.cenarios.realista.cogsVar} onChange={v => updateCenario('realista', 'cogsVar', v)} />
              <PctField label="Desp. Op. (var. %)" value={cliente.cenarios.realista.opexVar} onChange={v => updateCenario('realista', 'opexVar', v)} />
            </div>
            <div className="scenario-results">
              <div className="scenario-result-item">
                <span>Receita Líq.</span>
                <strong>{fmt(cenReal.recLiq, moeda)}</strong>
              </div>
              <div className="scenario-result-item">
                <span>EBITDA</span>
                <strong>{fmt(cenReal.ebitda, moeda)}</strong>
              </div>
              <div className="scenario-result-item scenario-result-highlight" style={{ color: cenReal.lucLiq >= 0 ? COLORS.emerald : COLORS.rose }}>
                <span>Lucro Líquido</span>
                <strong>{fmt(cenReal.lucLiq, moeda)}</strong>
              </div>
            </div>
          </div>
          {/* Otimista */}
          <div className="scenario-card scenario-otimista">
            <div className="scenario-header" style={{ color: COLORS.emerald }}>
              <span className="scenario-icon">📈</span>
              <span>Otimista</span>
            </div>
            <div className="scenario-fields">
              <PctField label="Receita (var. %)" value={cliente.cenarios.otimista.revenueVar} onChange={v => updateCenario('otimista', 'revenueVar', v)} />
              <PctField label="CPV (var. %)" value={cliente.cenarios.otimista.cogsVar} onChange={v => updateCenario('otimista', 'cogsVar', v)} />
              <PctField label="Desp. Op. (var. %)" value={cliente.cenarios.otimista.opexVar} onChange={v => updateCenario('otimista', 'opexVar', v)} />
            </div>
            <div className="scenario-results">
              <div className="scenario-result-item">
                <span>Receita Líq.</span>
                <strong>{fmt(cenOtim.recLiq, moeda)}</strong>
              </div>
              <div className="scenario-result-item">
                <span>EBITDA</span>
                <strong>{fmt(cenOtim.ebitda, moeda)}</strong>
              </div>
              <div className="scenario-result-item scenario-result-highlight" style={{ color: cenOtim.lucLiq >= 0 ? COLORS.emerald : COLORS.rose }}>
                <span>Lucro Líquido</span>
                <strong>{fmt(cenOtim.lucLiq, moeda)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Cenários chart */}
        {hasOrcamento && (
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scenarioChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: 'DM Sans' }} />
                <YAxis tick={{ fontSize: 9, fontFamily: 'DM Mono' }} tickFormatter={v => fmtK(v as number, moeda)} />
                <Tooltip formatter={(v: number) => fmt(v, moeda)} />
                <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'DM Sans' }} iconSize={8} />
                <Bar dataKey="Pessimista" fill={COLORS.rose + '33'} stroke={COLORS.rose} strokeWidth={2} radius={[6, 6, 0, 0]} />
                <Bar dataKey="Realista" fill={COLORS.amber + '33'} stroke={COLORS.amber} strokeWidth={2} radius={[6, 6, 0, 0]} />
                <Bar dataKey="Otimista" fill={COLORS.emerald + '33'} stroke={COLORS.emerald} strokeWidth={2} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
