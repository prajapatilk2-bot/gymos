import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import type { RequestContext } from "@/server/auth/session";
import {
  hasPermission,
  requirePermission,
} from "@/server/modules/permissions/service";
import {
  assertBranchAccess,
  getAccessibleBranchIds,
  orgScope,
} from "@/server/modules/permissions/scope";
import { writeAuditLog } from "@/server/modules/audit/service";
import {
  ApprovalError,
  createApprovalRequest,
  decideApprovalRequest,
} from "@/server/modules/approvals/service";
import { parseCsvWithHeader, toCsv } from "@/server/modules/members/csv";
import type {
  AddMemberDocumentInput,
  CheckDuplicateMemberInput,
  CreateMemberInput,
  DecideMemberApprovalInput,
  ExportMembersQuery,
  ImportMembersInput,
  ListMemberApprovalRequestsQuery,
  ListMembersQuery,
  MemberHealthDeclarationInput,
  RecordMemberConsentInput,
  RequestMemberMergeInput,
  RequestMemberSuspensionInput,
  TransferMemberBranchInput,
  UpdateMemberInput,
  WithdrawMemberConsentInput,
} from "@/server/modules/members/schema";

const PAGE_SIZE = 25;
const MEMBER_APPROVAL_REQUEST_TYPES = [
  "member_suspend",
  "member_merge",
] as const;

export class MemberError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MemberError";
  }
}

export class DuplicateMemberError extends MemberError {
  constructor(
    public readonly matches: {
      id: string;
      name: string;
      mobile: string;
      email: string | null;
    }[],
  ) {
    super("A member with this mobile number or email already exists.");
    this.name = "DuplicateMemberError";
  }
}

/** Builds the branch-access-aware `where` fragment used by every list query in this module. */
async function branchFilter(ctx: RequestContext, requestedBranchId?: string) {
  if (requestedBranchId) {
    await assertBranchAccess(ctx, requestedBranchId);
    return { branchId: requestedBranchId };
  }
  const accessible = await getAccessibleBranchIds(
    ctx.userId,
    ctx.organizationId,
  );
  return accessible === "all" ? {} : { branchId: { in: accessible } };
}

async function nextMemberCode(organizationId: string): Promise<string> {
  const updated = await prisma.organization.update({
    where: { id: organizationId },
    data: { memberSequence: { increment: 1 } },
    select: { memberSequence: true },
  });
  return `GM-${String(updated.memberSequence).padStart(4, "0")}`;
}

export async function findPotentialDuplicateMembers(
  ctx: RequestContext,
  input: CheckDuplicateMemberInput,
) {
  await requirePermission(ctx, "members.view");

  if (!input.mobile && !input.email) return [];

  return prisma.member.findMany({
    where: {
      ...orgScope(ctx),
      deletedAt: null,
      ...(input.excludeId ? { id: { not: input.excludeId } } : {}),
      OR: [
        ...(input.mobile ? [{ mobile: input.mobile }] : []),
        ...(input.email ? [{ email: input.email }] : []),
      ],
    },
    select: {
      id: true,
      name: true,
      mobile: true,
      email: true,
      memberCode: true,
      status: true,
    },
  });
}

