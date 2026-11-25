/**
 * Phase 0 demo seed: one organization, one branch, the full permission
 * catalog, the 11 W1 default system roles (with their default permission
 * matrix), one demo user per role, and a super admin from env vars.
 *
 * Safe to re-run: every write is an upsert keyed on a stable natural key.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { auth } from "../src/server/auth/auth";
import { PERMISSIONS } from "../src/server/modules/permissions/registry";
import {
  DEFAULT_SYSTEM_ROLES,
  resolveSystemRolePermissionKeys,
} from "../src/server/modules/permissions/default-roles";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function createStaffAccount(params: {
  organizationId: string;
  name: string;
  email: string;
  password: string;
  employeeCode: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: params.email },
  });
  if (existing) return existing;

  const { user } = await auth.api.createUser({
    body: {
      email: params.email,
      password: params.password,
      name: params.name,
      data: {
        organizationId: params.organizationId,
        employeeCode: params.employeeCode,
        mustChangePassword: true,
      },
    },
  });

  await prisma.user.update({ where: { id: user.id }, data: { role: "admin" } });
  return prisma.user.findUniqueOrThrow({ where: { id: user.id } });
}

// Prisma's compound-unique `where` selector rejects `null` for a nullable
// column, so a plain upsert() can't be used when branchId is null (org-wide
// role assignment) — find-then-create instead.
async function upsertUserRole(params: {
  userId: string;
  roleId: string;
  organizationId: string;
  branchId: string | null;
}) {
  const existing = await prisma.userRole.findFirst({
    where: {
      userId: params.userId,
      roleId: params.roleId,
      branchId: params.branchId,
    },
  });
  if (existing) return existing;

  return prisma.userRole.create({ data: params });
}

async function main() {
  console.log("Seeding GymOS demo data...");

  // 1. Organization + default branch -----------------------------------
  const organization = await prisma.organization.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      slug: "demo",
      name: "GymOS Demo Fitness Club",
      address: "12 MG Road, Bengaluru, Karnataka",
      phone: "+91 90000 00000",
      email: "hello@gymos-demo.test",
      gstin: "29ABCDE1234F1Z5",
    },
  });

  const mainBranch = await prisma.branch.upsert({
    where: {
      organizationId_code: { organizationId: organization.id, code: "MAIN" },
    },
    update: {},
    create: {
      organizationId: organization.id,
      name: "Main Branch",
      code: "MAIN",
      address: "12 MG Road, Bengaluru, Karnataka",
      phone: "+91 90000 00000",
      operatingHoursStart: "06:00",
      operatingHoursEnd: "22:00",
      isDefault: true,
    },
  });

  // 2. Permission catalog -------------------------------------------------
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: {
        module: permission.module,
        action: permission.action,
        isSensitive: permission.isSensitive,
        sensitiveCategory: permission.sensitiveCategory,
        description: permission.description,
      },
      create: {
        key: permission.key,
        module: permission.module,
        action: permission.action,
        isSensitive: permission.isSensitive,
        sensitiveCategory: permission.sensitiveCategory,
        description: permission.description,
      },
    });
  }
  console.log(`  Permission catalog: ${PERMISSIONS.length} keys.`);

  // 3. Default system roles ----------------------------------------------
  const branchScopedRoleKeys = new Set([
    "branch_manager",
    "receptionist",
    "trainer",
    "housekeeping",
    "security",
  ]);

  const rolesByKey = new Map<string, { id: string }>();
  for (const roleDefinition of DEFAULT_SYSTEM_ROLES) {
    const permissionKeys = resolveSystemRolePermissionKeys(roleDefinition);
    const permissionRows = await prisma.permission.findMany({
      where: { key: { in: permissionKeys } },
      select: { id: true },
    });

    const role = await prisma.role.upsert({
      where: {
        organizationId_key: {
          organizationId: organization.id,
          key: roleDefinition.key,
        },
      },
      update: {
        name: roleDefinition.name,
        description: roleDefinition.description,
        isSystem: true,
      },
      create: {
        organizationId: organization.id,
        key: roleDefinition.key,
        name: roleDefinition.name,
        description: roleDefinition.description,
        isSystem: true,
      },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: permissionRows.map((p) => ({
        roleId: role.id,
        permissionId: p.id,
      })),
    });

    rolesByKey.set(roleDefinition.key, role);
  }
  console.log(`  Roles: ${DEFAULT_SYSTEM_ROLES.length} system roles.`);

  // 4. Super admin from env ------------------------------------------------
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set to seed.",
    );
  }

  const superAdmin = await createStaffAccount({
    organizationId: organization.id,
    name: "Super Admin",
    email: adminEmail,
    password: adminPassword,
    employeeCode: "EMP-0000",
  });

  await upsertUserRole({
    userId: superAdmin.id,
    roleId: rolesByKey.get("super_admin")!.id,
    organizationId: organization.id,
    branchId: null,
  });

  // 5. One demo user per default role --------------------------------------
  const DEMO_PASSWORD = "Demo@12345";
  let employeeCounter = 1;

  for (const roleDefinition of DEFAULT_SYSTEM_ROLES) {
    if (roleDefinition.key === "super_admin") continue; // covered by the real super admin above

    const role = rolesByKey.get(roleDefinition.key)!;
    const email = `${roleDefinition.key}@gymos-demo.test`;
    const name = `Demo ${roleDefinition.name}`;
    const employeeCode = `EMP-${String(employeeCounter++).padStart(4, "0")}`;

    const user = await createStaffAccount({
      organizationId: organization.id,
      name,
      email,
      password: DEMO_PASSWORD,
      employeeCode,
    });

    const branchId = branchScopedRoleKeys.has(roleDefinition.key)
      ? mainBranch.id
      : null;

    await upsertUserRole({
      userId: user.id,
      roleId: role.id,
      organizationId: organization.id,
      branchId,
    });
  }

  console.log(
    `  Demo users: ${DEFAULT_SYSTEM_ROLES.length} (incl. super admin).`,
  );
  console.log("Seed complete.");
  console.log(
    `  Super admin login: ${adminEmail} / (from SEED_ADMIN_PASSWORD)`,
  );
  console.log(
    `  Demo users login: <role_key>@gymos-demo.test / ${DEMO_PASSWORD}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
