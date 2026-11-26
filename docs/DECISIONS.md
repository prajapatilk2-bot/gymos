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

## Phase 1.1 — Member Management

**Emergency contact as three plain fields on `Member`, not a separate
table.** It's a strict 1:1, has no independent lifecycle, and every other
1:1 Member sub-table in this phase (`MemberHealthDeclaration`) exists
specifically to put a _permission boundary_ around sensitive data — there's
no such boundary need for an emergency contact name/phone/relationship, so
a join only adds a query.

**`MemberHealthDeclaration` is a separate table, and its AuditLog entries
use `entityType: "MemberHealthDeclaration"` instead of `"Member"`.** C1
calls out health/injury data for "restricted access" specifically; keeping
it in its own table means an ordinary `members.view` Prisma query never
even selects the columns. The same boundary has to hold for the C3
activity timeline, though — `getMemberTimeline` filters AuditLog by
`entityType`, and only includes `"MemberHealthDeclaration"` when the caller
also holds `sensitive.health.view`. Every other member-related sub-entity
(`MemberDocument`, `MemberConsent`, branch transfers, merges, ...) is
logged with `entityType: "Member"` and `entityId: <memberId>` — even though
the row that actually changed has its own id — specifically so the
timeline query is one simple `entityType in (...), entityId = memberId`
filter instead of a union across every sub-table's own id space.

**Member ID (`"GM-0001"`) and the matching card number come from a single
incrementing `Organization.memberSequence` column, not a separate counter
table.** `UPDATE organization SET "memberSequence" = "memberSequence" + 1`
is a single atomic statement under Postgres's row-level locking, so
concurrent registrations can't collide — same guarantee a dedicated
sequence table would give, without a migration-visible new table for one
integer.

**Duplicate detection blocks creation by default; the caller must pass
`allowDuplicate: true` to proceed.** C2 asks for "duplicate detection,
merge and data validation" — rather than a silent warning a caller could
ignore, `createMember` throws `DuplicateMemberError` (with the matches) so
the UI has to show them and get an explicit "create anyway" before a true
duplicate is created. Already-approved merges then clean up any that slip
through.

**Suspend/unsuspend and merge go through `ApprovalRequest`, deactivate and
branch transfer don't.** CLAUDE.md calls out "manual attendance overrides,
discounts, winner publication, etc." as approval-worthy; the brief
explicitly named suspend and merge for this module. Deactivate/reactivate
and branch transfer are reversible, routine front-desk actions with their
own audit trail, so gating them behind a second approver would just slow
down ordinary operations for no real safety gain.

**`decideApprovalRequest` (generic, Phase 0) only flips the request's own
status — it never touches the member.** Approving a `member_suspend` or
`member_merge` request is a two-step wrapper in
`members/service.ts` (`decideMemberApprovalRequest`): call the generic
decide function, then apply the actual Member change only if the result
came back `approved`. This keeps the generic approvals service module-
agnostic (it has no idea what a `member_suspend` payload means) while
letting the Members module decide what "approved" means for its own
request types. It's also the first real consumer of the generic workflow,
so it adds a `members.approve`-gated `GET` (`listMemberApprovalRequests`)
rather than reusing `GET /api/v1/approval-requests`, which Phase 0 gated
behind `admin.approve` only — a module-specific approver (e.g. a branch
manager with `members.approve` but not `admin.approve`) couldn't see their
own pending requests through that endpoint. A follow-up session should
still fix the shared endpoint itself, per the TODO already in
`docs/PROGRESS.md` Session 2.

**Visitor register and guest/trial passes are their own tables, not
`Member` rows with a flag.** Both are explicitly "lightweight" in the
brief — no login, no profile, no C1 field set — and giving them a
`Member` row would mean either nullable-everything on `Member` or fake
placeholder values just to satisfy required fields. `GuestPass` does carry
a `convertedToMemberId` so a trial that turns into a real signup is
traceable back to the pass that started it.

