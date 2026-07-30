import { describe, expect, it } from 'vitest';
import { parseRjCode } from '../../src/domain/rj-code';
import { parseSouthPlusResults, parseSouthPlusSearchForm } from '../../src/providers/southplus/parser';

describe('South Plus parser', () => {
  it('replays the search form with the normalized RJ code', () => {
    const body = parseSouthPlusSearchForm(`
      <form action="search.php" name="schform">
        <input name="keyword" value="old">
        <input name="token" value="csrf">
        <select name="sch_time"><option value="30" selected>30</option></select>
      </form>
    `, parseRjCode('RJ123456')!);
    const params = new URLSearchParams(body);
    expect(params.get('keyword')).toBe('RJ123456');
    expect(params.get('token')).toBe('csrf');
    expect(params.get('sch_time')).toBe('all');
  });

  it('parses and deduplicates result rows', () => {
    const results = parseSouthPlusResults(`
      <table><tr>
        <td><a href="read.php?tid-123.html">Title</a></td><td></td><td></td>
        <td><a href="u.php?uid=4">Author</a> 2026-01-01</td><td></td><td></td>
        <td><a href="read.php?tid-123.html&page=e">Title duplicate</a></td>
      </tr></table>
    `, 'www.south-plus.net');
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ id: '123', title: 'Title', author: 'Author' });
  });

  it('returns an empty array for an explicit no-match response', () => {
    expect(parseSouthPlusResults('抱歉，没有找到匹配结果', 'www.south-plus.net')).toEqual([]);
  });

  it('parses the current seven-column production result layout', () => {
    const results = parseSouthPlusResults(`
      <table><tr>
        <td></td>
        <th><a href="read.php?tid-1676629-keyword-RJ123456.html">求RJ123456汉化LRC</a></th>
        <td>询问&amp;求物</td>
        <td><a href="u.php?action-show-uid-944409.html">6ad060f9</a> 2022-12-17</td>
        <td>1</td><td>1852</td>
        <td><a href="read.php?tid-1676629-page-e.html#a">2022-12-17 22:05</a></td>
      </tr></table>
    `, 'www.south-plus.net');

    expect(results).toEqual([expect.objectContaining({
      id: '1676629',
      title: '求RJ123456汉化LRC',
      author: '6ad060f9',
      date: '2022-12-17 22:05',
    })]);
  });

  it('classifies a login page as an authorization failure', () => {
    expect(() => parseSouthPlusSearchForm(
      '<form action="login.php"><input name="pwuser"></form>',
      parseRjCode('RJ123456')!,
    )).toThrowError(expect.objectContaining({ kind: 'unauthorized' }));
  });
});
