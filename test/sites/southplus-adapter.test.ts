import { beforeEach, describe, expect, it } from 'vitest';
import { enhanceSouthPlusNode } from '../../src/sites/southplus/adapter';

describe('South Plus DOM enhancer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('linkifies plain text without touching editable fields', () => {
    document.body.innerHTML = '<p>作品 RJ123456 与 VJ12345678</p><textarea>RJ999999</textarea>';
    enhanceSouthPlusNode(document.body);
    expect(document.querySelectorAll('.rwg-rj-link')).toHaveLength(2);
    expect(document.querySelector('.rwg-rj-link')?.getAttribute('data-rwg-code')).toBe('RJ123456');
    expect(document.querySelector('textarea')?.value).toBe('RJ999999');
  });

  it('preserves the href and target of existing DLsite links', () => {
    document.body.innerHTML = '<a target="_blank" href="https://www.dlsite.com/maniax/work/=/product_id/RJ123456.html">DLsite</a>';
    const anchor = document.querySelector('a')!;
    const originalHref = anchor.href;
    enhanceSouthPlusNode(document.body);
    expect(anchor.href).toBe(originalHref);
    expect(anchor.target).toBe('_blank');
    expect(anchor.classList.contains('rwg-rj-link')).toBe(true);
  });

  it('is idempotent when scanning an already enhanced subtree', () => {
    document.body.innerHTML = '<p>RJ123456</p>';
    enhanceSouthPlusNode(document.body);
    enhanceSouthPlusNode(document.body);
    expect(document.querySelectorAll('.rwg-rj-link')).toHaveLength(1);
    expect(document.body.textContent).toBe('RJ123456');
  });
});

