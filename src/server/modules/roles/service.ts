import { prisma } from "@/server/db/prisma";
import type { RequestContext } from "@/server/auth/session";
import { requirePermission } from "@/server/modules/permissions/service";
import { orgScope } from "@/server/modules/permissions/scope";
import { isKnownPermissionKey } from "@/server/modules/permissions/registry";
import { writeAuditLog } from "@/server/modules/audit/service";
import type {
  CreateRoleInput,
  UpdateRoleInput,
  UpdateRolePermissionsInput,
} from "@/server/modules/roles/schema";

export async function listRoles(ctx: RequestContext) {
  await requirePermission(ctx, "admin.view");

  return prisma.role.findMany({
    where: { ...orgScope(ctx), deletedAt: null },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    include: {
      rolePermissions: { select: { permission: { select: { key: true } } } },
      _count: { select: { userRoles: true } },
    },
  });
}

export async function getRole(ctx: RequestContext, roleId: string) {
  await requirePermission(ctx, "admin.view");

  return prisma.role.findFirst({
    where: { id: roleId, ...orgScope(ctx), deletedAt: null },
    include: {
      rolePermissions: { select: { permission: { select: { key: true } } } },
    },
  });
}

function assertValidPermissionKeys(keys: string[]) {
  const unknown = keys.filter((key) => !isKnownPermissionKey(key));
  if (unknown.length > 0) {
    throw new Error(`Unknown permission key(s): ${unknown.join(", ")}`);
  }
}

export async function createRole(ctx: RequestContext, input: CreateRoleInput) {
  await requirePermission(ctx, "admin.create");
  assertValidPermissionKeys(input.permissionKeys);

  const existing = await prisma.role.findUnique({
    where: {
      organizationId_key: {
        organizationId: ctx.organizationId,
        key: input.key,
      },
    },
  });
  if (existing) {
    throw new Error("A role with this key already exists.");
  }

  const permissions = await prisma.permission.findMany({
    where: { key: { in: input.permissionKeys } },
    select: { id: true },
  });

  const role = await prisma.role.create({
    data: {
      organizationId: ctx.organizationId,
      key: input.key,
      name: input.name,
      description: input.description,
      isSystem: false,
      createdById: ctx.userId,
      updatedById: ctx.userId,
      rolePermissions: {
        create: permissions.map((p) => ({ permissionId: p.id })),
      },
    },
  });

  await writeAuditLog(ctx, {
    action: "create",
    entityType: "Role",
    entityId: role.id,
    after: {
      key: role.key,
      name: role.name,
      permissionKeys: input.permissionKeys,
    },
  });

  return role;
}

export async function updateRole(
  ctx: RequestContext,
  roleId: string,
  input: UpdateRoleInput,
) {
  await requirePermission(ctx, "admin.edit");

  const before = await prisma.role.findFirst({
    where: { id: roleId, ...orgScope(ctx), deletedAt: null },
  });
  if (!before) throw new Error("Role not found.");

  const updated = await prisma.role.update({
    where: { id: roleId },
    data: { ...input, updatedById: ctx.userId },
  });

  await writeAuditLog(ctx, {
    action: "update",
    entityType: "Role",
    entityId: roleId,
    before: { name: before.name, description: before.description },
    after: { name: updated.name, description: updated.description },
  });

  return updated;
}

export async function updateRolePermissions(
  ctx: RequestContext,
  roleId: string,
  input: UpdateRolePermissionsInput,
) {
  await requirePermission(ctx, "admin.edit");
  assertValidPermissionKeys(input.permissionKeys);

  const role = await prisma.role.findFirst({
    where: { id: roleId, ...orgScope(ctx), deletedAt: null },
    include: {
      rolePermissions: { select: { permission: { select: { key: true } } } },
    },
  });
  if (!role) throw new Error("Role not found.");

  const permissions = await prisma.permission.findMany({
    where: { key: { in: input.permissionKeys } },
    select: { id: true },
  });

  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId } }),
    prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId, permissionId: p.id })),
    }),
  ]);

  await writeAuditLog(ctx, {
    action: "update",
    entityType: "RolePermission",
    entityId: roleId,
    before: role.rolePermissions.map((rp) => rp.permission.key),
    after: input.permissionKeys,
  });
}

export async function deleteRole(ctx: RequestContext, roleId: string) {
  await requirePermission(ctx, "admin.delete");

  const role = await prisma.role.findFirst({
    where: { id: roleId, ...orgScope(ctx), deletedAt: null },
    include: { _count: { select: { userRoles: true } } },
  });
  if (!role) throw new Error("Role not found.");
  if (role.isSystem) throw new Error("System roles cannot be deleted.");
  if (role._count.userRoles > 0) {
    throw new Error("This role is still assigned to one or more users.");
  }

  await prisma.role.update({
    where: { id: roleId },
    data: { deletedAt: new Date(), updatedById: ctx.userId },
  });

  await writeAuditLog(ctx, {
    action: "delete",
    entityType: "Role",
    entityId: roleId,
    before: { key: role.key, name: role.name },
  });
}
