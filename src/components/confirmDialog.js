// Promise-based confirmation modal (Bootstrap). Resolves true on confirm,
// false on cancel/dismiss. Body/title are trusted markup — escape any
// user-supplied text before passing it in.

export function confirmDialog({
  title = 'Are you sure?',
  body = '',
  confirmLabel = 'Confirm',
  variant = 'danger',
} = {}) {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'modal fade';
    el.tabIndex = -1;
    el.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${title}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">${body}</div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-${variant}" id="confirm-ok">${confirmLabel}</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(el);

    const modal = new window.bootstrap.Modal(el);
    let confirmed = false;
    el.querySelector('#confirm-ok').addEventListener('click', () => {
      confirmed = true;
      modal.hide();
    });
    el.addEventListener('hidden.bs.modal', () => {
      el.remove();
      resolve(confirmed);
    });
    modal.show();
  });
}
