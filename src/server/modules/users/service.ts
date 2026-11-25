import { prisma } from "@/server/db/prisma";
import { auth } from "@/server/auth/auth";
import type { RequestContext } from "@/server/auth/session";
import { requirePermission } from "@/server/modules/permissions/service";
import { orgScope } from "@/server/modules/permissions/scope";
import { writeAuditLog } from "@/server/modules/audit/service";
import type {
  CreateUserInput,
  ListUsersQuery,
  ResetPasswordInput,
  SetUserRolesInput,
  UpdateUserInput,
} from "@/server/modules/users/schema";

const PAGE_SIZE = 25;

export async function listUsers(ctx: RequestContext, query: ListUsersQuery) {
  await requirePermission(ctx, "admin.view");

  const where = {
    ...orgScope(ctx),
    deletedAt: null,
    ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" as const } },
            { email: { contains: query.q, mode: "insensitive" as const } },
            {
              employeeCode: { contains: query.q, mode: "insensitive" as const },
            },
          ],
        }
      : {}),
    ...(query.roleId || query.branchId
      ? {
          userRoles: {
            some: {
              ...(query.roleId ? { roleId: query.roleId } : {}),
              ...(query.branchId ? { branchId: query.branchId } : {}),
            },
          },
        }
      : {}),
  };

  const page = query.page ?? 1;

  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        employeeCode: true,
        phone: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        userRoles: {
          select: {
            id: true,
            branchId: true,
            branch: { select: { id: true, name: true } },
            role: { select: { id: true, key: true, name: true } },
          },
        },
      },
    }),
  ]);

  return {
    items,
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getUserById(ctx: RequestContext, userId: string) {
  await requirePermission(ctx, "admin.view");
  return prisma.user.findFirst({
    where: { id: userId, ...orgScope(ctx) },
    select: {
      id: true,
      name: true,
      email: true,
      employeeCode: true,
      phone: true,
      isActive: true,
      mustChangePassword: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      userRoles: {
        select: {
          id: true,
          branchId: true,
          branch: { select: { id: true, name: true } },
          role: { select: { id: true, key: true, name: true } },
        },
      },
    },
  });
}

export async function createUser(
  ctx: RequestContext,
  input: CreateUserInput,
  requestHeaders: Headers,
) {
  await requirePermission(ctx, "admin.create");

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw new Error("A user with this email already exists.");
  }

  const result = await auth.api.createUser({
    headers: requestHeaders,
    body: {
      email: input.email,
      password: input.password,
      name: input.name,
      data: {
        organizationId: ctx.organizationId,
        employeeCode: input.employeeCode,
        phone: input.phone,
        mustChangePassword: true,
      },
    },
  });

  await prisma.user.update({
    where: { id: result.user.id },
    data: { role: "admin", createdById: ctx.userId, updatedById: ctx.userId },
  });

  if (input.roleAssignments?.length) {
    await setUserRoles(ctx, result.user.id, {
      roleAssignments: input.roleAssignments,
    });
  }

  await writeAuditLog(ctx, {
    action: "create",
    entityType: "User",
    entityId: result.user.id,
    after: {
      name: input.name,
      email: input.email,
      employeeCode: input.employeeCode,
    },
  });

  return result.user;
}

export async function updateUser(
  ctx: RequestContext,
  userId: string,
  input: UpdateUserInput,
) {
  await requirePermission(ctx, "admin.edit");

  const before = await prisma.user.findFirst({
    where: { id: userId, ...orgScope(ctx) },
  });
  if (!before) throw new Error("User not found.");

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { ...input, updatedById: ctx.userId },
  });

  await writeAuditLog(ctx, {
    action: "update",
    entityType: "User",
    entityId: userId,
    before: {
      name: before.name,
      employeeCode: before.employeeCode,
      phone: before.phone,
    },
    after: {
      name: updated.name,
      employeeCode: updated.employeeCode,
      phone: updated.phone,
    },
  });

  return updated;
}

export async function setUserActive(
  ctx: RequestContext,
  userId: string,
  isActive: boolean,
) {
  await requirePermission(ctx, "admin.edit");

  const before = await prisma.user.findFirst({
    where: { id: userId, ...orgScope(ctx) },
  });
  if (!before) throw new Error("User not found.");
  if (before.id === ctx.userId && !isActive) {
    throw new Error("You cannot deactivate your own account.");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive, updatedById: ctx.userId },
  });

  await writeAuditLog(ctx, {
    action: isActive ? "reactivate" : "deactivate",
    entityType: "User",
    entityId: userId,
    before: { isActive: before.isActive },
    after: { isActive: updated.isActive },
  });

  return updated;
}

export async function resetUserPassword(
  ctx: RequestContext,
  userId: string,
  input: ResetPasswordInput,
  requestHeaders: Headers,
) {
  await requirePermission(ctx, "admin.edit");

  const user = await prisma.user.findFirst({
    where: { id: userId, ...orgScope(ctx) },
  });
  if (!user) throw new Error("User not found.");

  await auth.api.setUserPassword({
    headers: requestHeaders,
    body: { userId, newPassword: input.newPassword },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { mustChangePassword: true, updatedById: ctx.userId },
  });

  await writeAuditLog(ctx, {
    action: "reset_password",
    entityType: "User",
    entityId: userId,
  });
}

export async function setUserRoles(
  ctx: RequestContext,
  userId: string,
  input: SetUserRolesInput,
) {
  await requirePermission(ctx, "admin.edit");

  const user = await prisma.user.findFirst({
    where: { id: userId, ...orgScope(ctx) },
  });
  if (!user) throw new Error("User not found.");

  const before = await prisma.userRole.findMany({
    where: { userId, organizationId: ctx.organizationId },
  });

  await prisma.$transaction([
    prisma.userRole.deleteMany({
      where: { userId, organizationId: ctx.organizationId },
    }),
    prisma.userRole.createMany({
      data: input.roleAssignments.map((assignment) => ({
        userId,
        roleId: assignment.roleId,
        branchId: assignment.branchId,
        organizationId: ctx.organizationId,
        createdById: ctx.userId,
      })),
    }),
  ]);

  await writeAuditLog(ctx, {
    action: "update",
    entityType: "UserRole",
    entityId: userId,
    before: before.map((b) => ({ roleId: b.roleId, branchId: b.branchId })),
    after: input.roleAssignments,
  });
}
