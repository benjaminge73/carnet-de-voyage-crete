// Parses an aspect-ratio prop into both its CSS aspect-ratio string and a
// numeric width/height value. Accepts:
// - the aliases "1", "4:3", "3:4", "16:9"
// - any "N/M" or "N / M" string
// - a plain number
// Falls back to a square (value = 1) when the input cannot be parsed numerically,
// but always returns the original string as the CSS value so callers stay in control.

export type RatioInput = string | number;

const ALIASES: Record<string, { css: string; value: number }> = {
  "1": { css: "1 / 1", value: 1 },
  "4:3": { css: "4 / 3", value: 4 / 3 },
  "3:4": { css: "3 / 4", value: 3 / 4 },
  "16:9": { css: "16 / 9", value: 16 / 9 },
};

export function parseRatio(input: RatioInput): { css: string; value: number } {
  if (typeof input === "number") {
    return { css: String(input), value: input };
  }
  const alias = ALIASES[input];
  if (alias) return alias;

  const m = input.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (m) return { css: input, value: Number(m[1]) / Number(m[2]) };

  return { css: input, value: 1 };
}