**Hand-rolled CSV encode/decode (`members/csv.ts`) instead of a dependency.**
The format needed — comma-separated, double-quote escaping, embedded
commas/newlines/quotes — is about 60 lines either way; adding a package for
it isn't worth the dependency for one module's bulk import/export.

**Bulk CSV import creates rows one at a time (not in a transaction), and
keeps going past a bad row.** `importMembersCsv` returns a per-row
created/skipped_duplicate/error result so the caller can see exactly which
rows need fixing, instead of an all-or-nothing import where one malformed
row discards an otherwise-good batch.

**Directory PDF export is "print the directory page," not a server-side
PDF library** — same approach as the member ID card. Both are the kind of
one-page printable view a browser's own print-to-PDF already handles well;
a PDF generation dependency can be layered on later if an unattended/
scheduled export is ever needed (see Module T, Phase 5.2).

**`playwright.config.ts`'s `expect.timeout` raised from the 5s default to
15s.** Unrelated to this module's business logic: Next dev (Turbopack)
compiles each route on first visit, and the login → dashboard smoke test's
first navigation in a freshly-started dev server now sometimes exceeds 5s
simply because there are more routes in the app for Turbopack's dev
manifest to account for. Confirmed by running `test:e2e` against a cold
`.next` cache repeatedly before and after the change.

## Session 5

**CSV injection (formula injection) hardening in the shared `toCsv`
encoder.** A field starting with `=`, `+`, `-`, `@`, tab or CR (after
leading spaces) is prefixed with `'` on export, since Excel/Google Sheets
can otherwise execute it as a formula when a member export is opened —
applies to every CSV export via `encodeCsvField`, not just members, and
deliberately does not touch `parseCsv`/import.

## Phase 1.2 — Membership & Package Management

**`Package` models D1's plan types as duration (unit + value) + a
`category` enum + two independent booleans, not one rigid enum.** A real
plan is "monthly" AND "VIP" AND possibly "trial" at once — D1's list
(monthly/quarterly/daily/weekly/trial/limited-visit/student/couple/
family/corporate/off-peak/premium/VIP/cardio-only/general/group-class/
bundled/custom) isn't a set of mutually exclusive options. `durationUnit`/
`durationValue` cover the time-based distinctions, `category` covers the
remaining marketing-type distinctions, and `isTrial`/`isLimitedVisit` (+
`visitLimit`) are orthogonal flags — any combination composes naturally
without the enum needing a new value for every new combination a gym
invents.

**`Package` is org-scoped, not branch-scoped — branch _access_ is a
restriction on top, not ownership.** D2 explicitly separates "which
branches can sell/use this package" from "who owns this product
definition." `allBranches: true` (default) means sellable everywhere;
`false` restricts to the `PackageBranch` join rows. This also means
archiving/editing a package is one write regardless of how many branches
offer it.

**`Membership.status` is only `active | frozen | cancelled` — "expired" is
derived at read time (`deriveMembershipStatus` in
`memberships/service.ts`), never stored.** The brief asked for this
explicitly. The payoff shows up in the freeze design: a fixed-duration
freeze's extended `expiryDate` can pass with nobody ever calling
`unfreezeMembership` again, and the membership still correctly reads as
"expired" (not stuck showing "frozen" forever) because derivation checks
`expiryDate` _before_ falling back to the stored `frozen`/`active` value.
No cron job anywhere flips a membership's status at midnight.

**`originalExpiryDate` is set once at `Membership` creation and never
touched again.** It's the fixed baseline every later extension (freeze,
manual `extendMembership`) is measured against — "how much has this
row's validity grown in total" is always `expiryDate - originalExpiryDate`
regardless of how many separate extensions contributed. A renewal does
_not_ update it, because renewal creates a _new_ `Membership` row (see
next entry), which gets its own fresh baseline.

