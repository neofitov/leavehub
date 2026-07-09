# LeaveHub 🗓️

A simple **paid time-off (PTO) tracker**. Employees request days off, track
their remaining allowance and upload supporting documents; admins review,
approve or reject requests and manage the team.

Built for the SoftUni **Software Technologies with AI** capstone project using
AI-assisted development.

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | HTML, CSS, vanilla JavaScript (ES modules), Bootstrap 5, Bootstrap Icons |
| Build | Node.js, npm, Vite |
| Backend | Supabase (Postgres DB, Auth, Storage) |
| Hosting | Vercel |

## Features

- Register / login / logout (Supabase Auth, JWT)
- Employee dashboard with leave balance and recent activity
- Create leave requests with date range, type and file attachment
- View / cancel your own requests
- Profile with avatar upload
- Admin panel: approve/reject requests, manage users and leave types
- Row-Level Security enforcing per-user access server-side

## Local development

> Full setup instructions (including Supabase configuration) are completed in
> Phase 1. Quick start for the frontend scaffold:

```bash
npm install        # install dependencies
cp .env.example .env   # then fill in your Supabase keys
npm run dev        # start Vite dev server at http://localhost:5173
```

## Project structure

```
timeoff-tracker/
├─ index.html                 # single HTML entry; #app is the mount point
├─ vite.config.js             # Vite config
├─ vercel.json                # SPA rewrites for client-side routing
├─ .github/copilot-instructions.md  # AI agent instructions
├─ supabase/migrations/       # SQL schema migrations (source of truth)
├─ scripts/                   # seed + tooling
└─ src/
   ├─ main.js                 # entry: mounts shell, starts router
   ├─ router.js               # History API client-side router + guards
   ├─ components/             # header, footer, toast, dialogs
   ├─ pages/                  # one module per screen
   ├─ services/               # Supabase access (auth, requests, ...)
   ├─ supabase/               # Supabase client instance
   ├─ utils/                  # DOM + helpers
   └─ styles/                 # custom CSS
```

## Sample credentials

Provided once seeding is in place (Phase 1):

- **Admin:** `admin@demo.com` / `demo123`
- **Employee:** `demo@demo.com` / `demo123`
