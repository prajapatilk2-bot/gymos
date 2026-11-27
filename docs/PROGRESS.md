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

## Session 3 — Vercel + Neon deploy readiness

### Built

- `vercel.json`: `buildCommand` runs `prisma migrate deploy && next build`
  on every deploy. `migrate deploy` only applies migrations not yet run, so
  it's a safe no-op on deploys with no schema change — verified locally
  (second `migrate deploy` run reported "No pending migrations to apply").
- `.github/workflows/seed-production.yml`: `workflow_dispatch`-only (no
  push/PR trigger) workflow that runs `pnpm install --frozen-lockfile &&
pnpm db:seed` against repo secrets `DATABASE_URL`, `SEED_ADMIN_EMAIL`,
  `SEED_ADMIN_PASSWORD`. For the user to run once, by hand, from the
  Actions tab, after the first successful Vercel deploy.
- `docs/DEPLOYMENT.md`: full Vercel + Neon walkthrough — Neon project
  setup, Vercel env vars, the two-step `BETTER_AUTH_URL` dance (placeholder
  → first deploy → real URL → redeploy), and the one-time production seed
  via the Actions tab.
- `docs/ROADMAP.md` Phase 0 "First deploy" item split into "deploy
  readiness" (done this session) vs. the actual first deploy (still
  pending — needs the user's own Vercel/Neon accounts).

### Verified locally before finishing

Spun up a disposable local Postgres 16 cluster (`gymos` + `gymos_test`
databases) in the sandbox — nothing was run against Neon or any shared
database. `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test` (15/15
passed), and `pnpm exec prisma migrate deploy && pnpm build` (mirroring the
new `vercel.json` build command exactly) all ran clean. `.env`/`.env.test`
were created only for this local run and deleted afterward (both
gitignored; `git status` confirmed nothing leaked).

### Deliberately not done this session

- **Actually deploying to Vercel/Neon.** Creating the Neon project, the
  Vercel project, and setting the real environment variables all require
  the user's own accounts/browser — see `docs/DEPLOYMENT.md` for the exact
  steps.
- **Running `seed-production.yml` for real.** It needs the repo secrets the
  user adds themselves, against a real Neon database that doesn't exist
  yet from this session's perspective.
- **E2E smoke test / full CI run.** Not re-run this session — no code
  changed in `src/`, only build config, a new manual-only workflow, and
  docs. The GitHub Actions CI workflow (`ci.yml`) is unaffected (it already
  runs its own `prisma migrate deploy` step separately from `pnpm build`).

## Session 4 — Phase 1.1: Member Management

**Branch:** `claude/sleepy-hawking-caenop`.

### Built

- Prisma models (C1–C4 + Members & Reception checklist row): `Member`
  (core profile, emergency contact fields, status enum, tag array,
  `mergedIntoId` self-relation), `MemberHealthDeclaration` (separate
  table, gated by `sensitive.health.*`), `MemberDocument`, `MemberConsent`,
  `Visitor`, `GuestPass`. `Organization.memberSequence` for atomic
  sequential member-code generation. See `docs/DECISIONS.md` "Phase 1.1"
  for the reasoning behind each modelling choice.
- `src/server/modules/members/{schema,service,csv}.ts` +
  `visitors.{schema,service}.ts` + `guest-passes.{schema,service}.ts`:
  registration with duplicate detection and auto-generated member
  ID/card number (C1); directory listing with search, status/tag/branch/
  trainer/joining-date filters, branch-access scoping, CSV export and
  per-row-resilient CSV bulk import (C2); profile reads, health
  declaration, documents, consent history/withdrawal and an
  AuditLog-sourced activity timeline that excludes health-declaration
  entries unless the caller holds `sensitive.health.view` (C3); edit,
  deactivate/reactivate, branch transfer, approval-gated suspend/unsuspend
  and merge (via a `members.approve`-gated wrapper around the generic
  `ApprovalRequest` workflow), data export and consent withdrawal (C4);
  visitor check-in/check-out and guest/trial pass issue/use/convert.
- `src/app/api/v1/{members,visitors,guest-passes}/...`: full REST surface
  for all of the above, Zod-validated, calling only the service layer.
