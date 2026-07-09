// Admin-only data access. Every call here is additionally gated server-side by
// RLS (is_admin()), so a non-admin who reached these functions would get
// empty results or an error rather than data.

import { supabase } from '../supabase/client.js';
import { getCurrentUser } from './session.js';

const REQUEST_SELECT = '*, leave_types (name, color)';

/**
 * All leave requests, newest first, each with its requester's profile attached.
 * leave_requests.user_id references auth.users (not profiles), so PostgREST
 * can't embed the profile directly — we fetch and join the profiles in JS.
 */
export async function listAllRequests({ status } = {}) {
  let query = supabase
    .from('leave_requests')
    .select(REQUEST_SELECT)
    .order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);

  const { data: requests, error } = await query;
  if (error) throw error;
  if (!requests.length) return [];

  const userIds = [...new Set(requests.map((r) => r.user_id))];
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, full_name, department')
    .in('id', userIds);
  if (pErr) throw pErr;

  const byId = Object.fromEntries(profiles.map((p) => [p.id, p]));
  return requests.map((r) => ({ ...r, requester: byId[r.user_id] || null }));
}

/** Approve or reject a request, stamping the reviewer. */
export async function updateRequestStatus(id, status) {
  const admin = getCurrentUser();
  const { data, error } = await supabase
    .from('leave_requests')
    .update({
      status,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(REQUEST_SELECT)
    .single();
  if (error) throw error;
  return data;
}

/** All users with their profile + whether they hold the admin role. */
export async function listUsers() {
  const [profilesRes, rolesRes] = await Promise.all([
    supabase.from('profiles').select('*').order('full_name'),
    supabase.from('user_roles').select('user_id, role'),
  ]);
  if (profilesRes.error) throw profilesRes.error;
  if (rolesRes.error) throw rolesRes.error;

  const adminIds = new Set(
    rolesRes.data.filter((r) => r.role === 'admin').map((r) => r.user_id)
  );
  return profilesRes.data.map((p) => ({ ...p, isAdmin: adminIds.has(p.id) }));
}

/** Grant or revoke the admin role for a user. */
export async function setAdminRole(userId, makeAdmin) {
  if (makeAdmin) {
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: 'admin' });
    if (error && error.code !== '23505') throw error; // ignore "already admin"
  } else {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', 'admin');
    if (error) throw error;
  }
}

/** Set a user's annual leave allowance. */
export async function updateAllowance(userId, days) {
  const { error } = await supabase
    .from('profiles')
    .update({ annual_allowance: days })
    .eq('id', userId);
  if (error) throw error;
}
