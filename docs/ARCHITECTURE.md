# Architecture — GymOS Phase 0

## Folder structure

```
gymos/
├─ docs/
│  ├─ SPEC.md            # the full product spec (source of truth for requirement IDs)
│  ├─ ARCHITECTURE.md    # this file
│  ├─ ROADMAP.md          # phase plan as a checklist
│  ├─ DECISIONS.md        # short decision log
│  └─ PROGRESS.md         # session-by-session build log
├─ prisma/
│  ├─ schema.prisma       # single schema file (Better Auth tables + GymOS tables)
│  ├─ migrations/         # committed, timestamped SQL migrations
│  └─ seed.ts             # demo org/branch/roles/users seed script
├─ src/
│  ├─ app/
│  │  ├─ login/page.tsx                # public
│  │  ├─ (app)/                        # authenticated shell (sidebar + topbar)
│  │  │  ├─ layout.tsx                 # session check, loads visible modules + branches
│  │  │  ├─ [moduleSlug]/page.tsx      # generic "Planned for Phase N" placeholder
│  │  │  └─ admin/                     # W1–W4, built in Phase 0
│  │  │     ├─ users/  roles/  branches/  settings/  audit-log/
│  │  └─ api/v1/                       # REST, mirrors src/server/modules/*
│  ├─ components/
│  │  ├─ ui/              # hand-written shadcn/ui-style primitives
│  │  ├─ app-shell/       # sidebar, topbar, branch switcher, user menu
│  │  └─ admin/           # permission matrix editor, role-assignment editor, nav
│  ├─ server/
│  │  ├─ auth/            # Better Auth instance, session helper, password policy
│  │  ├─ db/prisma.ts      # Prisma client singleton (driver adapter)
│  │  ├─ http.ts           # requireApiContext / handleApiError for route handlers
│  │  └─ modules/
│  │     ├─ registry.ts                 # the 24 A–X modules: id, name, description, phase, slug
│  │     ├─ permissions/                # permission catalog, default role matrix, scoping, checks
│  │     ├─ audit/                      # AuditLog service
│  │     ├─ approvals/                  # ApprovalRequest service
│  │     ├─ users/ roles/ branches/ organization-settings/   # W1/W4 domain services
│  │  └─ proxy.ts (middleware)          # (actually at src/proxy.ts, see below)
├─ tests/
│  ├─ unit/               # Vitest, run against a real Postgres "gymos_test" DB
│  └─ e2e/                # Playwright smoke test
└─ .github/workflows/ci.yml
```

`src/proxy.ts` is Next.js 16's renamed `middleware.ts` convention (same
signature, same `matcher` config, just a different file name and exported
function name — `proxy` instead of `middleware`).

## Data scoping

Every business table carries `organizationId`; branch-specific tables also
carry `branchId`. Three layers enforce this, in order:

1. **Session.** `getSessionContext()` resolves the authenticated user and
   their `organizationId` from the Better Auth session — never from a
   request body/query param.
