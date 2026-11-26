import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import type { RequestContext } from "@/server/auth/session";
import { requirePermission } from "@/server/modules/permissions/service";
import {
  assertBranchAccess,
  getAccessibleBranchIds,
  orgScope,
} from "@/server/modules/permissions/scope";
import { writeAuditLog } from "@/server/modules/audit/service";
import {
  ApprovalError,
  createApprovalRequest,
  decideApprovalRequest,
} from "@/server/modules/approvals/service";
import { isPackageAvailableToBranch } from "@/server/modules/memberships/packages.service";
import type {
  ChangePackageMembershipInput,
  CreateMembershipInput,
  DecideMembershipApprovalInput,
  ExtendMembershipInput,
  ListMembershipApprovalRequestsQuery,
  ListMembershipRemindersQuery,
  ListMembershipsQuery,
  RenewMembershipInput,
  RequestCancelMembershipInput,
  RequestFreezeMembershipInput,
  RequestRefundApprovalInput,
  RequestTransferMembershipInput,
} from "@/server/modules/memberships/schema";

const PAGE_SIZE = 25;
const MEMBERSHIP_APPROVAL_REQUEST_TYPES = [
  "membership_freeze",
  "membership_cancel",
  "membership_transfer",
  "membership_refund",
] as const;
type MembershipApprovalRequestType =
  (typeof MEMBERSHIP_APPROVAL_REQUEST_TYPES)[number];

/** Grace period (days past expiry) within which a lapsed membership can still be reactivated. */
export const REACTIVATION_GRACE_DAYS = 90;

export class MembershipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MembershipError";
  }
}

// ---------------------------------------------------------------------------
// Date helpers — all UTC-based (CLAUDE.md "store timestamps in UTC").
// ---------------------------------------------------------------------------

function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/** Whole days from a to b (can be negative), ignoring time-of-day. */
function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfUtcDay(b) - startOfUtcDay(a)) / 86_400_000);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function computeExpiryDate(
  startDate: Date,
  pkg: { durationUnit: string; durationValue: number },
): Date {
  const d = new Date(startDate);
  switch (pkg.durationUnit) {
    case "day":
      d.setUTCDate(d.getUTCDate() + pkg.durationValue);
      break;
    case "week":
      d.setUTCDate(d.getUTCDate() + pkg.durationValue * 7);
      break;
    case "month":
      d.setUTCMonth(d.getUTCMonth() + pkg.durationValue);
      break;
    case "year":
      d.setUTCFullYear(d.getUTCFullYear() + pkg.durationValue);
      break;
  }
  return d;
}

// ---------------------------------------------------------------------------
// Derived status (D3) — "expired" is never stored, only computed at read
// time from expiryDate, so there's no cron job needed to flip memberships
// over at midnight. Priority: an explicitly cancelled membership stays
// "cancelled" forever; otherwise once expiryDate has passed it reads as
// "expired" even if the stored column still says "frozen" (a fixed-duration
// freeze that nobody ever called unfreezeMembership on afterwards) — only a
// membership whose expiry hasn't passed yet can show as "frozen" or "active".
// ---------------------------------------------------------------------------

export type DerivedMembershipStatus =
  "active" | "frozen" | "cancelled" | "expired";

export function deriveMembershipStatus(membership: {
  status: string;
  expiryDate: Date;
}): DerivedMembershipStatus {
  if (membership.status === "cancelled") return "cancelled";
  if (membership.expiryDate.getTime() <= Date.now()) return "expired";
  if (membership.status === "frozen") return "frozen";
  return "active";
}

function withDerivedStatus<T extends { status: string; expiryDate: Date }>(
  membership: T,
): T & { derivedStatus: DerivedMembershipStatus } {
  return { ...membership, derivedStatus: deriveMembershipStatus(membership) };
}

// ---------------------------------------------------------------------------
// Internal lookups
// ---------------------------------------------------------------------------

async function findMembershipOrThrow(
  ctx: RequestContext,
  membershipId: string,
) {
  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, ...orgScope(ctx), deletedAt: null },
  });
  if (!membership) throw new MembershipError("Membership not found.");
  await assertBranchAccess(ctx, membership.branchId);
  return membership;
}

