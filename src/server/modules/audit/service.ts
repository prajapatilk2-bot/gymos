import { prisma } from "@/server/db/prisma";
import type { RequestContext } from "@/server/auth/session";
import { orgScope } from "@/server/modules/permissions/scope";
import type { AuditLogFilter } from "@/server/modules/audit/schema";

export interface WriteAuditLogInput {
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
  branchId?: string | null;
}

/**
 * Every create/update/delete/approve of important data must call this (see
 * CLAUDE.md). Writes are append-only: AuditLog rows are never updated or
 * soft-deleted.
 */
export async function writeAuditLog(
  ctx: Pick<
    RequestContext,
    "organizationId" | "userId" | "ipAddress" | "userAgent"
  >,
  input: WriteAuditLogInput,
) {
  return prisma.auditLog.create({
    data: {
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      branchId: input.branchId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      before: input.before === undefined ? undefined : (input.before as object),
      after: input.after === undefined ? undefined : (input.after as object),
      metadata:
        input.metadata === undefined ? undefined : (input.metadata as object),
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });
}

const PAGE_SIZE = 25;

export async function listAuditLogs(
  ctx: RequestContext,
  filter: AuditLogFilter,
) {
  const where = {
    ...orgScope(ctx),
    ...(filter.userId ? { userId: filter.userId } : {}),
    ...(filter.entityType ? { entityType: filter.entityType } : {}),
    ...(filter.action ? { action: filter.action } : {}),
    ...(filter.branchId ? { branchId: filter.branchId } : {}),
    ...(filter.from || filter.to
      ? {
          createdAt: {
            ...(filter.from ? { gte: new Date(filter.from) } : {}),
            ...(filter.to ? { lte: new Date(filter.to) } : {}),
          },
        }
      : {}),
  };

  const page = filter.page ?? 1;

  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: { select: { id: true, name: true, email: true } },
        branch: { select: { id: true, name: true } },
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
