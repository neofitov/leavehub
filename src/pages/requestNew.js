// New Request (/requests/new) — create a leave request with an optional
// attachment uploaded to Supabase Storage.

import { html, escapeHtml } from '../utils/dom.js';
import { getCurrentUser } from '../services/session.js';
import { listLeaveTypes } from '../services/leaveTypesService.js';
import { createRequest } from '../services/requestsService.js';
import { uploadAttachment } from '../services/storageService.js';
import { navigate } from '../router.js';
import { showToast } from '../components/toast.js';
import { inclusiveDays, todayISO } from '../utils/dates.js';

export default async function render() {
  const user = getCurrentUser();
  const types = await listLeaveTypes();
  const today = todayISO();

  const typeOptions = types
    .map((t) => `<option value="${t.id}">${escapeHtml(t.name)}</option>`)
    .join('');

  const node = html`
    <div class="container py-4">
      <div class="row justify-content-center">
        <div class="col-lg-7">
          <div class="d-flex align-items-center gap-2 mb-3">
            <a class="btn btn-sm btn-outline-secondary" data-link href="/requests">
              <i class="bi bi-arrow-left"></i>
            </a>
            <h1 class="h3 mb-0">New leave request</h1>
          </div>

          <div class="card border-0 shadow-sm">
            <div class="card-body p-4">
              <form id="req-form" novalidate>
                <div class="mb-3">
                  <label class="form-label" for="type">Leave type</label>
                  <select class="form-select" id="type" required>${typeOptions}</select>
                </div>

                <div class="row g-3">
                  <div class="col-sm-6">
                    <label class="form-label" for="start">Start date</label>
                    <input class="form-control" type="date" id="start" min="${today}" value="${today}" required />
                  </div>
                  <div class="col-sm-6">
                    <label class="form-label" for="end">End date</label>
                    <input class="form-control" type="date" id="end" min="${today}" value="${today}" required />
                  </div>
                </div>

                <div class="alert alert-info d-flex align-items-center mt-3 mb-3 py-2" id="days-info">
                  <i class="bi bi-calendar-range me-2"></i>
                  <span>Duration: <strong id="days-count">1</strong> day(s)</span>
                </div>

                <div class="mb-3">
                  <label class="form-label" for="reason">Reason <span class="text-muted">(optional)</span></label>
                  <textarea class="form-control" id="reason" rows="3" placeholder="Add a short note for your manager…"></textarea>
                </div>

                <div class="mb-4">
                  <label class="form-label" for="attachment">
                    Supporting document <span class="text-muted">(optional)</span>
                  </label>
                  <input class="form-control" type="file" id="attachment"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" />
                  <div class="form-text">e.g. a sick note. Max ~5 MB.</div>
                </div>

                <div class="d-flex gap-2">
                  <button class="btn btn-primary" type="submit" id="submit-btn">
                    <i class="bi bi-send me-1"></i>Submit request
                  </button>
                  <a class="btn btn-outline-secondary" data-link href="/requests">Cancel</a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  const startEl = node.querySelector('#start');
  const endEl = node.querySelector('#end');
  const daysEl = node.querySelector('#days-count');
  const daysInfo = node.querySelector('#days-info');
  const form = node.querySelector('#req-form');
  const submitBtn = node.querySelector('#submit-btn');

  function recomputeDays() {
    // Keep end >= start.
    if (endEl.value < startEl.value) endEl.value = startEl.value;
    endEl.min = startEl.value;
    const days = inclusiveDays(startEl.value, endEl.value);
    daysEl.textContent = days;
    daysInfo.classList.toggle('alert-info', days > 0);
    daysInfo.classList.toggle('alert-danger', days <= 0);
    return days;
  }
  startEl.addEventListener('change', recomputeDays);
  endEl.addEventListener('change', recomputeDays);
  recomputeDays();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const days = recomputeDays();
    if (!form.checkValidity() || days <= 0) {
      form.classList.add('was-validated');
      return;
    }

    const fileInput = node.querySelector('#attachment');
    const file = fileInput.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      showToast('Attachment is too large (max 5 MB).', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Submitting…';
    try {
      let attachment_url = null;
      if (file) attachment_url = await uploadAttachment(user.id, file);

      await createRequest({
        leave_type_id: Number(node.querySelector('#type').value),
        start_date: startEl.value,
        end_date: endEl.value,
        days_count: days,
        reason: node.querySelector('#reason').value.trim() || null,
        attachment_url,
      });

      showToast('Leave request submitted.', 'success');
      navigate('/requests');
    } catch (err) {
      showToast(err.message || 'Could not submit request.', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-send me-1"></i>Submit request';
    }
  });

  return node;
}
