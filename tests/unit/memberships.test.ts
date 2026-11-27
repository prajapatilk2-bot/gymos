import { describe, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import { PermissionError } from "@/server/modules/permissions/service";
import { ScopeError } from "@/server/modules/permissions/scope";
import { ApprovalError } from "@/server/modules/approvals/service";
import { createMember } from "@/server/modules/members/service";
import {
  archivePackage,
  createPackage,
  deletePackage,
  PackageError,
} from "@/server/modules/memberships/packages.service";
import {
  createMembership,
  decideMembershipApprovalRequest,
  deriveMembershipStatus,
  extendMembership,
  listMemberships,
  listMembershipsNeedingReminder,
  MembershipError,
  reactivateMembership,
  renewMembership,
  requestCancelMembership,
  requestFreezeMembership,
  requestTransferMembership,
  unfreezeMembership,
} from "@/server/modules/memberships/service";
import {
  assignRole,
  createBranch,
  createOrganization,
  createRoleWithPermissions,
  createUser,
  toRequestContext,
} from "./fixtures";

const ALL_MEMBERSHIP_PERMS = [
  "memberships.view",
  "memberships.create",
  "memberships.edit",
  "memberships.delete",
  "memberships.approve",
];

async function orgWideUser(organizationId: string, permissionKeys: string[]) {
  const user = await createUser(organizationId);
  const role = await createRoleWithPermissions(organizationId, permissionKeys);
  await assignRole({
    userId: user.id,
    roleId: role.id,
    organizationId,
    branchId: null,
  });
  return toRequestContext(organizationId, user);
}

async function branchUser(
  organizationId: string,
  branchId: string,
  permissionKeys: string[],
) {
  const user = await createUser(organizationId);
  const role = await createRoleWithPermissions(organizationId, permissionKeys);
  await assignRole({
    userId: user.id,
    roleId: role.id,
    organizationId,
    branchId,
  });
  return toRequestContext(organizationId, user);
}

async function setupMemberAndPackage(
  overrides: {
    priceInPaise?: number;
    durationUnit?: "day" | "week" | "month" | "year";
    durationValue?: number;
    freezeMaxCount?: number;
    freezeMaxDaysPerYear?: number;
    freezeMinNoticeDays?: number;
    ptSessionsIncluded?: number;
  } = {},
) {
  const org = await createOrganization();
  const branch = await createBranch(org.id);
  const ctx = await orgWideUser(org.id, [
    ...ALL_MEMBERSHIP_PERMS,
    "members.view",
    "members.create",
  ]);

  const member = await createMember(ctx, {
    branchId: branch.id,
    name: "Jane Doe",
    mobile: "9000000001",
  });

  const pkg = await createPackage(ctx, {
    name: "Monthly General",
    durationUnit: overrides.durationUnit ?? "month",
    durationValue: overrides.durationValue ?? 1,
    priceInPaise: overrides.priceInPaise ?? 100_000,
    freezeMaxCount: overrides.freezeMaxCount,
    freezeMaxDaysPerYear: overrides.freezeMaxDaysPerYear,
    freezeMinNoticeDays: overrides.freezeMinNoticeDays,
    ptSessionsIncluded: overrides.ptSessionsIncluded,
  });

  return { org, branch, ctx, member, pkg };
}

describe("packages.createPackage / archivePackage / deletePackage", () => {
  it("denies creation without memberships.create", async () => {
    const org = await createOrganization();
    const ctx = await orgWideUser(org.id, ["memberships.view"]);

    await expect(
      createPackage(ctx, {
        name: "X",
        durationUnit: "month",
        durationValue: 1,
        priceInPaise: 100,
      }),
    ).rejects.toBeInstanceOf(PermissionError);
  });

  it("creates a package with sensible defaults", async () => {
    const org = await createOrganization();
    const ctx = await orgWideUser(org.id, ALL_MEMBERSHIP_PERMS);

    const pkg = await createPackage(ctx, {
      name: "Annual VIP",
      durationUnit: "year",
      durationValue: 1,
      priceInPaise: 1_000_000,
    });

    expect(pkg.status).toBe("active");
    expect(pkg.allBranches).toBe(true);
    expect(pkg.freezeAllowed).toBe(true);
  });

  it("archiving a package leaves existing memberships untouched", async () => {
    const { ctx, member, pkg, branch } = await setupMemberAndPackage();
    const membership = await createMembership(ctx, {
      memberId: member.id,
      packageId: pkg.id,
      branchId: branch.id,
    });

    const archived = await archivePackage(ctx, pkg.id);
    expect(archived.status).toBe("archived");

    const stillThere = await prisma.membership.findUnique({
      where: { id: membership.id },
    });
    expect(stillThere?.packageId).toBe(pkg.id);
  });

  it("refuses to delete a package that has memberships on it, suggesting archive instead", async () => {
    const { ctx, member, pkg, branch } = await setupMemberAndPackage();
    await createMembership(ctx, {
      memberId: member.id,
      packageId: pkg.id,
      branchId: branch.id,
    });

    await expect(deletePackage(ctx, pkg.id)).rejects.toBeInstanceOf(
      PackageError,
    );
  });

  it("deletes a package that was never used", async () => {
    const org = await createOrganization();
    const ctx = await orgWideUser(org.id, ALL_MEMBERSHIP_PERMS);
    const pkg = await createPackage(ctx, {
      name: "Unused",
      durationUnit: "month",
      durationValue: 1,
      priceInPaise: 500,
    });

    await deletePackage(ctx, pkg.id);
    const deleted = await prisma.package.findUnique({ where: { id: pkg.id } });
    expect(deleted?.deletedAt).not.toBeNull();
  });
});

describe("memberships.createMembership — pricing snapshot", () => {
  it("snapshots price/joining fee at purchase; later Package price changes don't retroactively alter it", async () => {
    const { ctx, member, pkg, branch } = await setupMemberAndPackage({
      priceInPaise: 200_000,
    });

    const membership = await createMembership(ctx, {
      memberId: member.id,
      packageId: pkg.id,
      branchId: branch.id,
    });
    expect(membership.priceAtPurchaseInPaise).toBe(200_000);

    await prisma.package.update({
      where: { id: pkg.id },
      data: { priceInPaise: 999_999 },
    });

    const unchanged = await prisma.membership.findUnique({
      where: { id: membership.id },
    });
    expect(unchanged?.priceAtPurchaseInPaise).toBe(200_000);
  });

  it("rejects a branch the caller cannot access", async () => {
    const org = await createOrganization();
    const branchA = await createBranch(org.id);
    const branchB = await createBranch(org.id);
    const adminCtx = await orgWideUser(org.id, [
      ...ALL_MEMBERSHIP_PERMS,
      "members.create",
      "members.view",
    ]);
    const member = await createMember(adminCtx, {
      branchId: branchA.id,
      name: "Jane",
      mobile: "9000000002",
    });
    const pkg = await createPackage(adminCtx, {
      name: "Plan",
      durationUnit: "month",
      durationValue: 1,
      priceInPaise: 1000,
    });

    const scopedCtx = await branchUser(
      org.id,
      branchA.id,
      ALL_MEMBERSHIP_PERMS,
    );

    await expect(
      createMembership(scopedCtx, {
        memberId: member.id,
        packageId: pkg.id,
        branchId: branchB.id,
      }),
    ).rejects.toBeInstanceOf(ScopeError);
  });

  it("rejects a package that isn't available at the requested branch", async () => {
    const org = await createOrganization();
    const branchA = await createBranch(org.id);
    const branchB = await createBranch(org.id);
    const ctx = await orgWideUser(org.id, [
      ...ALL_MEMBERSHIP_PERMS,
      "members.create",
      "members.view",
    ]);
    const member = await createMember(ctx, {
      branchId: branchB.id,
      name: "Jane",
      mobile: "9000000003",
    });
    const pkg = await createPackage(ctx, {
      name: "Branch A Only",
      durationUnit: "month",
      durationValue: 1,
      priceInPaise: 1000,
      allBranches: false,
      branchIds: [branchA.id],
    });

    await expect(
      createMembership(ctx, {
        memberId: member.id,
        packageId: pkg.id,
        branchId: branchB.id,
      }),
    ).rejects.toBeInstanceOf(MembershipError);
  });
});

describe("memberships.renewMembership — date math", () => {
  it("renewing before expiry extends from the current expiry, not from today", async () => {
    const { ctx, member, pkg, branch } = await setupMemberAndPackage({
      durationUnit: "month",
      durationValue: 1,
      ptSessionsIncluded: 3,
    });
    const membership = await createMembership(ctx, {
      memberId: member.id,
      packageId: pkg.id,
      branchId: branch.id,
    });
    // Membership expiry is ~1 month in the future (well after "now").
    const renewed = await renewMembership(ctx, membership.id, {});

    expect(new Date(renewed.startDate).getTime()).toBe(
      new Date(membership.expiryDate).getTime(),
    );
    expect(renewed.renewedFromId).toBe(membership.id);

    // Regression: the OLD row must be closed out — expiryDate pinned to the
    // new row's startDate (so it can never drift into a gap/overlap if the
    // date math above it changes) and benefits zeroed (so the member can't
    // spend the same PT sessions/classes/guest passes from both rows during
    // the remaining window). For an early renewal like this one, newStart
    // equals the old row's original expiryDate, so it legitimately still
    // derives "active" until that date — the member hasn't lost access
    // early, they've just pre-paid for the next cycle. See docs/DECISIONS.md.
    const oldAfterRenewal = await prisma.membership.findUniqueOrThrow({
      where: { id: membership.id },
    });
    expect(deriveMembershipStatus(oldAfterRenewal)).toBe("active");
    expect(oldAfterRenewal.expiryDate.getTime()).toBe(
      new Date(renewed.startDate).getTime(),
    );
    expect(oldAfterRenewal.ptSessionsRemaining).toBe(0);
    expect(oldAfterRenewal.groupClassesRemaining).toBe(0);
    expect(oldAfterRenewal.guestPassesRemaining).toBe(0);
  });

  it("renewing after expiry starts the new cycle today, not backdated, and the old row still reads as expired", async () => {
    const { ctx, member, pkg, branch } = await setupMemberAndPackage({
      durationUnit: "day",
      durationValue: 1,
    });
    const membership = await createMembership(ctx, {
      memberId: member.id,
      packageId: pkg.id,
      branchId: branch.id,
    });
    // Force it into the past to simulate a lapsed membership.
    const pastExpiry = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    await prisma.membership.update({
      where: { id: membership.id },
      data: { expiryDate: pastExpiry },
    });

    const before = Date.now();
    const renewed = await renewMembership(ctx, membership.id, {});
    const after = Date.now();

    const renewedStart = new Date(renewed.startDate).getTime();
    expect(renewedStart).toBeGreaterThanOrEqual(before - 1000);
    expect(renewedStart).toBeLessThanOrEqual(after + 1000);
    expect(renewedStart).not.toBe(pastExpiry.getTime());

    // This case already derived "expired" before the fix (expiryDate was
    // already in the past); confirm the fix doesn't change that outcome.
    const oldAfterRenewal = await prisma.membership.findUniqueOrThrow({
      where: { id: membership.id },
    });
    expect(deriveMembershipStatus(oldAfterRenewal)).toBe("expired");
  });

  it("listMembershipsNeedingReminder does not surface an already-renewed (closed-out) membership", async () => {
    const { ctx, member, pkg, branch } = await setupMemberAndPackage({
      durationUnit: "day",
      durationValue: 2,
    });
    const membership = await createMembership(ctx, {
      memberId: member.id,
      packageId: pkg.id,
      branchId: branch.id,
    });
    // Within the reminder window (expiring in ~2 days, window is 3) before renewal.
    const before = await listMembershipsNeedingReminder(ctx, {
      daysBeforeExpiry: 3,
    });
    expect(before.some((m) => m.id === membership.id)).toBe(true);

    const renewed = await renewMembership(ctx, membership.id, {});

    const after = await listMembershipsNeedingReminder(ctx, {
      daysBeforeExpiry: 3,
    });
    expect(after.some((m) => m.id === membership.id)).toBe(false);
    // The new cycle's own expiry (~4 days out: old 2-day expiry + new 2-day
    // duration, since this is an early renewal) falls outside the 3-day
    // window, so it isn't "expiring soon" either — unrelated to the fix,
    // just confirms the new row wasn't accidentally picked up instead.
    expect(after.some((m) => m.id === renewed.id)).toBe(false);
  });
});

describe("memberships — derived expired status", () => {
  it("derives 'expired' from a past expiryDate even though the stored status is still 'active'", () => {
    expect(
      deriveMembershipStatus({
        status: "active",
        expiryDate: new Date(Date.now() - 1000),
      }),
    ).toBe("expired");
  });

  it("a cancelled membership stays 'cancelled' even if its expiry is in the future", () => {
    expect(
      deriveMembershipStatus({
        status: "cancelled",
        expiryDate: new Date(Date.now() + 1_000_000),
      }),
    ).toBe("cancelled");
  });

  it("an active membership with a future expiry reads as 'active'", () => {
    expect(
      deriveMembershipStatus({
        status: "active",
        expiryDate: new Date(Date.now() + 1_000_000),
      }),
    ).toBe("active");
  });

  it("listMemberships reflects the derived status, not the raw column", async () => {
    const { ctx, member, pkg, branch } = await setupMemberAndPackage({
      durationUnit: "day",
      durationValue: 1,
    });
    const membership = await createMembership(ctx, {
      memberId: member.id,
      packageId: pkg.id,
      branchId: branch.id,
    });
    await prisma.membership.update({
      where: { id: membership.id },
      data: { expiryDate: new Date(Date.now() - 1000) },
    });

    const result = await listMemberships(ctx, {});
    const row = result.items.find((m) => m.id === membership.id);
    expect(row?.status).toBe("active");
    expect(row?.derivedStatus).toBe("expired");
  });
});

describe("memberships — freeze policy limits", () => {
  it("rejects a freeze that would exceed the package's max freeze count", async () => {
    const { ctx, member, pkg, branch } = await setupMemberAndPackage({
      freezeMaxCount: 0,
    });
    const membership = await createMembership(ctx, {
      memberId: member.id,
      packageId: pkg.id,
      branchId: branch.id,
    });

    await expect(
      requestFreezeMembership(ctx, membership.id, {
        startDate: new Date().toISOString().slice(0, 10),
      }),
    ).rejects.toBeInstanceOf(MembershipError);
  });

  it("rejects a freeze that doesn't meet the package's minimum notice period", async () => {
    const { ctx, member, pkg, branch } = await setupMemberAndPackage({
      freezeMinNoticeDays: 5,
    });
    const membership = await createMembership(ctx, {
      memberId: member.id,
      packageId: pkg.id,
      branchId: branch.id,
    });

    await expect(
      requestFreezeMembership(ctx, membership.id, {
        startDate: new Date().toISOString().slice(0, 10), // 0 days notice
      }),
    ).rejects.toBeInstanceOf(MembershipError);
  });

  it("rejects a fixed-duration freeze that would exceed the max days per year", async () => {
    const { ctx, member, pkg, branch } = await setupMemberAndPackage({
      freezeMaxDaysPerYear: 5,
    });
    const membership = await createMembership(ctx, {
      memberId: member.id,
      packageId: pkg.id,
      branchId: branch.id,
    });

    const start = new Date();
    const end = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 11 days inclusive

    await expect(
      requestFreezeMembership(ctx, membership.id, {
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
      }),
    ).rejects.toBeInstanceOf(MembershipError);
  });

  it("approving a fixed-duration freeze extends expiry by exactly the requested days and marks it frozen", async () => {
    const { ctx, member, pkg, branch } = await setupMemberAndPackage({
      freezeMaxDaysPerYear: 30,
      freezeMaxCount: 2,
    });
    const membership = await createMembership(ctx, {
      memberId: member.id,
      packageId: pkg.id,
      branchId: branch.id,
    });

    const start = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const end = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000); // 5 days inclusive
    const request = await requestFreezeMembership(ctx, membership.id, {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    });

    const approverCtx = await orgWideUser(
      ctx.organizationId,
      ALL_MEMBERSHIP_PERMS,
    );
    await decideMembershipApprovalRequest(approverCtx, {
      approvalRequestId: request.id,
      decision: "approved",
    });

    const updated = await prisma.membership.findUnique({
      where: { id: membership.id },
    });
    expect(updated?.status).toBe("frozen");
    expect(updated?.freezeCount).toBe(1);
    expect(updated?.freezeDaysUsed).toBe(5);
    expect(updated?.expiryDate.getTime()).toBe(
      new Date(membership.expiryDate).getTime() + 5 * 24 * 60 * 60 * 1000,
    );
  });

  it("unfreezing an open-ended freeze extends expiry by the actual elapsed days", async () => {
    const { ctx, member, pkg, branch } = await setupMemberAndPackage();
    const membership = await createMembership(ctx, {
      memberId: member.id,
      packageId: pkg.id,
      branchId: branch.id,
    });

    const request = await requestFreezeMembership(ctx, membership.id, {
      startDate: new Date().toISOString().slice(0, 10),
    });
    const approverCtx = await orgWideUser(
      ctx.organizationId,
      ALL_MEMBERSHIP_PERMS,
    );
    await decideMembershipApprovalRequest(approverCtx, {
      approvalRequestId: request.id,
      decision: "approved",
    });

    // Backdate the open freeze's start so we can assert a known elapsed count.
    const openFreeze = await prisma.membershipFreeze.findFirst({
      where: { membershipId: membership.id, endDate: null },
    });
    const backdatedStart = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    await prisma.membershipFreeze.update({
      where: { id: openFreeze!.id },
      data: { startDate: backdatedStart },
    });

    const unfrozen = await unfreezeMembership(ctx, membership.id);
    expect(unfrozen.status).toBe("active");
    expect(unfrozen.freezeDaysUsed).toBe(4); // inclusive day count
  });
});

