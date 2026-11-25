import { prisma } from "@/server/db/prisma";
import type { RequestContext } from "@/server/auth/session";

export class ScopeError extends Error {
  constructor(
    message = "That record does not belong to your organization or branch.",
  ) {
    super(message);
    this.name = "ScopeError";
  }
}

/**
 * Returns the set of branch ids a user may act in, or "all" when any of
 * their role assignments is organization-wide (branchId = null).
 *
 * Every service function that accepts a branchId from the client MUST
 * validate it against this (via assertBranchAccess) instead of trusting it
 * directly — IDs from the client are never trusted on their own.
 */
export async function getAccessibleBranchIds(
  userId: string,
  organizationId: string,
): Promise<"all" | string[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId, organizationId },
    select: { branchId: true },
  });

  if (userRoles.some((ur) => ur.branchId === null)) {
    return "all";
  }
  return Array.from(
    new Set(
      userRoles.map((ur) => ur.branchId).filter((id): id is string => !!id),
    ),
  );
}

export async function assertBranchAccess(
  ctx: RequestContext,
  branchId: string,
): Promise<void> {
  const accessible = await getAccessibleBranchIds(
    ctx.userId,
    ctx.organizationId,
  );
  if (accessible === "all") return;
  if (!accessible.includes(branchId)) {
    throw new ScopeError();
  }
}

/** Base `where` clause every organization-scoped query must start from. */
export function orgScope(ctx: RequestContext) {
  return { organizationId: ctx.organizationId } as const;
}

/**
 * Base `where` clause for a branch-specific table. Pass the branchId the
 * caller asked for (already validated with assertBranchAccess) or leave it
 * undefined to scope to the organization only (e.g. for an org-wide list).
 */
export function orgBranchScope(ctx: RequestContext, branchId?: string) {
  return {
    organizationId: ctx.organizationId,
    ...(branchId ? { branchId } : {}),
  } as const;
}
