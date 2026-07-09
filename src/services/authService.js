// Authentication service.
//
// Phase 0: stubs backed by the in-memory session so the UI wiring (login form,
// logout button, guards) can be built and demoed. Phase 1/2 replace the bodies
// with real Supabase Auth calls (supabase.auth.signUp / signInWithPassword /
// signOut) and load the user's role from the `user_roles` table. The exported
// function signatures stay the same.

import { setCurrentUser } from './session.js';
import { navigate } from '../router.js';

export async function register({ email /*, password, fullName */ }) {
  throw new Error('Registration is wired up in Phase 2 (Supabase Auth).');
}

export async function login({ email /*, password */ }) {
  throw new Error('Login is wired up in Phase 2 (Supabase Auth).');
}

export async function logout() {
  setCurrentUser(null);
  navigate('/', { replace: true });
}

/** Restore an existing session on app start. No-op until Phase 2. */
export async function restoreSession() {
  return null;
}
