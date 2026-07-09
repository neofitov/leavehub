import { placeholderPage } from './_placeholder.js';

export default async function render() {
  return placeholderPage({
    title: 'Dashboard',
    icon: 'bi-speedometer2',
    phase: 'Phase 2',
    note: 'Your leave balance, pending requests and recent activity will appear here.',
  });
}