async function findPackageForMembership(
  ctx: RequestContext,
  packageId: string,
) {
  const pkg = await prisma.package.findFirst({
    where: { id: packageId, ...orgScope(ctx), deletedAt: null },
    include: { branchRestrictions: { select: { branchId: true } } },
  });
  if (!pkg) throw new MembershipError("Package not found.");
  return pkg;
}

async function branchFilter(ctx: RequestContext, requestedBranchId?: string) {
  if (requestedBranchId) {
    await assertBranchAccess(ctx, requestedBranchId);
    return { branchId: requestedBranchId };
  }
  const accessible = await getAccessibleBranchIds(
    ctx.userId,
    ctx.organizationId,
  );
  return accessible === "all" ? {} : { branchId: { in: accessible } };
}

// ---------------------------------------------------------------------------
// D3 — create / list / read
// ---------------------------------------------------------------------------

export async function createMembership(
  ctx: RequestContext,
  input: CreateMembershipInput,
) {
  await requirePermission(ctx, "memberships.create");
  await assertBranchAccess(ctx, input.branchId);

  const pkg = await findPackageForMembership(ctx, input.packageId);
  if (pkg.status !== "active") {
    throw new MembershipError(
      "This package is not currently available for sale.",
    );
  }
  if (!isPackageAvailableToBranch(pkg, input.branchId)) {
    throw new MembershipError(
      "This package is not available at the selected branch.",
    );
  }

  const member = await prisma.member.findFirst({
    where: { id: input.memberId, ...orgScope(ctx), deletedAt: null },
  });
  if (!member) throw new MembershipError("Member not found.");

  const startDate = input.startDate ? new Date(input.startDate) : new Date();
  const expiryDate = computeExpiryDate(startDate, pkg);
  const discountAppliedInPaise = input.discountAppliedInPaise ?? 0;

  const membership = await prisma.membership.create({
    data: {
      organizationId: ctx.organizationId,
      branchId: input.branchId,
      memberId: input.memberId,
      packageId: input.packageId,
      startDate,
      expiryDate,
      originalExpiryDate: expiryDate,
      priceAtPurchaseInPaise: pkg.priceInPaise,
      joiningFeeChargedInPaise: pkg.joiningFeeInPaise,
      discountAppliedInPaise,
      couponCode: input.couponCode,
      ptSessionsRemaining: pkg.ptSessionsIncluded,
      groupClassesRemaining: pkg.groupClassesIncluded,
      guestPassesRemaining: pkg.guestPassesIncluded,
      paymentDueAmountInPaise:
        input.paymentDueAmountInPaise ??
        Math.max(
          0,
          pkg.priceInPaise + pkg.joiningFeeInPaise - discountAppliedInPaise,
        ),
      createdById: ctx.userId,
      updatedById: ctx.userId,
    },
  });

  await writeAuditLog(ctx, {
    action: "create",
    entityType: "Membership",
    entityId: membership.id,
    after: membership,
    branchId: membership.branchId,
  });

  return withDerivedStatus(membership);
}

