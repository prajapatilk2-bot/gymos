import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import type { RequestContext } from "@/server/auth/session";
import { requirePermission } from "@/server/modules/permissions/service";
import {
  assertBranchAccess,
  orgScope,
} from "@/server/modules/permissions/scope";
import { writeAuditLog } from "@/server/modules/audit/service";
import type {
  CreatePackageInput,
  ListPackagesQuery,
  UpdatePackageInput,
} from "@/server/modules/memberships/packages.schema";

export class PackageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PackageError";
  }
}

async function findPackageOrThrow(ctx: RequestContext, packageId: string) {
  const pkg = await prisma.package.findFirst({
    where: { id: packageId, ...orgScope(ctx), deletedAt: null },
    include: { branchRestrictions: { select: { branchId: true } } },
  });
  if (!pkg) throw new PackageError("Package not found.");
  return pkg;
}

/**
 * D2 branch access restriction check. A package with `allBranches: true`
 * (the default) is sellable/usable at every branch in the organization;
 * otherwise only at the branches listed in `branchRestrictions`.
 */
export function isPackageAvailableToBranch(
  pkg: { allBranches: boolean; branchRestrictions: { branchId: string }[] },
  branchId: string,
): boolean {
  if (pkg.allBranches) return true;
  return pkg.branchRestrictions.some((b) => b.branchId === branchId);
}

async function setBranchRestrictions(packageId: string, branchIds: string[]) {
  await prisma.$transaction([
    prisma.packageBranch.deleteMany({ where: { packageId } }),
    prisma.packageBranch.createMany({
      data: branchIds.map((branchId) => ({ packageId, branchId })),
    }),
  ]);
}

export async function listPackages(
  ctx: RequestContext,
  query: ListPackagesQuery,
) {
  await requirePermission(ctx, "memberships.view");

  const where: Prisma.PackageWhereInput = {
    ...orgScope(ctx),
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.category ? { category: query.category } : {}),
  };

  const packages = await prisma.package.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { branchRestrictions: { select: { branchId: true } } },
  });

  if (!query.branchId) return packages;
  return packages.filter((p) => isPackageAvailableToBranch(p, query.branchId!));
}

export async function getPackageById(ctx: RequestContext, packageId: string) {
  await requirePermission(ctx, "memberships.view");
  return findPackageOrThrow(ctx, packageId);
}

export async function createPackage(
  ctx: RequestContext,
  input: CreatePackageInput,
) {
  await requirePermission(ctx, "memberships.create");

  if (input.branchIds) {
    for (const branchId of input.branchIds) {
      await assertBranchAccess(ctx, branchId);
    }
  }

  const { branchIds, ...fields } = input;
  const pkg = await prisma.package.create({
    data: {
      ...fields,
      organizationId: ctx.organizationId,
      allBranches: input.allBranches ?? branchIds === undefined,
      createdById: ctx.userId,
      updatedById: ctx.userId,
      ...(branchIds && branchIds.length > 0
        ? {
            branchRestrictions: {
              create: branchIds.map((branchId) => ({ branchId })),
            },
          }
        : {}),
    },
  });

  await writeAuditLog(ctx, {
    action: "create",
    entityType: "Package",
    entityId: pkg.id,
    after: pkg,
  });

  return pkg;
}

export async function updatePackage(
  ctx: RequestContext,
  packageId: string,
  input: UpdatePackageInput,
) {
  await requirePermission(ctx, "memberships.edit");
  const before = await findPackageOrThrow(ctx, packageId);

  if (input.branchIds) {
    for (const branchId of input.branchIds) {
      await assertBranchAccess(ctx, branchId);
    }
    await setBranchRestrictions(packageId, input.branchIds);
  }

  const { branchIds, ...fields } = input;
  void branchIds; // handled via setBranchRestrictions above, not a Package column
  const updated = await prisma.package.update({
    where: { id: packageId },
    data: { ...fields, updatedById: ctx.userId },
  });

  await writeAuditLog(ctx, {
    action: "update",
    entityType: "Package",
    entityId: packageId,
    before,
    after: updated,
  });

  return updated;
}

/** D1/D2 "retire a plan without affecting members already on it." */
export async function archivePackage(ctx: RequestContext, packageId: string) {
  await requirePermission(ctx, "memberships.edit");
  const before = await findPackageOrThrow(ctx, packageId);

  const updated = await prisma.package.update({
    where: { id: packageId },
    data: { status: "archived", updatedById: ctx.userId },
  });

  await writeAuditLog(ctx, {
    action: "archive",
    entityType: "Package",
    entityId: packageId,
    before: { status: before.status },
    after: { status: updated.status },
  });

  return updated;
}

export async function setPackageStatus(
  ctx: RequestContext,
  packageId: string,
  status: "active" | "inactive",
) {
  await requirePermission(ctx, "memberships.edit");
  const before = await findPackageOrThrow(ctx, packageId);
  if (before.status === "archived") {
    throw new PackageError(
      "An archived package cannot be reactivated; create a new one instead.",
    );
  }

  const updated = await prisma.package.update({
    where: { id: packageId },
    data: { status, updatedById: ctx.userId },
  });

  await writeAuditLog(ctx, {
    action: "update",
    entityType: "Package",
    entityId: packageId,
    before: { status: before.status },
    after: { status: updated.status },
  });

  return updated;
}

/** True delete (soft) — only allowed if no Membership ever referenced it; archive otherwise. */
export async function deletePackage(ctx: RequestContext, packageId: string) {
  await requirePermission(ctx, "memberships.delete");
  const pkg = await findPackageOrThrow(ctx, packageId);

  const membershipCount = await prisma.membership.count({
    where: { packageId },
  });
  if (membershipCount > 0) {
    throw new PackageError(
      "This package has members on it; archive it instead of deleting it.",
    );
  }

  await prisma.package.update({
    where: { id: packageId },
    data: { deletedAt: new Date(), updatedById: ctx.userId },
  });

  await writeAuditLog(ctx, {
    action: "delete",
    entityType: "Package",
    entityId: packageId,
    before: { name: pkg.name },
  });
}