export async function createMember(
  ctx: RequestContext,
  input: CreateMemberInput,
) {
  await requirePermission(ctx, "members.create");
  await assertBranchAccess(ctx, input.branchId);

  if (!input.allowDuplicate) {
    const duplicates = await findPotentialDuplicateMembers(ctx, {
      mobile: input.mobile,
      email: input.email,
    });
    if (duplicates.length > 0) {
      throw new DuplicateMemberError(duplicates);
    }
  }

  const memberCode = await nextMemberCode(ctx.organizationId);

  const member = await prisma.member.create({
    data: {
      organizationId: ctx.organizationId,
      branchId: input.branchId,
      memberCode,
      cardNumber: input.cardNumber ?? memberCode,
      name: input.name,
      photoUrl: input.photoUrl,
      mobile: input.mobile,
      whatsappNumber: input.whatsappNumber,
      email: input.email,
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      address: input.address,
      emergencyContactName: input.emergencyContactName,
      emergencyContactPhone: input.emergencyContactPhone,
      emergencyContactRelation: input.emergencyContactRelation,
      joiningDate: input.joiningDate ? new Date(input.joiningDate) : undefined,
      leadSource: input.leadSource,
      occupation: input.occupation,
      fitnessGoals: input.fitnessGoals,
      assignedTrainerId: input.assignedTrainerId,
      membershipPreference: input.membershipPreference,
      tags: input.tags ?? [],
      createdById: ctx.userId,
      updatedById: ctx.userId,
    },
  });

  await writeAuditLog(ctx, {
    action: "create",
    entityType: "Member",
    entityId: member.id,
    after: member,
    branchId: member.branchId,
  });

  if (input.waiverAccepted) {
    const consent = await prisma.memberConsent.create({
      data: {
        organizationId: ctx.organizationId,
        memberId: member.id,
        type: "waiver",
        granted: true,
        grantedAt: new Date(),
        createdById: ctx.userId,
        updatedById: ctx.userId,
      },
    });
    await writeAuditLog(ctx, {
      action: "grant_consent",
      entityType: "Member",
      entityId: member.id,
      after: consent,
      branchId: member.branchId,
    });
  }

  return member;
}

