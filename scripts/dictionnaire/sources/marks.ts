// Marques d'usage qui retirent un sens (R28), reconnues dans chaque source.
import type { UsageMark } from "../types";

const RULES: readonly (readonly [UsageMark, RegExp])[] = [
  ["vulgaire", /^(vulgar|offensive|very-familiar|vulgaire|insulte|raciste|fétichisme sexuel|érotisme)$/i],
  ["vieilli", /^(dated|obsolete|archaic|vieilli|vieux|archaïque|désuet)\b/i],
  ["argot", /^(slang|argot)\b/i],
];

export function usageMarks(labels: readonly string[]): UsageMark[] {
  const marks = RULES.filter(([, pattern]) => labels.some((l) => pattern.test(l.trim()))).map(([mark]) => mark);
  return [...new Set(marks)];
}
