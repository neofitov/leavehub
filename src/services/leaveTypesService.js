// Leave types (Vacation, Sick, ...). Read by everyone; managed by admins.

import { supabase } from '../supabase/client.js';

export async function listLeaveTypes() {
  const { data, error } = await supabase
    .from('leave_types')
    .select('*')
    .order('id');
  if (error) throw error;
  return data;
}

export async function createLeaveType({ name, color, default_days }) {
  const { data, error } = await supabase
    .from('leave_types')
    .insert({ name, color, default_days })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteLeaveType(id) {
  const { error } = await supabase.from('leave_types').delete().eq('id', id);
  if (error) throw error;
}
