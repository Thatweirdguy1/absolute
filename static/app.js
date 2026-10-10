const $ = selector => document.querySelector(selector);
let movie = { id: 1240889, title: 'Teenage Sex and Death at Camp Miasma', year: 2026 };
let sourceFile = null;
const requestedMovie = new URLSearchParams(location.search);
if (requestedMovie.has('tmdb_id')) movie = {
  id: Number(requestedMovie.get('tmdb_id')),
  title: requestedMovie.get('title') || 'Selected film',
  year: requestedMovie.get('year') || ''
};

function secondsLabel(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function timecode(seconds) {
  const value = Math.max(0, Math.round(seconds));
  return [Math.floor(value / 3600), Math.floor(value % 3600 / 60), value % 60].map(part => String(part).padStart(2, '0')).join(':');
}

async function api(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

function movieResults(container, results) {
  container.replaceChildren(...results.map(result => {
    const button = document.createElement('button');
    button.className = 'result'; button.type = 'button';
    const title = document.createElement('strong'); title.textContent = result.title;
    const year = document.createElement('small'); year.textContent = result.year || 'Release year unknown';
    button.append(title, year);
    button.addEventListener('click', () => { location.href = `/movie/${result.id}`; });
    return button;
  }));
}

async function loadStatus() {
  try {
    const data = await api('/api/status');
    sourceFile = data.file;
    if (sourceFile) {
      $('#file-name').textContent = sourceFile.name;
      $('#file-note').textContent = `${secondsLabel(sourceFile.duration)} · subtitles ignored`;
      if (sourceFile.name.includes('Camp Miasma')) {
        $('#start-time').value = '00:01:24';
        $('#end-time').value = '01:47:18';
      }
    }
    if (!data.tmdb_configured) $('#status').textContent = 'Add your regenerated TMDB token to .env before searching.';
    if (data.job?.state === 'complete' && data.job.result.tmdb_id === movie.id) showResult(data.job.result);
  } catch (error) { setStatus(error.message, true); }
}

$('#search-button').addEventListener('click', async () => {
  const container = $('#search-results');
  container.textContent = 'Searching…';
  try {
    const data = await api(`/api/tmdb/search?q=${encodeURIComponent($('#movie-search').value)}`);
    movieResults(container, data.results);
  } catch (error) { container.textContent = error.message; }
});

$('#file-button').addEventListener('click', async () => {
  try {
    const data = await api('/api/select-file', { method: 'POST' });
    if (!data.file) return;
    sourceFile = data.file;
    $('#file-name').textContent = sourceFile.name;
    $('#file-note').textContent = `${secondsLabel(sourceFile.duration)} · subtitles ignored`;
    $('#movie-details').textContent = `Theatrical cut · ${movie.year} · ${secondsLabel(sourceFile.duration)}`;
    $('#start-time').value = '00:00:00';
    $('#end-time').value = timecode(sourceFile.duration);
    $('#suggestion-note').textContent = '';
  } catch (error) { setStatus(error.message, true); }
});

$('#suggest-button').addEventListener('click', async () => {
  if (!sourceFile) return setStatus('Choose the movie file first.', true);
  const button = $('#suggest-button');
  button.disabled = true;
  button.textContent = 'Watching the beginning and ending…';
  $('#suggestion-note').textContent = 'Looking for transitions around studio logos and closing credits.';
  try {
    const result = await api('/api/suggest-cuts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: sourceFile.path })
    });
    $('#start-time').value = result.start;
    $('#end-time').value = result.end;
    $('#suggestion-note').textContent = `Start confidence: ${result.start_confidence} · End confidence: ${result.end_confidence}. ${result.note}`;
  } catch (error) { $('#suggestion-note').textContent = error.message; }
  finally { button.disabled = false; button.textContent = 'Suggest automatically'; }
});

$('#generate-button').addEventListener('click', async () => {
  if (!sourceFile) return setStatus('Choose the movie file first.', true);
  const button = $('#generate-button');
  button.disabled = true;
  $('.progress').hidden = false;
  try {
    await api('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tmdb_id: movie.id, title: movie.title, year: movie.year, path: sourceFile.path, edition: 'Theatrical', start: $('#start-time').value, end: $('#end-time').value })
    });
    pollJob();
  } catch (error) { button.disabled = false; setStatus(error.message, true); }
});

async function pollJob() {
  try {
    const current = await api('/api/job');
    $('#progress-fill').style.width = `${current.progress}%`;
    setStatus(current.message, current.state === 'error');
    if (current.state === 'complete') {
      $('#generate-button').disabled = false;
      showResult(current.result);
    } else if (current.state === 'error') {
      $('#generate-button').disabled = false;
      setStatus(current.error, true);
    } else setTimeout(pollJob, 700);
  } catch (error) { $('#generate-button').disabled = false; setStatus(error.message, true); }
}

function showResult(result) {
  const canvas = $('#spectrum-canvas');
  const context = canvas.getContext('2d');
  result.colors.forEach((color, index) => { context.fillStyle = color; context.fillRect(index, 0, 1, canvas.height); });
  $('#empty-state').hidden = true;
  $('#stage-title').textContent = `${result.title} · ${result.edition}`;
  $('#spectrum-id').textContent = result.id;
  $('#svg-export').href = result.svg_url;
  $('#json-export').href = result.json_url;
  $('#svg-export').classList.remove('disabled');
  $('#json-export').classList.remove('disabled');
  $('[data-kind="png"]').disabled = false;
}

$('[data-kind="png"]').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = `${movie.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-absolute-spectrum.png`;
  link.href = $('#spectrum-canvas').toDataURL('image/png');
  link.click();
});

function setStatus(message, error = false) {
  $('#status').textContent = message;
  $('#status').classList.toggle('error', error);
}

$('#movie-title').textContent = movie.title;
$('#movie-search').value = movie.title;
$('#movie-details').textContent = `Theatrical cut · ${movie.year || 'Year unknown'} · Choose file`;
loadStatus();
