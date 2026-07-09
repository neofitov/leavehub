// Leave-request status metadata + badge markup, reused across pages.

import { escapeHtml } from './dom.js';

export const STATUS_META = {
  pending:   { label: 'Pending',   cls: 'text-bg-warning',   icon: 'bi-hourglass-split' },
  approved:  { label: 'Approved',  cls: 'text-bg-success',   icon: 'bi-check-circle' },
  rejected:  { label: 'Rejected',  cls: 'text-bg-danger',    icon: 'bi-x-circle' },
  cancelled: { label: 'Cancelled', cls: 'text-bg-secondary', icon: 'bi-slash-circle' },
};

/** Returns a Bootstrap badge HTML string for a status. */
export function statusBadge(status) {
  const m = STATUS_META[status] || { label: status, cls: 'text-bg-secondary', icon: 'bi-question-circle' };
  return `<span class="badge ${m.cls} status-pill"><i class="bi ${m.icon} me-1"></i>${m.label}</span>`;
}

/** Small colored dot + name for a leave type. */
export function typePill(name, color) {
  const safeColor = /^#[0-9a-fA-F]{3,8}$/.test(color || '') ? color : '#6c757d';
  return `<span class="d-inline-flex align-items-center">
    <span class="rounded-circle d-inline-block me-2" style="width:.7rem;height:.7rem;background:${safeColor}"></span>${escapeHtml(name || 'Leave')}</span>`;
}
