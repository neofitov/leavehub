// Client-side router using the History API.
//
// The app is a single-domain, multi-page experience: every page lives in its
// own module under src/pages and is loaded on demand. Each page module exports
// a default async function `(ctx) => HTMLElement`, where ctx = { params, query }.
//
// Route guards:
//   auth: true      -> requires a logged-in user (else redirect to /login)
//   admin: true     -> requires an admin user   (else redirect to /dashboard)
//   guestOnly: true -> only for logged-out users (else redirect to /dashboard)

import { renderHeader } from './components/header.js';
import { getCurrentUser, isAdmin } from './services/session.js';
import { mount } from './utils/dom.js';

const routes = [
  { path: '/', page: () => import('./pages/index.js') },
  { path: '/login', page: () => import('./pages/login.js'), guestOnly: true },
  { path: '/dashboard', page: () => import('./pages/dashboard.js'), auth: true },
  { path: '/requests', page: () => import('./pages/requests.js'), auth: true },
  { path: '/requests/new', page: () => import('./pages/requestNew.js'), auth: true },
  { path: '/requests/:id', page: () => import('./pages/requestDetail.js'), auth: true },
  { path: '/profile', page: () => import('./pages/profile.js'), auth: true },
  { path: '/admin', page: () => import('./pages/admin.js'), auth: true, admin: true },
];

/** Turn a route pattern into a matcher: `/requests/:id` -> regex + param keys. */
function compile(pattern) {
  const keys = [];
  const source = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // escape regex specials in literals
    .replace(/:([A-Za-z0-9_]+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    });
  return { regex: new RegExp(`^${source}$`), keys };
}

function matchRoute(pathname) {
  for (const route of routes) {
    const { regex, keys } = compile(route.path);
    const m = pathname.match(regex);
    if (!m) continue;
    const params = {};
    keys.forEach((key, i) => (params[key] = decodeURIComponent(m[i + 1])));
    return { route, params };
  }
  return null;
}

/** Programmatic navigation. */
export function navigate(url, { replace = false } = {}) {
  if (replace) history.replaceState({}, '', url);
  else history.pushState({}, '', url);
  handleRoute();
}

async function handleRoute() {
  const content = document.getElementById('app-content');
  const query = Object.fromEntries(new URLSearchParams(location.search));

  // Header reflects the current auth state, so refresh it on every navigation.
  renderHeader(document.getElementById('app-header'));

  const matched = matchRoute(location.pathname);
  const user = getCurrentUser();

  if (!matched) {
    const mod = await import('./pages/notFound.js');
    mount(content, await mod.default({ params: {}, query }));
    return;
  }

  const { route, params } = matched;

  // Guards
  if (route.auth && !user) return navigate('/login', { replace: true });
  if (route.admin && !isAdmin()) return navigate('/dashboard', { replace: true });
  if (route.guestOnly && user) return navigate('/dashboard', { replace: true });

  try {
    const mod = await route.page();
    mount(content, await mod.default({ params, query }));
    window.scrollTo(0, 0);
  } catch (err) {
    console.error('Failed to render route', location.pathname, err);
    const mod = await import('./pages/notFound.js');
    mount(content, await mod.default({ params, query, error: err }));
  }
}

/** Intercept in-app link clicks so navigation stays client-side. */
function interceptLinks() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-link]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || link.target === '_blank') return;
    e.preventDefault();
    if (href !== location.pathname + location.search) navigate(href);
  });
}

export function startRouter() {
  interceptLinks();
  window.addEventListener('popstate', handleRoute);
  handleRoute();
}
