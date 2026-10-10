const page = document.querySelector('#movie-page');
const id = location.pathname.split('/').filter(Boolean).pop();
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

function movieSkeleton() {
  const shell = el('div', 'movie-skeleton'); shell.setAttribute('aria-hidden', 'true');
  const hero = el('div', 'movie-skeleton-hero'); hero.append(el('span', 'skeleton skeleton-kicker'), el('span', 'skeleton skeleton-heading'), el('span', 'skeleton skeleton-heading short'), el('span', 'skeleton skeleton-copy wide'), el('span', 'skeleton skeleton-copy'));
  const rail = el('div', 'movie-skeleton-rail');
  for (let index = 0; index < 4; index += 1) rail.append(el('span', 'skeleton skeleton-poster'));
  shell.append(hero, rail); return shell;
}

function facts(movie) {
  return [movie.year, movie.runtime && `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`, ...movie.genres].filter(Boolean).join(' · ');
}

function spectrumCard(item) {
  const card = el('article', 'spectrum-card');
  const image = el('img');
  image.src = item.svg_url;
  image.alt = `${item.title} Absolute Spectrum`;
  const meta = el('div', 'spectrum-meta');
  meta.append(el('p', 'eyebrow', item.edition), el('h2', '', 'Absolute Spectrum'), el('p', 'spectrum-code', item.id));
  const links = el('div', 'download-row');
  [['Download artwork', item.svg_url], ['Spectrum data', item.json_url]].forEach(([label, href]) => {
    const link = el('a', 'catalog-button', label); link.href = href; link.download = ''; links.append(link);
  });
  meta.append(links); card.append(image, meta); return card;
}

function personCard(person, role) {
  const card = el('a', 'person-card'); card.href = `/person/${person.id}`;
  if (person.photo_url) {
    const image = el('img'); image.src = person.photo_url; image.alt = ''; image.loading = 'lazy'; card.append(image);
  } else {
    const image = el('img', 'person-placeholder'); image.src = '/default-person.png'; image.alt = ''; image.loading = 'lazy'; card.append(image);
  }
  const copy = el('div'); copy.append(el('h3', '', person.name), el('p', '', role)); card.append(copy); return card;
}

function peopleSection(label, people, role) {
  const section = el('section', 'people-section');
  section.append(el('p', 'eyebrow', label));
  const grid = el('div', 'people-grid');
  let visible = 20;
  const more = el('button', 'load-more'); more.type = 'button';
  const render = () => {
    grid.replaceChildren(...people.slice(0, visible).map(person => personCard(person, role(person))));
    more.textContent = `Show 20 more · ${Math.max(0, people.length - visible)} remaining`;
    more.hidden = visible >= people.length;
  };
  more.addEventListener('click', () => { visible += 20; render(); });
  section.append(grid, more); render(); return section;
}

const ratingSelect = (label = 'No rating') => {
  const select = el('select', 'rating-select');
  select.append(new Option(label, ''));
  for (let value = .5; value <= 5; value += .5) select.append(new Option(`${value} ★`, value));
  return select;
};