export async function listMemberships(
  ctx: RequestContext,
  query: ListMembershipsQuery,
) {
  await requirePermission(ctx, "memberships.view");

  const where: Prisma.MembershipWhereInput = {
    ...orgScope(ctx),
    deletedAt: null,
    ...(await branchFilter(ctx, query.branchId)),
    ...(query.memberId ? { memberId: query.memberId } : {}),
    ...(query.packageId ? { packageId: query.packageId } : {}),
    ...(query.status
      ? { status: query.status }
      : query.expiringSoonDays !== undefined
        ? { status: { not: "cancelled" } }
        : {}),
    ...(query.expiringSoonDays !== undefined
      ? { expiryDate: { lte: addDays(new Date(), query.expiringSoonDays) } }
      : {}),
  };

  const page = query.page ?? 1;

  const [total, items] = await Promise.all([
    prisma.membership.count({ where }),
    prisma.membership.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        member: {
          select: { id: true, name: true, memberCode: true, mobile: true },
        },
        package: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    }),
  ]);

  return {
    items: items.map(withDerivedStatus),
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getMembershipById(
  ctx: RequestContext,
  membershipId: string,
) {
  await requirePermission(ctx, "memberships.view");
  await findMembershipOrThrow(ctx, membershipId);

  const membership = await prisma.membership.findUniqueOrThrow({
    where: { id: membershipId },
    include: {
      member: { select: { id: true, name: true, memberCode: true } },
      package: true,
      branch: { select: { id: true, name: true } },
      freezes: { orderBy: { startDate: "desc" } },
    },
  });

  return withDerivedStatus(membership);
}

/**
 * The membership shown on a member's profile "Membership" tab — the most
 * recently started one, regardless of its derived status, so a lapsed or
 * cancelled membership still shows (rather than the tab going blank) until
 * a new one is created.
 */
export async function getCurrentMembershipForMember(
  ctx: RequestContext,
  memberId: string,
) {
  await requirePermission(ctx, "memberships.view");

  const member = await prisma.member.findFirst({
    where: { id: memberId, ...orgScope(ctx), deletedAt: null },
  });
  if (!member) throw new MembershipError("Member not found.");
  await assertBranchAccess(ctx, member.branchId);

  const membership = await prisma.membership.findFirst({
    where: { memberId, ...orgScope(ctx), deletedAt: null },
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    include: {
      package: true,
      branch: { select: { id: true, name: true } },
      freezes: { orderBy: { startDate: "desc" }, take: 5 },
    },
  });

  return membership ? withDerivedStatus(membership) : null;
}

/**
 * D3 "maintain complete membership history" — reuses AuditLog exactly like
 * Module C's member timeline does; no separate membership-event table.
 */
export async function getMembershipTimeline(
  ctx: RequestContext,
  membershipId: string,
) {
  await requirePermission(ctx, "memberships.view");
  await findMembershipOrThrow(ctx, membershipId);

  return prisma.auditLog.findMany({
    where: {
      ...orgScope(ctx),
      entityType: "Membership",
      entityId: membershipId,
    },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}

/**
 * Read-only query for memberships expiring soon (within daysBeforeExpiry
 * ahead) or that recently lapsed (within daysBeforeExpiry behind) — no
 * reminder is actually sent here. Module V's notification engine (Phase 2)
 * will call this; do not duplicate this query elsewhere when that arrives.
 */
export async function listMembershipsNeedingReminder(
  ctx: RequestContext,
  query: ListMembershipRemindersQuery,
) {
  await requirePermission(ctx, "memberships.view");

  const now = new Date();
  const windowStart = addDays(now, -query.daysBeforeExpiry);
  const windowEnd = addDays(now, query.daysBeforeExpiry);

  const memberships = await prisma.membership.findMany({
    where: {
      ...orgScope(ctx),
      deletedAt: null,
      status: { not: "cancelled" },
      expiryDate: { gte: windowStart, lte: windowEnd },
    },
    orderBy: { expiryDate: "asc" },
    include: {
      member: { select: { id: true, name: true, mobile: true, email: true } },
      package: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true } },
    },
  });

  return memberships.map(withDerivedStatus);
}

// ---------------------------------------------------------------------------
// D3 — renew / upgrade / downgrade / extend
// ---------------------------------------------------------------------------

export async function renewMembership(
  ctx: RequestContext,
  membershipId: string,
  input: RenewMembershipInput,
) {
  await requirePermission(ctx, "memberships.edit");
  const current = await findMembershipOrThrow(ctx, membershipId);
  if (current.status === "cancelled") {
    throw new MembershipError(
      "Cannot renew a cancelled membership — reactivate it or create a new one instead.",
    );
  }
  const pkg = await findPackageForMembership(ctx, current.packageId);

  const now = new Date();
  // "extend from the later of (today, current expiry)": renewing before
  // expiry starts the new cycle the moment the old one ends; renewing late
  // starts it today rather than backdating from the missed expiry date.
  const newStart =
    current.expiryDate.getTime() > now.getTime() ? current.expiryDate : now;
  const newExpiry = computeExpiryDate(newStart, pkg);
  const discountAppliedInPaise = input.discountAppliedInPaise ?? 0;

  const created = await prisma.membership.create({
    data: {
      organizationId: ctx.organizationId,
      branchId: current.branchId,
      memberId: current.memberId,
      packageId: current.packageId,
      status: "active",
      startDate: newStart,
      expiryDate: newExpiry,
      originalExpiryDate: newExpiry,
      priceAtPurchaseInPaise: pkg.priceInPaise,
      discountAppliedInPaise,
      couponCode: input.couponCode,
      ptSessionsRemaining: pkg.ptSessionsIncluded,
      groupClassesRemaining: pkg.groupClassesIncluded,
      guestPassesRemaining: pkg.guestPassesIncluded,
      paymentDueAmountInPaise: Math.max(
        0,
        pkg.priceInPaise - discountAppliedInPaise,
      ),
      renewedFromId: current.id,
      createdById: ctx.userId,
      updatedById: ctx.userId,
    },
  });

  await writeAuditLog(ctx, {
    action: "renew",
    entityType: "Membership",
    entityId: created.id,
    before: current,
    after: created,
    branchId: created.branchId,
  });

  return withDerivedStatus(created);
}

async function changeMembershipPackage(
  ctx: RequestContext,
  membershipId: string,
  input: ChangePackageMembershipInput,
  direction: "upgrade" | "downgrade",
) {
  await requirePermission(ctx, "memberships.edit");
  const current = await findMembershipOrThrow(ctx, membershipId);
  if (current.status === "cancelled") {
    throw new MembershipError(
      "Cannot change the package of a cancelled membership.",
    );
  }
  if (current.packageId === input.packageId) {
    throw new MembershipError("Already on this package.");
  }

  const [oldPkg, newPkg] = await Promise.all([
    findPackageForMembership(ctx, current.packageId),
    findPackageForMembership(ctx, input.packageId),
  ]);

  if (newPkg.status !== "active") {
    throw new MembershipError(
      "The target package is not currently available for sale.",
    );
  }
  if (!isPackageAvailableToBranch(newPkg, current.branchId)) {
    throw new MembershipError(
      "The target package is not available at this membership's branch.",
    );
  }
  if (direction === "upgrade" && newPkg.priceInPaise < oldPkg.priceInPaise) {
    throw new MembershipError(
      "The selected package is cheaper — use downgradeMembership instead.",
    );
  }
  if (direction === "downgrade" && newPkg.priceInPaise > oldPkg.priceInPaise) {
    throw new MembershipError(
      "The selected package is more expensive — use upgradeMembership instead.",
    );
  }

  // Fresh cycle starting now; the old membership's remaining time/benefits
  // are forfeited rather than prorated — proration is explicitly out of
  // scope for this phase (see docs/DECISIONS.md). Transfers are different:
  // requestTransferMembership explicitly preserves remaining validity.
  const now = new Date();
  const newExpiry = computeExpiryDate(now, newPkg);
  const discountAppliedInPaise = input.discountAppliedInPaise ?? 0;

  const created = await prisma.membership.create({
    data: {
      organizationId: ctx.organizationId,
      branchId: current.branchId,
      memberId: current.memberId,
      packageId: newPkg.id,
      status: "active",
      startDate: now,
      expiryDate: newExpiry,
      originalExpiryDate: newExpiry,
      priceAtPurchaseInPaise: newPkg.priceInPaise,
      discountAppliedInPaise,
      couponCode: input.couponCode,
      ptSessionsRemaining: newPkg.ptSessionsIncluded,
      groupClassesRemaining: newPkg.groupClassesIncluded,
      guestPassesRemaining: newPkg.guestPassesIncluded,
      paymentDueAmountInPaise: Math.max(
        0,
        newPkg.priceInPaise - discountAppliedInPaise,
      ),
      ...(direction === "upgrade"
        ? { upgradedFromId: current.id }
        : { downgradedFromId: current.id }),
      createdById: ctx.userId,
      updatedById: ctx.userId,
    },
  });

  await prisma.membership.update({
    where: { id: current.id },
    data: {
      expiryDate: now,
      ptSessionsRemaining: 0,
      groupClassesRemaining: 0,
      guestPassesRemaining: 0,
      updatedById: ctx.userId,
    },
  });

  await writeAuditLog(ctx, {
    action: direction,
    entityType: "Membership",
    entityId: created.id,
    before: current,
    after: created,
    branchId: created.branchId,
  });

  return withDerivedStatus(created);
}

export async function upgradeMembership(
  ctx: RequestContext,
  membershipId: string,
  input: ChangePackageMembershipInput,
) {
  return changeMembershipPackage(ctx, membershipId, input, "upgrade");
}

export async function downgradeMembership(
  ctx: RequestContext,
  membershipId: string,
  input: ChangePackageMembershipInput,
) {
  return changeMembershipPackage(ctx, membershipId, input, "downgrade");
}

/** Manual goodwill/administrative extension — distinct from renewal (same package, no new cycle/row). */
export async function extendMembership(
  ctx: RequestContext,
  membershipId: string,
  input: ExtendMembershipInput,
) {
  await requirePermission(ctx, "memberships.edit");
  const current = await findMembershipOrThrow(ctx, membershipId);
  if (current.status === "cancelled") {
    throw new MembershipError("Cannot extend a cancelled membership.");
  }

  const updated = await prisma.membership.update({
    where: { id: membershipId },
    data: {
      expiryDate: addDays(current.expiryDate, input.additionalDays),
      updatedById: ctx.userId,
    },
  });

  await writeAuditLog(ctx, {
    action: "extend",
    entityType: "Membership",
    entityId: membershipId,
    before: { expiryDate: current.expiryDate },
    after: { expiryDate: updated.expiryDate },
    metadata: { additionalDays: input.additionalDays, reason: input.reason },
    branchId: current.branchId,
  });

  return withDerivedStatus(updated);
}

// ---------------------------------------------------------------------------
// D3 — freeze / unfreeze
// ---------------------------------------------------------------------------

export async function requestFreezeMembership(
  ctx: RequestContext,
  membershipId: string,
  input: RequestFreezeMembershipInput,
) {
  await requirePermission(ctx, "memberships.edit");
  const membership = await findMembershipOrThrow(ctx, membershipId);
  if (membership.status === "cancelled") {
    throw new MembershipError("Cannot freeze a cancelled membership.");
  }
  const pkg = await findPackageForMembership(ctx, membership.packageId);

  if (!pkg.freezeAllowed) {
    throw new MembershipError("This package's policy does not allow freezing.");
  }

  const startDate = new Date(input.startDate);
  const noticeDays = daysBetween(new Date(), startDate);
  if (noticeDays < pkg.freezeMinNoticeDays) {
    throw new MembershipError(
      `This package requires at least ${pkg.freezeMinNoticeDays} day(s) notice before a freeze starts.`,
    );
  }

  if (membership.freezeCount + 1 > pkg.freezeMaxCount) {
    throw new MembershipError(
      `This membership has already used its ${pkg.freezeMaxCount} allowed freeze(s).`,
    );
  }

  // The day-count limit can only be checked up front for a fixed-duration
  // freeze; an open-ended one (no endDate) is checked against the limit
  // retroactively when unfreezeMembership closes it out.
  if (input.endDate) {
    const freezeDays = daysBetween(startDate, new Date(input.endDate)) + 1;
    if (membership.freezeDaysUsed + freezeDays > pkg.freezeMaxDaysPerYear) {
      throw new MembershipError(
        `This freeze would use ${freezeDays} day(s), exceeding the package's limit of ${pkg.freezeMaxDaysPerYear} day(s) (already used ${membership.freezeDaysUsed}).`,
      );
    }
  }

  return createApprovalRequest(ctx, {
    requestType: "membership_freeze",
    entityType: "Membership",
    entityId: membershipId,
    payload: {
      membershipId,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
    },
    reason: input.reason,
    branchId: membership.branchId,
  });
}

/**
 * Ends an ongoing freeze. Direct action (not approval-gated), consistent
 * with how Module C treats "undo a routine pause" (deactivate/reactivate)
 * as a direct action while *starting* the pause is the approval-gated step
 * — see docs/DECISIONS.md "Phase 1.2" for the full reasoning.
 */
export async function unfreezeMembership(
  ctx: RequestContext,
  membershipId: string,
) {
  await requirePermission(ctx, "memberships.edit");
  const membership = await findMembershipOrThrow(ctx, membershipId);
  if (membership.status !== "frozen") {
    throw new MembershipError("Membership is not frozen.");
  }

  const openFreeze = await prisma.membershipFreeze.findFirst({
    where: { membershipId, endDate: null },
    orderBy: { startDate: "desc" },
  });

  const now = new Date();
  let expiryDate = membership.expiryDate;
  let freezeDaysUsedIncrement = 0;

  if (openFreeze) {
    const days = Math.max(0, daysBetween(openFreeze.startDate, now) + 1);
    await prisma.membershipFreeze.update({
      where: { id: openFreeze.id },
      data: { endDate: now, updatedById: ctx.userId },
    });
    expiryDate = addDays(membership.expiryDate, days);
    freezeDaysUsedIncrement = days;
  }
  // else: a fixed-duration freeze already had its days applied at approval
  // time — unfreezing early just flips status back without touching expiry.

  const updated = await prisma.membership.update({
    where: { id: membershipId },
    data: {
      status: "active",
      expiryDate,
      freezeDaysUsed: { increment: freezeDaysUsedIncrement },
      updatedById: ctx.userId,
    },
  });

  await writeAuditLog(ctx, {
    action: "unfreeze",
    entityType: "Membership",
    entityId: membershipId,
    before: { expiryDate: membership.expiryDate, status: membership.status },
    after: { expiryDate: updated.expiryDate, status: updated.status },
    branchId: membership.branchId,
  });

  return withDerivedStatus(updated);
}

// ---------------------------------------------------------------------------
// D3 — cancel / transfer / refund request / reactivate
// ---------------------------------------------------------------------------

export async function requestCancelMembership(
  ctx: RequestContext,
  membershipId: string,
  input: RequestCancelMembershipInput,
) {
  await requirePermission(ctx, "memberships.edit");
  const membership = await findMembershipOrThrow(ctx, membershipId);
  if (membership.status === "cancelled") {
    throw new MembershipError("Membership is already cancelled.");
  }

  return createApprovalRequest(ctx, {
    requestType: "membership_cancel",
    entityType: "Membership",
    entityId: membershipId,
    payload: { membershipId },
    reason: input.reason,
    branchId: membership.branchId,
  });
}

export async function requestTransferMembership(
  ctx: RequestContext,
  membershipId: string,
  input: RequestTransferMembershipInput,
) {
  await requirePermission(ctx, "memberships.edit");
  const membership = await findMembershipOrThrow(ctx, membershipId);
  if (membership.status === "cancelled") {
    throw new MembershipError("Cannot transfer a cancelled membership.");
  }
  const pkg = await findPackageForMembership(ctx, membership.packageId);
  if (!pkg.transferAllowed) {
    throw new MembershipError(
      "This package's policy does not allow transfers.",
    );
  }
  if (membership.memberId === input.targetMemberId) {
    throw new MembershipError(
      "Cannot transfer a membership to the same member.",
    );
  }

  const targetMember = await prisma.member.findFirst({
    where: { id: input.targetMemberId, ...orgScope(ctx), deletedAt: null },
  });
  if (!targetMember) throw new MembershipError("Target member not found.");
  await assertBranchAccess(ctx, targetMember.branchId);

  return createApprovalRequest(ctx, {
    requestType: "membership_transfer",
    entityType: "Membership",
    entityId: membershipId,
    payload: {
      sourceMembershipId: membershipId,
      targetMemberId: input.targetMemberId,
    },
    reason: input.reason,
    branchId: membership.branchId,
  });
}

/**
 * Request-only (W2/CLAUDE.md rule 8) — this NEVER moves money or touches
 * any invoice/payment record. There are none yet: real invoices arrive
 * with Module O (Phase 1.3), which is expected to look up approved
 * "membership_refund" requests when it builds actual refund processing.
 * Approving this request here only flips the ApprovalRequest's own status;
 * decideMembershipApprovalRequest below deliberately has no "apply" step
 * for this requestType.
 */
export async function requestRefundApproval(
  ctx: RequestContext,
  membershipId: string,
  input: RequestRefundApprovalInput,
) {
  await requirePermission(ctx, "memberships.edit");
  const membership = await findMembershipOrThrow(ctx, membershipId);

  return createApprovalRequest(ctx, {
    requestType: "membership_refund",
    entityType: "Membership",
    entityId: membershipId,
    payload: { membershipId, amountInPaise: input.amountInPaise },
    reason: input.reason,
    branchId: membership.branchId,
  });
}

/**
 * Reactivates a cancelled/expired membership within REACTIVATION_GRACE_DAYS
 * of its expiry — long enough for "I forgot to renew, let me back in," not
 * so long that a years-dormant membership can be casually revived instead
 * of the member re-registering with a new one.
 */
export async function reactivateMembership(
  ctx: RequestContext,
  membershipId: string,
) {
  await requirePermission(ctx, "memberships.edit");
  const membership = await findMembershipOrThrow(ctx, membershipId);
  const derived = deriveMembershipStatus(membership);
  if (derived === "active" || derived === "frozen") {
    throw new MembershipError("Membership is not cancelled or expired.");
  }

  const daysSinceExpiry = daysBetween(membership.expiryDate, new Date());
  if (daysSinceExpiry > REACTIVATION_GRACE_DAYS) {
    throw new MembershipError(
      `This membership expired more than ${REACTIVATION_GRACE_DAYS} days ago — create a new membership instead of reactivating.`,
    );
  }

  const updated = await prisma.membership.update({
    where: { id: membershipId },
    data: { status: "active", updatedById: ctx.userId },
  });

  await writeAuditLog(ctx, {
    action: "reactivate",
    entityType: "Membership",
    entityId: membershipId,
    before: { status: membership.status, expiryDate: membership.expiryDate },
    after: { status: updated.status },
    branchId: membership.branchId,
  });

  return withDerivedStatus(updated);
}

// ---------------------------------------------------------------------------
// Membership-scoped view over the generic ApprovalRequest workflow — same
// wrapper pattern as members.approve in Module C (see docs/DECISIONS.md:
// the shared GET /api/v1/approval-requests is still Phase 0's
// admin.approve-only gate, so each module exposes its own).
// ---------------------------------------------------------------------------

export async function listMembershipApprovalRequests(
  ctx: RequestContext,
  query: ListMembershipApprovalRequestsQuery,
) {
  await requirePermission(ctx, "memberships.approve");

  return prisma.approvalRequest.findMany({
    where: {
      ...orgScope(ctx),
      deletedAt: null,
      requestType: { in: [...MEMBERSHIP_APPROVAL_REQUEST_TYPES] },
      ...(query.status ? { status: query.status } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      requestedBy: { select: { id: true, name: true, email: true } },
      approver: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function decideMembershipApprovalRequest(
  ctx: RequestContext,
  input: DecideMembershipApprovalInput,
) {
  await requirePermission(ctx, "memberships.approve");

  const pending = await prisma.approvalRequest.findFirst({
    where: { id: input.approvalRequestId, ...orgScope(ctx) },
  });
  if (
    !pending ||
    !MEMBERSHIP_APPROVAL_REQUEST_TYPES.includes(
      pending.requestType as MembershipApprovalRequestType,
    )
  ) {
    throw new ApprovalError("Not a membership-management approval request.");
  }

  const decided = await decideApprovalRequest(ctx, {
    id: input.approvalRequestId,
    decision: input.decision,
    decisionNote: input.decisionNote,
  });

  if (decided.status === "approved") {
    if (decided.requestType === "membership_freeze") {
      await applyFreezeDecision(
        ctx,
        decided as typeof decided & {
          payload: {
            membershipId: string;
            startDate: string;
            endDate: string | null;
          };
        },
      );
    } else if (decided.requestType === "membership_cancel") {
      await applyCancelDecision(
        ctx,
        decided as typeof decided & { payload: { membershipId: string } },
      );
    } else if (decided.requestType === "membership_transfer") {
      await applyTransferDecision(
        ctx,
        decided as typeof decided & {
          payload: { sourceMembershipId: string; targetMemberId: string };
        },
      );
    }
    // "membership_refund": intentionally no apply step — see requestRefundApproval.
  }

  return decided;
}

async function applyFreezeDecision(
  ctx: RequestContext,
  decided: {
    id: string;
    reason: string | null;
    payload: {
      membershipId: string;
      startDate: string;
      endDate: string | null;
    };
  },
) {
  const { membershipId, startDate, endDate } = decided.payload;
  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
  });
  if (!membership) return;

  const freeze = await prisma.membershipFreeze.create({
    data: {
      organizationId: ctx.organizationId,
      membershipId,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      reason: decided.reason,
      approvalRequestId: decided.id,
      createdById: ctx.userId,
      updatedById: ctx.userId,
    },
  });

  const data: Prisma.MembershipUpdateInput = {
    status: "frozen",
    freezeCount: { increment: 1 },
    updatedById: ctx.userId,
  };

  if (endDate) {
    const days = daysBetween(new Date(startDate), new Date(endDate)) + 1;
    data.expiryDate = addDays(membership.expiryDate, days);
    data.freezeDaysUsed = { increment: days };
  }

  const updated = await prisma.membership.update({
    where: { id: membershipId },
    data,
  });

  await writeAuditLog(ctx, {
    action: "freeze",
    entityType: "Membership",
    entityId: membershipId,
    before: { status: membership.status, expiryDate: membership.expiryDate },
    after: { status: updated.status, expiryDate: updated.expiryDate },
    metadata: { freezeId: freeze.id },
    branchId: membership.branchId,
  });
}

async function applyCancelDecision(
  ctx: RequestContext,
  decided: { reason: string | null; payload: { membershipId: string } },
) {
  const { membershipId } = decided.payload;
  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
  });
  if (!membership) return;

  const updated = await prisma.membership.update({
    where: { id: membershipId },
    data: { status: "cancelled", updatedById: ctx.userId },
  });

  await writeAuditLog(ctx, {
    action: "cancel",
    entityType: "Membership",
    entityId: membershipId,
    before: { status: membership.status },
    after: { status: updated.status },
    metadata: { reason: decided.reason },
    branchId: membership.branchId,
  });
}

async function applyTransferDecision(
  ctx: RequestContext,
  decided: { payload: { sourceMembershipId: string; targetMemberId: string } },
) {
  const { sourceMembershipId, targetMemberId } = decided.payload;
  const source = await prisma.membership.findUnique({
    where: { id: sourceMembershipId },
  });
  if (!source) return;
  const targetMember = await prisma.member.findUnique({
    where: { id: targetMemberId },
  });
  if (!targetMember) {
    throw new MembershipError("Target member no longer exists.");
  }

  const now = new Date();

  const created = await prisma.membership.create({
    data: {
      organizationId: ctx.organizationId,
      branchId: targetMember.branchId,
      memberId: targetMember.id,
      packageId: source.packageId,
      status: "active",
      startDate: now,
      // Transfer preserves remaining validity exactly, unlike upgrade/downgrade.
      expiryDate: source.expiryDate,
      originalExpiryDate: source.expiryDate,
      priceAtPurchaseInPaise: source.priceAtPurchaseInPaise,
      discountAppliedInPaise: source.discountAppliedInPaise,
      couponCode: source.couponCode,
      ptSessionsRemaining: source.ptSessionsRemaining,
      groupClassesRemaining: source.groupClassesRemaining,
      guestPassesRemaining: source.guestPassesRemaining,
      transferredFromId: source.id,
      createdById: ctx.userId,
      updatedById: ctx.userId,
    },
  });

  await prisma.membership.update({
    where: { id: source.id },
    data: {
      expiryDate: now,
      ptSessionsRemaining: 0,
      groupClassesRemaining: 0,
      guestPassesRemaining: 0,
      updatedById: ctx.userId,
    },
  });

  await writeAuditLog(ctx, {
    action: "transfer",
    entityType: "Membership",
    entityId: source.id,
    before: source,
    after: { closedMembershipId: source.id, newMembershipId: created.id },
    metadata: { targetMemberId: targetMember.id },
    branchId: source.branchId,
  });
  await writeAuditLog(ctx, {
    action: "create",
    entityType: "Membership",
    entityId: created.id,
    after: created,
    metadata: { transferredFromMembershipId: source.id },
    branchId: created.branchId,
  });
}
