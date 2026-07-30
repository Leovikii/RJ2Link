import { GmHttpClient } from '../infrastructure/http/http-client';
import { GmKeyValueStorage } from '../infrastructure/gm/storage';
import { QueryCache } from '../infrastructure/cache/query-cache';
import { QueryClient } from '../infrastructure/cache/query-client';
import { SouthPlusRateLimiter } from '../infrastructure/coordination/southplus-rate-limiter';
import { DlsiteMetadataProvider } from '../providers/dlsite/metadata-provider';
import { AsmrOneResourceProvider } from '../providers/asmr-one/resource-provider';
import { SouthPlusResourceProvider } from '../providers/southplus/resource-provider';
import { ProviderRegistry } from '../services/provider-registry';
import { GmTextClipboard } from '../infrastructure/gm/clipboard';

const storage = new GmKeyValueStorage();
const http = new GmHttpClient();
const queryCache = new QueryCache(storage);
const queryClient = new QueryClient(queryCache);
const limiter = new SouthPlusRateLimiter(storage);
export const clipboard = new GmTextClipboard();

export const dlsiteProvider = new DlsiteMetadataProvider(http, queryClient);
export const asmrOneProvider = new AsmrOneResourceProvider(http, queryClient);
export const southPlusProvider = new SouthPlusResourceProvider(http, storage, queryClient, limiter);

export const providerRegistry = new ProviderRegistry()
  .registerMetadata(dlsiteProvider)
  .registerResource(asmrOneProvider)
  .registerResource(southPlusProvider);

export { storage };
