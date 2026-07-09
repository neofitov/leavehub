// Central place for the current authenticated user + role.
//
// Phase 0: this is an in-memory stub so routing/guards can be built and tested
// without a backend. Phase 1 replaces the internals with real Supabase Auth
// session + the user's role from the `user_roles` table, but the public API
// (getCurrentUser / isAdmin / subscribe) stays the same so pages don't change.

let currentUser = null; // { id, email, fullName, role }
const listeners = new Set();

export function getCurrentUser() {
  return currentUser;
}

export function isAuthenticated() {
  return currentUser !== null;
}

export function isAdmin() {
  return currentUser?.role === 'admin';
}

export function setCurrentUser(user) {
  currentUser = user;
  listeners.forEach((fn) => fn(currentUser));
}

/** Subscribe to auth-state changes. Returns an unsubscribe function. */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
