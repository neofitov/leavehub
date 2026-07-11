import { html, escapeHtml } from '../utils/dom.js';

// Doubles as the 404 page and the fallback when a route module throws. The
// router passes `{ error }` in the latter case; without it, a genuine render
// failure would be indistinguishable from a real "page not found".
export default async function render({ error } = {}) {
  if (error) {
    return html`
      <div class="container py-5">
        <div class="text-center py-5">
          <div class="display-1 text-danger"><i class="bi bi-exclamation-triangle"></i></div>
          <h1 class="h4">Something went wrong</h1>
          <p class="text-muted">This page couldn&rsquo;t be loaded. Please try again.</p>
          <p class="small text-muted mb-4"><code>${escapeHtml(error.message || String(error))}</code></p>
          <a class="btn btn-primary" data-link href="/">
            <i class="bi bi-house me-1"></i>Back home
          </a>
        </div>
      </div>`;
  }

  return html`
    <div class="container py-5">
      <div class="text-center py-5">
        <div class="display-1 fw-bold text-primary">404</div>
        <h1 class="h4">Page not found</h1>
        <p class="text-muted">The page you are looking for doesn&rsquo;t exist.</p>
        <a class="btn btn-primary" data-link href="/">
          <i class="bi bi-house me-1"></i>Back home
        </a>
      </div>
    </div>`;
}
