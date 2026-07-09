// Central place for the current authenticated user + role.
//
// Holds the in-memory view of who is logged in. authService owns the writes:
// it resolves the Supabase Auth user plus the `user_roles` row into the shape
// below and calls setCurrentUser(). Pages read it through getCurrentUser() /
// isAdmin(), and the header re-renders off subscribe().

// { id, email, fullName, avatarUrl, department, annualAllowance, role }
let currentUser = null;
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
