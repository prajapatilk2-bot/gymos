import { prisma } from "@/server/db/prisma";
import type { RequestContext } from "@/server/auth/session";
import { requirePermission } from "@/server/modules/permissions/service";
import {
  assertBranchAccess,
  getAccessibleBranchIds,
  orgScope,
} from "@/server/modules/permissions/scope";
import { writeAuditLog } from "@/server/modules/audit/service";
import type {
  ConvertGuestPassInput,
  CreateGuestPassInput,
  ListGuestPassesQuery,
} from "@/server/modules/members/guest-passes.schema";

const PAGE_SIZE = 25;

export class GuestPassError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GuestPassError";
  }
}

/** Guest pass / trial pass (Additional Operational Details Checklist — Members & Reception). */
export async function createGuestPass(
  ctx: RequestContext,
  input: CreateGuestPassInput,
) {
  await requirePermission(ctx, "members.create");
  await assertBranchAccess(ctx, input.branchId);

  const validFrom = new Date(input.validFrom);
  const validTo = new Date(input.validTo);
  if (validTo <= validFrom) {
    throw new GuestPassError("validTo must be after validFrom.");
  }

  const pass = await prisma.guestPass.create({
    data: {
      organizationId: ctx.organizationId,
      branchId: input.branchId,
      type: input.type,
      name: input.name,
      phone: input.phone,
      email: input.email,
      issuedByMemberId: input.issuedByMemberId,
      issuedById: ctx.userId,
      validFrom,
      validTo,
      notes: input.notes,
      createdById: ctx.userId,
      updatedById: ctx.userId,
    },
  });

  await writeAuditLog(ctx, {
    action: "create",
    entityType: "GuestPass",
    entityId: pass.id,
    after: pass,
    branchId: pass.branchId,
  });

  return pass;
}

export async function listGuestPasses(
  ctx: RequestContext,
  query: ListGuestPassesQuery,
) {
  await requirePermission(ctx, "members.view");

  const accessible = await getAccessibleBranchIds(
    ctx.userId,
    ctx.organizationId,
  );
  if (query.branchId) await assertBranchAccess(ctx, query.branchId);

  const where = {
    ...orgScope(ctx),
    deletedAt: null,
    ...(query.branchId
      ? { branchId: query.branchId }
      : accessible === "all"
        ? {}
        : { branchId: { in: accessible } }),
    ...(query.type ? { type: query.type } : {}),
  };

  const page = query.page ?? 1;

  const [total, items] = await Promise.all([
    prisma.guestPass.count({ where }),
    prisma.guestPass.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { branch: { select: { id: true, name: true } } },
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

async function findGuestPassOrThrow(ctx: RequestContext, id: string) {
  const pass = await prisma.guestPass.findFirst({
    where: { id, ...orgScope(ctx), deletedAt: null },
  });
  if (!pass) throw new GuestPassError("Guest pass not found.");
  await assertBranchAccess(ctx, pass.branchId);
  return pass;
}

export async function markGuestPassUsed(ctx: RequestContext, id: string) {
  await requirePermission(ctx, "members.edit");
  const pass = await findGuestPassOrThrow(ctx, id);
  if (pass.usedAt)
    throw new GuestPassError("Guest pass has already been used.");

  const updated = await prisma.guestPass.update({
    where: { id },
    data: { usedAt: new Date(), updatedById: ctx.userId },
  });

  await writeAuditLog(ctx, {
    action: "mark_used",
    entityType: "GuestPass",
    entityId: id,
    after: { usedAt: updated.usedAt },
    branchId: pass.branchId,
  });

  return updated;
}

/** Links a converted trial pass to the Member record created from it (C1/C2 "trial" members). */
export async function convertGuestPassToMember(
  ctx: RequestContext,
  id: string,
  input: ConvertGuestPassInput,
) {
  await requirePermission(ctx, "members.edit");
  const pass = await findGuestPassOrThrow(ctx, id);

  const member = await prisma.member.findFirst({
    where: { id: input.memberId, ...orgScope(ctx), deletedAt: null },
  });
  if (!member) throw new GuestPassError("Member not found.");

  const updated = await prisma.guestPass.update({
    where: { id },
    data: { convertedToMemberId: input.memberId, updatedById: ctx.userId },
  });

  await writeAuditLog(ctx, {
    action: "convert_to_member",
    entityType: "GuestPass",
    entityId: id,
    after: { convertedToMemberId: input.memberId },
    branchId: pass.branchId,
  });

  return updated;
}
