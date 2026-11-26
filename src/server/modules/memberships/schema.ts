import { z } from "zod";

export const membershipStatusSchema = z.enum(["active", "frozen", "cancelled"]);
export const derivedMembershipStatusSchema = z.enum([
  "active",
  "frozen",
  "cancelled",
  "expired",
]);
export const membershipPaymentStatusSchema = z.enum([
  "unpaid",
  "partially_paid",
  "paid",
]);

export const createMembershipSchema = z.object({
  memberId: z.string(),
  packageId: z.string(),
  branchId: z.string(),
  startDate: z.string().optional(), // defaults to today
  discountAppliedInPaise: z.number().int().min(0).optional(),
  couponCode: z.string().max(50).optional(),
  paymentDueAmountInPaise: z.number().int().min(0).optional(),
});
export type CreateMembershipInput = z.infer<typeof createMembershipSchema>;

export const renewMembershipSchema = z.object({
  discountAppliedInPaise: z.number().int().min(0).optional(),
  couponCode: z.string().max(50).optional(),
});
export type RenewMembershipInput = z.infer<typeof renewMembershipSchema>;

export const changePackageMembershipSchema = z.object({
  packageId: z.string(),
  discountAppliedInPaise: z.number().int().min(0).optional(),
  couponCode: z.string().max(50).optional(),
});
export type ChangePackageMembershipInput = z.infer<
  typeof changePackageMembershipSchema
>;

export const extendMembershipSchema = z.object({
  additionalDays: z.number().int().positive().max(3650),
  reason: z.string().max(500).optional(),
});
export type ExtendMembershipInput = z.infer<typeof extendMembershipSchema>;

export const requestFreezeMembershipSchema = z
  .object({
    startDate: z.string(),
    endDate: z.string().optional(), // omit for an open-ended freeze
    reason: z.string().max(500).optional(),
  })
  .refine((v) => !v.endDate || new Date(v.endDate) >= new Date(v.startDate), {
    message: "endDate must be on or after startDate.",
    path: ["endDate"],
  });
export type RequestFreezeMembershipInput = z.infer<
  typeof requestFreezeMembershipSchema
>;

export const requestCancelMembershipSchema = z.object({
  reason: z.string().min(1).max(500),
});
export type RequestCancelMembershipInput = z.infer<
  typeof requestCancelMembershipSchema
>;

export const requestTransferMembershipSchema = z.object({
  targetMemberId: z.string(),
  reason: z.string().max(500).optional(),
});
export type RequestTransferMembershipInput = z.infer<
  typeof requestTransferMembershipSchema
>;

export const requestRefundApprovalSchema = z.object({
  amountInPaise: z.number().int().positive(),
  reason: z.string().min(1).max(500),
});
export type RequestRefundApprovalInput = z.infer<
  typeof requestRefundApprovalSchema
>;

export const listMembershipsQuerySchema = z.object({
  memberId: z.string().optional(),
  packageId: z.string().optional(),
  branchId: z.string().optional(),
  status: membershipStatusSchema.optional(),
  expiringSoonDays: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).optional(),
});
export type ListMembershipsQuery = z.infer<typeof listMembershipsQuerySchema>;

export const listMembershipRemindersQuerySchema = z.object({
  daysBeforeExpiry: z.coerce.number().int().min(0).max(365).default(7),
});
export type ListMembershipRemindersQuery = z.infer<
  typeof listMembershipRemindersQuerySchema
>;

export const decideMembershipApprovalSchema = z.object({
  approvalRequestId: z.string(),
  decision: z.enum(["approved", "rejected"]),
  decisionNote: z.string().max(2000).optional(),
});
export type DecideMembershipApprovalInput = z.infer<
  typeof decideMembershipApprovalSchema
>;

export const listMembershipApprovalRequestsQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
  entityId: z.string().optional(),
});
export type ListMembershipApprovalRequestsQuery = z.infer<
  typeof listMembershipApprovalRequestsQuerySchema
>;