describe("memberships — approval-gated actions", () => {
  it("rejects self-approval of a membership_cancel request", async () => {
    const { ctx, member, pkg, branch } = await setupMemberAndPackage();
    const membership = await createMembership(ctx, {
      memberId: member.id,
      packageId: pkg.id,
      branchId: branch.id,
    });

    const request = await requestCancelMembership(ctx, membership.id, {
      reason: "Relocating",
    });

    await expect(
      decideMembershipApprovalRequest(ctx, {
        approvalRequestId: request.id,
        decision: "approved",
      }),
    ).rejects.toBeInstanceOf(ApprovalError);
  });

  it("approving a cancel request sets the membership to cancelled", async () => {
    const { ctx, member, pkg, branch } = await setupMemberAndPackage();
    const membership = await createMembership(ctx, {
      memberId: member.id,
      packageId: pkg.id,
      branchId: branch.id,
    });
    const request = await requestCancelMembership(ctx, membership.id, {
      reason: "Relocating",
    });

    const approverCtx = await orgWideUser(
      ctx.organizationId,
      ALL_MEMBERSHIP_PERMS,
    );
    const decided = await decideMembershipApprovalRequest(approverCtx, {
      approvalRequestId: request.id,
      decision: "approved",
    });
    expect(decided.status).toBe("approved");

    const updated = await prisma.membership.findUnique({
      where: { id: membership.id },
    });
    expect(updated?.status).toBe("cancelled");
  });

  it("refuses to decide a request that doesn't belong to this module", async () => {
    const org = await createOrganization();
    const ctx = await orgWideUser(org.id, [
      ...ALL_MEMBERSHIP_PERMS,
      "admin.approve",
    ]);

    const { createApprovalRequest } =
      await import("@/server/modules/approvals/service");
    const foreignRequest = await createApprovalRequest(ctx, {
      requestType: "some_other_module_action",
      payload: {},
    });

    await expect(
      decideMembershipApprovalRequest(ctx, {
        approvalRequestId: foreignRequest.id,
        decision: "approved",
      }),
    ).rejects.toBeInstanceOf(ApprovalError);
  });
});

