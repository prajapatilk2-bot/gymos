import { prisma } from "@/server/db/prisma";
import type { RequestContext } from "@/server/auth/session";
import { requirePermission } from "@/server/modules/permissions/service";
import {
  getAccessibleBranchIds,
  orgScope,
} from "@/server/modules/permissions/scope";
import { writeAuditLog } from "@/server/modules/audit/service";
import type {
  CreateBranchInput,
  UpdateBranchInput,
} from "@/server/modules/branches/schema";

export async function listBranches(ctx: RequestContext) {
  await requirePermission(ctx, "admin.view");
  return prisma.branch.findMany({
    where: { ...orgScope(ctx), deletedAt: null },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}

/**
 * Branches to offer in the branch switcher — every authenticated user, not
 * just those with admin.view, since picking a branch isn't itself
 * sensitive. Limited to branches the user's role assignments actually
 * cover.
 */
export async function listBranchesForCurrentUser(ctx: RequestContext) {
  const accessible = await getAccessibleBranchIds(
    ctx.userId,
    ctx.organizationId,
  );
  return prisma.branch.findMany({
    where: {
      ...orgScope(ctx),
      deletedAt: null,
      isActive: true,
      ...(accessible === "all" ? {} : { id: { in: accessible } }),
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}

export async function createBranch(
  ctx: RequestContext,
  input: CreateBranchInput,
) {
  await requirePermission(ctx, "admin.create");

  const existing = await prisma.branch.findUnique({
    where: {
      organizationId_code: {
        organizationId: ctx.organizationId,
        code: input.code,
      },
    },
  });
  if (existing) throw new Error("A branch with this code already exists.");

  if (input.isDefault) {
    await prisma.branch.updateMany({
      where: { ...orgScope(ctx), isDefault: true },
      data: { isDefault: false, updatedById: ctx.userId },
    });
  }

  const branch = await prisma.branch.create({
    data: {
      ...input,
      organizationId: ctx.organizationId,
      createdById: ctx.userId,
      updatedById: ctx.userId,
    },
  });

  await writeAuditLog(ctx, {
    action: "create",
    entityType: "Branch",
    entityId: branch.id,
    after: branch,
    branchId: branch.id,
  });

  return branch;
}

export async function updateBranch(
  ctx: RequestContext,
  branchId: string,
  input: UpdateBranchInput,
) {
  await requirePermission(ctx, "admin.edit");

  const before = await prisma.branch.findFirst({
    where: { id: branchId, ...orgScope(ctx), deletedAt: null },
  });
  if (!before) throw new Error("Branch not found.");

  if (input.isDefault) {
    await prisma.branch.updateMany({
      where: { ...orgScope(ctx), isDefault: true, id: { not: branchId } },
      data: { isDefault: false, updatedById: ctx.userId },
    });
  }

  const updated = await prisma.branch.update({
    where: { id: branchId },
    data: { ...input, updatedById: ctx.userId },
  });

  await writeAuditLog(ctx, {
    action: "update",
    entityType: "Branch",
    entityId: branchId,
    before,
    after: updated,
    branchId,
  });

  return updated;
}
