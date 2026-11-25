# Progress

## Session 1 — Phase 0: Foundation

**Repo:** `prajapatilk2-bot/gymos` (new repo — see `docs/DECISIONS.md` for
why). **Branch:** `phase-0/foundation`.

### Built

- Next.js 16 (App Router, Turbopack) + TypeScript strict + Tailwind v4 +
  pnpm scaffold; folder structure per `docs/ARCHITECTURE.md`.
- Hand-written shadcn/ui-style component library
  (`src/components/ui/*`): button, input, label, card, badge, table,
  dialog, sheet, dropdown-menu, select, switch, tabs, avatar, separator,
  checkbox, tooltip, skeleton, sonner toaster.
- PostgreSQL + Prisma 7 (driver adapter) base schema: `Organization`,
  `Branch`, `User`/`Session`/`Account`/`Verification` (Better Auth, plus
  GymOS additional fields and the `admin` plugin's `role`/`banned`/...
  columns), `Role`, `Permission`, `RolePermission`, `UserRole`,
  `AuditLog`, `LoginHistory`, `ApprovalRequest`, `OrganizationSetting`.
  Two committed migrations.
- Better Auth email/password login (W3): custom `/api/v1/auth/login`
  wrapper recording `LoginHistory` and blocking deactivated users; session
  inactivity auto-logout (configurable, env default 30 min); strong
  password rules (Zod); logout wrapper that writes an `AuditLog` entry.
- RBAC (W1, W2): 150-key permission catalog generated from the 24-module
  registry; 11 default system roles with a documented permission matrix
  (`src/server/modules/permissions/default-roles.ts`,
  `docs/ARCHITECTURE.md`); `requirePermission`/`hasPermission`; branch-scope
  helpers (`orgScope`, `orgBranchScope`, `assertBranchAccess`,
  `getAccessibleBranchIds`).
- Audit log service (append-only, before/after JSON) and generic
  `ApprovalRequest` workflow service (create → pending → approve/reject,
  self-approval blocked).
- App shell: login page; responsive collapsible sidebar (24 modules,
  grouped, filtered by the signed-in user's permissions); topbar with
  branch switcher, light/dark theme toggle, user menu/logout; generic
  "Planned for Phase N" placeholder page for every not-yet-built module.
- Admin panel (W1, W4): Users (list/search, create, deactivate/reactivate,
  reset password, assign roles per branch), Roles (list, create custom
  role, edit permission matrix), Branches (list, create/edit), Organization
  settings (profile fields), Audit log viewer (filterable, paginated).
- Seed script: demo organization + "Main Branch", full permission catalog,
  11 system roles with their default permissions, one demo user per role
  - a super admin from `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`. Idempotent
    (safe to re-run).
- Tests: 13 Vitest unit/integration tests (permission checks — allowed
  _and_ prohibited, across several roles; org/branch scoping; audit log
  isolation and filtering) against a real `gymos_test` Postgres database;
  1 Playwright smoke test (login → dashboard placeholder → logout).
- GitHub Actions CI: install → lint → typecheck → format → unit tests →
  build → E2E, with a Postgres service container.

### Verified locally before finishing

`pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test` (13/13 passed),
`pnpm build` (production build succeeds, all routes compile), `pnpm start`
(serves), `pnpm test:e2e` (1/1 passed) all ran clean.

### Deliberately not done this session

- **Deploy to Vercel/Neon.** The brief said to make the project ready for
  it, not deploy it — the Prisma driver-adapter setup and `DATABASE_URL`
  config are already compatible.
- **Forced "change password on first login" UI.** `mustChangePassword` is
  set correctly on every created/reset account and visible in the admin
  Users API, but nothing yet redirects a user with that flag set to a
  change-password page. Low risk to leave for Phase 1 since Phase 0 has no
  self-service password change page either; flagged here so it isn't
  mistaken for "done."
- **Approval-request admin UI.** The service/schema/API routes exist and
  are tested indirectly, but there's no dedicated screen to review pending
  approvals yet — Phase 0 has no business module that actually creates one.
  Will get a UI once a Phase 1+ module needs it (e.g. refund approval in
  1.3).
- **`shadcn` CLI usage.** Components were hand-written instead (network
  policy blocks `ui.shadcn.com` in this sandbox) — see `docs/DECISIONS.md`.

### Known issues / TODOs for the next session

- No rate limiting on `/api/v1/auth/login` yet (Better Auth has a rate-limit
  plugin available; not wired up).
- `OrganizationSetting` has no admin UI for arbitrary keys yet — only the
  `Organization` profile fields have a form. Fine for Phase 0 since nothing
  else writes a setting yet besides the session-timeout override, which has
  no UI either (env var only for now).
- The branch switcher persists the chosen branch in a plain (non-httpOnly)
  cookie for convenience; nothing sensitive is stored there (just a branch
  id, re-validated server-side on every write via `assertBranchAccess`).

## Session 2 — Phase 0 review fixes

- **Fixed:** `GET /api/v1/approval-requests` had no permission check at
  all — any authenticated user could list every `ApprovalRequest` in the
  organization, including sensitive payloads (refund amounts, stock
  adjustments, manual overrides). Added `requirePermission(ctx,
"admin.approve")` before the listing call, with a comment noting that
  once module-specific approval requests exist (Phase 1+), this should
  also accept the relevant module's own `.approve` key. Added a
  route-level regression test (`tests/unit/approval-requests-route.test.ts`)
  covering both the 403 (no permission) and 200 (has permission) cases.
- **Fixed CI:** `pnpm typecheck` (`tsc --noEmit`) relied on `.next/types`
  (for ambient types like `LayoutProps`) existing from a prior `next dev`/
  `next build`, which is true on a developer machine that's already run
  the app but not in a clean CI checkout — CI failed with `Cannot find
name 'LayoutProps'`. `typecheck` now runs `next typegen` first (generates
  route/layout types without a full build), making it self-contained.
  Also fixed a `pnpm/action-setup` CI failure (duplicate pnpm version:
  the workflow's explicit `version: 10` input conflicted with
  `packageManager: "pnpm@10.28.0"` in `package.json`) by dropping the
  explicit input.
