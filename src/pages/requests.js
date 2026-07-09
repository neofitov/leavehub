import { placeholderPage } from './_placeholder.js';

export default async function render() {
  return placeholderPage({
    title: 'My Requests',
    icon: 'bi-calendar-check',
    phase: 'Phase 2',
    note: 'The list of your leave requests, filterable by status, will live here.',
  });
}
