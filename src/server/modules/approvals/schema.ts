import { z } from "zod";

export const createApprovalRequestSchema = z.object({
  requestType: z.string().min(1).max(100),
  entityType: z.string().max(100).optional(),
  entityId: z.string().max(100).optional(),
  payload: z.record(z.string(), z.unknown()),
  reason: z.string().max(2000).optional(),
  branchId: z.string().optional(),
});

export type CreateApprovalRequestInput = z.infer<
  typeof createApprovalRequestSchema
>;

export const decideApprovalRequestSchema = z.object({
  id: z.string(),
  decision: z.enum(["approved", "rejected"]),
  decisionNote: z.string().max(2000).optional(),
});

export type DecideApprovalRequestInput = z.infer<
  typeof decideApprovalRequestSchema
>;

export const listApprovalRequestsSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
  requestType: z.string().optional(),
  branchId: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
});

export type ListApprovalRequestsInput = z.infer<
  typeof listApprovalRequestsSchema
>;
