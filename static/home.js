async function buildCollage() {
  const collage = document.querySelector('#cinema-collage');
  try {
    const response = await fetch('/api/home');
    const data = await response.json();
    if (!response.ok) throw new Error();
    if (!data.films.length) throw new Error();
    const films = Array.from({ length: 32 }, (_, index) => data.films[index % data.films.length]);
    films.forEach((film, index) => {
      const link = document.createElement('a'); link.href = `/movie/${film.id}`; link.tabIndex = -1;
      const image = document.createElement('img'); image.src = film.image_url; image.alt = ''; image.loading = index < 8 ? 'eager' : 'lazy';
      link.append(image); collage.append(link);
    });
  } catch { collage.classList.add('collage-fallback'); }
}
buildCollage();
