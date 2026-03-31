import { DREData, DREResult } from '@/types/financial';

export function calcDRE(d: DREData): DREResult {
  const recLiq = d.recBruta - d.deducoes;
  const lucBruto = recLiq - d.cpv;
  const ebitda = lucBruto - d.despOp;
  const lucLiq = ebitda - d.depAmort + d.resFinanc - d.ir;
  return { recLiq, lucBruto, ebitda, lucLiq };
}

export function fmt(v: number, moeda: string = 'R$'): string {
  const neg = v < 0;
  const abs = Math.abs(v);
  const formatted = abs.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${moeda}\u00a0${neg ? '(' : ''}${formatted}${neg ? ')' : ''}`;
}

export function fmtK(v: number, moeda: string = 'R$'): string {
  const neg = v < 0;
  const abs = Math.abs(v / 1000);
  return `${moeda}${neg ? '-' : ''}${abs.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`;
}

export function fP(v: number, base: number): string {
  if (!base) return '—';
  return (v / base * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
}

export function dP(a: number, b: number): number {
  return b ? ((a - b) / Math.abs(b) * 100) : 0;
}

export function maskMoney(value: string): string {
  const v = value.replace(/\D/g, '');
  if (!v) return '';
  return (parseInt(v, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function parseMoney(value: string): number {
  return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
}

export function parsePct(value: string): number {
  return parseFloat(value.replace(',', '.')) || 0;
}

export function formatPctInput(n: number): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatMoneyInput(n: number): string {
  if (n === 0) return '';
  return Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function toObj(d: Partial<DREData> | undefined): DREData {
  return {
    recBruta: d?.recBruta || 0,
    deducoes: d?.deducoes || 0,
    cpv: d?.cpv || 0,
    despOp: d?.despOp || 0,
    depAmort: d?.depAmort || 0,
    resFinanc: d?.resFinanc || 0,
    ir: d?.ir || 0,
  };
}
