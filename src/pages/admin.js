import { placeholderPage } from './_placeholder.js';

export default async function render() {
  return placeholderPage({
    title: 'Admin Panel',
    icon: 'bi-shield-lock',
    phase: 'Phase 3',
    note: 'Approve/reject requests and manage users and leave types here.',
  });
}
