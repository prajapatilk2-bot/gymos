import { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import type { RequestContext } from "@/server/auth/session";
import { orgScope } from "@/server/modules/permissions/scope";
import { writeAuditLog } from "@/server/modules/audit/service";
import type {
  CreateApprovalRequestInput,
  DecideApprovalRequestInput,
  ListApprovalRequestsInput,
} from "@/server/modules/approvals/schema";

export class ApprovalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApprovalError";
  }
}

const PAGE_SIZE = 25;

/**
 * Generic "sensitive action needs sign-off" workflow (W2). Module services
 * in later phases call this instead of applying a sensitive change
 * directly — e.g. a refund or stock adjustment is created here as
 * `pending`, and only applied to its real tables once an approver with the
 * right permission calls decideApprovalRequest with "approved".
 */
export async function createApprovalRequest(
  ctx: RequestContext,
  input: CreateApprovalRequestInput,
) {
  const request = await prisma.approvalRequest.create({
    data: {
      organizationId: ctx.organizationId,
      branchId: input.branchId ?? null,
      requestType: input.requestType,
      entityType: input.entityType,
      entityId: input.entityId,
      payload: input.payload as Prisma.InputJsonValue,
      reason: input.reason,
      requestedById: ctx.userId,
      createdById: ctx.userId,
      updatedById: ctx.userId,
    },
  });

  await writeAuditLog(ctx, {
    action: "request_approval",
    entityType: "ApprovalRequest",
    entityId: request.id,
    after: request,
    branchId: input.branchId,
  });

  return request;
}

export async function listApprovalRequests(
  ctx: RequestContext,
  filter: ListApprovalRequestsInput,
) {
  const where = {
    ...orgScope(ctx),
    deletedAt: null,
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.requestType ? { requestType: filter.requestType } : {}),
    ...(filter.branchId ? { branchId: filter.branchId } : {}),
  };

  const page = filter.page ?? 1;

  const [total, items] = await Promise.all([
    prisma.approvalRequest.count({ where }),
    prisma.approvalRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        requestedBy: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true, email: true } },
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

/**
 * Approves or rejects a pending request. Deliberately does NOT re-check
 * permissions itself: callers must requirePermission(ctx, "<module>.approve")
 * (or the generic admin approval permission) before calling this, since the
 * right permission key depends on the request's module/requestType.
 */
export async function decideApprovalRequest(
  ctx: RequestContext,
  input: DecideApprovalRequestInput,
) {
  const request = await prisma.approvalRequest.findFirst({
    where: { id: input.id, ...orgScope(ctx), deletedAt: null },
  });

  if (!request) {
    throw new ApprovalError("Approval request not found.");
  }
  if (request.status !== "pending") {
    throw new ApprovalError("This request has already been decided.");
  }
  if (request.requestedById === ctx.userId) {
    throw new ApprovalError("You cannot approve or reject your own request.");
  }

  const updated = await prisma.approvalRequest.update({
    where: { id: request.id },
    data: {
      status: input.decision,
      approverId: ctx.userId,
      decisionNote: input.decisionNote,
      decidedAt: new Date(),
      updatedById: ctx.userId,
    },
  });

  await writeAuditLog(ctx, {
    action: input.decision === "approved" ? "approve" : "reject",
    entityType: "ApprovalRequest",
    entityId: request.id,
    before: request,
    after: updated,
    branchId: request.branchId,
  });

  return updated;
}
