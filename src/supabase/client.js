// Single Supabase client instance shared across the app.
// Configured from Vite env vars (see .env.example). All service modules import
// `supabase` from here; pages never talk to Supabase directly.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Supabase's new "publishable" key (sb_publishable_...) — safe to ship in the
// browser; access is controlled by RLS. Replaces the legacy anon key.
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  // Fail loudly during development if env vars are missing.
  console.error(
    'Missing Supabase env vars. Copy .env.example to .env and fill in ' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.'
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
