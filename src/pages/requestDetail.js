import { placeholderPage } from './_placeholder.js';

export default async function render({ params }) {
  return placeholderPage({
    title: `Request #${params.id}`,
    icon: 'bi-file-earmark-text',
    phase: 'Phase 2',
    note: 'Full details of a single leave request, with a cancel action, will be here.',
  });
}
