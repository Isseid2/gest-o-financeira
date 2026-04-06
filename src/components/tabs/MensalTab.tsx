import { useState, useEffect } from 'react';
import { useFinancial } from '@/context/FinancialContext';
import { MoneyField } from '@/components/fields/FormFields';
import { MESES, DREData, INDIC_COLORS, INDIC_LABELS, COLORS } from '@/types/financial';
import { calcDRE, fmt, fP, dP, toObj } from '@/utils/financial';
import { ImportPlanilha } from '@/components/financial/ImportPlanilha';
import { isDesvioFavoravel } from '@/utils/dreAnalysis';

export function MensalTab() {
  const { yearData, anoSelecionado: ano, cliente, clienteAtivo, updateYearData } = useFinancial();
  const [mesSel, setMesSel] = useState(0);
  const [localData, setLocalData] = useState<DREData>(toObj(yearData.realMes[mesSel]));
  const [status, setStatus] = useState('');
  const [importMsg, setImportMsg] = useState('');

  const realMesSel = yearData.realMes[mesSel];
  useEffect(() => {
    setLocalData(toObj(realMesSel));
    setStatus(realMesSel ? `✓ ${MESES[mesSel]} carregado` : '');
  }, [mesSel, realMesSel]);

  useEffect(() => {
    setMesSel(0);
    setLocalData(toObj(yearData.realMes[0]));
    setStatus('');
    setImportMsg('');
  }, [clienteAtivo, ano]);

  const moeda = cliente.empresa.moeda;
  const res = calcDRE(localData);
  const orc = toObj(yearData.orcMes[mesSel]);
  const ores = calcDRE(orc);

  const updateField = (key: keyof DREData, val: number) => {
    setLocalData(d => ({ ...d, [key]: val }));
  };

  const salvar = () => {
    updateYearData(yd => ({ ...yd, realMes: { ...yd.realMes, [mesSel]: { ...localData } } }));
    setStatus(`✓ ${MESES[mesSel]} salvo com sucesso`);
  };

  const desfazerImportacao = () => {
    updateYearData(yd => {
      const newReal = { ...yd.realMes };
      delete newReal[mesSel];
      return { ...yd, realMes: newReal };
    });
    setLocalData(toObj(undefined));
    setStatus(`🗑 Lançamento de ${MESES[mesSel]} removido`);
  };

  const desfazerTodaImportacao = () => {
    updateYearData(yd => ({ ...yd, realMes: {} }));
    setLocalData(toObj(undefined));
    setStatus('🗑 Todos os lançamentos foram removidos');
  };

  // Alerts
  const alerts: string[] = [];
  if (ores.recLiq > 0 && res.recLiq < ores.recLiq * 0.95) alerts.push(`Receita ${Math.abs(dP(res.recLiq, ores.recLiq)).toFixed(1)}% abaixo do orçado`);
  if (ores.ebitda > 0 && res.ebitda < ores.ebitda * 0.90) alerts.push(`EBITDA ${Math.abs(dP(res.ebitda, ores.ebitda)).toFixed(1)}% abaixo`);
  if (res.lucLiq < 0) alerts.push('Lucro Líquido negativo neste mês');

  const linhas: [string, number, number, boolean, number, number][] = [
    ['Receita Bruta', localData.recBruta, orc.recBruta, false, localData.recBruta, orc.recBruta],
    ['(−) Deduções', localData.deducoes, orc.deducoes, false, localData.recBruta, orc.recBruta],
    ['= Receita Líquida', res.recLiq, ores.recLiq, true, localData.recBruta, orc.recBruta],
    ['(−) CPV / CMV', localData.cpv, orc.cpv, false, res.recLiq, ores.recLiq],
    ['= Lucro Bruto', res.lucBruto, ores.lucBruto, true, res.recLiq, ores.recLiq],
    ['(−) Despesas Op.', localData.despOp, orc.despOp, false, res.recLiq, ores.recLiq],
    ['= EBITDA', res.ebitda, ores.ebitda, true, res.recLiq, ores.recLiq],
    ['(−) Deprec./Amort.', localData.depAmort, orc.depAmort, false, res.recLiq, ores.recLiq],
    ['(+/−) Res. Financ.', localData.resFinanc, orc.resFinanc, false, res.recLiq, ores.recLiq],
    ['(−) IR / CSLL', localData.ir, orc.ir, false, res.recLiq, ores.recLiq],
    ['= Lucro Líquido', res.lucLiq, ores.lucLiq, true, res.recLiq, ores.recLiq],
  ];

  return (
    <div style={{ animation: 'fadeUp .25s ease' }}>
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span className="text-[11px] font-semibold" style={{ color: 'hsl(var(--text-muted))' }}>Ano: {ano}</span>
        <select className="ano-sel" value={mesSel} onChange={e => setMesSel(Number(e.target.value))}>
          {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <button className="btn btn-primary" onClick={salvar}>💾 Salvar mês</button>
        {yearData.realMes[mesSel] && (
          <button className="btn" onClick={desfazerImportacao} style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', fontSize: 11 }}>
            🗑 Apagar este mês
          </button>
        )}
        {status && <span style={{ fontSize: 11, color: '#059669', fontWeight: 500 }}>{status}</span>}
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <ImportPlanilha target="realMes" onDone={(r) => {
            setImportMsg(`✅ ${r.imported} mês(es) importado(s): ${r.months.join(', ')}`);
            setTimeout(() => setImportMsg(''), 8000);
          }} />
          {Object.keys(yearData.realMes).length > 0 && (
            <button className="btn" onClick={desfazerTodaImportacao} style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', fontSize: 11 }}>
              🗑 Desfazer toda importação
            </button>
          )}
        </div>
        {importMsg && <div className="text-[12px] mt-2" style={{ color: '#059669', fontWeight: 500 }}>{importMsg}</div>}
      </div>

      {alerts.length > 0 && (
        <div className="alert-banner">⚠ &nbsp;{alerts.join(' · ')}</div>
      )}

      <div className="grid gap-[10px] mb-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
        {INDIC_LABELS.map((lbl, i) => {
          const keys: (keyof typeof res)[] = ['recLiq', 'lucBruto', 'ebitda', 'lucLiq'];
          const k = keys[i];
          const val = res[k];
          const orcVal = ores[k];
          const v = dP(val, orcVal);
          const ok = val >= orcVal;
          const pReal = i > 0 ? fP(val, res.recLiq) : '';
          const pOrc = i > 0 ? fP(orcVal, ores.recLiq) : '';
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
                  <strong style={{ color: ok ? '#059669' : '#e11d48' }}>{ok ? '▲' : '▼'} {Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</strong>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="sec">
          <div className="sec-title">DRE Realizado — {MESES[mesSel]} {ano}</div>
          <MoneyField label="Receita Bruta" value={localData.recBruta} prefix={moeda} onChange={v => updateField('recBruta', v)} />
          <MoneyField label="Deduções / Impostos s/ venda" value={localData.deducoes} prefix={moeda} onChange={v => updateField('deducoes', v)} />
          <MoneyField label="CPV / CMV" value={localData.cpv} prefix={moeda} onChange={v => updateField('cpv', v)} />
          <MoneyField label="Despesas Operacionais" value={localData.despOp} prefix={moeda} onChange={v => updateField('despOp', v)} />
          <MoneyField label="Depreciação / Amortização" value={localData.depAmort} prefix={moeda} onChange={v => updateField('depAmort', v)} />
          <MoneyField label="Resultado Financeiro" value={localData.resFinanc} prefix={moeda} onChange={v => updateField('resFinanc', v)} />
          <MoneyField label="IR / CSLL" value={localData.ir} prefix={moeda} onChange={v => updateField('ir', v)} />
        </div>

        <div className="sec">
          <div className="sec-title">Avaliação vs. Orçado — {MESES[mesSel]} {ano}</div>
          <div className="overflow-x-auto">
            <table className="dre-table">
              <thead>
                <tr>
                  <th>Linha DRE</th>
                  <th style={{ textAlign: 'right' }}>Realizado</th>
                  <th style={{ textAlign: 'right' }}>% RL</th>
                  <th style={{ textAlign: 'right' }}>Orçado</th>
                  <th style={{ textAlign: 'right' }}>% RL</th>
                  <th style={{ textAlign: 'right' }}>Desvio</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map(([label, rv, ov, sub, bR, bO]) => {
                  const dev = rv - ov;
                  const favoravel = isDesvioFavoravel(label, dev);
                  return (
                    <tr key={label} className={sub ? 'sub-row' : ''}>
                      <td>{label}</td>
                      <td className="cell-right">{fmt(rv, moeda)}</td>
                      <td className="cell-dim">{fP(rv, bR)}</td>
                      <td className="cell-right">{fmt(ov, moeda)}</td>
                      <td className="cell-dim">{fP(ov, bO)}</td>
                      <td className="cell-right">
                        {ov ? <span className={`pill ${favoravel ? 'pill-positive' : 'pill-negative'}`}>{dev >= 0 ? '+' : ''}{fmt(dev, moeda)}</span> : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
