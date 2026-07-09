// Landing page (/) - public. Explains the app and routes visitors to login.

import { html } from '../utils/dom.js';
import { getCurrentUser } from '../services/session.js';

const FEATURES = [
  {
    icon: 'bi-calendar-plus',
    title: 'Request in seconds',
    text: 'Pick your dates and leave type, attach a document if needed, and submit.',
  },
  {
    icon: 'bi-speedometer2',
    title: 'Know your balance',
    text: 'See remaining allowance and pending days at a glance on your dashboard.',
  },
  {
    icon: 'bi-shield-check',
    title: 'Manager approvals',
    text: 'Admins review, approve or reject requests with full team visibility.',
  },
];

export default async function render() {
  const user = getCurrentUser();
  const primaryCta = user
    ? `<a class="btn btn-light btn-lg px-4" data-link href="/dashboard">
         <i class="bi bi-speedometer2 me-2"></i>Go to Dashboard
       </a>`
    : `<a class="btn btn-light btn-lg px-4" data-link href="/login">
         <i class="bi bi-box-arrow-in-right me-2"></i>Get started
       </a>`;

  const featureCards = FEATURES.map(
    (f) => `
      <div class="col-md-4">
        <div class="card h-100 border-0 shadow-sm">
          <div class="card-body text-center p-4">
            <div class="display-6 text-primary mb-3"><i class="bi ${f.icon}"></i></div>
            <h3 class="h5 fw-semibold">${f.title}</h3>
            <p class="text-muted mb-0">${f.text}</p>
          </div>
        </div>
      </div>`
  ).join('');

  return html`
    <div>
      <section class="bg-primary text-white py-5">
        <div class="container py-4 text-center">
          <h1 class="display-4 fw-bold mb-3">
            <i class="bi bi-calendar2-heart me-2"></i>LeaveHub
          </h1>
          <p class="lead mb-4 mx-auto" style="max-width: 640px;">
            The simple way to request, track and approve paid time off for your team.
          </p>
          <div class="d-flex justify-content-center gap-3 flex-wrap">
            ${primaryCta}
          </div>
        </div>
      </section>

      <section class="container py-5">
        <div class="row g-4">
          ${featureCards}
        </div>
      </section>
    </div>`;
}
