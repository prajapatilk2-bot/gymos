# Decision log

Short entries, newest last. Record a decision here when a future session
would otherwise have to re-derive _why_ something is the way it is.

## Phase 0

**New repo instead of the attached Construction-ERP repo.** The session
that started this project was attached to `prajapatilk2-bot/Construction-ERP`,
which already holds an unrelated, in-progress "Tender ERP" scraper SaaS
(NestJS + Prisma). Reusing it for GymOS would have mixed two unrelated
products in one history. Created `prajapatilk2-bot/gymos` instead.

**Next.js 16 + Tailwind v4 + Prisma 7 + Better Auth, all "latest stable"
at the time.** The brief asked for latest stable versions. `create-next-app`
pulled Next 16 / React 19 / Tailwind v4 by default; `prisma` resolved to a
7.x release-candidate by default (`8.0.0-rc.35`) which was pinned down to
the latest _stable_ 7.x (`7.10.1`) instead, since "latest stable" was
explicit in the brief.

**Prisma 7's new config shape.** Prisma 7 removed `datasource.url` from
`schema.prisma` itself — the connection string now lives in
`prisma.config.ts` (`datasource.url`), and `PrismaClient` is constructed
with an explicit driver adapter (`@prisma/adapter-pg`'s `PrismaPg`) rather
than reading `DATABASE_URL` implicitly. This is already how Neon's
recommended Prisma setup looks, so Phase 0 is Vercel+Neon-ready without
extra migration work later.

**Hand-written shadcn/ui components instead of the `shadcn` CLI.** The
CLI's `init`/`add` commands fetch from `ui.shadcn.com`, which this sandbox's
network policy blocks (403 through the proxy). Rather than provisioning a
new cloud environment just to unblock a code-generation convenience, the
handful of components needed were hand-written following shadcn's own
conventions (Radix primitives + `cva` + `cn`) — same code shape the CLI
would have produced, just typed by hand. `components.json` is still
present and correctly configured, so a later session with network access
can use `pnpm dlx shadcn@latest add <component>` for anything new.

**Better Auth's `admin` plugin, but not for its own authorization.** Needed
a reliable, session-aware server API to create a user (without logging the
acting admin out of their own session) and to reset another user's
password (with Better Auth's own password hasher, not a hand-rolled one).
The `admin` plugin provides exactly `auth.api.createUser` /
`auth.api.setUserPassword` for this. Its own role-based gate is satisfied
by fixing every GymOS user's Better Auth `role` field to `"admin"` at
creation; the actual authorization decision is made by GymOS's own
`requirePermission` before either API is ever called. See
`docs/ARCHITECTURE.md` → "Auth design" for the full reasoning — this is the
one piece of Phase 0 most likely to look surprising on a first read.

**Custom `/api/v1/auth/login` wrapper instead of Better Auth's sign-in
endpoint directly.** Needed to log _every_ login attempt (success and
failure, with a reason) and to block deactivated users before a password
check runs. Better Auth's own endpoint only reliably signals success.
Session/sign-out/etc. still go through the standard Better Auth catch-all
route at `/api/v1/auth/[...all]`.

**`OrganizationSetting` as an extensible key/value table, separate from
`Organization`'s own profile columns.** The spec's W4 settings list
(timings, QR, stock, notification settings, ...) will keep growing every
phase. Profile fields every organization always has (name, GSTIN,
timezone, ...) are plain columns on `Organization`; anything more
optional/module-specific is a `(organizationId, key) → value` row, so
adding one in a later phase never needs a migration.

**Disabled Next.js 16's Cache Components / Partial Prefetching.** Both
assume most routes can be statically shelled. Nearly every GymOS route sits
behind a per-request session check (`getSessionContext`), so the app is
dynamic by nature — fighting that experimental optimization (wrapping
every layout in `Suspense` just to satisfy the prerenderer) wasn't worth it
for an app with essentially no static content.

**Vitest tests run against a real Postgres database (`gymos_test`), not
PGlite/embedded-postgres.** A system Postgres 16 was available and startable
in this sandbox, so the "only if a Postgres server is unavailable" fallback
the brief allowed wasn't needed. `tests/unit/global-setup.ts` applies
committed migrations to `gymos_test` before the suite runs.
