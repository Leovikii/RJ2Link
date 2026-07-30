export type RjCode = string & { readonly __brand: 'RjCode' };

const RJ_CODE_PATTERN = /^(?:R[JE]|[VB]J)\d{6}(?:\d{2})?$/i;
export const RJ_CODE_SEARCH_PATTERN = /(?:R[JE]|[VB]J)\d{6}(?:\d{2})?/gi;

export function parseRjCode(input: string): RjCode | null {
  const normalized = input.trim().toUpperCase();
  return RJ_CODE_PATTERN.test(normalized) ? (normalized as RjCode) : null;
}

export function findRjCodes(input: string): RjCode[] {
  const matches = input.match(RJ_CODE_SEARCH_PATTERN) ?? [];
  const unique = new Set<RjCode>();
  for (const match of matches) {
    const code = parseRjCode(match);
    if (code) unique.add(code);
  }
  return [...unique];
}

