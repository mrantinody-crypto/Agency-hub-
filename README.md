# Agency Hub

A private, macOS-styled control panel for managing unlimited client brands — contact info,
socials, calendar, scripts, linked docs/sheets, and tasks — with three access levels:
**Admin** (you, sees everything), **Designer** (sees only the brands you assign them),
and **Client** (sees only their own brand, read-only). Free to run using Supabase, Vercel,
GitHub, and Resend free tiers.

**Note on Google Docs/Sheets:** this version has a "Docs & Sheets" section per brand where
you paste and store links so everything lives in one place. True live auto-sync (editing a
Sheet and having it reflect here automatically) needs Google's OAuth setup — a bigger,
separate step. Tell me when you're ready for that and I'll build it as a v3.

---

## Part 1 — Create your free accounts (10 min)

1. **Supabase** → https://supabase.com → Sign up → "New project" → pick any name + password
   (save this DB password somewhere safe) → wait ~2 min for it to spin up.
2. **Resend** → https://resend.com → Sign up (free, 100 emails/day).
3. **GitHub** → https://github.com → Sign up if you don't have one.
4. **Vercel** → https://vercel.com → Sign up using your GitHub account (one click).

---

## Part 2 — Set up the database (5 min)

1. In Supabase, open your project → **SQL Editor** → **New query**.
2. Open the file `supabase/schema.sql` from this project, copy all of it, paste into the
   SQL editor, click **Run**.
3. In Supabase, go to **Project Settings → API**. Copy:
   - **Project URL**
   - **anon public** key
4. Open the `.env.example` file in this project, save a copy as `.env`, and paste those two
   values in.

---

## Part 3 — Put the code on GitHub (5 min)

1. Go to https://github.com/new → name it `agency-hub` → Create repository.
2. On your computer, in this project folder, run:
   ```
   git init
   git add .
   git commit -m "Agency Hub"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/agency-hub.git
   git push -u origin main
   ```
   (If you don't have `git` installed or aren't comfortable with terminal commands, GitHub
   also lets you drag-and-drop the whole folder as a zip through "Add file → Upload files"
   on the repo page.)

---

## Part 4 — Deploy on Vercel (3 min)

1. In Vercel, click **Add New → Project** → import your `agency-hub` GitHub repo.
2. Under **Environment Variables**, add the same two values from your `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Click **Deploy**. You'll get a live URL like `agency-hub.vercel.app` — this is the site
   you and your clients will use.

From now on: any time I update the code and push it to GitHub, Vercel redeploys the live
site automatically.

---

## Part 5 — Make yourself admin (2 min)

1. Visit your live site → **Create an account** with your own email.
2. In Supabase → **Table Editor → profiles**, find your row, change `role` from `client`
   to `admin`. (Or run in SQL Editor: `update profiles set role = 'admin' where email = 'YOUR EMAIL';`)
3. Refresh the site — you'll now see the admin dashboard with the "+ new client" button.

---

## Part 6 — Add a brand, and give people access

1. As admin, click **+ new brand**, fill in their name/socials/website.
2. Ask each designer or client to sign up on the same site with their own email — this
   creates their account automatically. New sign-ups start as "Client" by default.
3. Go to **Team & Access** in your sidebar. Every signed-up person shows up in a table —
   set their role (**Designer** or **Client**) and tick exactly which brands they should see.
   Nobody sees a brand unless it's ticked — no manual database editing needed anymore.

---

## Part 7 — Turn on daily email notifications (10 min)

This uses a Supabase Edge Function (`supabase/functions/send-digest`) that runs once a
day and emails everyone their pending tasks + today's calendar items.

1. Install the Supabase CLI: https://supabase.com/docs/guides/cli (free)
2. From this project folder, run:
   ```
   supabase login
   supabase link --project-ref YOUR-PROJECT-REF
   supabase functions deploy send-digest
   ```
3. In Supabase → **Edge Functions → send-digest → Settings**, add these secrets:
   - `RESEND_API_KEY` — from your Resend account
   - `DIGEST_FROM_EMAIL` — an email address (Resend lets you use their test domain to start)
4. In Supabase → **Database → Cron Jobs** (or via SQL: `select cron.schedule(...)`), schedule
   it to run once daily, e.g. every morning at 8 AM.

I can walk you through any of these steps in more detail, or simplify further once you're
at that stage — no need to do Part 7 until Parts 1–6 are working.

---

## What's already built

- **Admin dashboard** — client list, add new clients, full edit access to everything
- **Client dashboard** — each client logs in and sees only their own account
- Per client: **account/socials info**, **content calendar**, **scripts & copy bank**, **task tracker**
- Row-level security in the database — enforced at the database level, not just hidden in the UI
- Daily email digest function (ready to deploy — see Part 7)

## Local development (optional, if you want to preview before deploying)

```
npm install
npm run dev
```
