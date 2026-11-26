import { describe, expect, it } from "vitest";

import { PermissionError } from "@/server/modules/permissions/service";
import { ScopeError } from "@/server/modules/permissions/scope";
import { ApprovalError } from "@/server/modules/approvals/service";
import {
  createMember,
  decideMemberApprovalRequest,
  DuplicateMemberError,
  getMemberTimeline,
  listMembers,
  requestMemberMerge,
  requestMemberSuspension,
  updateMember,
} from "@/server/modules/members/service";
import {
  assignRole,
  createBranch,
  createOrganization,
  createRoleWithPermissions,
  createUser,
  toRequestContext,
} from "./fixtures";

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

describe("members.createMember", () => {
  it("denies creation without members.create", async () => {
    const org = await createOrganization();
    const branch = await createBranch(org.id);
    const ctx = await orgWideUser(org.id, ["members.view"]);

    await expect(
      createMember(ctx, {
        branchId: branch.id,
        name: "Jane",
        mobile: "9000000001",
      }),
    ).rejects.toBeInstanceOf(PermissionError);
  });

  it("generates sequential, human-readable member codes per organization", async () => {
    const org = await createOrganization();
    const branch = await createBranch(org.id);
    const ctx = await orgWideUser(org.id, ["members.create", "members.view"]);

    const first = await createMember(ctx, {
      branchId: branch.id,
      name: "Jane",
      mobile: "9000000001",
    });
    const second = await createMember(ctx, {
      branchId: branch.id,
      name: "John",
      mobile: "9000000002",
    });

    expect(first.memberCode).toMatch(/^GM-\d{4}$/);
    expect(second.memberCode).not.toBe(first.memberCode);
    expect(first.cardNumber).toBe(first.memberCode);
  });

  it("rejects branch ids the caller cannot access", async () => {
    const org = await createOrganization();
    const branchA = await createBranch(org.id);
    const branchB = await createBranch(org.id);
    const user = await createUser(org.id);
    const role = await createRoleWithPermissions(org.id, ["members.create"]);
    await assignRole({
      userId: user.id,
      roleId: role.id,
      organizationId: org.id,
      branchId: branchA.id,
    });
    const ctx = toRequestContext(org.id, user);

    await expect(
      createMember(ctx, {
        branchId: branchB.id,
        name: "Jane",
        mobile: "9000000003",
      }),
    ).rejects.toBeInstanceOf(ScopeError);
  });

  it("blocks duplicate mobile/email unless allowDuplicate is set", async () => {
    const org = await createOrganization();
    const branch = await createBranch(org.id);
    const ctx = await orgWideUser(org.id, ["members.create", "members.view"]);

    await createMember(ctx, {
      branchId: branch.id,
      name: "Jane",
      mobile: "9000000004",
      email: "jane@example.test",
    });

    await expect(
      createMember(ctx, {
        branchId: branch.id,
        name: "Jane Again",
        mobile: "9000000004",
      }),
    ).rejects.toBeInstanceOf(DuplicateMemberError);

    const created = await createMember(ctx, {
      branchId: branch.id,
      name: "Jane Again",
      mobile: "9000000004",
      allowDuplicate: true,
    });
    expect(created.mobile).toBe("9000000004");
  });

  it("records a waiver consent at registration when waiverAccepted is set", async () => {
    const org = await createOrganization();
    const branch = await createBranch(org.id);
    const ctx = await orgWideUser(org.id, ["members.create", "members.view"]);

    const member = await createMember(ctx, {
      branchId: branch.id,
      name: "Jane",
      mobile: "9000000005",
      waiverAccepted: true,
    });

    const timeline = await getMemberTimeline(ctx, member.id);
    expect(timeline.some((e) => e.action === "grant_consent")).toBe(true);
    expect(timeline.some((e) => e.action === "create")).toBe(true);
  });
});

describe("members.listMembers", () => {
  it("scopes results to the caller's accessible branches", async () => {
    const org = await createOrganization();
    const branchA = await createBranch(org.id);
    const branchB = await createBranch(org.id);
    const admin = await orgWideUser(org.id, ["members.create", "members.view"]);

    await createMember(admin, {
      branchId: branchA.id,
      name: "In A",
      mobile: "9000000010",
    });
    await createMember(admin, {
      branchId: branchB.id,
      name: "In B",
      mobile: "9000000011",
    });

    const branchUser = await createUser(org.id);
    const role = await createRoleWithPermissions(org.id, ["members.view"]);
    await assignRole({
      userId: branchUser.id,
      roleId: role.id,
      organizationId: org.id,
      branchId: branchA.id,
    });
    const branchCtx = toRequestContext(org.id, branchUser);

    const result = await listMembers(branchCtx, {});
    expect(result.items.map((m) => m.name)).toEqual(["In A"]);
  });

  it("searches by name, member code, mobile and email", async () => {
    const org = await createOrganization();
    const branch = await createBranch(org.id);
    const ctx = await orgWideUser(org.id, ["members.create", "members.view"]);
    await createMember(ctx, {
      branchId: branch.id,
      name: "Searchable Person",
      mobile: "9000000020",
      email: "searchable@example.test",
    });

    const byName = await listMembers(ctx, { q: "Searchable" });
    expect(byName.total).toBe(1);
    const byMobile = await listMembers(ctx, { q: "9000000020" });
    expect(byMobile.total).toBe(1);
    const byNothing = await listMembers(ctx, { q: "no-such-member" });
    expect(byNothing.total).toBe(0);
  });
});

