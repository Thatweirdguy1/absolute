const content = document.querySelector('#library-content');
const tabs = [...document.querySelectorAll('.library-tabs button')];
const layoutButtons = [...document.querySelectorAll('.view-switch button')];
const search = document.querySelector('#library-search');
const sort = document.querySelector('#library-sort');
const label = document.querySelector('#archive-label');
const count = document.querySelector('#archive-count');
const importFile = document.querySelector('#letterboxd-file');
const importButton = document.querySelector('#letterboxd-import');
const importStatus = document.querySelector('#import-status');
const importReport = document.querySelector('#import-report');
let library = {diary:[], watched:[], watchlist:[], rated:[], spectra:[]};
let view = 'diary';
let layout = 'grid';

const empty = text => Object.assign(document.createElement('p'), {className:'library-empty', textContent:text});
const skeletons = (count = 10) => Array.from({length:count}, () => { const item = document.createElement('div'); item.className = 'poster-skeleton'; item.setAttribute('aria-hidden','true'); item.append(Object.assign(document.createElement('span'),{className:'skeleton skeleton-poster'}), Object.assign(document.createElement('span'),{className:'skeleton skeleton-title'}), Object.assign(document.createElement('span'),{className:'skeleton skeleton-copy'})); return item; });

async function activity(tmdbId, body) {
  const response = await fetch(`/api/activity/${tmdbId}`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
  const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Could not update your library');
  await loadLibrary();
}

function actions(item, kind) {
  const row = document.createElement('div'); row.className = 'card-actions';
  const edit = document.createElement('a'); edit.href = `/movie/${item.tmdb_id}#diary`; edit.textContent = 'Edit'; row.append(edit);
  if (kind === 'diary') {
    edit.href = '#'; edit.addEventListener('click', async event => {
      event.preventDefault();
      const watched_on = prompt('Watched date (YYYY-MM-DD)', item.watched_on); if (watched_on === null) return;
      const rating = prompt('Rating from 0.5 to 5, or leave blank', item.rating ?? ''); if (rating === null) return;
      const review = prompt('Viewing note', item.review || ''); if (review === null) return;
      try { await activity(item.tmdb_id, {action:'edit_log', id:item.id, watched_on, rating, review, rewatch:item.rewatch}); } catch (error) { alert(error.message); }
    });
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Delete'; remove.addEventListener('click', async () => { if (confirm(`Delete this ${item.watched_on} viewing of ${item.title}?`)) await activity(item.tmdb_id, {action:'delete_log', id:item.id}); }); row.append(remove);
  } else if (kind === 'rated') {
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Clear rating'; remove.addEventListener('click', async () => { if (confirm(`Clear your rating for ${item.title}?`)) await activity(item.tmdb_id, {action:'state', rating:null}); }); row.append(remove);
  }
  return row;
}

function card(item, kind) {
  const card = document.createElement('article'); card.className = 'library-card';
  const link = document.createElement('a'); link.href = `/movie/${item.tmdb_id}`; link.className = 'library-card-link';
  if (item.poster_url) { const image = document.createElement('img'); image.src = item.poster_url; image.alt = ''; image.loading = 'lazy'; link.append(image); }
  else { const blank = document.createElement('div'); blank.className = 'poster-blank'; blank.textContent = 'ABSOLUTE'; link.append(blank); }
  const copy = document.createElement('div');
  const title = document.createElement('h2'); title.textContent = item.title;
  const detail = document.createElement('p');
  detail.textContent = kind === 'diary' ? `${item.watched_on}${item.rewatch ? ' · Rewatch' : ''}${item.rating ? ` · ${item.rating} ★` : ''}` : `${item.year || 'Year unknown'}${item.rating ? ` · ${item.rating} ★` : ''}${kind === 'spectra' ? ` · ${item.edition}` : ''}`;
  copy.append(title, detail);
  if (kind === 'spectra') { const code = document.createElement('small'); code.textContent = item.id; copy.append(code); }
  link.append(copy); card.append(link);
  if (['diary','rated'].includes(kind)) card.append(actions(item, kind));
  return card;
}

function sorted(items) {
  const result = [...items]; const value = sort.value;
  result.sort((a,b) => value === 'title' ? a.title.localeCompare(b.title) : value === 'year' ? Number(b.year||0)-Number(a.year||0) : value === 'rating' ? Number(b.rating||0)-Number(a.rating||0) : value === 'watched' ? String(b.watched_on||'').localeCompare(String(a.watched_on||'')) : Number(b.updated_at||b.created_at||0)-Number(a.updated_at||a.created_at||0));
  return result;
}

function render() {
  const query = search.value.trim().toLowerCase();
  const items = sorted((library[view] || []).filter(item => !query || `${item.title} ${item.year||''}`.toLowerCase().includes(query)));
  label.textContent = view === 'spectra' ? 'Absolute Spectrums' : view[0].toUpperCase() + view.slice(1);
  count.textContent = `${items.length} ${items.length === 1 ? 'entry' : 'entries'}`;
  content.className = layout === 'grid' ? 'library-grid' : 'library-list';
  content.replaceChildren(...(items.length ? items.map(item => card(item, view)) : [empty(query ? 'No films match this search.' : `Nothing in ${label.textContent.toLowerCase()} yet.`)]));
}

async function loadLibrary() {
  content.className = 'library-grid'; content.setAttribute('aria-busy','true'); content.replaceChildren(...skeletons());
  try { const response = await fetch('/api/library'); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Library unavailable'); library = data; render(); }
  catch (error) { content.replaceChildren(empty(error.message)); }
  finally { content.setAttribute('aria-busy','false'); }
}

async function loadReport() {
  try {
    const data = await (await fetch('/api/import-report')).json(); if (!data.report) return;
    const rows = Object.entries(data.report.source).map(([key,total]) => `${key}: ${data.report.applied[key]||0}/${total}`).join(' · ');
    const summary = document.createElement('p'); summary.textContent = `Last import verified — ${rows}${data.report.unmatched.length ? ` · ${data.report.unmatched.length} unmatched` : ' · all matched'}`;
    const unique = [...new Map(data.report.unmatched.map(item => [`${item.name}\0${item.year}`, item])).values()];
    const list = document.createElement('ul'); list.className = 'unmatched-list';
    unique.forEach(item => {
      const entry = document.createElement('li'); const title = document.createElement('span'); title.textContent = `${item.name} (${item.year || 'year unknown'})`;
      const query = document.createElement('input'); query.value = item.name; query.setAttribute('aria-label', `Search TMDB match for ${item.name}`);
      const find = document.createElement('button'); find.type = 'button'; find.className = 'quiet-action'; find.textContent = 'Find match';
      find.addEventListener('click', async () => {
        find.disabled = true; find.textContent = 'Searching…';
        try {
          const response = await fetch(`/api/import-candidates?q=${encodeURIComponent(query.value)}&year=${encodeURIComponent(item.year)}`); const result = await response.json(); if (!response.ok) throw new Error(result.error);
          if (!result.results.length) throw new Error('No TMDB matches found');
          const select = document.createElement('select'); select.setAttribute('aria-label', `Match for ${item.name}`);
          result.results.forEach(candidate => { const option = document.createElement('option'); option.value = `${candidate.media_type}:${Math.abs(candidate.id)}`; option.textContent = `${candidate.title} (${candidate.year || 'year unknown'}) · ${candidate.media_type === 'tv' ? 'TV' : 'Film'}`; select.append(option); });
          const save = document.createElement('button'); save.type = 'button'; save.className = 'catalog-button'; save.textContent = 'Save match';
          save.addEventListener('click', async () => { const [media_type,id] = select.value.split(':'); const response = await fetch('/api/import-alias', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:item.name,year:item.year,media_type,id:Number(id)})}); const result = await response.json(); if (!response.ok) return save.textContent = result.error; entry.replaceChildren(`${item.name} matched. Re-import the same ZIP to apply it.`); });
          entry.replaceChildren(title, select, save);
        } catch (error) { find.disabled = false; find.textContent = error.message; }
      });
      entry.append(title, query, find); list.append(entry);
    });
    importReport.replaceChildren(summary, list);
  } catch {}
}

