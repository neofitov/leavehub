// Shared placeholder used by pages that are scaffolded in Phase 0 and built out
// in later phases. Keeps the router/nav fully navigable while backend work lands.

import { html, escapeHtml } from '../utils/dom.js';

export function placeholderPage({ title, icon = 'bi-cone-striped', phase, note }) {
  return html`
    <div class="container py-5">
      <div class="text-center py-5">
        <div class="display-4 text-primary mb-3"><i class="bi ${icon}"></i></div>
        <h1 class="h3">${escapeHtml(title)}</h1>
        <p class="text-muted">${escapeHtml(note || 'This screen is coming together.')}</p>
        ${phase ? `<span class="badge text-bg-secondary">Planned: ${escapeHtml(phase)}</span>` : ''}
      </div>
    </div>`;
}
