# Deployment — Vercel + Neon

GymOS deploys to Vercel (app) + Neon (Postgres). Nothing here needs to be run
from a developer's own machine, and no secret is ever typed into chat or
committed to the repo — every value below is pasted directly into the
Vercel dashboard or GitHub's Actions secrets UI.

## How the build applies migrations

`vercel.json` sets the build command to:

```
prisma migrate deploy && next build
```

`prisma migrate deploy` only applies migrations that haven't run yet against
the target database — it never generates new migrations and never resets
data, so it's safe to run on every single deploy (including re-deploys with
no schema change, where it's a no-op).

## 1. Create the Neon database

In the [Neon console](https://console.neon.tech): create a project, create a
database, and copy its pooled connection string (`postgresql://...`). That's
your `DATABASE_URL`.

## 2. Create the Vercel project

Import the GitHub repo into Vercel. Vercel auto-detects Next.js; the
`vercel.json` build command above is picked up automatically.

## 3. Vercel environment variables

In **Vercel → Project → Settings → Environment Variables**, add these for
the **Production** environment:

| Variable                             | Value                                                                                    |
| ------------------------------------ | ---------------------------------------------------------------------------------------- |
| `DATABASE_URL`                       | The Neon pooled connection string from step 1.                                           |
| `BETTER_AUTH_SECRET`                 | A long random string (e.g. generate 32+ random bytes, base64-encoded). Keep this secret. |
| `BETTER_AUTH_URL`                    | The app's live Vercel URL, e.g. `https://gymos.vercel.app`. See note below.              |
| `SESSION_INACTIVITY_TIMEOUT_MINUTES` | `30` (or your preferred inactivity timeout, in minutes).                                 |
| `SEED_ADMIN_EMAIL`                   | The email for the super admin account the seed script will create.                       |
| `SEED_ADMIN_PASSWORD`                | A strong password for that super admin account.                                          |

**Important — `BETTER_AUTH_URL` is a two-step value:** you don't know the
live URL until after the first deploy. So:

1. Deploy once with a placeholder `BETTER_AUTH_URL` (or Vercel's auto-generated
   preview value — any value works for the build to succeed).
2. After the first deploy succeeds, copy the real production URL Vercel
   assigned (Project → Deployments → the production deployment's URL, or your
   custom domain if you attached one).
3. Update `BETTER_AUTH_URL` in Environment Variables to that exact URL.
4. **Redeploy** (Deployments → ⋯ → Redeploy) so the app picks up the new
   value — env var changes don't apply retroactively to a running
   deployment.

Auth (cookies, callback URLs) will not work correctly until `BETTER_AUTH_URL`
matches the live URL and the app has been redeployed with it set.

## 4. First deploy

Push/merge to `main` (or trigger a deploy from the Vercel dashboard). Vercel
runs `prisma migrate deploy && next build`, which creates all tables on the
fresh Neon database. The app will build and serve, but there is no data yet
— no organization, no roles, no login-capable user — until you run the seed
step below.

## 5. One-time production seed (GitHub Actions, manual)

The database is seeded by a manually-triggered GitHub Actions workflow —
`.github/workflows/seed-production.yml` — never automatically, and never from
a developer's machine.

### 5a. Add the required repo secrets (you do this, in the browser)

In **GitHub → repo → Settings → Secrets and variables → Actions → New
repository secret**, add:

| Secret name           | Value                                                     |
| --------------------- | --------------------------------------------------------- |
| `DATABASE_URL`        | The same Neon connection string you put in Vercel.        |
| `SEED_ADMIN_EMAIL`    | The same value you put in Vercel's `SEED_ADMIN_EMAIL`.    |
| `SEED_ADMIN_PASSWORD` | The same value you put in Vercel's `SEED_ADMIN_PASSWORD`. |

### 5b. Run the workflow (you do this, in the browser)

1. Go to the repo's **Actions** tab.
2. Click **seed-production** in the left-hand workflow list.
3. Click **Run workflow** (top right), confirm the branch (`main`), and click
   **Run workflow** again.
4. Wait for the run to go green. It runs `pnpm install --frozen-lockfile &&
pnpm db:seed`, which creates the demo organization, the full permission
   catalog, the 11 default system roles, and the super admin account
   (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

Run this once, right after the first successful Vercel deploy. The seed
script is idempotent (every write is an upsert on a stable key), so re-running
it later is harmless if you ever need to.

## Summary of secrets and where each one lives

- **Vercel env vars** (Project → Settings → Environment Variables):
  `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`,
  `SESSION_INACTIVITY_TIMEOUT_MINUTES`, `SEED_ADMIN_EMAIL`,
  `SEED_ADMIN_PASSWORD`.
- **GitHub Actions repo secrets** (Settings → Secrets and variables →
  Actions): `DATABASE_URL`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` — used
  only by the manual `seed-production` workflow.

No secret is ever committed to the repo or pasted into a chat session;
`.env.example` / `.env.test.example` only document variable names with
placeholder values.
