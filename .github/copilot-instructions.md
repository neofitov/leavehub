# LeaveHub — AI Agent Instructions

These instructions guide any AI dev agent (GitHub Copilot, Claude, etc.) working
on this repository. Follow them for every change.

## Project

LeaveHub is a **paid time-off (PTO) tracker**. Employees submit leave requests
(vacation, sick, personal, unpaid), see their remaining allowance, and upload
supporting documents. Admins (HR/managers) review, approve or reject requests
and manage users and leave types.

## Tech stack (do NOT deviate)

- **Frontend:** HTML, CSS, vanilla **JavaScript (ES modules)**, **Bootstrap 5**
  + Bootstrap Icons. No TypeScript. No React/Vue/Svelte or any UI framework.
- **Build tool:** **Vite** (Node.js + npm).
- **Backend:** **Supabase** — Postgres DB, Auth, Storage.
- **Deployment:** Vercel (static build, SPA rewrites in `vercel.json`).

## Architecture

- **Client-side routing** via the History API in `src/router.js`. The app is a
  single-domain, multi-page experience: each page is its own module under
  `src/pages/` and is lazy-loaded. Clean URLs: `/`, `/login`, `/dashboard`,
  `/requests`, `/requests/new`, `/requests/:id`, `/profile`, `/admin`.
- **Modular design.** Keep pages, components, services and utils in separate
  files. Never build large monolith files.
  - `src/pages/` — one file per screen; default export `async (ctx) => HTMLElement`.
  - `src/components/` — reusable UI (header, footer, toast, dialogs).
  - `src/services/` — all Supabase access (auth, requests, leave types,
    profiles, storage). Pages call services; pages never call Supabase directly.
  - `src/utils/` — small helpers (DOM, dates, escaping).
  - `src/supabase/client.js` — the single Supabase client instance.
- **Layout** is a shell (header + `#app-content` + footer); the router swaps the
  content on navigation and re-renders the header to reflect auth state.

## UI guidelines

- Responsive (desktop + mobile) using Bootstrap's grid and components.
- Use Bootstrap Icons, subtle effects and clear visual cues.
- **Toasts** (`src/components/toast.js`) for errors and significant actions
  (created/updated/deleted). Do not toast obvious outcomes (e.g. "logged in").
- Destructive actions (delete/cancel) use a confirmation dialog/modal.
- **Always escape user-supplied text** with `escapeHtml()` before inserting it
  into HTML.

## Backend & data guidelines

- All schema changes go through **SQL migrations** in `supabase/migrations/`,
  kept in sync with the Supabase project and committed to git.
- Core tables: `profiles`, `user_roles`, `leave_types`, `leave_requests`.
- Use proper relationships (foreign keys), indexes and normalization.
- Files (avatars, request attachments) go in **Supabase Storage** buckets.

## Auth & security guidelines

- **Supabase Auth** (JWT) for register/login/logout.
- Roles: `employee` (default) and `admin`, stored in `user_roles`.
- **Row-Level Security (RLS) is mandatory** and is the real security boundary:
  - Employees can read/insert/update only their **own** leave requests.
  - Admins can read all requests and change status.
  - Use a `SECURITY DEFINER` `is_admin()` helper in policies to avoid recursion.
- Never rely on hiding UI for security — always enforce it server-side via RLS.

## Environment

- Secrets come from `.env` (git-ignored). Frontend uses `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY`. The seed script uses the service_role key locally.

## Workflow

- Work in small, testable slices. After each working slice, **commit and push**
  with a clear message. Keep a real, incremental commit history.
