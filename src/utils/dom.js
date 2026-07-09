// Tiny DOM helpers used across pages and components.

/**
 * Tagged-template helper that returns the first root HTMLElement described by
 * the markup. Interpolated values are inserted as-is, so any untrusted / user
 * supplied text MUST be passed through escapeHtml() first.
 *
 * Usage:
 *   const node = html`<div class="card">${escapeHtml(title)}</div>`;
 */
export function html(strings, ...values) {
  const markup = strings.reduce(
    (acc, str, i) => acc + str + (values[i] ?? ''),
    ''
  );
  const template = document.createElement('template');
  template.innerHTML = markup.trim();
  return template.content.firstElementChild;
}

/** Escape a string so it is safe to embed inside HTML text/attributes. */
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Replace all children of a container with a single node. */
export function mount(container, node) {
  container.replaceChildren(node);
}
