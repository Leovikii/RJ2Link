import { AppError } from '../../domain/errors';
import type { RjCode } from '../../domain/rj-code';
import type { ResourceResult } from '../../domain/work';

export function parseSouthPlusSearchForm(html: string, code: RjCode): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const form = doc.querySelector<HTMLFormElement>('form[action*="search.php"], form[name="schform"]')
    ?? doc.forms.item(0);
  if (!form || !form.querySelector('[name="keyword"]')) {
    const loginPage = Boolean(doc.querySelector('form[action*="login.php"], input[name="pwuser"], a[href^="login.php"]'));
    throw new AppError(
      loginPage ? 'unauthorized' : 'invalid-data',
      loginPage
        ? 'South Plus login cookie was not available to the cross-site request'
        : 'South Plus search form was not available; the forum layout may have changed',
    );
  }

  const params = new URLSearchParams();
  form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea')
    .forEach((element) => {
      if (!element.name) return;
      if (element instanceof HTMLInputElement) {
        const type = element.type.toLowerCase();
        if ((type === 'checkbox' || type === 'radio') && !element.checked) return;
        if (type === 'submit' && params.has(element.name)) return;
      }
      if (element instanceof HTMLSelectElement) {
        const option = element.selectedOptions.item(0) ?? element.options.item(0);
        if (option) params.append(element.name, option.value);
        return;
      }
      if (!params.has(element.name)) params.append(element.name, element.value);
    });
  params.set('keyword', code);
  params.set('step', '2');
  if (params.has('sch_time')) params.set('sch_time', 'all');
  return params.toString();
}

export function parseSouthPlusResults(html: string, domain: string): ResourceResult[] {
  if (html.includes('抱歉，没有找到匹配结果') || html.includes('没有查找匹配的内容')) return [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const error = doc.querySelector('.t .f_one b')?.textContent?.trim();
  if (error && !error.includes('没有找到') && !error.includes('没有查找匹配')) {
    const rateLimited = error.includes('上次搜索时间') || error.includes('连续两次搜索') || error.includes('不能少于');
    throw new AppError(rateLimited ? 'rate-limited' : 'invalid-data', error);
  }

  const results = new Map<string, ResourceResult>();
  doc.querySelectorAll<HTMLAnchorElement>('a[href^="read.php?tid"]')
    .forEach((anchor) => {
      const title = anchor.textContent?.trim();
      const href = anchor.getAttribute('href');
      const row = anchor.closest('tr');
      if (!title || !href || !row) return;
      const id = href.match(/tid[=-](\d+)/)?.[1] ?? href;
      if (results.has(id)) return;
      const cells = row.querySelectorAll('td, th');
      const authorCell = cells.item(3);
      const authorLink = authorCell?.querySelector('a');
      const author = authorLink?.textContent?.trim() ?? '';
      const date = row.querySelector('a[href*="page-e.html"]')?.textContent?.trim()
        ?? authorCell?.textContent?.replace(author, '').trim()
        ?? '';
      results.set(id, {
        id,
        providerId: 'southplus',
        title,
        url: new URL(href, `https://${domain}/`).href,
        author: author.replace(/[\r\n]+/g, ' ').trim(),
        date: date.replace(/[\r\n]+/g, ' ').trim(),
      });
    });
  if (results.size === 0) {
    throw new AppError('invalid-data', 'South Plus response did not contain search results');
  }
  return [...results.values()];
}
