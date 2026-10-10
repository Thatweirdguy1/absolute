const grid = document.querySelector('#popular-grid');
const more = document.querySelector('#popular-more');
let page = 1;

function card(movie, rank) {
  const link = document.createElement('a'); link.className = 'popular-card'; link.href = `/movie/${movie.id}`;
  if (movie.poster_url) { const image = document.createElement('img'); image.src = movie.poster_url; image.alt = ''; image.loading = 'lazy'; link.append(image); }
  else { const blank = document.createElement('div'); blank.className = 'poster-blank'; blank.textContent = 'ABSOLUTE'; link.append(blank); }
  const number = document.createElement('span'); number.className = 'popular-number'; number.textContent = String(rank).padStart(2, '0');
  const title = document.createElement('h2'); title.textContent = movie.title;
  const detail = document.createElement('p'); detail.textContent = `${movie.year || 'Year unknown'}${movie.rating ? ` · ${movie.rating.toFixed(1)} TMDB` : ''}`;
  link.append(number, title, detail); return link;
}

async function load() {
  more.disabled = true;
  try {
    const response = await fetch(`/api/popular?page=${page}`); const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Popular films are unavailable');
    if (page === 1) grid.replaceChildren();
    const start = (page - 1) * 20; data.results.forEach((movie, index) => grid.append(card(movie, start + index + 1)));
    more.hidden = page >= data.total_pages; more.disabled = false; page += 1;
  } catch (error) { if (page === 1) grid.textContent = error.message; more.hidden = true; }
}
more.addEventListener('click', load); load();
