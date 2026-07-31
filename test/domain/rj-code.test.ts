import { describe, expect, it } from 'vitest';
import { findRjCodes, parseRjCode } from '../../src/domain/rj-code';

describe('RJ code', () => {
  it.each(['RJ123456', 'rj01234567', 'RE123456', 'VJ12345678', 'BJ999999'])(
    'normalizes supported code %s',
    (value) => expect(parseRjCode(value)).toBe(value.toUpperCase()),
  );

  it.each(['RJ12345', 'RJ1234567', 'AB123456', 'RJ123456789', '']) (
    'rejects unsupported code %s',
    (value) => expect(parseRjCode(value)).toBeNull(),
  );

  it('finds and deduplicates codes in text', () => {
    expect(findRjCodes('RJ123456 and rj123456, then VJ12345678')).toEqual([
      'RJ123456',
      'VJ12345678',
    ]);
  });
});