- UI under `src/app/(app)/members/`: directory (with visitor register and
  guest/trial pass tabs), member detail page (profile, membership/
  payments/attendance placeholders, health, documents, consents, timeline
  tabs, plus edit/transfer/suspend-request/merge-request/export actions
  and a pending-approval banner with approve/reject), a hardcoded-but-
  sectioned registration form (`components/members/member-form.tsx`) built
  so Phase 1.5's dynamic form builder can wire the same sections to
  backend-configured fields later, and a printable member ID card
  (`members/[id]/card`) using CSS `print:` utilities on the app shell
  layout rather than a PDF library.
- 31 new/updated Vitest tests (`tests/unit/members.test.ts`,
  `members-csv.test.ts`): permission checks (allowed + denied) for create/
  edit/approve, branch scoping, member-code sequencing, duplicate
  detection and override, the full suspend and merge approval flows
  (including self-approval and wrong-module-request rejection), the
  sensitive-data isolation in the timeline, and CSV round-tripping.

### Verified locally before finishing

`pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test` (31/31 passed),
`pnpm build` (all 30 routes compile, including the new member/visitor/
guest-pass API routes and pages), `pnpm test:e2e` (1/1 passed, including a
repeated cold-start run after bumping Playwright's `expect.timeout`).

### Deliberately not done this session (Phase 1.2+)

- **Real membership/package logic.** The member profile's Membership,
  Payments and Attendance tabs are explicit placeholders per the brief —
  `Member.membershipPreference` is a free-text note captured at
  registration only. Arrives with Module D (Phase 1.2), Module O
  (Phase 1.3) and Module E (Phase 1.4) respectively.
- **"Cancel membership" and "upgrade/downgrade/freeze/unfreeze/extend
  membership" (C4).** These are membership-lifecycle operations that need
  a real Package/Membership record to act on; deferred to Module D.
- **Real file storage for `MemberDocument`/photos.** Stores a URL/key
  only, per the brief; an actual upload integration is a later session.
- **Fixing `GET /api/v1/approval-requests`'s `admin.approve`-only gate.**
  Flagged again in `docs/DECISIONS.md` — now that a second module
  (`members.approve`) creates real `ApprovalRequest` rows, the shared
  endpoint should accept either `admin.approve` or the request's own
  module permission. Worked around for this module with its own
  `GET /api/v1/members/approvals`, but the shared endpoint itself is
  still Phase 0's narrower check.

### Known issues / TODOs for the next session

- `assignedTrainerId` on `Member` is a bare string (a `User.id`) with no
  validation or trainer directory yet — Module H (Phase 2) should add a
  real Trainer entity and a picker instead of the free-text id field
  currently in the registration form.
- The member directory's PDF export is "print the page," matching the ID
  card — fine for one-off printing, but a scheduled/unattended export
  (Module T, Phase 5.2) will need a real PDF-generation path.

## Session 5 — Security fix: CSV injection guard on exports

**Branch:** `claude/gifted-hawking-394rhv`.

### Built

- Hardened `encodeCsvField` in `src/server/modules/members/csv.ts`: a field
  value starting with `=`, `+`, `-`, `@`, tab or CR (leading spaces
  stripped first) is now prefixed with a leading `'` before quoting, so
  Excel/Google Sheets can't interpret an exported member field as a
  formula. Applies to every current and future caller of the shared
  `toCsv` encoder; `parseCsv`/`parseCsvWithHeader` (import) are untouched
  so a value genuinely starting with `-` still round-trips exactly on
  import.
- New unit tests in `tests/unit/members-csv.test.ts` covering each trigger
  character, a normal value staying unchanged, a value merely containing
  (not starting with) a trigger char, leading-space evasion, and the
  one-way nature of the guard (re-parsing an exported, guarded value does
  not strip the apostrophe back off).
- `docs/DECISIONS.md` note on why the guard exists.

### Verified locally before finishing

`pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`, `pnpm build`.

## Session 6 — Phase 1.2: Membership & Package Management

**Branch:** `claude/phase-1-2-memberships`.

### Built

- Prisma models (D1–D3 + "Membership & Payments" checklist row): `Package`
  (duration unit/value + category/isTrial/isLimitedVisit flags rather than
  one rigid plan-type enum; pricing, benefits, access-timing and branch
  restrictions via `PackageBranch`, freeze/transfer/cancellation/refund
  policy fields, active/inactive/archived status), `Membership` (the
  subscription a Member holds — pricing snapshotted at purchase, lineage
  self-relations for renew/upgrade/downgrade/transfer, benefit-balance
  counters, `originalExpiryDate` preserved separately from `expiryDate`),
  `MembershipFreeze`. See `docs/DECISIONS.md` "Phase 1.2" for the reasoning
  behind the derived "expired" status, the renewal date math, and every
  other modelling choice.
- `src/server/modules/memberships/{packages.schema,packages.service,schema,
service}.ts`: package CRUD/archive/branch-restriction enforcement (D1,
  D2); membership create (pricing snapshot) / renew (extends from the
  later of today or current expiry) / upgrade / downgrade (fresh cycle,
  price-direction validated) / extend (manual goodwill) / approval-gated
  freeze-request / direct unfreeze / approval-gated cancel-request /
  approval-gated transfer-request (preserves remaining validity and
  benefit counters exactly) / request-only refund-approval (never touches
  money — Module O's job) / reactivate (90-day grace window) / a read-only
  expiring-soon-or-recently-lapsed query for Module V to call later (D3).
  A `memberships.approve`-gated list/decide wrapper around the generic
  `ApprovalRequest` workflow, mirroring Module C's `members.approve`
  pattern exactly (including the self-approval guard and the "does this
  request actually belong to this module" check).
- `src/app/api/v1/{packages,memberships}/...`: full REST surface, Zod-
  validated, calling only the service layer. A member-scoped convenience
  read at `/api/v1/members/[id]/membership` for the profile tab.
- UI: a new `/memberships` section (tabs: Memberships directory —
  filterable by package/status/expiring-soon, with member search to
  subscribe someone to a package; Packages — full D2 config form,
  create/edit/archive; Approvals — a module-wide inbox for
  `memberships.approve` holders, since freeze/cancel/transfer/refund
  requests benefit from a cross-member view unlike Module C's single-member
  suspend/merge). The member detail page's "Membership" tab is now real:
  current membership card (package, dates, remaining benefits, payment
  status), action buttons for every D3 lifecycle operation (each opening a
  small dialog), a pending-approval banner (same inline pattern as Module
  C), and a membership history list backed by `AuditLog`.
- 23 new Vitest tests (`tests/unit/memberships.test.ts`): package CRUD and
  archival (existing memberships unaffected; delete blocked while
  referenced), pricing-snapshot isolation from later Package price changes,
  renew-date math (both renewing-early and renewing-late cases), the
  derived-expired-status logic (including through `listMemberships`),
  freeze-policy limit enforcement (max count, min notice, max days/year)
  and the extend-expiry-by-exact-days math for both fixed-duration and
  open-ended freezes, the approval self-approval guard and wrong-module
  rejection, transfer preserving remaining benefits/validity while closing
  the source membership, branch-scoping on create, and extend/reactivate
  (including the grace-window boundary).

### Verified locally before finishing

`pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test` (66/66 passed),
`pnpm build` (all 73 routes compile, including every new package/
membership API route and page).

### Deliberately not done this session

- **D4 Package Performance analytics.** No most/least-selling, package-wise
  revenue/renewal/cancellation, or coupon-performance queries or UI —
  explicitly deferred to Phase 1.6 per the brief. `docs/ROADMAP.md` notes
  this on both the 1.2 and 1.6 lines so it isn't mistaken for already done.
- **Real invoices/payments.** `Membership.paymentDueAmountInPaise` and
  `paymentStatus` are staff-maintained placeholders, not derived from any
  ledger — real billing arrives with Module O (Phase 1.3). The member
  profile's "Payments" tab is still Phase 1.3's placeholder, untouched.
- **Proration on upgrade/downgrade.** Changing package starts a fresh
  cycle today; the old membership's remaining time/benefits are forfeited
  rather than prorated into a credit. Transfers are the one operation that
  explicitly preserves remaining validity, per the brief.
- **Calendar-year reset of freeze limits.** `freezeMaxDaysPerYear`/
  `freezeMaxCount` are enforced over the membership row's lifetime, not
  reset every calendar year — seldom what "per year" literally means, but
  tracking a rolling or calendar freeze-year needs its own bookkeeping
  that nothing in this phase otherwise needs. Flagged in
  `docs/DECISIONS.md` as a known simplification.
- **Fixing the shared `GET /api/v1/approval-requests` endpoint.** Still
  Phase 0's `admin.approve`-only gate (flagged again in Session 4); Module
  D works around it with its own `/api/v1/memberships/approvals`, same as
  Module C did.

### Known issues / TODOs for the next session

- An open-ended freeze's day-count isn't checked against
  `freezeMaxDaysPerYear` until `unfreezeMembership` closes it out (the
  duration isn't known before then) — so an open-ended freeze can
  temporarily exceed the per-year day limit before anyone notices. Only
  `freezeMaxCount` is enforced strictly up front for every freeze type.
- The memberships directory's and the transfer dialog's member search both
  reuse `GET /api/v1/members?q=...` directly from client components; no
  shared "member picker" component exists yet — worth extracting once a
  third place needs the same search-and-select UI (likely Module B's
  enquiry-to-member conversion in Phase 1.5).

## Session 5 — `renewMembership` predecessor close-out bug fix

Bug found in review of Phase 1.2: `renewMembership`
(`src/server/modules/memberships/service.ts`) created the new `Membership`
row correctly but never closed out the old one, unlike
`changeMembershipPackage` a few functions below it which does. See the
correction appended to the "Phase 1.2" entry in `docs/DECISIONS.md` for the
full reasoning (including why the old row legitimately keeps reading
`"active"` through an early renewal's remaining window, and why that's
correct, not a bug).

- `renewMembership` now updates the old `current` row right after creating
  `created`: `expiryDate: newStart`, `ptSessionsRemaining`/
  `groupClassesRemaining`/`guestPassesRemaining` all zeroed, audited —
  mirroring `changeMembershipPackage`'s predecessor-closing pattern. Fixes
  a real double-spend: before this, a member renewing early could draw PT
  sessions/classes/guest passes from both the old and new row during the
  overlap window. `status` is deliberately left untouched (derived-status
  convention, unchanged).
- `listMembershipsNeedingReminder` now excludes any membership with a
  `renewedTo` successor (`renewedTo: { none: {} }`), so an
  already-renewed membership stops being surfaced as "expiring soon" —
  its raw `expiryDate` can still fall inside the reminder window after an
  early renewal (it's unchanged, by construction), so filtering on
  `expiryDate` alone wasn't enough.
- `tests/unit/memberships.test.ts`: extended both the "renewing before
  expiry" and "renewing after expiry" tests to assert the *old* row's
  state (not just the new row's) — benefit counters zeroed in both cases,
  derived status `"active"` for early renewal (legitimately — see above)
  and still `"expired"` for late renewal (unchanged by the fix). Added a
  new test asserting `listMembershipsNeedingReminder` drops an
  already-renewed membership from its results.
- Verified locally: `pnpm lint`, `pnpm typecheck`, `pnpm test` (67/67
  passed), `pnpm build` — all clean.

### Deliberately not done this session

- **"Upcoming, not yet started" derived status.** `deriveMembershipStatus`
  only looks at `status`/`expiryDate`, never `startDate` — so right after
  an early renewal, the new row already reads `"active"` even though its
  benefits haven't started yet, and directory/report counts of "active
  memberships" can briefly show both the old and new row as active. Fixing
  this needs a new derived state (schema + UI work across every place that
  reads `derivedStatus`), out of scope for this bug-fix session. Flagged in
  `docs/DECISIONS.md`.
- The same "stale raw `expiryDate` inside the reminder window right after
  a transition" gap plausibly also affects `listMembershipsNeedingReminder`
  for upgrade/downgrade/transfer in the first moments after a cutover (their
  old row's `expiryDate` is set to `now`, which can itself still be inside
  the window). Not fixed here — only the renewal case was in scope — but
  worth a follow-up look.
