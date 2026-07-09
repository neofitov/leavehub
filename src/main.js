// App entry point: load global styles + Bootstrap, mount the app shell, restore
// any existing session, then start the client-side router.

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import * as bootstrap from 'bootstrap';
import './styles/main.css';

import { renderFooter } from './components/footer.js';
import { restoreSession } from './services/authService.js';
import { startRouter } from './router.js';

// Expose Bootstrap's JS API globally for components that create toasts/modals.
window.bootstrap = bootstrap;

function mountShell() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="d-flex flex-column min-vh-100">
      <header id="app-header"></header>
      <main id="app-content" class="flex-grow-1"></main>
      <footer id="app-footer"></footer>
    </div>`;
  renderFooter(document.getElementById('app-footer'));
}

async function bootstrapApp() {
  mountShell();
  // Must finish before the router runs, or auth guards would see no user and
  // bounce a signed-in visitor to /login on every hard refresh.
  await restoreSession();
  startRouter();
}

bootstrapApp();
