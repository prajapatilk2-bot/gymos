import { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import type { RequestContext } from "@/server/auth/session";
import { requirePermission } from "@/server/modules/permissions/service";
import { writeAuditLog } from "@/server/modules/audit/service";
import type {
  SetOrganizationSettingInput,
  UpdateOrganizationProfileInput,
} from "@/server/modules/organization-settings/schema";

export async function getOrganizationProfile(ctx: RequestContext) {
  await requirePermission(ctx, "admin.view");
  return prisma.organization.findUniqueOrThrow({
    where: { id: ctx.organizationId },
  });
}

export async function updateOrganizationProfile(
  ctx: RequestContext,
  input: UpdateOrganizationProfileInput,
) {
  await requirePermission(ctx, "admin.edit");

  const before = await prisma.organization.findUniqueOrThrow({
    where: { id: ctx.organizationId },
  });
  const updated = await prisma.organization.update({
    where: { id: ctx.organizationId },
    data: { ...input, updatedById: ctx.userId },
  });

  await writeAuditLog(ctx, {
    action: "update",
    entityType: "Organization",
    entityId: ctx.organizationId,
    before,
    after: updated,
  });

  return updated;
}

export async function listOrganizationSettings(ctx: RequestContext) {
  await requirePermission(ctx, "admin.view");
  return prisma.organizationSetting.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { key: "asc" },
  });
}

export async function setOrganizationSetting(
  ctx: RequestContext,
  input: SetOrganizationSettingInput,
) {
  await requirePermission(ctx, "admin.edit");

  const before = await prisma.organizationSetting.findUnique({
    where: {
      organizationId_key: {
        organizationId: ctx.organizationId,
        key: input.key,
      },
    },
  });

  const updated = await prisma.organizationSetting.upsert({
    where: {
      organizationId_key: {
        organizationId: ctx.organizationId,
        key: input.key,
      },
    },
    create: {
      organizationId: ctx.organizationId,
      key: input.key,
      value: input.value as Prisma.InputJsonValue,
      updatedById: ctx.userId,
    },
    update: {
      value: input.value as Prisma.InputJsonValue,
      updatedById: ctx.userId,
    },
  });

  await writeAuditLog(ctx, {
    action: "update",
    entityType: "OrganizationSetting",
    entityId: updated.id,
    before: before?.value,
    after: updated.value,
  });

  return updated;
}
