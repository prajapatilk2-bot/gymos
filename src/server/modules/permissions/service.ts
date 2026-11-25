import { prisma } from "@/server/db/prisma";
import type { RequestContext } from "@/server/auth/session";

export class PermissionError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "PermissionError";
  }
}

/**
 * Resolves the full set of permission keys a user holds in their
 * organization. When `branchId` is given, only role assignments that are
 * either organization-wide (UserRole.branchId = null) or scoped to that
 * exact branch are counted — this is what every write path should use.
 * When `branchId` is omitted, every role assignment counts regardless of
 * branch — appropriate for "can this user do X anywhere" checks such as
 * sidebar visibility.
 */
export async function getUserPermissionKeys(
  userId: string,
  organizationId: string,
  options?: { branchId?: string | null },
): Promise<Set<string>> {
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
      organizationId,
      ...(options && "branchId" in options
        ? {
            OR: [
              { branchId: null },
              { branchId: options.branchId ?? undefined },
            ],
          }
        : {}),
    },
    select: {
      role: {
        select: {
          rolePermissions: {
            select: { permission: { select: { key: true } } },
          },
        },
      },
    },
  });

  const keys = new Set<string>();
  for (const userRole of userRoles) {
    for (const rolePermission of userRole.role.rolePermissions) {
      keys.add(rolePermission.permission.key);
    }
  }
  return keys;
}

export async function hasPermission(
  ctx: RequestContext,
  key: string | string[],
  options?: { branchId?: string | null },
): Promise<boolean> {
  const required = Array.isArray(key) ? key : [key];
  const granted = await getUserPermissionKeys(
    ctx.userId,
    ctx.organizationId,
    options,
  );
  return required.every((k) => granted.has(k));
}

/**
 * Throws PermissionError unless the user holds ALL of the given permission
 * keys. Combine a module key with a sensitive.* key to gate sensitive
 * fields, e.g. requirePermission(ctx, ["members.view", "sensitive.health.view"]).
 */
export async function requirePermission(
  ctx: RequestContext,
  key: string | string[],
  options?: { branchId?: string | null },
): Promise<void> {
  const ok = await hasPermission(ctx, key, options);
  if (!ok) {
    throw new PermissionError();
  }
}
