const page = document.querySelector('#person-page');
const personId = location.pathname.split('/').filter(Boolean).pop();
const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
function creditCard(credit) {
  const card = el(credit.media_type === 'movie' ? 'a' : 'article', 'credit-card');
  if (credit.media_type === 'movie') card.href = `/movie/${credit.id}`;
  if (credit.poster_url) { const image = el('img'); image.src = credit.poster_url; image.alt = ''; image.loading = 'lazy'; card.append(image); }
  else card.append(el('div', 'credit-placeholder'));
  card.append(el('h3', '', credit.title || 'Untitled'), el('p', '', [credit.year, credit.role].filter(Boolean).join(' · '))); return card;
}
function creditSection(label, credits, allHref, ranked = false) {
  const section = el('section', 'credits-section');
  const heading = el('div', 'credit-heading'); heading.append(el('p', 'eyebrow', label));
  if (label === 'Cast credits') { const link = el('a', 'credits-arrow', '→'); link.href = allHref; link.setAttribute('aria-label', 'View complete filmography'); heading.append(link); }
  section.append(heading);
  const ordered = ranked ? [...credits].sort((a, b) => b.popularity - a.popularity) : credits;
  const grid = el('div', 'credits-grid');
  const render = () => {
    const columns = Math.max(2, Math.floor((grid.clientWidth + 16) / 146));
    grid.replaceChildren(...ordered.slice(0, columns * 2).map(creditCard));
  };
  grid._renderPreview = render; grid.replaceChildren(...ordered.slice(0, 8).map(creditCard)); section.append(grid);
  return section;
}
async function loadPerson() {
  try {
    const response = await fetch(`/api/person/${personId}`); const person = await response.json();
    if (!response.ok) throw new Error(person.error || 'Person unavailable');
    document.title = `${person.name} · Absolute`;
    const hero = el('section', 'person-hero'); const image = el('img'); image.src = person.photo_url; image.alt = person.name;
    const copy = el('div', 'person-copy'); copy.append(el('p', 'eyebrow', person.known_for || 'Film artist'), el('h1', '', person.name));
    copy.append(el('p', 'person-facts', [person.birthday, person.place_of_birth, person.deathday && `Died ${person.deathday}`].filter(Boolean).join(' · ')));
    copy.append(el('p', 'biography', person.biography || 'No biography is available yet.')); hero.append(image, copy);
    const allHref = `/person/${person.id}/credits`;
    const groups = [
      ['Director', person.crew.filter(item => item.role === 'Director')],
      ['Producer', person.crew.filter(item => /Producer/.test(item.role) && item.role !== 'Executive Producer')],
      ['Writer', person.crew.filter(item => /Writer|Screenplay|Story|Teleplay/.test(item.role))],
      ['Executive producer', person.crew.filter(item => item.role === 'Executive Producer')]
    ];
    page.replaceChildren(hero, creditSection('Cast credits', person.cast, allHref, true), ...groups.filter(([, credits]) => credits.length).map(([label, credits]) => creditSection(label, credits, allHref)));
    const renderPreviews = () => document.querySelectorAll('.credits-grid').forEach(grid => grid._renderPreview());
    requestAnimationFrame(renderPreviews); window.addEventListener('resize', renderPreviews, { passive: true });
  } catch (error) { page.replaceChildren(el('p', 'loading', error.message)); }
}
loadPerson();
