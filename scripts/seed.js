// Seed the LeaveHub database with demo users and sample leave requests.
//
//   npm run seed
//
// Uses the Supabase SECRET key (bypasses RLS) — read from .env. Never commit
// that key. Creating an auth user fires the handle_new_user() trigger, which
// auto-creates a profile + default 'employee' role; we then enrich profiles
// and promote the admin.

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// --- Load .env (zero-dependency parser) -----------------------------------
function loadEnv() {
  try {
    const text = readFileSync(new URL('../.env', import.meta.url), 'utf8');
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
    }
  } catch {
    /* .env is optional if the vars are already exported */
  }
}
loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SECRET_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SECRET_KEY in .env');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_PASSWORD = 'demo123';

const USERS = [
  { email: 'admin@demo.com', name: 'Alex Admin',    department: 'People Ops',  role: 'admin',    annual_allowance: 25 },
  { email: 'demo@demo.com',  name: 'Demo Employee', department: 'Engineering', role: 'employee', annual_allowance: 20 },
  { email: 'maria@demo.com', name: 'Maria Ivanova', department: 'Design',      role: 'employee', annual_allowance: 20 },
  { email: 'peter@demo.com', name: 'Peter Petrov',  department: 'Sales',       role: 'employee', annual_allowance: 18 },
];

/** Create a user if missing, otherwise return the existing one. */
async function ensureUser(u) {
  const { data, error } = await db.auth.admin.createUser({
    email: u.email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: u.name },
  });
  if (!error) return data.user;

  if (String(error.message || '').toLowerCase().includes('already')) {
    // Find the existing user by paging through the admin list.
    for (let page = 1; page <= 10; page++) {
      const { data: list } = await db.auth.admin.listUsers({ page, perPage: 200 });
      const found = list.users.find((x) => x.email === u.email);
      if (found) return found;
      if (list.users.length < 200) break;
    }
  }
  throw error;
}

async function main() {
  console.log('Seeding LeaveHub…');

  // Map leave types by name -> id.
  const { data: types, error: typesErr } = await db.from('leave_types').select('id, name');
  if (typesErr) throw typesErr;
  const typeId = Object.fromEntries(types.map((t) => [t.name, t.id]));

  // Create users and enrich their profiles / roles.
  const byEmail = {};
  for (const u of USERS) {
    const authUser = await ensureUser(u);
    byEmail[u.email] = authUser;

    const { error: pErr } = await db
      .from('profiles')
      .update({
        full_name: u.name,
        department: u.department,
        annual_allowance: u.annual_allowance,
      })
      .eq('id', authUser.id);
    if (pErr) throw pErr;

    if (u.role === 'admin') {
      const { error: rErr } = await db
        .from('user_roles')
        .upsert({ user_id: authUser.id, role: 'admin' }, { onConflict: 'user_id,role' });
      if (rErr) throw rErr;
    }
    console.log(`  ✓ ${u.email} (${u.role})`);
  }

  const adminId = byEmail['admin@demo.com'].id;
  const now = new Date().toISOString();

  // Sample requests across statuses. Reset seeded users' requests for idempotency.
  const seededUserIds = ['demo@demo.com', 'maria@demo.com', 'peter@demo.com'].map(
    (e) => byEmail[e].id
  );
  await db.from('leave_requests').delete().in('user_id', seededUserIds);

  const R = (email, type, start, end, days, reason, status) => {
    const reviewed = status === 'approved' || status === 'rejected';
    return {
      user_id: byEmail[email].id,
      leave_type_id: typeId[type],
      start_date: start,
      end_date: end,
      days_count: days,
      reason,
      status,
      reviewed_by: reviewed ? adminId : null,
      reviewed_at: reviewed ? now : null,
    };
  };

  const requests = [
    R('demo@demo.com',  'Vacation', '2026-07-20', '2026-07-24', 5, 'Summer holiday',       'approved'),
    R('demo@demo.com',  'Sick',     '2026-06-10', '2026-06-11', 2, 'Flu',                  'approved'),
    R('demo@demo.com',  'Personal', '2026-08-03', '2026-08-03', 1, 'Doctor appointment',   'pending'),
    R('maria@demo.com', 'Vacation', '2026-07-28', '2026-08-01', 5, 'Trip abroad',          'pending'),
    R('maria@demo.com', 'Sick',     '2026-05-14', '2026-05-15', 2, 'Migraine',             'approved'),
    R('peter@demo.com', 'Unpaid',   '2026-09-07', '2026-09-08', 2, 'Family matters',       'rejected'),
    R('peter@demo.com', 'Personal', '2026-08-19', '2026-08-19', 1, 'Moving apartments',    'pending'),
  ];

  const { error: reqErr } = await db.from('leave_requests').insert(requests);
  if (reqErr) throw reqErr;
  console.log(`  ✓ ${requests.length} leave requests`);

  console.log('\nDone. Demo logins (password: demo123):');
  console.log('  admin@demo.com  (admin)');
  console.log('  demo@demo.com   (employee)');
}

main().catch((err) => {
  console.error('Seed failed:', err.message || err);
  process.exit(1);
});