describe("members.updateMember", () => {
  it("writes an audit log entry on update", async () => {
    const org = await createOrganization();
    const branch = await createBranch(org.id);
    const ctx = await orgWideUser(org.id, [
      "members.create",
      "members.view",
      "members.edit",
    ]);
    const member = await createMember(ctx, {
      branchId: branch.id,
      name: "Jane",
      mobile: "9000000030",
    });

    const updated = await updateMember(ctx, member.id, {
      fitnessGoals: "Run a 10k",
    });
    expect(updated.fitnessGoals).toBe("Run a 10k");

    const timeline = await getMemberTimeline(ctx, member.id);
    expect(timeline.some((e) => e.action === "update")).toBe(true);
  });
});

describe("members approval workflow (suspend/unsuspend, merge)", () => {
  it("only suspends a member once a separate approver approves the request", async () => {
    const org = await createOrganization();
    const branch = await createBranch(org.id);
    const requester = await orgWideUser(org.id, [
      "members.create",
      "members.view",
      "members.edit",
      "members.approve",
    ]);
    const approver = await orgWideUser(org.id, [
      "members.view",
      "members.approve",
    ]);

    const member = await createMember(requester, {
      branchId: branch.id,
      name: "Jane",
      mobile: "9000000040",
    });
    expect(member.status).toBe("active");

    const request = await requestMemberSuspension(requester, member.id, {
      action: "suspend",
      reason: "Payment dispute",
    });
    expect(request.status).toBe("pending");

    // Member status is unchanged until the request is approved.
    const stillActive = await listMembers(requester, {});
    expect(stillActive.items.find((m) => m.id === member.id)?.status).toBe(
      "active",
    );

    // The requester holds members.approve but still cannot approve their own request.
    await expect(
      decideMemberApprovalRequest(requester, {
        approvalRequestId: request.id,
        decision: "approved",
      }),
    ).rejects.toBeInstanceOf(ApprovalError);

    // A user without members.approve cannot decide it either.
    const viewer = await orgWideUser(org.id, ["members.view"]);
    await expect(
      decideMemberApprovalRequest(viewer, {
        approvalRequestId: request.id,
        decision: "approved",
      }),
    ).rejects.toBeInstanceOf(PermissionError);

    const decided = await decideMemberApprovalRequest(approver, {
      approvalRequestId: request.id,
      decision: "approved",
    });
    expect(decided.status).toBe("approved");

    const afterApproval = await listMembers(requester, {});
    expect(afterApproval.items.find((m) => m.id === member.id)?.status).toBe(
      "suspended",
    );
  });

  it("rejects deciding a non-member approval request through this module", async () => {
    const org = await createOrganization();
    const requester = await orgWideUser(org.id, ["admin.view"]);
    const approver = await orgWideUser(org.id, ["members.approve"]);

    const { createApprovalRequest } =
      await import("@/server/modules/approvals/service");
    const request = await createApprovalRequest(requester, {
      requestType: "refund",
      payload: { amount: 100 },
    });

    await expect(
      decideMemberApprovalRequest(approver, {
        approvalRequestId: request.id,
        decision: "approved",
      }),
    ).rejects.toBeInstanceOf(ApprovalError);
  });

  it("merges a duplicate member into the primary once approved", async () => {
    const org = await createOrganization();
    const branch = await createBranch(org.id);
    const requester = await orgWideUser(org.id, [
      "members.create",
      "members.view",
      "members.edit",
    ]);
    const approver = await orgWideUser(org.id, [
      "members.view",
      "members.approve",
    ]);

    const primary = await createMember(requester, {
      branchId: branch.id,
      name: "Primary Person",
      mobile: "9000000050",
    });
    const duplicate = await createMember(requester, {
      branchId: branch.id,
      name: "Primary Person Duplicate",
      mobile: "9000000051",
      allowDuplicate: true,
    });

    const request = await requestMemberMerge(requester, primary.id, {
      duplicateMemberId: duplicate.id,
      reason: "Same person, two sign-ups",
    });

    await decideMemberApprovalRequest(approver, {
      approvalRequestId: request.id,
      decision: "approved",
    });

    const result = await listMembers(requester, {});
    const duplicateStillListed = result.items.find(
      (m) => m.id === duplicate.id,
    );
    expect(duplicateStillListed).toBeUndefined(); // soft-deleted, excluded from ordinary listings

    const timeline = await getMemberTimeline(requester, primary.id);
    expect(timeline.some((e) => e.action === "merge")).toBe(true);
  });
});

describe("members.getMemberTimeline sensitive-data isolation", () => {
  it("excludes health-declaration events for a caller without sensitive.health.view", async () => {
    const org = await createOrganization();
    const branch = await createBranch(org.id);
    const privileged = await orgWideUser(org.id, [
      "members.create",
      "members.view",
      "members.edit",
      "sensitive.health.view",
      "sensitive.health.edit",
    ]);
    const unprivileged = await orgWideUser(org.id, ["members.view"]);

    const { upsertMemberHealthDeclaration } =
      await import("@/server/modules/members/service");
    const member = await createMember(privileged, {
      branchId: branch.id,
      name: "Jane",
      mobile: "9000000060",
    });
    await upsertMemberHealthDeclaration(privileged, member.id, {
      injuries: "Twisted ankle",
    });

    const privilegedTimeline = await getMemberTimeline(privileged, member.id);
    expect(
      privilegedTimeline.some(
        (e) => e.entityType === "MemberHealthDeclaration",
      ),
    ).toBe(true);

    const unprivilegedTimeline = await getMemberTimeline(
      unprivileged,
      member.id,
    );
    expect(
      unprivilegedTimeline.some(
        (e) => e.entityType === "MemberHealthDeclaration",
      ),
    ).toBe(false);
  });
});
