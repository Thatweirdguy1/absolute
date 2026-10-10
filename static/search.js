document.querySelectorAll('.global-search').forEach(form => form.addEventListener('submit', async event => {
  event.preventDefault();
  const input = form.querySelector('.global-search-input');
  const results = form.querySelector('.global-results');
  if (!input.value.trim()) return input.focus();
  results.textContent = 'Searching…';
  try {
    const response = await fetch(`/api/tmdb/search?q=${encodeURIComponent(input.value)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Search unavailable');
    results.replaceChildren(...data.results.map(movie => {
      const link = document.createElement('a'); link.className = 'result'; link.href = `/movie/${movie.id}`;
      const title = document.createElement('strong'); title.textContent = movie.title;
      const year = document.createElement('small'); year.textContent = movie.year || 'Release year unknown';
      link.append(title, year); return link;
    }));
  } catch (error) { results.textContent = error.message; }
}));
