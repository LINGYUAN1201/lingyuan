(() => {
  'use strict';
  const doc = document;
  const menuButton = doc.querySelector('.nav-toggle');
  const menu = doc.querySelector('.main-nav');
  if (menuButton && menu) {
    const closeMenu = () => { menu.classList.remove('is-open'); menuButton.setAttribute('aria-expanded', 'false'); };
    menuButton.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
    });
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    doc.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
    doc.addEventListener('click', event => {
      if (!menu.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
    });
  }

  doc.querySelectorAll('[data-current-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  const items = Array.isArray(window.SITE_NEWS) ? [...window.SITE_NEWS] : [];
  const toTimestamp = date => new Date(date.length === 7 ? `${date}-01T12:00:00` : `${date}T12:00:00`).getTime();
  items.sort((a, b) => toTimestamp(b.date) - toTimestamp(a.date));
  const formatDate = date => {
    const dt = new Date(date.length === 7 ? `${date}-01T12:00:00` : `${date}T12:00:00`);
    return new Intl.DateTimeFormat('en-GB', { day:date.length === 7 ? undefined : 'numeric', month:'short', year:'numeric' }).format(dt);
  };
  const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl = url => /^(https?:\/\/|\.\.?\/|[\w.-]+\.html(?:#[-\w]+)?$)/i.test(url) ? safe(url) : '';
  function entryHtml(item, archive=false) {
    const id = safe(item.id);
    const url = item.url ? safeUrl(item.url) : '';
    const target = archive ? (url || `#${id}`) : `news.html#${id}`;
    const action = target.startsWith('#') ? '' : (target.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : '');
    return `<article class="news-entry" id="${id}">
      <div class="news-date">${safe(formatDate(item.date))}</div>
      <div><h3 class="news-title"><a href="${target}"${action}>${safe(item.title)}</a></h3>
      <p class="news-description">${safe(item.description)}</p><span class="news-tag">${safe(item.category)}</span></div>
      <a class="news-entry-arrow" href="${target}"${action} aria-label="Read about ${safe(item.title)}">↗</a></article>`;
  }
  const homeNews = doc.querySelector('[data-home-news]');
  if (homeNews) homeNews.innerHTML = items.slice(0,3).map(item => entryHtml(item)).join('') || '<p class="empty-state">No updates yet.</p>';
  const archive = doc.querySelector('[data-news-archive]');
  if (archive) {
    const category = doc.querySelector('[data-news-category]');
    const year = doc.querySelector('[data-news-year]');
    const search = doc.querySelector('[data-news-search]');
    const count = doc.querySelector('[data-news-count]');
    [...new Set(items.map(x => x.category))].sort().forEach(c => { const opt=doc.createElement('option'); opt.value=c; opt.textContent=c; category.appendChild(opt); });
    [...new Set(items.map(x => x.date.slice(0,4)))].sort().reverse().forEach(y => { const opt=doc.createElement('option'); opt.value=y; opt.textContent=y; year.appendChild(opt); });
    function render() {
      const q = search.value.toLowerCase().trim();
      const filtered = items.filter(item =>
        (!category.value || item.category === category.value) &&
        (!year.value || item.date.startsWith(year.value)) &&
        (!q || `${item.title} ${item.description} ${item.category}`.toLowerCase().includes(q)));
      const groups = new Map();
      filtered.forEach(item => { const y=item.date.slice(0,4); if (!groups.has(y)) groups.set(y, []); groups.get(y).push(item); });
      archive.innerHTML = filtered.length
        ? [...groups].map(([y,entries])=>`<section aria-labelledby="year-${y}"><h2 class="archive-year" id="year-${y}">${y}</h2><div class="news-list">${entries.map(x=>entryHtml(x,true)).join('')}</div></section>`).join('')
        : '<div class="empty-state">No news matched your filters. Try changing the year, category, or search.</div>';
      count.textContent = `${filtered.length} ${filtered.length === 1 ? 'update' : 'updates'}`;
    }
    [category,year,search].forEach(element => element.addEventListener(element===search?'input':'change', render));
    render();
    if (location.hash) {
      const targetId=decodeURIComponent(location.hash.slice(1));
      const target=doc.getElementById(targetId);
      if (target) requestAnimationFrame(()=>target.scrollIntoView({block:'center'}));
    }
  }
  // Display portrait by default; reveal the fallback only on an actual load failure.
  doc.querySelectorAll('.portrait-img').forEach(img => {
    const reportFailure = () => img.closest('.portrait-frame')?.classList.add('image-failed');
    if (img.complete && !img.naturalWidth) reportFailure();
    img.addEventListener('error', reportFailure, {once:true});
  });

  const papers = Array.isArray(window.SITE_PAPERS) ? window.SITE_PAPERS : [];
  function renderPaper(item) {
    return `<article class="paper-entry" id="${safe(item.id)}">
      <div class="paper-status">${safe(item.status)}</div>
      <div><h3>${safe(item.title)}</h3>
      <p class="paper-abstract-label">ABSTRACT</p>
      <p class="paper-abstract">${safe(item.abstract)}</p></div>
    </article>`;
  }
  const fullPapers = doc.querySelector('[data-all-papers]');
  if (fullPapers) fullPapers.innerHTML = papers.map(renderPaper).join('') || '<p class="empty-state">Working papers will appear here.</p>';

  const printButton = doc.querySelector('[data-print]');
  if (printButton) printButton.addEventListener('click', () => window.print());
})();
