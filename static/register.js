const registerForm = document.getElementById('register-form');
if (registerForm) registerForm.addEventListener('submit', async event => {
  event.preventDefault();
  const status = document.getElementById('register-status');
  const button = registerForm.querySelector('button[type="submit"]');
  button.disabled = true;
  status.textContent = 'Creating your account…';
  try {
    const response = await fetch('/api/register', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(Object.fromEntries(new FormData(registerForm))),
    });
    const result = await response.json();
    status.textContent = result.message || result.error || 'Something went wrong.';
    status.classList.toggle('error', !response.ok);
    if (response.ok) registerForm.reset();
  } catch {
    status.textContent = 'Unable to reach Absolute. Try again.';
    status.classList.add('error');
  } finally { button.disabled = false; }
});

const verifyButton = document.getElementById('verify-button');
if (verifyButton) verifyButton.addEventListener('click', async () => {
  const status = document.getElementById('verify-status');
  const token = new URLSearchParams(location.hash.slice(1)).get('token');
  if (!token) { status.textContent = 'This verification link is incomplete.'; return; }
  history.replaceState(null, '', '/verify-email');
  verifyButton.disabled = true;
  status.textContent = 'Verifying…';
  try {
    const response = await fetch('/api/verify-email', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({token}),
    });
    const result = await response.json();
    status.textContent = result.message || result.error || 'Something went wrong.';
    status.classList.toggle('error', !response.ok);
    if (!response.ok) verifyButton.disabled = false;
  } catch {
    status.textContent = 'Unable to reach Absolute. Try again.';
    verifyButton.disabled = false;
  }
});
