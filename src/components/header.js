// Top navigation bar. Re-rendered by the router on every navigation so it
// always reflects the current auth state and the active route.

import { getCurrentUser, isAdmin } from '../services/session.js';
import { logout } from '../services/authService.js';
import { escapeHtml } from '../utils/dom.js';

function navLink(href, label, icon, active) {
  return `
    <li class="nav-item">
      <a class="nav-link ${active ? 'active fw-semibold' : ''}" data-link href="${href}">
        <i class="bi ${icon} me-1"></i>${label}
      </a>
    </li>`;
}

export function renderHeader(container) {
  const user = getCurrentUser();
  const path = location.pathname;
  const isActive = (href) =>
    href === '/' ? path === '/' : path.startsWith(href);

  let links = '';
  if (user) {
    links += navLink('/dashboard', 'Dashboard', 'bi-speedometer2', isActive('/dashboard'));
    links += navLink('/requests', 'My Requests', 'bi-calendar-check', isActive('/requests'));
    links += navLink('/profile', 'Profile', 'bi-person-circle', isActive('/profile'));
    if (isAdmin()) {
      links += navLink('/admin', 'Admin', 'bi-shield-lock', isActive('/admin'));
    }
  }

  const rightSide = user
    ? `
      <div class="d-flex align-items-center gap-2">
        <span class="text-light small d-none d-sm-inline">
          <i class="bi bi-person me-1"></i>${escapeHtml(user.fullName || user.email)}
        </span>
        <button id="logout-btn" class="btn btn-outline-light btn-sm">
          <i class="bi bi-box-arrow-right me-1"></i>Logout
        </button>
      </div>`
    : `
      <a class="btn btn-light btn-sm" data-link href="/login">
        <i class="bi bi-box-arrow-in-right me-1"></i>Login
      </a>`;

  container.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div class="container">
        <a class="navbar-brand fw-bold" data-link href="/">
          <i class="bi bi-calendar2-heart me-1"></i>LeaveHub
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
          data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false"
          aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="mainNav">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">${links}</ul>
          ${rightSide}
        </div>
      </div>
    </nav>`;

  const logoutBtn = container.querySelector('#logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await logout();
    });
  }
}
