// Leave-request data access. Employees see only their own rows (enforced by
// RLS); admins see all. Each row embeds its leave_type.

import { supabase } from '../supabase/client.js';
import { getCurrentUser } from './session.js';

const SELECT = '*, leave_types (name, color)';

/** The signed-in user's requests, newest first. Optional status filter. */
export async function listMyRequests({ status } = {}) {
  let query = supabase
    .from('leave_requests')
    .select(SELECT)
    .order('start_date', { ascending: false });
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getRequest(id) {
  const { data, error } = await supabase
    .from('leave_requests')
    .select(SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createRequest({
  leave_type_id,
  start_date,
  end_date,
  days_count,
  reason,
  attachment_url = null,
}) {
  const user = getCurrentUser();
  const { data, error } = await supabase
    .from('leave_requests')
    .insert({
      user_id: user.id,
      leave_type_id,
      start_date,
      end_date,
      days_count,
      reason,
      attachment_url,
      status: 'pending',
    })
    .select(SELECT)
    .single();
  if (error) throw error;
  return data;
}

/** Cancel a still-pending request (RLS only allows own + pending). */
export async function cancelRequest(id) {
  const { data, error } = await supabase
    .from('leave_requests')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .select(SELECT)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Summarise a set of requests into a leave balance for the current year.
 * Unpaid leave does not consume the paid allowance.
 */
export function summarize(requests, { annualAllowance = 0, unpaidTypeName = 'Unpaid' } = {}) {
  const year = new Date().getFullYear();
  let usedPaid = 0;
  let pendingDays = 0;

  for (const r of requests) {
    const y = new Date(r.start_date + 'T00:00:00').getFullYear();
    if (y !== year) continue;
    const isUnpaid = r.leave_types?.name === unpaidTypeName;
    if (r.status === 'approved' && !isUnpaid) usedPaid += r.days_count;
    if (r.status === 'pending') pendingDays += r.days_count;
  }

  return {
    allowance: annualAllowance,
    used: usedPaid,
    pending: pendingDays,
    remaining: Math.max(0, annualAllowance - usedPaid),
  };
}
