/**
 * Determines if a deviation (realizado - orçado) is unfavorable for a given DRE line.
 * For cost/expense items: realizado > orçado is BAD (more costs = worse)
 * For revenue/profit items: realizado < orçado is BAD (less revenue = worse)
 */

// Items where HIGHER realizado is WORSE (costs, expenses, taxes)
const COST_ITEMS = new Set([
  '(−) Deduções',
  '(−) CPV / CMV',
  '(−) CPV',
  '(−) Despesas Op.',
  '(−) Desp. Op.',
  '(−) Deprec./Amort.',
  '(−) Deprec.',
  '(−) IR / CSLL',
  '(−) IR/CSLL',
]);

export function isDesvioFavoravel(label: string, desvio: number): boolean {
  if (COST_ITEMS.has(label)) {
    // For costs: less spent than budgeted is favorable
    return desvio <= 0;
  }
  // For revenue/profit: more than budgeted is favorable
  return desvio >= 0;
}