function activitySection(movie) {
  const section = el('section', 'activity-section');
  const status = el('p', 'activity-status', 'Opening your diary…');
  const banner = el('div', 'diary-banner');
  if (movie.backdrop_url) banner.style.backgroundImage = `linear-gradient(90deg, rgba(9,12,12,.98), rgba(9,12,12,.72)), url("${movie.backdrop_url}")`;
  const bannerCopy = el('div');
  bannerCopy.append(el('p', 'eyebrow', 'Your film diary'), el('h2', '', 'Remember this film.'));
  const diaryFacts = el('p', 'diary-facts');
  diaryFacts.textContent = [movie.title, movie.year, movie.runtime && `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`, movie.directors[0] && `Dir. ${movie.directors[0]}`, ...movie.genres.slice(0, 2)].filter(Boolean).join('  ·  ');
  bannerCopy.append(diaryFacts); banner.append(bannerCopy, status);

  const actions = el('div', 'activity-actions');
  const watched = el('button', 'diary-toggle', '✓  Watched'); watched.type = 'button';
  const watchlist = el('button', 'diary-toggle', '＋  Watchlist'); watchlist.type = 'button';
  const rating = ratingSelect(); const ratingWrap = el('label', 'rating-wrap'); ratingWrap.append(el('span', '', 'Rating'), rating);
  const clearRating = el('button', 'quiet-action', 'Clear rating'); clearRating.type = 'button'; actions.append(watched, watchlist, ratingWrap, clearRating);

  const review = el('textarea'); review.rows = 4; review.placeholder = 'Write your review…'; review.setAttribute('aria-label', 'Your review');
  const spoiler = el('input'); spoiler.type = 'checkbox';
  const spoilerLabel = el('label', 'check-label'); spoilerLabel.append(spoiler, document.createTextNode(' Contains spoilers'));
  const saveReview = el('button', 'catalog-button', 'Save review'); saveReview.type = 'button';
  const deleteReview = el('button', 'quiet-action', 'Delete review'); deleteReview.type = 'button';
  const reviewButtons = el('div', 'form-actions'); reviewButtons.append(deleteReview, saveReview);
  const reviewBox = el('div', 'diary-form'); const reviewHead = el('div', 'diary-form-head'); reviewHead.append(el('h3', '', 'Review'), el('span', '', 'Private review')); reviewBox.append(reviewHead, review, spoilerLabel, reviewButtons);

  const watchedOn = el('input'); watchedOn.type = 'date';
  const today = new Date(); watchedOn.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const rewatch = el('input'); rewatch.type = 'checkbox';
  const rewatchLabel = el('label', 'check-label'); rewatchLabel.append(rewatch, document.createTextNode(' Rewatch'));
  const logRating = ratingSelect('No rating');
  const logReview = el('textarea'); logReview.rows = 3; logReview.placeholder = 'A note about this viewing (optional)';
  const logButton = el('button', 'catalog-button', 'Log this viewing'); logButton.type = 'button';
  const logBox = el('div', 'diary-form'); const logHead = el('div', 'diary-form-head'); logHead.append(el('h3', '', 'Log a viewing'), el('span', '', 'Diary entry')); const dateLabel = el('label', 'field-label', 'Viewing date'); dateLabel.append(watchedOn); const logRatingLabel = el('label', 'field-label', 'Viewing rating'); logRatingLabel.append(logRating); logBox.append(logHead, dateLabel, logRatingLabel, logReview, rewatchLabel, logButton);

  const comment = el('textarea'); comment.rows = 3; comment.placeholder = 'Leave yourself a private comment…';
  const commentButton = el('button', 'catalog-button', 'Add comment'); commentButton.type = 'button';
  const commentBox = el('div', 'diary-form'); const commentHead = el('div', 'diary-form-head'); commentHead.append(el('h3', '', 'Private comments'), el('span', '', 'Only visible to you')); commentBox.append(commentHead, el('p', 'form-note', 'Personal thoughts, emotional reactions, or memory anchors.'), comment, commentButton);
  const history = el('div', 'diary-history');

  const controls = [watched, watchlist, rating, clearRating, saveReview, deleteReview, logButton, commentButton];
  const busy = value => { section.classList.toggle('is-saving', value); status.classList.toggle('is-loading', value); controls.forEach(control => { control.disabled = value; }); };
  const post = async body => {
    busy(true); status.textContent = 'Saving to your private archive…';
    const response = await fetch(`/api/activity/${movie.id}`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
    const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Could not save'); return data;
  };
  const render = data => {
    watched.classList.toggle('active', data.state.watched); watched.setAttribute('aria-pressed', data.state.watched);
    watchlist.classList.toggle('active', data.state.watchlist); watchlist.setAttribute('aria-pressed', data.state.watchlist);
    rating.value = data.state.rating ?? ''; review.value = data.state.review || ''; spoiler.checked = data.state.spoiler;
    clearRating.hidden = data.state.rating == null; deleteReview.hidden = !data.state.review;
    const items = [];
    data.logs.forEach(item => {
      const row = el('div', 'history-item'); row.append(el('p', '', `${item.watched_on}${item.rewatch ? ' · Rewatch' : ''}${item.rating ? ` · ${item.rating} ★` : ''}${item.review ? ` — ${item.review}` : ''}`));
      const controls = el('div', 'history-actions'); const edit = el('button', '', 'Edit'); const remove = el('button', '', 'Delete');
      edit.type = remove.type = 'button'; edit.addEventListener('click', () => { const watched_on = prompt('Watched date (YYYY-MM-DD)', item.watched_on); if (watched_on === null) return; const nextRating = prompt('Rating from 0.5 to 5, or leave blank', item.rating ?? ''); if (nextRating === null) return; const nextReview = prompt('Viewing note', item.review || ''); if (nextReview !== null) act({action:'edit_log', id:item.id, watched_on, rating:nextRating, review:nextReview, rewatch:item.rewatch}); });
      remove.addEventListener('click', () => { if (confirm('Delete this viewing log?')) act({action:'delete_log', id:item.id}); }); controls.append(edit, remove); row.append(controls); items.push(row);
    });
    data.comments.forEach(item => {
      const row = el('div', 'history-item'); row.append(el('p', '', `Private note — ${item.body}`)); const controls = el('div', 'history-actions'); const edit = el('button', '', 'Edit'); const remove = el('button', '', 'Delete'); edit.type = remove.type = 'button';
      edit.addEventListener('click', () => { const body = prompt('Edit private comment', item.body); if (body !== null) act({action:'edit_comment', id:item.id, body}); }); remove.addEventListener('click', () => { if (confirm('Delete this private comment?')) act({action:'delete_comment', id:item.id}); }); controls.append(edit, remove); row.append(controls); items.push(row);
    });
    history.replaceChildren(...(items.length ? items : [el('div', 'history-empty', 'No viewings or comments yet. Your film memories will live here.') ]));
    status.textContent = 'Saved privately on this computer.';
  };
  const act = async body => { try { render(await post(body)); } catch (error) { status.textContent = error.message; } finally { busy(false); } };
  watched.addEventListener('click', () => act({action:'state', watched:!watched.classList.contains('active')}));
  watchlist.addEventListener('click', () => act({action:'state', watchlist:!watchlist.classList.contains('active')}));
  rating.addEventListener('change', () => act({action:'state', rating:rating.value}));
  clearRating.addEventListener('click', () => { if (confirm('Clear your rating?')) act({action:'state', rating:null}); });
  saveReview.addEventListener('click', () => act({action:'state', review:review.value, spoiler:spoiler.checked}));
  deleteReview.addEventListener('click', () => { if (confirm('Delete your review?')) act({action:'state', review:'', spoiler:false}); });
  logButton.addEventListener('click', () => act({action:'log', watched_on:watchedOn.value, rewatch:rewatch.checked, rating:logRating.value, review:logReview.value}));
  commentButton.addEventListener('click', async () => { await act({action:'comment', body:comment.value}); comment.value = ''; });
  const grid = el('div', 'diary-grid'); grid.append(reviewBox, logBox, commentBox);
  const historyHead = el('div', 'history-head'); historyHead.append(el('p', 'eyebrow', 'Film ledger history'), el('span', '', 'Viewings, reviews and private notes'));
  section.append(banner, actions, grid, historyHead, history);
  status.classList.add('is-loading');
  fetch(`/api/activity/${movie.id}`).then(response => response.json()).then(render).catch(error => { status.textContent = error.message; }).finally(() => status.classList.remove('is-loading'));
  return section;
}

async function loadMovie() {
  try {
    const response = await fetch(`/api/movie/${id}`);
    const movie = await response.json();
    if (!response.ok) throw new Error(movie.error || 'Film unavailable');
    document.title = `${movie.title} · Absolute`;
    const hero = el('section', 'movie-hero');
    if (movie.backdrop_url) hero.style.backgroundImage = `linear-gradient(90deg, rgba(8,10,10,.98) 8%, rgba(8,10,10,.72) 58%, rgba(8,10,10,.25)), url("${movie.backdrop_url}")`;
    const copy = el('div', 'hero-copy');
    copy.append(el('p', 'eyebrow', 'An Absolute film'), el('h1', '', movie.title), el('p', 'movie-facts', facts(movie)));
    if (movie.tagline) copy.append(el('p', 'tagline', movie.tagline));
    copy.append(el('p', 'overview', movie.overview || 'No synopsis is available yet.'));
    const credits = el('p', 'makers');
    credits.textContent = [movie.directors.length && `Directed by ${movie.directors.join(', ')}`, movie.writers.length && `Written by ${movie.writers.join(', ')}`].filter(Boolean).join('  ·  ');
    copy.append(credits); hero.append(copy);

    const posters = el('section', 'poster-section');
    posters.append(el('p', 'eyebrow', 'Official posters'));
    const posterGrid = el('div', 'poster-grid');
    const posterUrls = [...new Set(movie.posters.length ? movie.posters : [movie.poster_url].filter(Boolean))];
    posterUrls.forEach((url, index) => { const image = el('img'); image.src = url; image.alt = `${movie.title} official poster ${index + 1}`; image.loading = 'lazy'; posterGrid.append(image); });
    posters.append(posterGrid);

    const spectrum = el('section', 'spectrum-section');
    spectrum.append(el('p', 'eyebrow', 'The film in colour'));
    if (movie.spectra.length) movie.spectra.forEach(item => spectrum.append(spectrumCard(item)));
    else {
      const empty = el('div', 'no-spectrum');
      empty.append(el('h2', '', 'Its Spectrum has not been created yet.'), el('p', '', 'Choose your copy of the film and turn it into a permanent journey through colour.'));
      const create = el('a', 'catalog-button', 'Create this Spectrum');
      create.href = `/create?tmdb_id=${movie.id}&title=${encodeURIComponent(movie.title)}&year=${encodeURIComponent(movie.year)}`;
      empty.append(create); spectrum.append(empty);
    }

    const cast = peopleSection('Cast', movie.cast, person => person.character || 'Role not listed');
    const crew = peopleSection('Crew', movie.crew, person => person.job || person.department || 'Credit not listed');
    page.replaceChildren(hero, activitySection(movie), posters, spectrum, cast, crew); page.setAttribute('aria-busy', 'false');
  } catch (error) { page.replaceChildren(el('p', 'loading', error.message)); page.setAttribute('aria-busy', 'false'); }
}

page.replaceChildren(movieSkeleton());
loadMovie();