2. **Query scoping.** Every service function builds its Prisma `where`
   starting from `orgScope(ctx)` (`{ organizationId }`) or
   `orgBranchScope(ctx, branchId)`. A client-supplied id (e.g. "update
   branch X") is looked up with that scope baked into the `where` clause of
   the `findFirst`/`update` call itself, so a request for another
   organization's row returns "not found", not another tenant's data.
3. **Branch access.** `getAccessibleBranchIds(userId, organizationId)`
   returns either `"all"` (the user has at least one organization-wide role
   assignment, i.e. `UserRole.branchId = null`) or the exact list of branch
   ids they're assigned to. `assertBranchAccess(ctx, branchId)` throws
   `ScopeError` if the id the client asked to act on isn't in that set —
   called before any write that takes a branch id from the client.

This is what makes the platform multi-branch- and SaaS-ready without a
rebuild: a second organization, or a second branch inside one organization,
changes zero application logic — only the data each query returns.

## Auth design

Better Auth owns authentication (`src/server/auth/auth.ts`):

- **Email + password** today (`emailAndPassword`), with
  `advanced.database.generateId: false` so Postgres/Prisma's own `cuid()`
  default generates every id — consistent with every other table.
- **Additional fields** on `User`: `organizationId` (required), plus
  `employeeCode`, `phone`, `isActive`, `mustChangePassword`, `lastLoginAt` —
  declared in Better Auth's config so `auth.api.getSession()` returns them
  directly, and mirrored as real Prisma columns since Better Auth's Prisma
  adapter reads/writes this same `User` table.
- **The `admin` plugin** is enabled *only* to get
  `auth.api.createUser` / `auth.api.setUserPassword` as callable,
  session-aware server APIs (so admin-created accounts never log the
  acting admin out of their own session, and password hashing always goes
  through Better Auth's own hasher). Its own role-based authorization is
  not used for GymOS's authorization: every user's Better Auth `role`
  field is fixed to `"admin"` at creation, so the plugin's internal
  "is this caller allowed" check always passes; the actual decision is
  GymOS's own `requirePermission(ctx, "admin.create" | "admin.edit")`
  called *before* either of those APIs is invoked. Two independent,
  purpose-built authorization systems would be worse than one used twice
  for a single, deliberate reason.
- **Strong password rules** (10+ chars, upper/lower/digit/symbol) are
  enforced by `src/server/auth/password.ts`'s Zod schema, applied
  server-side in every route that accepts a password (admin create-user,
  reset-password) — Better Auth's own `minPasswordLength` is only a floor.
- **Login history** (`LoginHistory` table: time, IP, user agent,
  success/failure + reason) is written by `/api/v1/auth/login`, a thin
  wrapper around `auth.api.signInEmail` — not by Better Auth's own
  endpoint directly, since that's the only way to reliably capture
  *failed* attempts (unknown email, deactivated account, wrong password)
  with a reason, before any password check even runs for a deactivated
  user.
- **Inactivity auto-logout** compares `now - session.updatedAt` (Better
  Auth bumps `updatedAt` on its own sliding-window renewal) against a
  configurable number of minutes in `getSessionContext()`, revoking the
  session server-side if exceeded. This is deliberately not done via
  Better Auth's static `session.expiresIn`/`updateAge` alone, since those
  are fixed at process start — the per-organization override
  (`OrganizationSetting` key `"session.inactivityTimeoutMinutes"`) needs a
  runtime check.

## RBAC design

**Permission keys** are `"<module-slug>.<action>"`
(`src/server/modules/permissions/registry.ts`), generated from the 24-module
registry × six actions (`view, create, edit, delete, export, approve`) —
144 keys — plus six cross-cutting sensitive-data gates
(`sensitive.{health,financial,payroll}.{view,edit}`), for 150 total. The
`Permission` table is a global catalog (not organization-scoped), seeded
once.

**Roles** (`Role` table) *are* organization-scoped: the 11 W1 default roles
are seeded per organization from `default-roles.ts`, so every organization
gets its own editable copy and can also create fully custom roles
(`isSystem: false`, deletable; system roles cannot be deleted, only have
their permissions edited).

**UserRole** is the assignment: `(userId, roleId, organizationId, branchId)`.
`branchId = null` means the role applies across every branch in the
organization; a non-null `branchId` scopes it to exactly that branch. A
user can hold several `UserRole` rows (e.g. "Trainer" at Branch A and
"Receptionist" at Branch B).

**Checking permissions**
(`src/server/modules/permissions/service.ts`):

```ts
await requirePermission(ctx, "members.create");                         // anywhere
await requirePermission(ctx, "members.create", { branchId });            // that branch or org-wide
await requirePermission(ctx, ["members.view", "sensitive.health.view"]); // both required
```

`hasPermission` returns a boolean (for conditional UI / sidebar filtering);
`requirePermission` throws `PermissionError` (mapped to HTTP 403 by
`src/server/http.ts`). Every service function calls one of these itself —
the UI additionally filters the sidebar and hides actions a user can't
perform, but that's a UX nicety, never the actual gate.

### Default role → permission matrix (W1)

Access levels used below: **Full** = view/create/edit/delete/export/approve
· **Manage** = view/create/edit/export · **Manage+A** = Manage + approve ·
**Edit** = view/create/edit · **View** = view/export · blank = no access.
Full detail (including which sensitive gates each role gets) is in
`src/server/modules/permissions/default-roles.ts`; this table is a summary.

| Role | Scope | Typical modules |
|---|---|---|
| **Super Admin** | All orgs the account can see | Full on every module (A–X), all sensitive data |
| **Owner** | Org-wide | Full on every module except W (Admin Panel, which is view-only even for them — role/permission editing is Super Admin's job); sensitive: health view, financial edit, payroll edit |
| **General Manager** | Org-wide | Manage+A on B,D,E,F,G,J,Q · Manage on C,H,I,K,L,M,N,V · View on A,O,P,T,W; sensitive: all three view |
| **Branch Manager** | One branch (`UserRole.branchId` set) | Same shape as GM minus V; sensitive: health+financial view |
| **Receptionist** | One branch | Manage on B,C · Edit on D,E,F,G · Edit on O (take payments) · View on A,N,T; sensitive: health view |
| **Trainer** | One branch | Manage on H,I · Edit on M · View on A,C,G,J,K,T; sensitive: health edit |
| **Accountant** | Org-wide | Full on O (billing/finance) · Manage on P (payroll) · View on A,C,D,T; sensitive: financial+payroll edit |
| **Salesperson** | Org-wide | Manage on B,N · Edit on C,D · View on A,T |
| **Store Manager** | Org-wide | Full on F (retail/canteen) · Manage on G · View on A,C,O,T; sensitive: financial view |
| **Housekeeping** | One branch | Edit on Q (fault reporting) · Manage on R |
| **Security** | One branch | Manage on R · View on E |

## Audit & approval design

**AuditLog** (`src/server/modules/audit/service.ts`) is append-only:
`organizationId, branchId?, userId?, action, entityType, entityId?,
before?, after?, metadata?, ipAddress?, userAgent?, createdAt`. Every
service function that mutates something calls `writeAuditLog` itself —
there is no separate "wrap every route in an audit decorator" layer,
because that would make it easy to accidentally bypass by calling a
service function from a new place; putting the call inside the service
function makes it unconditional.

**ApprovalRequest** (`src/server/modules/approvals/service.ts`) is the
generic "needs sign-off" workflow: `createApprovalRequest` records a
`pending` row with a `payload` (the proposed change, as JSON) and a
`reason`; `decideApprovalRequest` requires the decider to hold the right
`<module>.approve` permission (checked by the *caller*, since the right
key depends on what's being approved) and refuses self-approval. Module
services in Phase 1+ that need "refund requires sign-off" etc. create a
request here instead of applying the change immediately, and apply it only
from the `approved` branch of their own "decide" flow.

## Admin panel scope (W1–W4, built in Phase 0)

- **Users** (`/admin/users`): list/search, create (temp password, forces
  change on first login), deactivate/reactivate (can't deactivate yourself),
  reset password, assign roles per branch.
- **Roles** (`/admin/roles`): list, create custom role, edit a role's
  permission matrix (module × action grid + sensitive-data toggles),
  delete a custom role (blocked while still assigned to a user; system
  roles can't be deleted at all).
- **Organization settings** (`/admin/settings`): name, logo URL, address,
  phone, email, GSTIN, financial year start month, time zone, date format,
  currency. (`OrganizationSetting` is a separate extensible key/value store
  for settings that will grow every phase — e.g. the session inactivity
  timeout — so they never need a schema migration to add.)
- **Branches** (`/admin/branches`): list, create, edit (incl. default
  branch flag, active flag).
- **Audit log viewer** (`/admin/audit-log`): filterable by user, entity
  type, action, date range; paginated.
