// Toast notifications.
//
// Usage:
//   import { showToast } from '../components/toast.js';
//   showToast('Request submitted', 'success');
//   showToast('Something went wrong', 'error');
//
// Guidelines (per project spec): show errors always, and info toasts after
// significant user actions (created / updated / deleted). Do NOT toast obvious
// outcomes like "login successful" or "table loaded".

import { escapeHtml } from '../utils/dom.js';

const VARIANTS = {
  success: { cls: 'text-bg-success', icon: 'bi-check-circle' },
  error: { cls: 'text-bg-danger', icon: 'bi-exclamation-triangle' },
  info: { cls: 'text-bg-primary', icon: 'bi-info-circle' },
  warning: { cls: 'text-bg-warning', icon: 'bi-exclamation-circle' },
};

function getContainer() {
  let el = document.getElementById('toast-container');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast-container';
    el.className = 'toast-container position-fixed top-0 end-0 p-3';
    el.style.zIndex = '1090';
    document.body.appendChild(el);
  }
  return el;
}

export function showToast(message, type = 'info', { delay = 4000 } = {}) {
  const variant = VARIANTS[type] ?? VARIANTS.info;
  const container = getContainer();

  const el = document.createElement('div');
  el.className = `toast align-items-center border-0 ${variant.cls}`;
  el.setAttribute('role', 'alert');
  el.setAttribute('aria-live', 'assertive');
  el.setAttribute('aria-atomic', 'true');
  el.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <i class="bi ${variant.icon} me-2"></i>${escapeHtml(message)}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto"
        data-bs-dismiss="toast" aria-label="Close"></button>
    </div>`;
  container.appendChild(el);

  // bootstrap is loaded globally in main.js
  const toast = window.bootstrap
    ? new window.bootstrap.Toast(el, { delay })
    : null;
  if (toast) {
    el.addEventListener('hidden.bs.toast', () => el.remove());
    toast.show();
  } else {
    setTimeout(() => el.remove(), delay);
  }
}
