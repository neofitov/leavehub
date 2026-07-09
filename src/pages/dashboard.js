// Dashboard (/dashboard) — leave balance + recent requests for the current user.

import { html, escapeHtml } from '../utils/dom.js';
import { getCurrentUser } from '../services/session.js';
import { listMyRequests, summarize } from '../services/requestsService.js';
import { navigate } from '../router.js';
import { formatRange } from '../utils/dates.js';
import { statusBadge, typePill } from '../utils/status.js';

function statCard(label, value, sub, icon, tone) {
  return `
    <div class="col-6 col-lg-3">
      <div class="card border-0 shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex align-items-center justify-content-between">
            <span class="text-muted small text-uppercase">${label}</span>
            <i class="bi ${icon} fs-5 text-${tone}"></i>
          </div>
          <div class="display-6 fw-bold text-${tone}">${value}</div>
          <div class="text-muted small">${sub}</div>
        </div>
      </div>
    </div>`;
}

export default async function render() {
  const user = getCurrentUser();
  const requests = await listMyRequests();
  const s = summarize(requests, { annualAllowance: user.annualAllowance });
  const recent = requests.slice(0, 5);

  const recentRows = recent.length
    ? recent
        .map(
          (r) => `
      <tr class="align-middle" role="button" data-link href="/requests/${r.id}">
        <td>${typePill(r.leave_types?.name, r.leave_types?.color)}</td>
        <td class="text-nowrap">${escapeHtml(formatRange(r.start_date, r.end_date))}</td>
        <td class="text-center">${r.days_count}</td>
        <td>${statusBadge(r.status)}</td>
      </tr>`
        )
        .join('')
    : `<tr><td colspan="4" class="text-center text-muted py-4">
         No requests yet. <a data-link href="/requests/new">Create your first one</a>.
       </td></tr>`;

  const node = html`
    <div class="container py-4">
      <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0">Welcome, ${escapeHtml(user.fullName)}</h1>
          <p class="text-muted mb-0">${escapeHtml(user.department || 'Your leave overview')}</p>
        </div>
        <a class="btn btn-primary" data-link href="/requests/new">
          <i class="bi bi-calendar-plus me-1"></i>New request
        </a>
      </div>

      <div class="row g-3 mb-4">
        ${statCard('Remaining', s.remaining, `of ${s.allowance} days`, 'bi-piggy-bank', 'success')}
        ${statCard('Used', s.used, 'approved this year', 'bi-calendar-check', 'primary')}
        ${statCard('Pending', s.pending, 'awaiting approval', 'bi-hourglass-split', 'warning')}
        ${statCard('Allowance', s.allowance, 'days per year', 'bi-award', 'secondary')}
      </div>

      <div class="card border-0 shadow-sm">
        <div class="card-header bg-body d-flex justify-content-between align-items-center">
          <span class="fw-semibold"><i class="bi bi-clock-history me-1"></i>Recent requests</span>
          <a class="small text-decoration-none" data-link href="/requests">View all</a>
        </div>
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Type</th><th>Dates</th><th class="text-center">Days</th><th>Status</th>
              </tr>
            </thead>
            <tbody>${recentRows}</tbody>
          </table>
        </div>
      </div>
    </div>`;

  node.querySelectorAll('tr[data-link]').forEach((tr) => {
    tr.addEventListener('click', () => navigate(tr.getAttribute('href')));
  });

  return node;
}
