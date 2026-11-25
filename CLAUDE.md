# CLAUDE.md — GymOS

GymOS is a complete gym management platform, built incrementally across many
sessions per `docs/ROADMAP.md`. The full product spec is in `docs/SPEC.md` —
**read it before writing code for any module.** Requirement IDs from the spec
(A1, C3, W2, I3a, WF1, ...) must be referenced in code comments, commit
messages and PR descriptions whenever you implement something the spec
describes.

This file is the standing rulebook every session must follow, regardless of
which phase or module is being worked on.

## Tech stack

- Next.js (App Router) + TypeScript (strict) + pnpm
- Tailwind CSS v4 + hand-written shadcn/ui-style components (see
  "UI components" below) + lucide-react icons
- PostgreSQL + Prisma ORM (driver adapter: `@prisma/adapter-pg`)
- Better Auth (email + password today; see "Auth" below)
- Zod for all input validation
- Vitest (unit/integration) + Playwright (E2E smoke)
- ESLint (`eslint-config-next`) + Prettier (`prettier-plugin-tailwindcss`)
- GitHub Actions CI (lint, typecheck, format, unit tests, build, E2E)
- Deployment target: Vercel + Neon Postgres (not deployed yet; the driver
  adapter and `DATABASE_URL`-based config are already Neon-compatible)

## Architecture rules

These are non-negotiable — every future module must follow them.

1. **API-first and modular.** Business logic lives in
   `src/server/modules/<module>/` as `service.ts` (functions, one per
   operation) + `schema.ts` (Zod input schemas). UI (`src/app/(app)/...`) and
   REST route handlers (`src/app/api/v1/...`) both call the **same** service
   functions — never duplicate business logic in a route handler. A future
   mobile app talks to the same `/api/v1/...` routes.
2. **One central record per entity.** One `User` row is shared by every
   module (reused, not copied). When Phase 1+ adds members, stock, etc.,
   there must be exactly one member record, one stock ledger, one
   transaction source of truth — never per-module duplicates.
3. **Multi-branch & SaaS ready.** Every business table has
   `organizationId`; branch-specific tables also have `branchId` (nullable
   on join/assignment tables where a row can apply "to every branch").
   Every query must be scoped through the helpers in
   `src/server/modules/permissions/scope.ts` (`orgScope`, `orgBranchScope`,
   `assertBranchAccess`) — **never trust an `organizationId` or `branchId`
   from the client directly**; always re-derive the organization from the
   session (`RequestContext.organizationId`) and validate any branch id the
   client sent against `getAccessibleBranchIds`/`assertBranchAccess`.
4. **Standard columns.** Every business table has `id` (cuid), `createdAt`,
   `updatedAt`, `createdById`, `updatedById`, `deletedAt` (soft delete —
   never hard-delete business data). Exceptions: `AuditLog` and
   `LoginHistory` are append-only logs and only have `createdAt` — they are
   never updated, corrected or deleted.
5. **Money as integer paise.** Any amount of money (from Phase 1 onward) is
   an `Int` column storing paise (1/100 rupee). Never use `Float`/`Decimal`
   for money, never store rupees.
6. **UTC storage, org-local display.** Store every timestamp in UTC.
   Display using the organization's `timeZone` (`Organization.timeZone`,
   default `Asia/Kolkata`) and `dateFormat` (default `DD-MM-YYYY`).
7. **Audit everything important.** Every create/update/delete/approve of
   non-trivial data calls `writeAuditLog` (`src/server/modules/audit/service.ts`)
   with a `before`/`after` snapshot. Do this inside the service function,
   not the route handler, so it can never be skipped by a different caller.
8. **Approvals for sensitive actions.** Refunds, stock adjustments, manual
   attendance overrides, discounts beyond policy, winner publication, etc.
   go through `src/server/modules/approvals/service.ts`
   (`createApprovalRequest` → pending → `decideApprovalRequest`) instead of
   being applied immediately. The caller must `requirePermission(ctx,
"<module>.approve")` before calling `decideApprovalRequest`.
9. **Server-side permission checks, always.** Every service function that
   reads or writes data calls `requirePermission(ctx, "<module>.<action>")`
   (or `hasPermission` where a boolean is needed) from
   `src/server/modules/permissions/service.ts` **itself** — never rely on
   the UI hiding a button. See "Permissions" below for the key format.
10. **Never commit secrets.** `.env`, `.env.test` etc. are gitignored;
    `.env.example` / `.env.test.example` document the required variable
    names with placeholder values only.
11. **Work on a new branch per session**, keep `docs/PROGRESS.md` updated
    with what was built and what's pending, and add tests for business
    rules (permission checks, scoping, audit logging, and any calculation
    with edge cases).

## Permissions

Permission keys follow `"<module-slug>.<action>"`, e.g. `"members.create"`.
Actions are `view | create | edit | delete | export | approve`. The full
catalog is generated from the module registry
(`src/server/modules/registry.ts` → `src/server/modules/permissions/registry.ts`)
— adding a new module to `MODULES` automatically gets all six permission
keys; you never hand-write them.

Sensitive data (health, financial, payroll) has its own cross-cutting gate
keys: `sensitive.health.view`, `sensitive.health.edit`,
`sensitive.financial.view`, `sensitive.financial.edit`,
`sensitive.payroll.view`, `sensitive.payroll.edit`. Combine a module key
with a sensitive key at the call site when the data being read/written is
sensitive:

