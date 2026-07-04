export interface SouthPlusSearchResult {
  title: string;
  url: string;
  author: string;
  date: string;
}

export interface SouthPlusSearchResponse {
  success: boolean;
  results: SouthPlusSearchResult[];
  errorMsg?: string;
  isCooldown?: boolean;
}

/**
 * Perform a background search on South Plus.
 */
export async function searchSouthPlus(rjCode: string, force = false): Promise<SouthPlusSearchResponse> {
  const cacheKey = `sp_cache_${rjCode.toUpperCase()}`;
  
  // 1. Local Cache Check
  if (!force && typeof GM_getValue !== "undefined") {
    const cached: any = await GM_getValue(cacheKey);
    // Cache valid for 12 hours
    if (cached && Date.now() - cached.time < 12 * 3600 * 1000) {
      return cached.data;
    }
  }

  // 2. Cross-Tab Rate Limiting Queue
  // South+ has a strict search cooldown (usually 15 seconds).
  // We use GM_getValue as a global mutex/lock to queue searches across all open DLsite tabs.
  if (typeof GM_getValue !== "undefined" && typeof GM_setValue !== "undefined") {
    while (true) {
      const lastSearch = (await GM_getValue('sp_last_search_time', 0)) as number;
      const now = Date.now();
      // Minimum 16 seconds gap to be safe
      if (now - lastSearch >= 16000) {
        await GM_setValue('sp_last_search_time', now);
        break;
      }
      // Wait for 1-2 seconds and check again
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    }
  }

  // Use the last active domain from the user's forum browsing
  // Fallback to south-plus.net
  const domain = (typeof GM_getValue !== "undefined") 
    ? await GM_getValue("last_forum_domain", "www.south-plus.net") 
    : "www.south-plus.net";
    
  const SEARCH_URL_GET = `https://${domain}/search.php`;
  const SEARCH_URL_POST = `https://${domain}/search.php?step=2`;

  return new Promise((resolve) => {
    // 1. First GET to retrieve CSRF token and check if we are already in cooldown
    GM_xmlhttpRequest({
      method: 'GET',
      url: SEARCH_URL_GET,
      onload: (res: any) => {
        const html = res.responseText;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Check if there is a cooldown or error message right away
        const errorText = doc.querySelector('.t .f_one b')?.textContent || '';
        if (errorText.includes('距离上次搜索时间') || errorText.includes('连续两次搜索')) {
          return resolve({ success: false, results: [], isCooldown: true, errorMsg: errorText });
        }

        // Try to find the search form and extract all inputs dynamically
        const searchForm = doc.querySelector('form[action*="search.php"]') || doc.querySelector('form[name="schform"]') || doc.forms[0];
        const formData = new URLSearchParams();
        
        if (searchForm) {
          const elements = searchForm.querySelectorAll('input, select, textarea');
          elements.forEach(el => {
             const name = el.getAttribute('name');
             if (!name) return;
             
             if (el.tagName.toLowerCase() === 'input') {
                 const type = el.getAttribute('type')?.toLowerCase();
                 if ((type === 'radio' || type === 'checkbox') && !(el as HTMLInputElement).checked) {
                     return;
                 }
                 if (type === 'submit') {
                     if (!formData.has(name)) formData.append(name, (el as HTMLInputElement).value || '');
                     return;
                 }
             }

             if (el.tagName.toLowerCase() === 'select') {
                 const selectEl = el as HTMLSelectElement;
                 const selectedOption = selectEl.options[selectEl.selectedIndex] || selectEl.options[0];
                 if (selectedOption) formData.append(name, selectedOption.value);
                 return;
             }

             if (!formData.has(name)) formData.append(name, (el as HTMLInputElement).value || '');
          });
        }

        // 2. Override specific parameters for our RJ search
        formData.set('keyword', rjCode);
        formData.set('step', '2');
        
        // Match Soul+Linker's behavior: set sch_time to all
        if (formData.has('sch_time')) {
            formData.set('sch_time', 'all');
        }
        
        GM_xmlhttpRequest({
          method: 'POST',
          url: SEARCH_URL_POST,
          data: formData.toString(),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': SEARCH_URL_GET,
            'Origin': `https://${domain}`
          },
          onload: (postRes: any) => {
            const postHtml = postRes.responseText;
            const postDoc = parser.parseFromString(postHtml, 'text/html');

            // Check for cooldown or error again
            const postErrorText = postDoc.querySelector('.t .f_one b')?.textContent || '';
            if (postErrorText.includes('距离上次搜索时间') || postErrorText.includes('连续两次搜索') || postErrorText.includes('不能少于')) {
              return resolve({ success: false, results: [], isCooldown: true, errorMsg: postErrorText });
            }

            if (postHtml.includes('抱歉，没有找到匹配结果') || postHtml.includes('没有查找匹配的内容')) {
              const emptyResponse = { success: true, results: [] };
              if (typeof GM_setValue !== "undefined") GM_setValue(cacheKey, { data: emptyResponse, time: Date.now() });
              return resolve(emptyResponse);
            }

            // Parse results robustly
            const results: SouthPlusSearchResult[] = [];
            
            // South+ uses URL rewrites like read.php?tid-123.html or read.php?tid=123
            const aTags = Array.from(postDoc.querySelectorAll('a[href^="read.php?tid"]'));
            
            
            aTags.forEach((aTag) => {
              const row = aTag.closest('tr');
              if (!row) return;

              const hrefAttr = aTag.getAttribute('href');
              if (!hrefAttr) return;

              const title = aTag.textContent?.trim() || '';
              // Exclude links that might just be icons or empty text
              if (!title) return;

              const url = `https://${domain}/${hrefAttr}`;

              // Extract thread ID (tid) to deduplicate 'Last Post' links in the same row
              const tidMatch = hrefAttr.match(/tid[=-](\d+)/);
              const tid = tidMatch ? tidMatch[1] : null;

              // Prevent duplicates by checking exact URL or thread ID
              if (results.some(r => r.url === url || (tid && r.url.match(new RegExp(`tid[=-]${tid}`))))) return;
              
              let author = '';
              let date = '';

              // Try to get author from the 4th column (index 3)
              const cells = row.querySelectorAll('td, th');
              if (cells.length >= 6) {
                  const authorCell = cells[3];
                  const authorLink = authorCell.querySelector('a');
                  if (authorLink) {
                      author = authorLink.textContent?.trim() || '';
                      date = authorCell.textContent?.replace(author, '').trim() || '';
                  } else {
                      // For anonymous authors, there might be no link
                      const rawText = authorCell.textContent?.trim() || '';
                      author = rawText; 
                  }
              } else {
                  // Fallback if table structure is weird
                  const authorTag = row.querySelector('a[href*="u.php?action=show"], a[href*="u.php?uid="]');
                  author = authorTag?.textContent?.trim() || '';
              }

              // The 'Last Post' link conveniently contains the exact date/time!
              const dateLink = row.querySelector('a[href*="page-e.html"]');
              if (dateLink && dateLink.textContent) {
                  const lastPostDate = dateLink.textContent.trim();
                  // We can display both or just the last post date. Let's use last post date as it indicates thread activity.
                  date = lastPostDate;
              }

              // Clean up newlines if any
              author = author.replace(/[\r\n]+/g, ' ').trim();
              date = date.replace(/[\r\n]+/g, ' ').trim();

              results.push({ title, url, author, date });
            });

            const finalResponse = { success: true, results };
            if (typeof GM_setValue !== "undefined") GM_setValue(cacheKey, { data: finalResponse, time: Date.now() });
            resolve(finalResponse);
          },
          onerror: (err: any) => {
            console.error(`[RJ-Warp-Gate] POST error:`, err);
            resolve({ success: false, results: [], errorMsg: 'Network error during search POST.' });
          }
        });
      },
      onerror: (err: any) => {
        console.error(`[RJ-Warp-Gate] GET error:`, err);
        resolve({ success: false, results: [], errorMsg: 'Network error during search GET.' });
      }
    });
  });
}
