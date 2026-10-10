window.setAbsoluteTheme = (color, persist = true) => {
  const fallback = '#83a68f';
  const chosen = /^#[0-9a-f]{6}$/i.test(color || '') ? color : fallback;
  const red = parseInt(chosen.slice(1, 3), 16), green = parseInt(chosen.slice(3, 5), 16), blue = parseInt(chosen.slice(5, 7), 16);
  const channel = value => { const scaled = value / 255; return scaled <= .03928 ? scaled / 12.92 : ((scaled + .055) / 1.055) ** 2.4; };
  const light = .2126 * channel(red) + .7152 * channel(green) + .0722 * channel(blue);
  document.documentElement.style.setProperty('--absolute-accent', chosen);
  document.documentElement.style.setProperty('--absolute-accent-rgb', `${red},${green},${blue}`);
  document.documentElement.style.setProperty('--absolute-accent-ink', (light + .05) / .054 > .966 / (light + .05) ? '#07100a' : '#f7f5ef');
  document.documentElement.style.setProperty('--emerald', chosen);
  document.documentElement.toggleAttribute('data-absolute-theme', Boolean(color));
  if (persist) { if (color) localStorage.setItem('absolute-theme', chosen); else localStorage.removeItem('absolute-theme'); }
};
window.setAbsoluteTheme(localStorage.getItem('absolute-theme'), false);

document.querySelectorAll('.global-search').forEach(form => form.addEventListener('submit', async event => {
  event.preventDefault();
  const input = form.querySelector('.global-search-input');
  const results = form.querySelector('.global-results');
  if (!input.value.trim()) return input.focus();
  form.classList.add('is-searching'); results.textContent = 'Searching…';
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
  finally { form.classList.remove('is-searching'); }
}));