export async function listMembers(
  ctx: RequestContext,
  query: ListMembersQuery,
) {
  await requirePermission(ctx, "members.view");

  const where: Prisma.MemberWhereInput = {
    ...orgScope(ctx),
    deletedAt: null,
    ...(await branchFilter(ctx, query.branchId)),
    ...(query.status ? { status: query.status } : {}),
    ...(query.tag ? { tags: { has: query.tag } } : {}),
    ...(query.assignedTrainerId
      ? { assignedTrainerId: query.assignedTrainerId }
      : {}),
    ...(query.joinedFrom || query.joinedTo
      ? {
          joiningDate: {
            ...(query.joinedFrom ? { gte: new Date(query.joinedFrom) } : {}),
            ...(query.joinedTo ? { lte: new Date(query.joinedTo) } : {}),
          },
        }
      : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" } },
            { memberCode: { contains: query.q, mode: "insensitive" } },
            { mobile: { contains: query.q, mode: "insensitive" } },
            { email: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const page = query.page ?? 1;

  const [total, items] = await Promise.all([
    prisma.member.count({ where }),
    prisma.member.findMany({
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

async function findMemberOrThrow(ctx: RequestContext, memberId: string) {
  const member = await prisma.member.findFirst({
    where: { id: memberId, ...orgScope(ctx), deletedAt: null },
  });
  if (!member) throw new MemberError("Member not found.");
  await assertBranchAccess(ctx, member.branchId);
  return member;
}

export async function getMemberById(ctx: RequestContext, memberId: string) {
  await requirePermission(ctx, "members.view");
  const member = await findMemberOrThrow(ctx, memberId);
  return prisma.member.findUnique({
    where: { id: member.id },
    include: { branch: { select: { id: true, name: true } } },
  });
}

export async function updateMember(
  ctx: RequestContext,
  memberId: string,
  input: UpdateMemberInput,
) {
  await requirePermission(ctx, "members.edit");
  const before = await findMemberOrThrow(ctx, memberId);

  const updated = await prisma.member.update({
    where: { id: memberId },
    data: {
      ...input,
      joiningDate: input.joiningDate ? new Date(input.joiningDate) : undefined,
      updatedById: ctx.userId,
    },
  });

  await writeAuditLog(ctx, {
    action: "update",
    entityType: "Member",
    entityId: memberId,
    before,
    after: updated,
    branchId: before.branchId,
  });

  return updated;
}

export async function setMemberActive(
  ctx: RequestContext,
  memberId: string,
  isActive: boolean,
) {
  await requirePermission(ctx, "members.edit");
  const before = await findMemberOrThrow(ctx, memberId);

  const updated = await prisma.member.update({
    where: { id: memberId },
    data: { status: isActive ? "active" : "inactive", updatedById: ctx.userId },
  });

  await writeAuditLog(ctx, {
    action: isActive ? "reactivate" : "deactivate",
    entityType: "Member",
    entityId: memberId,
    before: { status: before.status },
    after: { status: updated.status },
    branchId: before.branchId,
  });

  return updated;
}

export async function transferMemberBranch(
  ctx: RequestContext,
  memberId: string,
  input: TransferMemberBranchInput,
) {
  await requirePermission(ctx, "members.edit");
  const before = await findMemberOrThrow(ctx, memberId);
  await assertBranchAccess(ctx, input.branchId);

  const updated = await prisma.member.update({
    where: { id: memberId },
    data: { branchId: input.branchId, updatedById: ctx.userId },
  });

  await writeAuditLog(ctx, {
    action: "transfer_branch",
    entityType: "Member",
    entityId: memberId,
    before: { branchId: before.branchId },
    after: { branchId: updated.branchId },
    metadata: { reason: input.reason },
    branchId: updated.branchId,
  });

  return updated;
}

/** C4 "suspend/unsuspend" — sensitive enough to require approval (CLAUDE.md rule 8). */
export async function requestMemberSuspension(
  ctx: RequestContext,
  memberId: string,
  input: RequestMemberSuspensionInput,
) {
  await requirePermission(ctx, "members.edit");
  const member = await findMemberOrThrow(ctx, memberId);

  if (input.action === "suspend" && member.status === "suspended") {
    throw new MemberError("Member is already suspended.");
  }
  if (input.action === "unsuspend" && member.status !== "suspended") {
    throw new MemberError("Member is not suspended.");
  }

  return createApprovalRequest(ctx, {
    requestType: "member_suspend",
    entityType: "Member",
    entityId: memberId,
    payload: { memberId, action: input.action },
    reason: input.reason,
    branchId: member.branchId,
  });
}

/** C4 "merge duplicate profiles" — also requires approval. */
export async function requestMemberMerge(
  ctx: RequestContext,
  primaryMemberId: string,
  input: RequestMemberMergeInput,
) {
  await requirePermission(ctx, "members.edit");
  const primary = await findMemberOrThrow(ctx, primaryMemberId);
  const duplicate = await findMemberOrThrow(ctx, input.duplicateMemberId);

  if (primary.id === duplicate.id) {
    throw new MemberError("Cannot merge a member into itself.");
  }

  return createApprovalRequest(ctx, {
    requestType: "member_merge",
    entityType: "Member",
    entityId: primaryMemberId,
    payload: { primaryMemberId, duplicateMemberId: duplicate.id },
    reason: input.reason,
    branchId: primary.branchId,
  });
}

/**
 * Member-scoped view over the generic ApprovalRequest table (gated by
 * members.approve rather than admin.approve, since module-specific
 * approvers may not hold the generic admin permission).
 */
export async function listMemberApprovalRequests(
  ctx: RequestContext,
  query: ListMemberApprovalRequestsQuery,
) {
  await requirePermission(ctx, "members.approve");

  return prisma.approvalRequest.findMany({
    where: {
      ...orgScope(ctx),
      deletedAt: null,
      requestType: { in: [...MEMBER_APPROVAL_REQUEST_TYPES] },
      ...(query.status ? { status: query.status } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      requestedBy: { select: { id: true, name: true, email: true } },
      approver: { select: { id: true, name: true, email: true } },
    },
  });
}

/**
 * Approves/rejects a member_suspend or member_merge approval request and,
 * once approved, applies the underlying change. decideApprovalRequest
 * itself is generic across every module, so this wrapper both gates on the
 * members.approve permission and guards that the request actually belongs
 * to this module before touching it.
 */
export async function decideMemberApprovalRequest(
  ctx: RequestContext,
  input: DecideMemberApprovalInput,
) {
  await requirePermission(ctx, "members.approve");

  const pending = await prisma.approvalRequest.findFirst({
    where: { id: input.approvalRequestId, ...orgScope(ctx) },
  });
  if (
    !pending ||
    !MEMBER_APPROVAL_REQUEST_TYPES.includes(
      pending.requestType as "member_suspend" | "member_merge",
    )
  ) {
    throw new ApprovalError("Not a member-management approval request.");
  }

  const decided = await decideApprovalRequest(ctx, {
    id: input.approvalRequestId,
    decision: input.decision,
    decisionNote: input.decisionNote,
  });

  if (decided.status === "approved") {
    if (decided.requestType === "member_suspend") {
      await applyMemberSuspensionDecision(
        ctx,
        decided.payload as {
          memberId: string;
          action: "suspend" | "unsuspend";
        },
      );
    } else if (decided.requestType === "member_merge") {
      await applyMemberMergeDecision(
        ctx,
        decided.payload as {
          primaryMemberId: string;
          duplicateMemberId: string;
        },
      );
    }
  }

  return decided;
}

async function applyMemberSuspensionDecision(
  ctx: RequestContext,
  payload: { memberId: string; action: "suspend" | "unsuspend" },
) {
  const before = await prisma.member.findUnique({
    where: { id: payload.memberId },
  });
  if (!before) return;

  const newStatus = payload.action === "suspend" ? "suspended" : "active";
  const updated = await prisma.member.update({
    where: { id: payload.memberId },
    data: { status: newStatus, updatedById: ctx.userId },
  });

  await writeAuditLog(ctx, {
    action: payload.action,
    entityType: "Member",
    entityId: payload.memberId,
    before: { status: before.status },
    after: { status: updated.status },
    branchId: updated.branchId,
  });
}

async function applyMemberMergeDecision(
  ctx: RequestContext,
  payload: { primaryMemberId: string; duplicateMemberId: string },
) {
  const [primary, duplicate] = await Promise.all([
    prisma.member.findUnique({ where: { id: payload.primaryMemberId } }),
    prisma.member.findUnique({ where: { id: payload.duplicateMemberId } }),
  ]);
  if (!primary || !duplicate) {
    throw new MemberError("Member not found for merge.");
  }

  const mergedDuplicate = await prisma.member.update({
    where: { id: duplicate.id },
    data: {
      deletedAt: new Date(),
      status: "inactive",
      mergedIntoId: primary.id,
      updatedById: ctx.userId,
    },
  });

  await writeAuditLog(ctx, {
    action: "merge",
    entityType: "Member",
    entityId: primary.id,
    before: { primary, duplicate },
    after: { primary, mergedDuplicate },
    metadata: { duplicateMemberId: duplicate.id },
    branchId: primary.branchId,
  });
}

export async function requestMemberDataExport(
  ctx: RequestContext,
  memberId: string,
) {
  await requirePermission(ctx, "members.export");
  const member = await findMemberOrThrow(ctx, memberId);

  const canViewHealth = await hasPermission(ctx, "sensitive.health.view");

  const [documents, consents, healthDeclaration, timeline] = await Promise.all([
    prisma.memberDocument.findMany({ where: { memberId, deletedAt: null } }),
    prisma.memberConsent.findMany({ where: { memberId } }),
    canViewHealth
      ? prisma.memberHealthDeclaration.findUnique({ where: { memberId } })
      : Promise.resolve(null),
    getMemberTimeline(ctx, memberId),
  ]);

  await writeAuditLog(ctx, {
    action: "export",
    entityType: "Member",
    entityId: memberId,
    branchId: member.branchId,
  });

  return { member, documents, consents, healthDeclaration, timeline };
}

export async function recordMemberConsent(
  ctx: RequestContext,
  memberId: string,
  input: RecordMemberConsentInput,
) {
  await requirePermission(ctx, "members.edit");
  const member = await findMemberOrThrow(ctx, memberId);

  const consent = await prisma.memberConsent.create({
    data: {
      organizationId: ctx.organizationId,
      memberId,
      type: input.type,
      granted: input.granted,
      grantedAt: new Date(),
      ipAddress: input.ipAddress,
      notes: input.notes,
      createdById: ctx.userId,
      updatedById: ctx.userId,
    },
  });

  await writeAuditLog(ctx, {
    action: "grant_consent",
    entityType: "Member",
    entityId: memberId,
    after: consent,
    branchId: member.branchId,
  });

  return consent;
}

export async function withdrawMemberConsent(
  ctx: RequestContext,
  memberId: string,
  input: WithdrawMemberConsentInput,
) {
  await requirePermission(ctx, "members.edit");
  const member = await findMemberOrThrow(ctx, memberId);

  const active = await prisma.memberConsent.findFirst({
    where: { memberId, type: input.type, granted: true, revokedAt: null },
    orderBy: { grantedAt: "desc" },
  });
  if (!active) {
    throw new MemberError("No active consent of this type to withdraw.");
  }

  const updated = await prisma.memberConsent.update({
    where: { id: active.id },
    data: { revokedAt: new Date(), updatedById: ctx.userId },
  });

  await writeAuditLog(ctx, {
    action: "withdraw_consent",
    entityType: "Member",
    entityId: memberId,
    before: active,
    after: updated,
    branchId: member.branchId,
  });

  return updated;
}

export async function listMemberConsents(
  ctx: RequestContext,
  memberId: string,
) {
  await requirePermission(ctx, "members.view");
  await findMemberOrThrow(ctx, memberId);
  return prisma.memberConsent.findMany({
    where: { memberId },
    orderBy: { grantedAt: "desc" },
  });
}

export async function getMemberHealthDeclaration(
  ctx: RequestContext,
  memberId: string,
) {
  await requirePermission(ctx, ["members.view", "sensitive.health.view"]);
  await findMemberOrThrow(ctx, memberId);
  return prisma.memberHealthDeclaration.findUnique({ where: { memberId } });
}

export async function upsertMemberHealthDeclaration(
  ctx: RequestContext,
  memberId: string,
  input: MemberHealthDeclarationInput,
) {
  await requirePermission(ctx, ["members.edit", "sensitive.health.edit"]);
  const member = await findMemberOrThrow(ctx, memberId);

  const before = await prisma.memberHealthDeclaration.findUnique({
    where: { memberId },
  });

  const updated = await prisma.memberHealthDeclaration.upsert({
    where: { memberId },
    create: {
      organizationId: ctx.organizationId,
      memberId,
      ...input,
      declaredAt: new Date(),
      declaredById: ctx.userId,
      createdById: ctx.userId,
      updatedById: ctx.userId,
    },
    update: {
      ...input,
      declaredAt: new Date(),
      declaredById: ctx.userId,
      updatedById: ctx.userId,
    },
  });

  await writeAuditLog(ctx, {
    action: "update_health_declaration",
    entityType: "MemberHealthDeclaration",
    entityId: memberId,
    before,
    after: updated,
    branchId: member.branchId,
  });

  return updated;
}

export async function listMemberDocuments(
  ctx: RequestContext,
  memberId: string,
) {
  await requirePermission(ctx, "members.view");
  await findMemberOrThrow(ctx, memberId);
  return prisma.memberDocument.findMany({
    where: { memberId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export async function addMemberDocument(
  ctx: RequestContext,
  memberId: string,
  input: AddMemberDocumentInput,
) {
  await requirePermission(ctx, "members.edit");
  const member = await findMemberOrThrow(ctx, memberId);

  const document = await prisma.memberDocument.create({
    data: {
      organizationId: ctx.organizationId,
      memberId,
      ...input,
      createdById: ctx.userId,
      updatedById: ctx.userId,
    },
  });

  await writeAuditLog(ctx, {
    action: "add_document",
    entityType: "Member",
    entityId: memberId,
    after: document,
    branchId: member.branchId,
  });

  return document;
}

/**
 * C3 "complete member activity timeline". Member-level events are stored
 * with entityType "Member" and entityId = memberId; sub-entity events
 * (documents, consents) use entityId = memberId too so they group together
 * here. Health-declaration events deliberately use entityType
 * "MemberHealthDeclaration" instead, so they only show up for a caller who
 * also holds sensitive.health.view — never through this timeline to anyone
 * with members.view alone.
 */
export async function getMemberTimeline(ctx: RequestContext, memberId: string) {
  await requirePermission(ctx, "members.view");
  await findMemberOrThrow(ctx, memberId);

  const canViewHealth = await hasPermission(ctx, "sensitive.health.view");
  const entityTypes = canViewHealth
    ? ["Member", "MemberHealthDeclaration"]
    : ["Member"];

  return prisma.auditLog.findMany({
    where: {
      ...orgScope(ctx),
      entityId: memberId,
      entityType: { in: entityTypes },
    },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}

const MEMBER_CSV_COLUMNS = [
  "memberCode",
  "cardNumber",
  "name",
  "mobile",
  "whatsappNumber",
  "email",
  "dateOfBirth",
  "gender",
  "status",
  "tags",
  "branch",
  "joiningDate",
] as const;

export async function exportMembersCsv(
  ctx: RequestContext,
  query: ExportMembersQuery,
) {
  await requirePermission(ctx, "members.export");

  const where: Prisma.MemberWhereInput = {
    ...orgScope(ctx),
    deletedAt: null,
    ...(await branchFilter(ctx, query.branchId)),
    ...(query.status ? { status: query.status } : {}),
    ...(query.tag ? { tags: { has: query.tag } } : {}),
  };

  const members = await prisma.member.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { branch: { select: { name: true } } },
    take: 10_000,
  });

  const rows = members.map((m) => [
    m.memberCode,
    m.cardNumber ?? "",
    m.name,
    m.mobile,
    m.whatsappNumber ?? "",
    m.email ?? "",
    m.dateOfBirth ?? "",
    m.gender ?? "",
    m.status,
    m.tags.join(";"),
    m.branch.name,
    m.joiningDate ? m.joiningDate.toISOString().slice(0, 10) : "",
  ]);

  await writeAuditLog(ctx, {
    action: "export",
    entityType: "Member",
    metadata: { count: members.length },
  });

  return toCsv([[...MEMBER_CSV_COLUMNS], ...rows]);
}

export interface ImportMembersRowResult {
  row: number;
  name: string;
  status: "created" | "skipped_duplicate" | "error";
  message?: string;
  memberId?: string;
}

/** Bulk CSV import (C2). Each row is created independently so one bad row never blocks the rest. */
export async function importMembersCsv(
  ctx: RequestContext,
  input: ImportMembersInput,
) {
  await requirePermission(ctx, "members.create");
  await assertBranchAccess(ctx, input.branchId);

  const records = parseCsvWithHeader(input.csv);
  const results: ImportMembersRowResult[] = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const rowNumber = i + 2; // +1 for header, +1 for 1-based rows
    const name = record.name?.trim();
    const mobile = record.mobile?.trim();

    if (!name || !mobile) {
      results.push({
        row: rowNumber,
        name: name ?? "",
        status: "error",
        message: "name and mobile are required.",
      });
      continue;
    }

    try {
      const member = await createMember(ctx, {
        branchId: input.branchId,
        name,
        mobile,
        email: record.email?.trim() || undefined,
        whatsappNumber: record.whatsappNumber?.trim() || undefined,
        dateOfBirth: record.dateOfBirth?.trim() || undefined,
        gender:
          (record.gender?.trim() as CreateMemberInput["gender"]) || undefined,
        tags: record.tags
          ? (record.tags
              .split(";")
              .map((t) => t.trim())
              .filter(Boolean) as CreateMemberInput["tags"])
          : undefined,
      });
      results.push({
        row: rowNumber,
        name,
        status: "created",
        memberId: member.id,
      });
    } catch (error) {
      if (error instanceof DuplicateMemberError) {
        results.push({
          row: rowNumber,
          name,
          status: "skipped_duplicate",
          message: error.message,
        });
      } else {
        results.push({
          row: rowNumber,
          name,
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error.",
        });
      }
    }
  }

  return results;
}