```ts
await requirePermission(ctx, ["members.view", "sensitive.health.view"]);
```

Default role → permission matrices for the 11 W1 system roles live in
`src/server/modules/permissions/default-roles.ts` and are documented in
full in `docs/ARCHITECTURE.md`. They are seeded per-organization (not
global), so each organization can edit its own copy and also create fully
custom roles.

## Auth

Better Auth (`src/server/auth/auth.ts`) handles staff login. It's mounted
at `/api/v1/auth/[...all]` for session/sign-out/etc., but **sign-in itself
goes through the custom `/api/v1/auth/login` route**, not Better Auth's own
sign-in endpoint directly — that wrapper is what records `LoginHistory`
(success/failure + reason) and blocks deactivated users before a password
is even checked. Don't call `authClient.signIn.email()` from new UI; POST to
`/api/v1/auth/login` instead, exactly like `src/components/auth/login-form.tsx`
does.

The Better Auth `admin` plugin is enabled purely so
`auth.api.createUser` / `auth.api.setUserPassword` are available for
admin-driven user management — **not** for its own role/permission
semantics. Every GymOS user gets `role: "admin"` on the Better Auth user
row so the plugin's own internal gate always passes; real authorization is
entirely GymOS's own Role/Permission/UserRole tables, checked via
`requirePermission`. See `docs/ARCHITECTURE.md` for the full reasoning.

Session inactivity timeout is enforced in `src/server/auth/session.ts`
(`getSessionContext`), not via Better Auth's own static `session.expiresIn`
— it compares `now - session.updatedAt` against a configurable number of
minutes (env `SESSION_INACTIVITY_TIMEOUT_MINUTES`, overridable per
organization via `OrganizationSetting` key
`"session.inactivityTimeoutMinutes"`) and revokes the session if exceeded.

**Adding phone OTP / 2FA later:** add a new Better Auth plugin
(`phoneNumber`, `twoFactor`, ...) to `src/server/auth/auth.ts`, run
`pnpm dlx @better-auth/cli@latest generate --output /tmp/schema-diff.prisma`
to see exactly which columns it needs, then add those fields to the `User`
model (or a new table) in `prisma/schema.prisma` and migrate. Never guess
the shape — always diff against the generator.

## UI components

`src/components/ui/*` are hand-written shadcn/ui-style components (Radix
primitives + `cva` + `cn`), not generated via the `shadcn` CLI — that CLI
needs to reach `ui.shadcn.com`, which this environment's network policy
blocks. If a later session has that network access and wants to add a new
shadcn component, running `pnpm dlx shadcn@latest add <component>` is fine
and will fit right in (`components.json` is already configured to match
this project's conventions); otherwise hand-write it following the
existing files in `src/components/ui/` as a template.

## Running, testing, adding a module

```bash
cp .env.example .env            # fill in DATABASE_URL etc. for local Postgres
pnpm install
pnpm db:migrate                 # applies prisma/migrations, prompts for new ones
pnpm db:seed                    # demo org, 1 branch, 11 roles, 1 user per role + super admin
pnpm dev
```

| Command                             | What it does                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                          | Next.js dev server (Turbopack)                                                                          |
| `pnpm build` / `pnpm start`         | production build / serve                                                                                |
| `pnpm lint`                         | ESLint                                                                                                  |
| `pnpm typecheck`                    | `tsc --noEmit`                                                                                          |
| `pnpm format` / `pnpm format:write` | Prettier check / write                                                                                  |
| `pnpm test`                         | Vitest unit/integration tests (needs `.env.test` → a `gymos_test` Postgres DB; see `.env.test.example`) |
| `pnpm test:e2e`                     | Playwright smoke test against a running dev server                                                      |
| `pnpm db:migrate`                   | `prisma migrate dev`                                                                                    |
| `pnpm db:seed`                      | `prisma/seed.ts`                                                                                        |
| `pnpm db:studio`                    | Prisma Studio                                                                                           |

### Adding a new module (Phase 1+)

1. Read the module's section in `docs/SPEC.md` and note every requirement ID.
2. Add/confirm the module's entry in `src/server/modules/registry.ts`
   (`MODULES`) — this is also what generates its permission keys and its
   sidebar entry; nothing else to wire up by hand there.
3. Create `src/server/modules/<module>/{schema.ts,service.ts}`. Every
   service function: `requirePermission(ctx, "<slug>.<action>")` first,
   scope every query with `orgScope`/`orgBranchScope`, write an
   `AuditLog` entry for every mutation, and route sensitive-but-approvable
   actions through `createApprovalRequest` instead of applying them
   directly.
4. Add `src/app/api/v1/<module>/...route.ts` handlers that parse with the
   module's Zod schema, call `requireApiContext()`
   (`src/server/http.ts`) for the session, call the service function, and
   return `handleApiError` on failure.
5. Replace the module's generic placeholder page
   (`src/app/(app)/[moduleSlug]/page.tsx` currently renders it for every
   not-yet-built module) with a real route under `src/app/(app)/<module-slug>/`,
   following the admin section (`src/app/(app)/admin/`) as the pattern for a
   module with its own sub-pages.
6. Write Vitest tests for the module's permission checks (allowed +
   prohibited), scoping, and any non-trivial business rule. Add/extend the
   Playwright smoke test only if the change affects the core
   login → see dashboard → logout path.
7. Update `docs/ROADMAP.md` (check the item off) and `docs/PROGRESS.md`
   (what was built, what's left) before finishing the session.
