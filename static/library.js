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
let library = {diary:[], watched:[], watchlist:[], reviews:[], rated:[], spectra:[]};
let view = 'diary';
let layout = 'grid';

const empty = text => Object.assign(document.createElement('p'), {className:'library-empty', textContent:text});

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
  } else if (kind === 'reviews') {
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Delete review'; remove.addEventListener('click', async () => { if (confirm(`Delete your review of ${item.title}?`)) await activity(item.tmdb_id, {action:'state', review:'', spoiler:false}); }); row.append(remove);
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
  if (item.review) { const review = document.createElement('p'); review.className = 'library-review'; review.textContent = item.spoiler ? 'Review contains spoilers' : item.review; copy.append(review); }
  if (kind === 'spectra') { const code = document.createElement('small'); code.textContent = item.id; copy.append(code); }
  link.append(copy); card.append(link);
  if (['diary','reviews','rated'].includes(kind)) card.append(actions(item, kind));
  return card;
}

function sorted(items) {
  const result = [...items]; const value = sort.value;
  result.sort((a,b) => value === 'title' ? a.title.localeCompare(b.title) : value === 'year' ? Number(b.year||0)-Number(a.year||0) : value === 'rating' ? Number(b.rating||0)-Number(a.rating||0) : value === 'watched' ? String(b.watched_on||'').localeCompare(String(a.watched_on||'')) : Number(b.updated_at||b.created_at||0)-Number(a.updated_at||a.created_at||0));
  return result;
}

function render() {
  const query = search.value.trim().toLowerCase();
  const items = sorted((library[view] || []).filter(item => !query || `${item.title} ${item.review||''} ${item.year||''}`.toLowerCase().includes(query)));
  label.textContent = view === 'spectra' ? 'Absolute Spectrums' : view[0].toUpperCase() + view.slice(1);
  count.textContent = `${items.length} ${items.length === 1 ? 'entry' : 'entries'}`;
  content.className = layout === 'grid' ? 'library-grid' : 'library-list';
  content.replaceChildren(...(items.length ? items.map(item => card(item, view)) : [empty(query ? 'No films match this search.' : `Nothing in ${label.textContent.toLowerCase()} yet.`)]));
}

async function loadLibrary() {
  try { const response = await fetch('/api/library'); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Library unavailable'); library = data; render(); }
  catch (error) { content.replaceChildren(empty(error.message)); }
}

async function loadReport() {
  try { const data = await (await fetch('/api/import-report')).json(); if (!data.report) return; const rows = Object.entries(data.report.source).map(([key,total]) => `${key}: ${data.report.applied[key]||0}/${total}`).join(' · '); importReport.textContent = `Last import verified — ${rows}${data.report.unmatched.length ? ` · ${data.report.unmatched.length} unmatched` : ' · all matched'}`; } catch {}
}

async function pollImport() {
  const response = await fetch('/api/import-job'); const data = await response.json();
  importStatus.textContent = data.error ? `${data.message}: ${data.error}` : `${data.message}${data.state === 'running' ? ` ${data.progress}%` : ''}`;
  importButton.disabled = data.state === 'running';
  if (data.state === 'running') setTimeout(pollImport, 900);
  if (data.state === 'complete') { await loadLibrary(); await loadReport(); }
}

tabs.forEach(button => button.addEventListener('click', () => { view = button.dataset.view; tabs.forEach(item => item.classList.toggle('active', item === button)); render(); }));
layoutButtons.forEach(button => button.addEventListener('click', () => { layout = button.dataset.layout; layoutButtons.forEach(item => item.classList.toggle('active', item === button)); render(); }));
search.addEventListener('input', render); sort.addEventListener('change', render);
importButton.addEventListener('click', async () => {
  const file = importFile.files[0]; if (!file) return importStatus.textContent = 'Choose your Letterboxd export ZIP first.';
  importButton.disabled = true; importStatus.textContent = 'Uploading your export…';
  try { const response = await fetch('/api/import-letterboxd', {method:'POST', headers:{'Content-Type':'application/zip'}, body:file}); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Import could not start'); pollImport(); }
  catch (error) { importStatus.textContent = error.message; importButton.disabled = false; }
});

loadLibrary(); loadReport(); pollImport();
