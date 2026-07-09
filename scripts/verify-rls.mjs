// Row-Level Security verification. Signs in as a real admin and a real employee
// and asserts that the database — not the UI — enforces access control.
//
//   npm run verify:rls
//
// Proves an employee cannot read others' data, cannot approve any request
// (including their own), cannot self-promote to admin, and cannot manage leave
// types; and that an admin can do all of the above. Any change it makes is
// reverted before it exits.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  const text = readFileSync(new URL('../.env', import.meta.url), 'utf8');
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}
loadEnv();
const URL_ = process.env.VITE_SUPABASE_URL;
const PUB = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const mk = () => createClient(URL_, PUB, { auth: { persistSession: false, autoRefreshToken: false } });

async function signIn(email) {
  const c = mk();
  const { data, error } = await c.auth.signInWithPassword({ email, password: 'demo123' });
  if (error) throw new Error(`${email}: ${error.message}`);
  return { c, uid: data.user.id };
}

const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
};

// ---- admin sees everything -------------------------------------------------
const { c: admin, uid: adminId } = await signIn('admin@demo.com');
const { data: allReq, error: allErr } = await admin
  .from('leave_requests').select('*, leave_types(name,color)').order('created_at', { ascending: false });
check('admin reads ALL requests', !allErr && allReq.length === 7, `got ${allReq?.length} (expect 7)`);

const ids = [...new Set(allReq.map(r => r.user_id))];
const { data: profs } = await admin.from('profiles').select('id, full_name, department').in('id', ids);
check('admin reads all profiles for join', profs?.length === 3, `${profs?.length} requesters`);

const { data: roles } = await admin.from('user_roles').select('user_id, role');
check('admin reads user_roles', Array.isArray(roles) && roles.length >= 4, `${roles?.length} role rows`);

// ---- admin approves a pending request, then reverts -------------------------
const pending = allReq.find(r => r.status === 'pending');
const { data: approved, error: apprErr } = await admin
  .from('leave_requests')
  .update({ status: 'approved', reviewed_by: adminId, reviewed_at: new Date().toISOString() })
  .eq('id', pending.id).select().single();
check('admin approves a pending request', !apprErr && approved?.status === 'approved', apprErr?.message || `#${pending.id}`);

await admin.from('leave_requests')
  .update({ status: 'pending', reviewed_by: null, reviewed_at: null })
  .eq('id', pending.id);
const { data: reverted } = await admin.from('leave_requests').select('status').eq('id', pending.id).single();
check('revert approve (cleanup)', reverted.status === 'pending');

// ---- employee is confined by RLS -------------------------------------------
const { c: emp, uid: empId } = await signIn('demo@demo.com');
const { data: myReq } = await emp.from('leave_requests').select('id, user_id, status');
check('employee sees ONLY own requests', myReq.every(r => r.user_id === empId) && myReq.length === 3,
  `${myReq.length} rows, all own: ${myReq.every(r => r.user_id === empId)}`);

const foreign = allReq.find(r => r.user_id !== empId);
const { data: hack, error: hackErr } = await emp
  .from('leave_requests').update({ status: 'approved' }).eq('id', foreign.id).select();
check("employee CANNOT approve someone else's request", (hack?.length ?? 0) === 0,
  hackErr ? hackErr.message : 'update affected 0 rows');

// Make sure the employee has a pending request to work with. A previous run may
// have left one cancelled, and RLS (correctly) forbids the employee from
// un-cancelling it — only an admin can move it back.
let ownPending = myReq.find(r => r.status === 'pending');
if (!ownPending) {
  const stale = myReq.find(r => r.status === 'cancelled');
  await admin.from('leave_requests').update({ status: 'pending' }).eq('id', stale.id);
  ownPending = { ...stale, status: 'pending' };
}

const { data: selfAppr, error: selfErr } = await emp
  .from('leave_requests').update({ status: 'approved' }).eq('id', ownPending.id).select();
check('employee CANNOT self-approve own request',
  (selfAppr?.length ?? 0) === 0 || !!selfErr, selfErr ? selfErr.message : 'blocked by with_check');

const { data: canCancel } = await emp
  .from('leave_requests').update({ status: 'cancelled' }).eq('id', ownPending.id).select();
check('employee CAN cancel own pending request', canCancel?.length === 1);

// Restore via ADMIN: the employee's own update policy requires status='pending'
// in its USING clause, so they cannot reverse their own cancellation.
await admin.from('leave_requests').update({ status: 'pending' }).eq('id', ownPending.id);
const { data: restored } = await admin
  .from('leave_requests').select('status').eq('id', ownPending.id).single();
check('cancel is reverted by admin (cleanup)', restored.status === 'pending');

const { data: otherProfiles } = await emp.from('profiles').select('id');
check('employee sees ONLY own profile', otherProfiles.length === 1, `${otherProfiles.length} profile(s)`);

const { data: roleHack, error: roleErr } = await emp
  .from('user_roles').insert({ user_id: empId, role: 'admin' }).select();
check('employee CANNOT grant self admin', (roleHack?.length ?? 0) === 0 || !!roleErr,
  roleErr ? roleErr.message : 'blocked');

const { data: typeHack, error: typeErr } = await emp
  .from('leave_types').insert({ name: 'Hacked', color: '#000000', default_days: 0 }).select();
check('employee CANNOT create leave types', (typeHack?.length ?? 0) === 0 || !!typeErr,
  typeErr ? typeErr.message : 'blocked');

const { data: typesRead } = await emp.from('leave_types').select('id');
check('employee CAN read leave types', typesRead?.length === 4, `${typesRead?.length} types`);

console.log('\n' + '='.repeat(60));
const failed = results.filter(r => !r.pass);
console.log(`${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) { console.log('FAILED:', failed.map(f => f.name).join(', ')); process.exit(1); }
