import type { RjCode } from '../domain/rj-code';
import type { MetadataProvider, ResourceProvider } from './provider';

export class ProviderRegistry {
  private readonly metadataProviders = new Map<string, MetadataProvider>();
  private readonly resourceProviders = new Map<string, ResourceProvider>();

  registerMetadata(provider: MetadataProvider): this {
    if (this.metadataProviders.has(provider.id)) {
      throw new Error(`Metadata provider id already registered: ${provider.id}`);
    }
    this.metadataProviders.set(provider.id, provider);
    return this;
  }

  registerResource(provider: ResourceProvider): this {
    if (this.resourceProviders.has(provider.id)) {
      throw new Error(`Resource provider id already registered: ${provider.id}`);
    }
    this.resourceProviders.set(provider.id, provider);
    return this;
  }

  metadataFor(code: RjCode): MetadataProvider[] {
    return [...this.metadataProviders.values()].filter((provider) => provider.supports(code));
  }

  resourcesFor(code: RjCode): ResourceProvider[] {
    return [...this.resourceProviders.values()].filter((provider) => provider.supports(code));
  }

  metadata(id: string): MetadataProvider | undefined {
    return this.metadataProviders.get(id);
  }

  resource(id: string): ResourceProvider | undefined {
    return this.resourceProviders.get(id);
  }
}
