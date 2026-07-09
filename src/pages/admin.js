// Admin Panel (/admin) — admin-only. Review all leave requests, manage users
// (roles + allowance) and manage leave types.
//
// The route guard keeps non-admins out of the UI, but RLS + is_admin() is the
// real boundary: every query below is enforced server-side.

import { html, escapeHtml } from '../utils/dom.js';
import {
  listAllRequests,
  updateRequestStatus,
  listUsers,
  setAdminRole,
  updateAllowance,
} from '../services/adminService.js';
import {
  listLeaveTypes,
  createLeaveType,
  deleteLeaveType,
} from '../services/leaveTypesService.js';
import { getCurrentUser } from '../services/session.js';
import { showToast } from '../components/toast.js';
import { confirmDialog } from '../components/confirmDialog.js';
import { formatRange } from '../utils/dates.js';
import { statusBadge, typePill, STATUS_META } from '../utils/status.js';

export default async function render() {
  const me = getCurrentUser();

  const statusOptions = ['', ...Object.keys(STATUS_META)]
    .map(
      (s) =>
        `<option value="${s}">${s ? STATUS_META[s].label : 'All statuses'}</option>`
    )
    .join('');

  const node = html`
    <div class="container py-4">
      <div class="d-flex align-items-center gap-2 mb-3">
        <h1 class="h3 mb-0"><i class="bi bi-shield-lock me-2"></i>Admin panel</h1>
      </div>

      <ul class="nav nav-tabs mb-3" role="tablist">
        <li class="nav-item"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tab-requests" type="button">
          <i class="bi bi-inbox me-1"></i>Requests</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-users" type="button">
          <i class="bi bi-people me-1"></i>Users</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-types" type="button">
          <i class="bi bi-tags me-1"></i>Leave types</button></li>
      </ul>

      <div class="tab-content">
        <!-- Requests -->
        <div class="tab-pane fade show active" id="tab-requests">
          <div class="d-flex justify-content-end mb-2">
            <select class="form-select form-select-sm w-auto" id="status-filter">${statusOptions}</select>
          </div>
          <div class="card border-0 shadow-sm">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                  <tr><th>Employee</th><th>Type</th><th>Dates</th><th class="text-center">Days</th>
                      <th>Reason</th><th>Status</th><th class="text-end">Actions</th></tr>
                </thead>
                <tbody id="requests-body">
                  <tr><td colspan="7" class="text-center py-4 text-muted">Loading…</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Users -->
        <div class="tab-pane fade" id="tab-users">
          <div class="card border-0 shadow-sm">
            <div class="table-responsive">
              <table class="table align-middle mb-0">
                <thead class="table-light">
                  <tr><th>Name</th><th>Department</th><th style="width:9rem">Allowance</th><th class="text-center">Admin</th></tr>
                </thead>
                <tbody id="users-body">
                  <tr><td colspan="4" class="text-center py-4 text-muted">Loading…</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Leave types -->
        <div class="tab-pane fade" id="tab-types">
          <div class="row g-3">
            <div class="col-lg-7">
              <div class="card border-0 shadow-sm">
                <div class="table-responsive">
                  <table class="table align-middle mb-0">
                    <thead class="table-light">
                      <tr><th>Type</th><th class="text-center">Default days</th><th class="text-end">Actions</th></tr>
                    </thead>
                    <tbody id="types-body">
                      <tr><td colspan="3" class="text-center py-4 text-muted">Loading…</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div class="col-lg-5">
              <div class="card border-0 shadow-sm">
                <div class="card-body">
                  <h2 class="h6 mb-3">Add leave type</h2>
                  <form id="type-form" novalidate>
                    <div class="mb-2">
                      <label class="form-label small" for="t-name">Name</label>
                      <input class="form-control form-control-sm" id="t-name" required />
                    </div>
                    <div class="row g-2 mb-3">
                      <div class="col-6">
                        <label class="form-label small" for="t-color">Colour</label>
                        <input class="form-control form-control-color w-100" type="color" id="t-color" value="#0d6efd" />
                      </div>
                      <div class="col-6">
                        <label class="form-label small" for="t-days">Default days</label>
                        <input class="form-control form-control-sm" type="number" id="t-days" min="0" value="0" />
                      </div>
                    </div>
                    <button class="btn btn-primary btn-sm w-100" type="submit">
                      <i class="bi bi-plus-lg me-1"></i>Add type
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  const requestsBody = node.querySelector('#requests-body');
  const usersBody = node.querySelector('#users-body');
  const typesBody = node.querySelector('#types-body');

  // ---- Requests -----------------------------------------------------------
  async function refreshRequests() {
    const status = node.querySelector('#status-filter').value || undefined;
    const rows = await listAllRequests({ status });
    requestsBody.innerHTML = rows.length
      ? rows
          .map(
            (r) => `
        <tr>
          <td>
            <div class="fw-semibold">${escapeHtml(r.requester?.full_name || 'Unknown')}</div>
            <div class="small text-muted">${escapeHtml(r.requester?.department || '')}</div>
          </td>
          <td>${typePill(r.leave_types?.name, r.leave_types?.color)}</td>
          <td class="text-nowrap">${escapeHtml(formatRange(r.start_date, r.end_date))}</td>
          <td class="text-center">${r.days_count}</td>
          <td class="text-truncate" style="max-width:14rem">${escapeHtml(r.reason || '—')}</td>
          <td>${statusBadge(r.status)}</td>
          <td class="text-end text-nowrap">
            ${
              r.status === 'pending'
                ? `<button class="btn btn-sm btn-success me-1" data-approve="${r.id}" title="Approve">
                     <i class="bi bi-check-lg"></i></button>
                   <button class="btn btn-sm btn-outline-danger" data-reject="${r.id}" title="Reject">
                     <i class="bi bi-x-lg"></i></button>`
                : '<span class="text-muted small">—</span>'
            }
          </td>
        </tr>`
          )
          .join('')
      : `<tr><td colspan="7" class="text-center py-4 text-muted">No requests.</td></tr>`;
  }

  node.querySelector('#status-filter').addEventListener('change', () => {
    refreshRequests().catch((e) => showToast(e.message, 'error'));
  });

  // ---- Users --------------------------------------------------------------
  async function refreshUsers() {
    const users = await listUsers();
    usersBody.innerHTML = users
      .map(
        (u) => `
      <tr>
        <td class="fw-semibold">${escapeHtml(u.full_name || '—')}</td>
        <td>${escapeHtml(u.department || '—')}</td>
        <td>
          <input type="number" min="0" class="form-control form-control-sm"
            value="${u.annual_allowance}" data-allowance="${u.id}" style="width:6rem" />
        </td>
        <td class="text-center">
          <div class="form-check form-switch d-inline-block">
            <input class="form-check-input" type="checkbox" role="switch"
              data-role="${u.id}" ${u.isAdmin ? 'checked' : ''}
              ${u.id === me.id ? 'disabled title="You can\'t change your own role"' : ''} />
          </div>
        </td>
      </tr>`
      )
      .join('');
  }

  // ---- Leave types --------------------------------------------------------
  async function refreshTypes() {
    const types = await listLeaveTypes();
    typesBody.innerHTML = types
      .map(
        (t) => `
      <tr>
        <td>${typePill(t.name, t.color)}</td>
        <td class="text-center">${t.default_days}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-danger" data-deltype="${t.id}"
            data-typename="${escapeHtml(t.name)}" title="Delete">
            <i class="bi bi-trash"></i></button>
        </td>
      </tr>`
      )
      .join('');
  }

  node.querySelector('#type-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = node.querySelector('#t-name').value.trim();
    if (!name) return;
    try {
      await createLeaveType({
        name,
        color: node.querySelector('#t-color').value,
        default_days: Number(node.querySelector('#t-days').value) || 0,
      });
      node.querySelector('#type-form').reset();
      node.querySelector('#t-color').value = '#0d6efd';
      showToast(`Leave type "${name}" added.`, 'success');
      await refreshTypes();
    } catch (err) {
      showToast(err.message || 'Could not add leave type.', 'error');
    }
  });

  // ---- Delegated actions --------------------------------------------------
  node.addEventListener('click', async (e) => {
    const approve = e.target.closest('[data-approve]');
    const reject = e.target.closest('[data-reject]');
    const delType = e.target.closest('[data-deltype]');

    try {
      if (approve) {
        await updateRequestStatus(Number(approve.dataset.approve), 'approved');
        showToast('Request approved.', 'success');
        await refreshRequests();
      } else if (reject) {
        const ok = await confirmDialog({
          title: 'Reject this request?',
          body: 'The employee will see it as rejected.',
          confirmLabel: 'Reject',
        });
        if (!ok) return;
        await updateRequestStatus(Number(reject.dataset.reject), 'rejected');
        showToast('Request rejected.', 'info');
        await refreshRequests();
      } else if (delType) {
        const ok = await confirmDialog({
          title: 'Delete leave type?',
          body: `Delete "${escapeHtml(delType.dataset.typename)}"? Types already used by a request cannot be deleted.`,
          confirmLabel: 'Delete',
        });
        if (!ok) return;
        await deleteLeaveType(Number(delType.dataset.deltype));
        showToast('Leave type deleted.', 'info');
        await refreshTypes();
      }
    } catch (err) {
      showToast(err.message || 'Action failed.', 'error');
    }
  });

  node.addEventListener('change', async (e) => {
    const roleToggle = e.target.closest('[data-role]');
    const allowanceInput = e.target.closest('[data-allowance]');
    try {
      if (roleToggle) {
        await setAdminRole(roleToggle.dataset.role, roleToggle.checked);
        showToast(roleToggle.checked ? 'Admin role granted.' : 'Admin role revoked.', 'success');
      } else if (allowanceInput) {
        const days = Number(allowanceInput.value);
        if (Number.isNaN(days) || days < 0) return;
        await updateAllowance(allowanceInput.dataset.allowance, days);
        showToast('Allowance updated.', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Update failed.', 'error');
      await refreshUsers();
    }
  });

  await Promise.all([refreshRequests(), refreshUsers(), refreshTypes()]);
  return node;
}
