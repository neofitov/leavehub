import { placeholderPage } from './_placeholder.js';

export default async function render() {
  return placeholderPage({
    title: 'New Request',
    icon: 'bi-calendar-plus',
    phase: 'Phase 2',
    note: 'The new leave request form (dates, type, attachment upload) will be here.',
  });
}
