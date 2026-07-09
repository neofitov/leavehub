// Site footer. Static content, rendered once at app start.

export function renderFooter(container) {
  const year = new Date().getFullYear();
  container.innerHTML = `
    <div class="border-top bg-body-tertiary mt-5">
      <div class="container py-4 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
        <span class="text-muted small">
          <i class="bi bi-calendar2-heart me-1"></i>
          LeaveHub &copy; ${year} &mdash; PTO tracker
        </span>
        <span class="text-muted small">
          Built with JavaScript, Bootstrap, Vite &amp; Supabase
        </span>
      </div>
    </div>`;
}
