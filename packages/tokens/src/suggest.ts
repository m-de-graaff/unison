/** Levenshtein distance between two strings. */
export function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0] as number;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cur = row[j] as number;
      row[j] = Math.min(
        (row[j] as number) + 1,
        (row[j - 1] as number) + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      prev = cur;
    }
  }
  return row[b.length] as number;
}

const MAX_DISTANCE = 3;

/** `md` abbreviates `medium`: same first letter, and its letters appear in order in the input. */
function abbreviates(option: string, input: string): boolean {
  if (option.length >= input.length || option[0] !== input[0]) return false;
  let i = 0;
  for (const ch of input) if (ch === option[i]) i++;
  return i === option.length;
}

/**
 * The closest option by edit distance, among those within 3 edits or that abbreviate the input
 * (`"medium"` → `"md"`); undefined when nothing is close.
 */
export function nearest(input: string, options: readonly string[]): string | undefined {
  const needle = input.toLowerCase();
  let best: string | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const option of options) {
    const lower = option.toLowerCase();
    const d = editDistance(needle, lower);
    if (d > MAX_DISTANCE && !abbreviates(lower, needle)) continue;
    if (d < bestDistance) {
      best = option;
      bestDistance = d;
    }
  }
  return best;
}
