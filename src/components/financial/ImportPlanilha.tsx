import { useRef, useState } from 'react';
import { DREData, MESES, emptyDRE } from '@/types/financial';
import { useFinancial } from '@/context/FinancialContext';
import * as XLSX from 'xlsx';

const FIELD_MAP: (keyof DREData)[] = ['recBruta', 'deducoes', 'cpv', 'despOp', 'depAmort', 'resFinanc', 'ir'];

const MONTH_ALIASES: Record<string, number> = {};
MESES.forEach((m, i) => { MONTH_ALIASES[m.toLowerCase()] = i; });
['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'].forEach((m, i) => { MONTH_ALIASES[m] = i; });
for (let i = 1; i <= 12; i++) MONTH_ALIASES[String(i)] = i - 1;

function parseMonth(val: unknown): number | null {
  if (val == null) return null;
  const s = String(val).trim().toLowerCase();
  if (MONTH_ALIASES[s] !== undefined) return MONTH_ALIASES[s];
  const found = MESES.findIndex(m => m.toLowerCase().startsWith(s));
  return found >= 0 ? found : null;
}

function parseNum(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  const s = String(val).replace(/[R$€\s.]/g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

interface ImportResult {
  imported: number;
  months: string[];
  errors: string[];
}

interface Props {
  target?: 'realMes' | 'orcMes';
  onDone?: (result: ImportResult) => void;
}

export function ImportPlanilha({ target = 'realMes', onDone }: Props) {
  const { updateYearData } = useFinancial();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ month: number; data: DREData }[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const targetLabel = target === 'orcMes' ? 'orçamento' : 'realizado';

  const processFile = (file: File) => {
    setError('');
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        const parsed: { month: number; data: DREData }[] = [];
        const errors: string[] = [];

        for (let r = 1; r < rows.length; r++) {
          const row = rows[r];
          if (!row || row.length === 0) continue;
          const month = parseMonth(row[0]);
          if (month === null) {
            if (row.some(c => c != null && c !== '')) {
              errors.push(`Linha ${r + 1}: mês "${row[0]}" não reconhecido`);
            }
            continue;
          }
          const dreData: DREData = { ...emptyDRE };
          FIELD_MAP.forEach((field, i) => {
            dreData[field] = parseNum(row[i + 1]);
          });
          parsed.push({ month, data: dreData });
        }

        if (parsed.length === 0) {
          setError('Nenhum mês válido encontrado na planilha.');
          setPreview(null);
          return;
        }
        if (errors.length > 0) setError(errors.join('; '));
        setPreview(parsed);
      } catch {
        setError('Erro ao ler o arquivo. Verifique se é .xlsx ou .csv válido.');
        setPreview(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const confirmar = () => {
    if (!preview) return;
    updateYearData(yd => {
      const newData = { ...yd[target] };
      preview.forEach(({ month, data }) => {
        newData[month] = { ...data };
      });
      return { ...yd, [target]: newData };
    });
    const result: ImportResult = {
      imported: preview.length,
      months: preview.map(p => MESES[p.month]),
      errors: error ? [error] : [],
    };
    setPreview(null);
    setFileName('');
    setError('');
    onDone?.(result);
  };

  const cancelar = () => {
    setPreview(null);
    setFileName('');
    setError('');
  };

  const baixarModelo = () => {
    const wb = XLSX.utils.book_new();
    const header = ['Mês', 'Receita Bruta', 'Deduções', 'CPV / CMV', 'Despesas Operacionais', 'Depreciação / Amort.', 'Resultado Financeiro', 'IR / CSLL'];
    const rows = MESES.map(m => [m, 0, 0, 0, 0, 0, 0, 0]);
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    ws['!cols'] = header.map((_, i) => ({ wch: i === 0 ? 14 : 22 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Lançamentos');
    XLSX.writeFile(wb, `modelo_${target === 'orcMes' ? 'orcamento' : 'lancamentos'}_mensais.xlsx`);
  };

  const fmtVal = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        <button className="btn" onClick={() => fileRef.current?.click()} style={{ background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}>
          📥 Importar Planilha ({targetLabel})
        </button>
        <button className="btn" onClick={baixarModelo} style={{ background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0', fontSize: 11 }}>
          📄 Baixar Modelo
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ''; }} />
      </div>

      {error && !preview && <div className="alert-banner mt-3">⚠ {error}</div>}

      {preview && (
        <div className="sec mt-4" style={{ border: '2px solid #c7d2fe', background: '#fafafe' }}>
          <div className="sec-title" style={{ color: '#4f46e5' }}>📋 Pré-visualização — {fileName}</div>
          {error && <div className="text-[11px] mb-2" style={{ color: '#e11d48' }}>⚠ {error}</div>}
          <div className="text-[11px] mb-3" style={{ color: 'hsl(var(--text-muted))' }}>
            {preview.length} mês(es) encontrado(s) para {targetLabel}. Confira os valores antes de confirmar.
          </div>
          <div className="overflow-x-auto">
            <table className="dre-table">
              <thead>
                <tr>
                  <th>Mês</th>
                  <th style={{ textAlign: 'right' }}>Rec. Bruta</th>
                  <th style={{ textAlign: 'right' }}>Deduções</th>
                  <th style={{ textAlign: 'right' }}>CPV</th>
                  <th style={{ textAlign: 'right' }}>Desp. Op.</th>
                  <th style={{ textAlign: 'right' }}>Dep./Am.</th>
                  <th style={{ textAlign: 'right' }}>Res. Fin.</th>
                  <th style={{ textAlign: 'right' }}>IR/CSLL</th>
                </tr>
              </thead>
              <tbody>
                {preview.map(({ month, data }) => (
                  <tr key={month}>
                    <td style={{ fontWeight: 600 }}>{MESES[month]}</td>
                    <td className="cell-right">{fmtVal(data.recBruta)}</td>
                    <td className="cell-right">{fmtVal(data.deducoes)}</td>
                    <td className="cell-right">{fmtVal(data.cpv)}</td>
                    <td className="cell-right">{fmtVal(data.despOp)}</td>
                    <td className="cell-right">{fmtVal(data.depAmort)}</td>
                    <td className="cell-right">{fmtVal(data.resFinanc)}</td>
                    <td className="cell-right">{fmtVal(data.ir)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="btn btn-primary" onClick={confirmar}>✅ Confirmar Importação</button>
            <button className="btn" onClick={cancelar}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
