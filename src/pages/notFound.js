import { html } from '../utils/dom.js';

export default async function render() {
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
