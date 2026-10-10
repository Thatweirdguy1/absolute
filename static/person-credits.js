const page = document.querySelector('#credits-page');
const personId = location.pathname.split('/').filter(Boolean)[1];
const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
function creditSkeletons(){const shell=el('div','credits-skeleton'); shell.append(el('span','skeleton skeleton-heading')); const grid=el('div','credits-grid'); for(let i=0;i<12;i+=1) grid.append(el('span','skeleton skeleton-poster')); shell.append(grid); shell.setAttribute('aria-hidden','true'); return shell;}
function card(credit) {
  const node = el(credit.media_type === 'movie' ? 'a' : 'article', 'credit-card'); if (credit.media_type === 'movie') node.href = `/movie/${credit.id}`;
  if (credit.poster_url) { const image = el('img'); image.src = credit.poster_url; image.alt = ''; image.loading = 'lazy'; node.append(image); } else node.append(el('div', 'credit-placeholder'));
  node.append(el('h3', '', credit.title || 'Untitled'), el('p', '', [credit.year, credit.role].filter(Boolean).join(' · '))); return node;
}
function section(label, credits) { const area = el('section', 'credits-section'); area.append(el('p', 'eyebrow', `${label} · ${credits.length}`)); const grid = el('div', 'credits-grid'); credits.forEach(item => grid.append(card(item))); area.append(grid); return area; }
async function load() {
  try {
    const response = await fetch(`/api/person/${personId}`); const person = await response.json(); if (!response.ok) throw new Error(person.error || 'Credits unavailable');
    document.title = `${person.name}: all credits · Absolute`;
    const header = el('header', 'all-credits-header'); const back = el('a', 'view-all', `Back to ${person.name}`); back.href = `/person/${person.id}`; header.append(back, el('p', 'eyebrow', 'Complete filmography'), el('h1', '', person.name));
    const director = person.crew.filter(item => item.role === 'Director');
    const producer = person.crew.filter(item => /Producer/.test(item.role) && item.role !== 'Executive Producer');
    const writer = person.crew.filter(item => /Writer|Screenplay|Story|Teleplay/.test(item.role));
    const executive = person.crew.filter(item => item.role === 'Executive Producer');
    const grouped = new Set([...director, ...producer, ...writer, ...executive]); const other = person.crew.filter(item => !grouped.has(item));
    page.replaceChildren(header, section('Cast', person.cast), ...[['Director',director],['Producer',producer],['Writer',writer],['Executive producer',executive],['Other crew',other]].filter(([, items]) => items.length).map(([label, items]) => section(label, items))); page.setAttribute('aria-busy','false');
  } catch (error) { page.replaceChildren(el('p', 'loading', error.message)); page.setAttribute('aria-busy','false'); }
}
page.replaceChildren(creditSkeletons());
load();