async function pollImport() {
  const response = await fetch('/api/import-job'); const data = await response.json();
  importStatus.textContent = data.error ? `${data.message}: ${data.error}` : `${data.message}${data.state === 'running' ? ` ${data.progress}%` : ''}`;
  importButton.disabled = data.state === 'running'; importButton.classList.toggle('is-loading', data.state === 'running');
  if (data.state === 'running') setTimeout(pollImport, 900);
  if (data.state === 'complete') { await loadLibrary(); await loadReport(); }
}

tabs.forEach(button => button.addEventListener('click', () => { view = button.dataset.view; tabs.forEach(item => item.classList.toggle('active', item === button)); render(); }));
layoutButtons.forEach(button => button.addEventListener('click', () => { layout = button.dataset.layout; layoutButtons.forEach(item => item.classList.toggle('active', item === button)); render(); }));
search.addEventListener('input', render); sort.addEventListener('change', render);
importButton.addEventListener('click', async () => {
  const file = importFile.files[0]; if (!file) return importStatus.textContent = 'Choose your Letterboxd export ZIP first.';
  importButton.disabled = true; importButton.classList.add('is-loading'); importStatus.textContent = 'Uploading your export…';
  try { const response = await fetch('/api/import-letterboxd', {method:'POST', headers:{'Content-Type':'application/zip'}, body:file}); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Import could not start'); pollImport(); }
  catch (error) { importStatus.textContent = error.message; importButton.disabled = false; importButton.classList.remove('is-loading'); }
});

loadLibrary(); loadReport(); pollImport();
