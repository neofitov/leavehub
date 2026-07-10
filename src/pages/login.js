// Login / Register page (/login) - guest only.
//
// One form serves both modes; `setMode` swaps the copy and reveals the name
// field. Registering with email confirmation on returns the user here in login
// mode with a "check your email" toast rather than logging them straight in.

import { html } from '../utils/dom.js';
import { showToast } from '../components/toast.js';
import { login, register } from '../services/authService.js';

export default async function render() {
  const node = html`
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
          <div class="card border-0 shadow-sm">
            <div class="card-body p-4 p-md-5">
              <div class="text-center mb-4">
                <div class="display-6 text-primary"><i class="bi bi-calendar2-heart"></i></div>
                <h1 class="h4 mt-2 mb-0" id="auth-title">Welcome back</h1>
                <p class="text-muted small" id="auth-subtitle">Log in to your LeaveHub account</p>
              </div>

              <form id="auth-form" novalidate>
                <div class="mb-3 d-none" id="name-group">
                  <label class="form-label" for="fullName">Full name</label>
                  <input class="form-control" id="fullName" type="text" autocomplete="name" />
                </div>
                <div class="mb-3">
                  <label class="form-label" for="email">Email</label>
                  <input class="form-control" id="email" type="email" autocomplete="email" required />
                </div>
                <div class="mb-3">
                  <label class="form-label" for="password">Password</label>
                  <input class="form-control" id="password" type="password" autocomplete="current-password" required minlength="6" />
                  <div class="invalid-feedback">Password must be at least 6 characters.</div>
                </div>
                <button class="btn btn-primary w-100" type="submit" id="submit-btn">
                  <i class="bi bi-box-arrow-in-right me-1"></i><span>Log in</span>
                </button>
              </form>

              <hr class="my-4" />
              <p class="text-center small mb-0">
                <span id="toggle-text">New to LeaveHub?</span>
                <a href="#" id="toggle-mode" class="fw-semibold text-decoration-none">Create an account</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  let mode = 'login'; // 'login' | 'register'
  const form = node.querySelector('#auth-form');
  const nameGroup = node.querySelector('#name-group');
  const nameInput = node.querySelector('#fullName');
  const passwordInput = node.querySelector('#password');
  const submitBtn = node.querySelector('#submit-btn');
  const submitIcon = submitBtn.querySelector('i');

  function setMode(next) {
    mode = next;
    const isRegister = mode === 'register';
    nameGroup.classList.toggle('d-none', !isRegister);
    // Only require (and validate) the name field while it's visible.
    nameInput.required = isRegister;
    // Browsers/password managers offer the right credential for the mode.
    passwordInput.autocomplete = isRegister ? 'new-password' : 'current-password';
    submitIcon.className = isRegister ? 'bi bi-person-plus me-1' : 'bi bi-box-arrow-in-right me-1';
    node.querySelector('#auth-title').textContent = isRegister ? 'Create your account' : 'Welcome back';
    node.querySelector('#auth-subtitle').textContent = isRegister
      ? 'Sign up to start tracking your time off'
      : 'Log in to your LeaveHub account';
    submitBtn.querySelector('span').textContent = isRegister ? 'Create account' : 'Log in';
    node.querySelector('#toggle-text').textContent = isRegister ? 'Already have an account?' : 'New to LeaveHub?';
    node.querySelector('#toggle-mode').textContent = isRegister ? 'Log in' : 'Create an account';
  }

  node.querySelector('#toggle-mode').addEventListener('click', (e) => {
    e.preventDefault();
    setMode(mode === 'login' ? 'register' : 'login');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }
    const email = node.querySelector('#email').value.trim();
    const password = node.querySelector('#password').value;
    const fullName = node.querySelector('#fullName').value.trim();

    submitBtn.disabled = true;
    try {
      if (mode === 'register') {
        const { needsConfirmation } = await register({ email, password, fullName });
        if (needsConfirmation) {
          showToast('Account created. Check your email for a confirmation link, then log in.', 'success');
          form.reset();
          form.classList.remove('was-validated');
          setMode('login');
        }
      } else {
        await login({ email, password });
      }
    } catch (err) {
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });

  return node;
}
