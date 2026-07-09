import { placeholderPage } from './_placeholder.js';

export default async function render() {
  return placeholderPage({
    title: 'Profile',
    icon: 'bi-person-circle',
    phase: 'Phase 2',
    note: 'Edit your name, department and upload an avatar photo here.',
  });
}