describe("memberships.requestTransferMembership — preserves remaining benefits", () => {
  it("the new membership keeps the source's remaining validity and benefit counters; the source closes immediately", async () => {
    const org = await createOrganization();
    const branch = await createBranch(org.id);
    const ctx = await orgWideUser(org.id, [
      ...ALL_MEMBERSHIP_PERMS,
      "members.create",
      "members.view",
    ]);

    const sourceMember = await createMember(ctx, {
      branchId: branch.id,
      name: "Source",
      mobile: "9000000010",
    });
    const targetMember = await createMember(ctx, {
      branchId: branch.id,
      name: "Target",
      mobile: "9000000011",
    });
    const pkg = await createPackage(ctx, {
      name: "Transferable",
      durationUnit: "month",
      durationValue: 3,
      priceInPaise: 300_000,
      ptSessionsIncluded: 10,
    });

    const source = await createMembership(ctx, {
      memberId: sourceMember.id,
      packageId: pkg.id,
      branchId: branch.id,
    });

    const request = await requestTransferMembership(ctx, source.id, {
      targetMemberId: targetMember.id,
      reason: "Member moving away",
    });

    const approverCtx = await orgWideUser(org.id, ALL_MEMBERSHIP_PERMS);
    await decideMembershipApprovalRequest(approverCtx, {
      approvalRequestId: request.id,
      decision: "approved",
    });

    const closedSource = await prisma.membership.findUnique({
      where: { id: source.id },
    });
    expect(closedSource?.expiryDate.getTime()).toBeLessThanOrEqual(Date.now());
    expect(closedSource?.ptSessionsRemaining).toBe(0);

    const newMembership = await prisma.membership.findFirst({
      where: { memberId: targetMember.id, transferredFromId: source.id },
    });
    expect(newMembership).not.toBeNull();
    expect(newMembership?.ptSessionsRemaining).toBe(10);
    expect(newMembership?.expiryDate.getTime()).toBe(
      new Date(source.expiryDate).getTime(),
    );
  });
});

