import { describe, expect, it } from "vitest";

import {
  hasPermission,
  requirePermission,
  PermissionError,
} from "@/server/modules/permissions/service";
import {
  createBranch,
  createOrganization,
  createRoleWithPermissions,
  createUser,
  assignRole,
  toRequestContext,
} from "./fixtures";

describe("requirePermission / hasPermission", () => {
  it("allows a permission the user's role grants, and denies one it doesn't", async () => {
    const org = await createOrganization();
    const user = await createUser(org.id);
    const role = await createRoleWithPermissions(org.id, [
      "members.view",
      "members.create",
    ]);
    await assignRole({
      userId: user.id,
      roleId: role.id,
      organizationId: org.id,
      branchId: null,
    });

    const ctx = toRequestContext(org.id, user);

    await expect(hasPermission(ctx, "members.view")).resolves.toBe(true);
    await expect(hasPermission(ctx, "members.create")).resolves.toBe(true);
    await expect(hasPermission(ctx, "members.delete")).resolves.toBe(false);

    await expect(
      requirePermission(ctx, "members.view"),
    ).resolves.toBeUndefined();
    await expect(
      requirePermission(ctx, "members.delete"),
    ).rejects.toBeInstanceOf(PermissionError);
  });

  it("requires every key in a combined check (module + sensitive gate)", async () => {
    const org = await createOrganization();
    const user = await createUser(org.id);
    const role = await createRoleWithPermissions(org.id, ["members.view"]); // no sensitive.health.view
    await assignRole({
      userId: user.id,
      roleId: role.id,
      organizationId: org.id,
      branchId: null,
    });

    const ctx = toRequestContext(org.id, user);

    await expect(
      hasPermission(ctx, ["members.view", "sensitive.health.view"]),
    ).resolves.toBe(false);

    const roleWithHealth = await createRoleWithPermissions(org.id, [
      "sensitive.health.view",
    ]);
    await assignRole({
      userId: user.id,
      roleId: roleWithHealth.id,
      organizationId: org.id,
      branchId: null,
    });

    await expect(
      hasPermission(ctx, ["members.view", "sensitive.health.view"]),
    ).resolves.toBe(true);
  });

  it("a user with no role assignments has no permissions", async () => {
    const org = await createOrganization();
    const user = await createUser(org.id);
    const ctx = toRequestContext(org.id, user);

    await expect(hasPermission(ctx, "members.view")).resolves.toBe(false);
  });

  it("isolates permissions between organizations (same role key, different org)", async () => {
    const orgA = await createOrganization();
    const orgB = await createOrganization();
    const userA = await createUser(orgA.id);
    const userB = await createUser(orgB.id);

    const roleA = await createRoleWithPermissions(orgA.id, ["members.view"]);
    await assignRole({
      userId: userA.id,
      roleId: roleA.id,
      organizationId: orgA.id,
      branchId: null,
    });
    // userB has no role in orgB at all.

    const ctxA = toRequestContext(orgA.id, userA);
    const ctxB = toRequestContext(orgB.id, userB);

    await expect(hasPermission(ctxA, "members.view")).resolves.toBe(true);
    await expect(hasPermission(ctxB, "members.view")).resolves.toBe(false);
  });

  it("scopes a branch-specific role assignment to that branch only", async () => {
    const org = await createOrganization();
    const branchA = await createBranch(org.id);
    const branchB = await createBranch(org.id);
    const user = await createUser(org.id);
    const role = await createRoleWithPermissions(org.id, ["attendance.edit"]);
    await assignRole({
      userId: user.id,
      roleId: role.id,
      organizationId: org.id,
      branchId: branchA.id,
    });

    const ctx = toRequestContext(org.id, user);

    await expect(
      hasPermission(ctx, "attendance.edit", { branchId: branchA.id }),
    ).resolves.toBe(true);
    await expect(
      hasPermission(ctx, "attendance.edit", { branchId: branchB.id }),
    ).resolves.toBe(false);
    // Omitting branchId checks "anywhere", which is still true.
    await expect(hasPermission(ctx, "attendance.edit")).resolves.toBe(true);
  });

  it("an organization-wide assignment (branchId null) grants access to every branch", async () => {
    const org = await createOrganization();
    const branchA = await createBranch(org.id);
    const branchB = await createBranch(org.id);
    const user = await createUser(org.id);
    const role = await createRoleWithPermissions(org.id, ["finance.view"]);
    await assignRole({
      userId: user.id,
      roleId: role.id,
      organizationId: org.id,
      branchId: null,
    });

    const ctx = toRequestContext(org.id, user);

    await expect(
      hasPermission(ctx, "finance.view", { branchId: branchA.id }),
    ).resolves.toBe(true);
    await expect(
      hasPermission(ctx, "finance.view", { branchId: branchB.id }),
    ).resolves.toBe(true);
  });
});
