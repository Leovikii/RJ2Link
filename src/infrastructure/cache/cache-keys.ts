import type { RjCode } from '../../domain/rj-code';

const encode = (part: string) => encodeURIComponent(part);

export const cacheKeys = {
  work: (rjCode: RjCode, locale = 'default') =>
    `rwg:v1:work:${rjCode}:${encode(locale)}`,
  southPlus: (rjCode: RjCode, domain: string) =>
    `rwg:v1:southplus:${rjCode}:${encode(domain)}`,
  asmrOne: (rjCode: RjCode) => `rwg:v1:asmrone:${rjCode}`,
  linkage: (rjCode: RjCode, languages: readonly string[]) =>
    `rwg:v1:linkage:${rjCode}:${encode([...languages].sort().join(','))}`,
};