describe("memberships — extend and reactivate", () => {
  it("extendMembership moves expiry forward without touching originalExpiryDate", async () => {
    const { ctx, member, pkg, branch } = await setupMemberAndPackage();
    const membership = await createMembership(ctx, {
      memberId: member.id,
      packageId: pkg.id,
      branchId: branch.id,
    });

    const extended = await extendMembership(ctx, membership.id, {
      additionalDays: 10,
    });
    expect(new Date(extended.expiryDate).getTime()).toBe(
      new Date(membership.expiryDate).getTime() + 10 * 24 * 60 * 60 * 1000,
    );
    expect(new Date(extended.originalExpiryDate).getTime()).toBe(
      new Date(membership.originalExpiryDate).getTime(),
    );
  });

  it("reactivateMembership refuses a membership that lapsed beyond the grace window", async () => {
    const { ctx, member, pkg, branch } = await setupMemberAndPackage();
    const membership = await createMembership(ctx, {
      memberId: member.id,
      packageId: pkg.id,
      branchId: branch.id,
    });
    await prisma.membership.update({
      where: { id: membership.id },
      data: {
        status: "cancelled",
        expiryDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
      },
    });

    await expect(
      reactivateMembership(ctx, membership.id),
    ).rejects.toBeInstanceOf(MembershipError);
  });

  it("reactivateMembership succeeds within the grace window", async () => {
    const { ctx, member, pkg, branch } = await setupMemberAndPackage();
    const membership = await createMembership(ctx, {
      memberId: member.id,
      packageId: pkg.id,
      branchId: branch.id,
    });
    await prisma.membership.update({
      where: { id: membership.id },
      data: {
        status: "cancelled",
        expiryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    });

    const reactivated = await reactivateMembership(ctx, membership.id);
    expect(reactivated.status).toBe("active");
  });
});
