import { prisma } from "@/server/db/prisma";
import type { RequestContext } from "@/server/auth/session";

let counter = 0;
function unique(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

export async function createOrganization() {
  return prisma.organization.create({
    data: { name: unique("Org"), slug: unique("org") },
  });
}

export async function createBranch(
  organizationId: string,
  overrides: { isDefault?: boolean } = {},
) {
  return prisma.branch.create({
    data: {
      organizationId,
      name: unique("Branch"),
      code: unique("CODE").toUpperCase(),
      isDefault: overrides.isDefault ?? false,
    },
  });
}

export async function createUser(organizationId: string) {
  return prisma.user.create({
    data: {
      organizationId,
      name: unique("User"),
      email: `${unique("user")}@example.test`,
    },
  });
}

/** Ensures the permission catalog rows for the given keys exist, returning their ids. */
export async function ensurePermissions(keys: string[]) {
  const rows = await Promise.all(
    keys.map((key) =>
      prisma.permission.upsert({
        where: { key },
        update: {},
        create: { key, module: "W", action: "view" },
      }),
    ),
  );
  return rows;
}

export async function createRoleWithPermissions(
  organizationId: string,
  permissionKeys: string[],
) {
  const permissions = await ensurePermissions(permissionKeys);
  return prisma.role.create({
    data: {
      organizationId,
      key: unique("role"),
      name: unique("Role"),
      rolePermissions: {
        create: permissions.map((p) => ({ permissionId: p.id })),
      },
    },
  });
}

export async function assignRole(params: {
  userId: string;
  roleId: string;
  organizationId: string;
  branchId?: string | null;
}) {
  return prisma.userRole.create({
    data: {
      userId: params.userId,
      roleId: params.roleId,
      organizationId: params.organizationId,
      branchId: params.branchId ?? null,
    },
  });
}

export function toRequestContext(
  organizationId: string,
  user: { id: string; name: string; email: string },
): RequestContext {
  return {
    userId: user.id,
    organizationId,
    sessionId: unique("session"),
    ipAddress: "127.0.0.1",
    userAgent: "vitest",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      organizationId,
      isActive: true,
      mustChangePassword: false,
      employeeCode: null,
      phone: null,
    },
  };
}
