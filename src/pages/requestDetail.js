// Request detail (/requests/:id) — view a single request, download its
// attachment, and cancel it while pending.

import { html, escapeHtml } from '../utils/dom.js';
import { getRequest, cancelRequest } from '../services/requestsService.js';
import { getAttachmentUrl } from '../services/storageService.js';
import { navigate } from '../router.js';
import { showToast } from '../components/toast.js';
import { confirmDialog } from '../components/confirmDialog.js';
import { formatRange, formatDate } from '../utils/dates.js';
import { statusBadge, typePill } from '../utils/status.js';

function row(label, valueHtml) {
  return `
    <div class="row py-2 border-bottom">
      <div class="col-4 col-sm-3 text-muted">${label}</div>
      <div class="col-8 col-sm-9">${valueHtml}</div>
    </div>`;
}

export default async function render({ params }) {
  const req = await getRequest(params.id);

  if (!req) {
    return html`
      <div class="container py-5 text-center">
        <div class="display-6 text-muted mb-2"><i class="bi bi-search"></i></div>
        <h1 class="h4">Request not found</h1>
        <p class="text-muted">It may have been removed, or you don’t have access to it.</p>
        <a class="btn btn-primary" data-link href="/requests">Back to my requests</a>
      </div>`;
  }

  const canCancel = req.status === 'pending';

  const node = html`
    <div class="container py-4">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <div class="d-flex align-items-center gap-2 mb-3">
            <a class="btn btn-sm btn-outline-secondary" data-link href="/requests">
              <i class="bi bi-arrow-left"></i>
            </a>
            <h1 class="h3 mb-0">Request #${req.id}</h1>
            <span class="ms-auto">${statusBadge(req.status)}</span>
          </div>

          <div class="card border-0 shadow-sm">
            <div class="card-body p-4">
              ${row('Type', typePill(req.leave_types?.name, req.leave_types?.color))}
              ${row('Dates', escapeHtml(formatRange(req.start_date, req.end_date)))}
              ${row('Duration', `${req.days_count} day(s)`)}
              ${row('Reason', escapeHtml(req.reason || '—'))}
              ${row('Submitted', escapeHtml(formatDate(req.created_at)))}
              ${
                req.reviewed_at
                  ? row('Reviewed', escapeHtml(formatDate(req.reviewed_at)))
                  : ''
              }
              ${row(
                'Attachment',
                req.attachment_url
                  ? `<a href="#" id="download-attachment"><i class="bi bi-paperclip me-1"></i>Download document</a>`
                  : '<span class="text-muted">None</span>'
              )}
            </div>
            ${
              canCancel
                ? `<div class="card-footer bg-body">
                     <button class="btn btn-outline-danger" id="cancel-btn">
                       <i class="bi bi-x-circle me-1"></i>Cancel request
                     </button>
                   </div>`
                : ''
            }
          </div>
        </div>
      </div>
    </div>`;

  // Attachment download via short-lived signed URL.
  const dl = node.querySelector('#download-attachment');
  if (dl) {
    dl.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const url = await getAttachmentUrl(req.attachment_url);
        window.open(url, '_blank', 'noopener');
      } catch (err) {
        showToast(err.message || 'Could not open attachment.', 'error');
      }
    });
  }

  // Cancel (pending only).
  const cancelBtn = node.querySelector('#cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: 'Cancel this request?',
        body: 'This will withdraw your leave request. You can’t undo this.',
        confirmLabel: 'Cancel request',
      });
      if (!ok) return;
      try {
        await cancelRequest(req.id);
        showToast('Request cancelled.', 'info');
        navigate('/requests');
      } catch (err) {
        showToast(err.message || 'Could not cancel request.', 'error');
      }
    });
  }

  return node;
}