**Renew, upgrade and downgrade each create a new `Membership` row (with a
lineage pointer back to the old one); freeze/extend/unfreeze/reactivate
mutate the existing row in place.** The brief asked for lineage fields
(`renewedFromId`/`upgradedFromId`/`downgradedFromId`/`transferredFromId`),
which only make sense if a _new_ row is actually created for those four
operations — otherwise there'd be nothing to point at. This also means
"complete membership history" (D3) is just "list every `Membership` row
for this member," no AuditLog-diffing required to reconstruct past cycles.
Closing out the superseded row needs no new status value: upgrade/
downgrade/transfer set its `expiryDate` to the cutover moment (usually
"now"), and it then simply derives as "expired" — consistent with the
"expired is derived" design above. Renewal is the one case where the old
row doesn't need touching at all: `newStart = max(now, old.expiryDate)` is
never _before_ `old.expiryDate`, so the old row already derives correctly
with no write.

**Renew date math: `newStart = max(now, currentExpiry)`.** Renewing before
expiry starts the new cycle exactly when the old one ends (no gap, no
double-counted days); renewing after a lapse starts the new cycle today
rather than backdating from a missed expiry date the member wasn't
actually using the gym during.

**Upgrade/downgrade start a fresh cycle today and forfeit the old
package's remaining time/benefits — no proration.** The brief only asked
transfer to explicitly preserve remaining validity; proration math (credit
for N unused days of the old package applied to the new one) is real
billing logic that depends on Module O's invoicing, which doesn't exist
yet. Upgrade is rejected if the target package is strictly cheaper (and
vice versa for downgrade) so the two operations can't be used
interchangeably to dodge the distinction — equal-priced "sideways" moves
are allowed via either.

**`unfreezeMembership` is a direct action; `requestFreezeMembership` is
approval-gated.** The brief's own naming is the tell: every other
approval-gated D3 operation is named `request*` (`requestFreezeMembership`,
`requestCancelMembership`, `requestTransferMembership`,
`requestRefundApproval`) — `unfreezeMembership` and `reactivateMembership`
are the two lifecycle operations _not_ given that prefix. This also
matches Module C's precedent (deactivate/reactivate are direct; suspend/
merge are approval-gated): ending a pause is routine and reversible,
_starting_ one is the step worth a second pair of eyes.

**Freeze-limit enforcement: `freezeMaxCount` is always checked up front;
`freezeMaxDaysPerYear` only when the end date is already known.** An
open-ended freeze's day count isn't knowable until `unfreezeMembership`
closes it out, so that check happens retroactively at that point instead —
documented as a known gap (an open-ended freeze can temporarily exceed the
per-year limit before anyone notices) rather than silently skipped.
Limits are also enforced over the membership row's lifetime, not reset
every calendar year (tracking a real "freeze year" would need its own
bookkeeping nothing else in this phase needs) — both simplifications are
called out again in `docs/PROGRESS.md` Session 6.

**`requestRefundApproval` creates an `ApprovalRequest` and nothing else —
`decideMembershipApprovalRequest` has no "apply" branch for
`membership_refund` at all.** Every other request type
(freeze/cancel/transfer) has code that runs on approval; refund
deliberately doesn't, because there's no invoice or payment record yet to
refund against (Module O, Phase 1.3). Approving one here only flips the
`ApprovalRequest`'s own status — a future session's billing code is
expected to query approved `membership_refund` rows when real refund
processing is built, not have this phase guess at what that will look
like.

**The memberships approvals inbox is a new, module-wide page
(`/memberships` → Approvals tab), not just an inline per-membership
banner.** Module C never built a standalone approvals screen — it only
surfaces a member's own pending requests inline on their profile, which
this module also does (same banner pattern, unchanged) for consistency.
But freeze/cancel/transfer/refund requests are things an approver
naturally wants to triage _across_ members in one place, unlike Module
C's narrower suspend/merge case, so Module D adds the inbox in addition to
the inline banner rather than instead of it.
