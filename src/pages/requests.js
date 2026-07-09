// My Requests (/requests) — full list with a status filter.

import { html, escapeHtml } from '../utils/dom.js';
import { listMyRequests } from '../services/requestsService.js';
import { navigate } from '../router.js';
import { formatRange } from '../utils/dates.js';
import { statusBadge, typePill, STATUS_META } from '../utils/status.js';

const FILTERS = ['all', ...Object.keys(STATUS_META)];

export default async function render({ query }) {
  const active = FILTERS.includes(query.status) ? query.status : 'all';
  const requests = await listMyRequests(
    active === 'all' ? {} : { status: active }
  );

  const filterBtns = FILTERS.map((f) => {
    const label = f === 'all' ? 'All' : STATUS_META[f].label;
    return `<a class="btn btn-sm ${f === active ? 'btn-primary' : 'btn-outline-secondary'}"
              data-link href="/requests${f === 'all' ? '' : `?status=${f}`}">${label}</a>`;
  }).join('');

  const rows = requests.length
    ? requests
        .map(
          (r) => `
      <tr class="align-middle" role="button" data-link href="/requests/${r.id}">
        <td>${typePill(r.leave_types?.name, r.leave_types?.color)}</td>
        <td class="text-nowrap">${escapeHtml(formatRange(r.start_date, r.end_date))}</td>
        <td class="text-center">${r.days_count}</td>
        <td class="text-truncate" style="max-width:16rem">${escapeHtml(r.reason || '—')}</td>
        <td>${statusBadge(r.status)}</td>
      </tr>`
        )
        .join('')
    : `<tr><td colspan="5" class="text-center text-muted py-4">No ${active === 'all' ? '' : active} requests.</td></tr>`;

  const node = html`
    <div class="container py-4">
      <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
        <h1 class="h3 mb-0">My requests</h1>
        <a class="btn btn-primary" data-link href="/requests/new">
          <i class="bi bi-calendar-plus me-1"></i>New request
        </a>
      </div>

      <div class="btn-group flex-wrap mb-3" role="group" aria-label="Filter by status">
        ${filterBtns}
      </div>

      <div class="card border-0 shadow-sm">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Type</th><th>Dates</th><th class="text-center">Days</th><th>Reason</th><th>Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    </div>`;

  node.querySelectorAll('tr[data-link]').forEach((tr) => {
    tr.addEventListener('click', () => navigate(tr.getAttribute('href')));
  });

  return node;
}
