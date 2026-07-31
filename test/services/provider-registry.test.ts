import { describe, expect, it } from 'vitest';
import { parseRjCode } from '../../src/domain/rj-code';
import { ProviderRegistry } from '../../src/services/provider-registry';

const code = parseRjCode('RJ123456')!;

describe('ProviderRegistry', () => {
  it('allows the same site id to expose metadata and resource capabilities', () => {
    const registry = new ProviderRegistry()
      .registerMetadata({ id: 'site', supports: () => true, getWork: async () => { throw new Error(); } })
      .registerResource({ id: 'site', displayName: 'Site', supports: () => true, search: async () => [] });
    expect(registry.metadataFor(code)).toHaveLength(1);
    expect(registry.resourcesFor(code)).toHaveLength(1);
  });
});

