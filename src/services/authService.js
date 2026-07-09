// Authentication service — backed by Supabase Auth.
// Pages/components call these; the current user + role live in session.js.

import { supabase } from '../supabase/client.js';
import { setCurrentUser } from './session.js';
import { navigate } from '../router.js';

/**
 * Build the app-level user object (identity + profile + role) from a Supabase
 * auth user. The role comes from the user_roles table; 'admin' wins if present.
 */
async function loadUserContext(authUser) {
  const [rolesRes, profileRes] = await Promise.all([
    supabase.from('user_roles').select('role').eq('user_id', authUser.id),
    supabase
      .from('profiles')
      .select('full_name, avatar_url, department, annual_allowance')
      .eq('id', authUser.id)
      .maybeSingle(),
  ]);

  const roles = rolesRes.data || [];
  const role = roles.some((r) => r.role === 'admin') ? 'admin' : 'employee';
  const profile = profileRes.data;

  return {
    id: authUser.id,
    email: authUser.email,
    fullName: profile?.full_name || authUser.email,
    avatarUrl: profile?.avatar_url || null,
    department: profile?.department || null,
    annualAllowance: profile?.annual_allowance ?? 0,
    role,
  };
}

export async function register({ email, password, fullName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;

  // With email confirmation disabled, a session is returned immediately.
  if (!data.session) {
    throw new Error(
      'Account created. Please confirm your email, then log in.'
    );
  }

  const user = await loadUserContext(data.user);
  setCurrentUser(user);
  navigate('/dashboard', { replace: true });
}

export async function login({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;

  const user = await loadUserContext(data.user);
  setCurrentUser(user);
  navigate('/dashboard', { replace: true });
}

export async function logout() {
  await supabase.auth.signOut();
  setCurrentUser(null);
  navigate('/', { replace: true });
}

/** Restore an existing session on app start (page reload). */
export async function restoreSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    const user = await loadUserContext(session.user);
    setCurrentUser(user);
  }
  return session;
}
