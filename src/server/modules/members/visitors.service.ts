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
  CreateVisitorInput,
  ListVisitorsQuery,
} from "@/server/modules/members/visitors.schema";

const PAGE_SIZE = 25;

export class VisitorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VisitorError";
  }
}

/** Visitor register (Additional Operational Details Checklist — Members & Reception). */
export async function createVisitor(
  ctx: RequestContext,
  input: CreateVisitorInput,
) {
  await requirePermission(ctx, "members.create");
  await assertBranchAccess(ctx, input.branchId);

  const visitor = await prisma.visitor.create({
    data: {
      organizationId: ctx.organizationId,
      branchId: input.branchId,
      name: input.name,
      phone: input.phone,
      purpose: input.purpose,
      hostMemberId: input.hostMemberId,
      notes: input.notes,
      createdById: ctx.userId,
      updatedById: ctx.userId,
    },
  });

  await writeAuditLog(ctx, {
    action: "create",
    entityType: "Visitor",
    entityId: visitor.id,
    after: visitor,
    branchId: visitor.branchId,
  });

  return visitor;
}

export async function listVisitors(
  ctx: RequestContext,
  query: ListVisitorsQuery,
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
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" as const } },
            { phone: { contains: query.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const page = query.page ?? 1;

  const [total, items] = await Promise.all([
    prisma.visitor.count({ where }),
    prisma.visitor.findMany({
      where,
      orderBy: { checkInAt: "desc" },
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

export async function checkOutVisitor(ctx: RequestContext, visitorId: string) {
  await requirePermission(ctx, "members.edit");

  const visitor = await prisma.visitor.findFirst({
    where: { id: visitorId, ...orgScope(ctx), deletedAt: null },
  });
  if (!visitor) throw new VisitorError("Visitor not found.");
  await assertBranchAccess(ctx, visitor.branchId);
  if (visitor.checkOutAt)
    throw new VisitorError("Visitor has already checked out.");

  const updated = await prisma.visitor.update({
    where: { id: visitorId },
    data: { checkOutAt: new Date(), updatedById: ctx.userId },
  });

  await writeAuditLog(ctx, {
    action: "check_out",
    entityType: "Visitor",
    entityId: visitorId,
    after: { checkOutAt: updated.checkOutAt },
    branchId: visitor.branchId,
  });

  return updated;
}
