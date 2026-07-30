import { AppError } from '../../domain/errors';

export interface TextClipboard {
  writeText(value: string): Promise<void>;
}

export class GmTextClipboard implements TextClipboard {
  async writeText(value: string): Promise<void> {
    if (typeof GM_setClipboard !== 'function') {
      throw new AppError('network', 'GM_setClipboard is unavailable');
    }
    await GM_setClipboard(value, 'text');
  }
}
