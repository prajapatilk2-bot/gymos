import { describe, expect, it } from "vitest";

import {
  assertBranchAccess,
  getAccessibleBranchIds,
  orgScope,
  orgBranchScope,
  ScopeError,
} from "@/server/modules/permissions/scope";
import {
  createBranch,
  createOrganization,
  createRoleWithPermissions,
  createUser,
  assignRole,
  toRequestContext,
} from "./fixtures";

describe("branch scoping", () => {
  it("returns 'all' when any role assignment is organization-wide", async () => {
    const org = await createOrganization();
    const user = await createUser(org.id);
    const role = await createRoleWithPermissions(org.id, ["members.view"]);
    await assignRole({
      userId: user.id,
      roleId: role.id,
      organizationId: org.id,
      branchId: null,
    });

    await expect(getAccessibleBranchIds(user.id, org.id)).resolves.toBe("all");
  });

  it("returns only the assigned branch ids when every assignment is branch-scoped", async () => {
    const org = await createOrganization();
    const branchA = await createBranch(org.id);
    const branchB = await createBranch(org.id);
    const user = await createUser(org.id);
    const role = await createRoleWithPermissions(org.id, ["members.view"]);
    await assignRole({
      userId: user.id,
      roleId: role.id,
      organizationId: org.id,
      branchId: branchA.id,
    });

    const accessible = await getAccessibleBranchIds(user.id, org.id);
    expect(accessible).toEqual([branchA.id]);
    expect(accessible).not.toContain(branchB.id);
  });

  it("assertBranchAccess throws ScopeError for a branch the user cannot access", async () => {
    const org = await createOrganization();
    const branchA = await createBranch(org.id);
    const branchB = await createBranch(org.id);
    const user = await createUser(org.id);
    const role = await createRoleWithPermissions(org.id, ["members.view"]);
    await assignRole({
      userId: user.id,
      roleId: role.id,
      organizationId: org.id,
      branchId: branchA.id,
    });

    const ctx = toRequestContext(org.id, user);

    await expect(assertBranchAccess(ctx, branchA.id)).resolves.toBeUndefined();
    await expect(assertBranchAccess(ctx, branchB.id)).rejects.toBeInstanceOf(
      ScopeError,
    );
  });

  it("orgScope / orgBranchScope build the expected Prisma where clauses", async () => {
    const org = await createOrganization();
    const user = await createUser(org.id);
    const ctx = toRequestContext(org.id, user);

    expect(orgScope(ctx)).toEqual({ organizationId: org.id });
    expect(orgBranchScope(ctx)).toEqual({ organizationId: org.id });
    expect(orgBranchScope(ctx, "branch-123")).toEqual({
      organizationId: org.id,
      branchId: "branch-123",
    });
  });
});
