import { z } from "zod";

export const memberStatusSchema = z.enum([
  "active",
  "inactive",
  "expired",
  "suspended",
  "frozen",
]);

export const memberTagSchema = z.enum([
  "vip",
  "personal_training",
  "trial",
  "corporate",
  "couple",
  "family",
]);

export const genderSchema = z.enum([
  "male",
  "female",
  "other",
  "prefer_not_to_say",
]);

export const memberConsentTypeSchema = z.enum([
  "waiver",
  "terms_and_conditions",
  "marketing_communication",
  "data_processing",
  "photo_video_usage",
  "health_data_processing",
]);

export const memberDocumentTypeSchema = z.enum([
  "id_proof",
  "address_proof",
  "photo",
  "agreement",
  "waiver",
  "medical_certificate",
  "other",
]);

const memberCoreFields = {
  name: z.string().min(1).max(200),
  photoUrl: z.string().url().max(2000).optional(),
  mobile: z.string().min(5).max(20),
  whatsappNumber: z.string().max(20).optional(),
  email: z.string().email().max(300).optional(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")
    .optional(),
  gender: genderSchema.optional(),
  address: z.string().max(1000).optional(),
  emergencyContactName: z.string().max(200).optional(),
  emergencyContactPhone: z.string().max(30).optional(),
  emergencyContactRelation: z.string().max(100).optional(),
  joiningDate: z.string().optional(),
  leadSource: z.string().max(200).optional(),
  occupation: z.string().max(200).optional(),
  fitnessGoals: z.string().max(1000).optional(),
  assignedTrainerId: z.string().max(100).optional(),
  membershipPreference: z.string().max(500).optional(),
  tags: z.array(memberTagSchema).optional(),
};

export const createMemberSchema = z.object({
  branchId: z.string(),
  ...memberCoreFields,
  cardNumber: z.string().max(50).optional(),
  waiverAccepted: z.boolean().optional(),
  allowDuplicate: z.boolean().optional(),
});
export type CreateMemberInput = z.infer<typeof createMemberSchema>;

export const updateMemberSchema = z
  .object({ ...memberCoreFields })
  .partial()
  .extend({ cardNumber: z.string().max(50).nullable().optional() });
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

export const listMembersQuerySchema = z.object({
  q: z.string().optional(),
  status: memberStatusSchema.optional(),
  tag: memberTagSchema.optional(),
  branchId: z.string().optional(),
  assignedTrainerId: z.string().optional(),
  joinedFrom: z.string().optional(),
  joinedTo: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
});
export type ListMembersQuery = z.infer<typeof listMembersQuerySchema>;

export const checkDuplicateMemberSchema = z.object({
  mobile: z.string().optional(),
  email: z.string().email().optional(),
  excludeId: z.string().optional(),
});
export type CheckDuplicateMemberInput = z.infer<
  typeof checkDuplicateMemberSchema
>;

export const transferMemberBranchSchema = z.object({
  branchId: z.string(),
  reason: z.string().max(500).optional(),
});
export type TransferMemberBranchInput = z.infer<
  typeof transferMemberBranchSchema
>;

export const requestMemberSuspensionSchema = z.object({
  action: z.enum(["suspend", "unsuspend"]),
  reason: z.string().max(500).optional(),
});
export type RequestMemberSuspensionInput = z.infer<
  typeof requestMemberSuspensionSchema
>;

export const requestMemberMergeSchema = z.object({
  duplicateMemberId: z.string(),
  reason: z.string().max(500).optional(),
});
export type RequestMemberMergeInput = z.infer<typeof requestMemberMergeSchema>;

export const decideMemberApprovalSchema = z.object({
  approvalRequestId: z.string(),
  decision: z.enum(["approved", "rejected"]),
  decisionNote: z.string().max(2000).optional(),
});
export type DecideMemberApprovalInput = z.infer<
  typeof decideMemberApprovalSchema
>;

export const recordMemberConsentSchema = z.object({
  type: memberConsentTypeSchema,
  granted: z.boolean(),
  ipAddress: z.string().max(60).optional(),
  notes: z.string().max(1000).optional(),
});
export type RecordMemberConsentInput = z.infer<
  typeof recordMemberConsentSchema
>;

export const withdrawMemberConsentSchema = z.object({
  type: memberConsentTypeSchema,
});
export type WithdrawMemberConsentInput = z.infer<
  typeof withdrawMemberConsentSchema
>;

export const memberHealthDeclarationSchema = z.object({
  hasMedicalConditions: z.boolean().optional(),
  medicalConditions: z.string().max(2000).optional(),
  injuries: z.string().max(2000).optional(),
  medications: z.string().max(2000).optional(),
  allergies: z.string().max(1000).optional(),
  physicianName: z.string().max(200).optional(),
  physicianPhone: z.string().max(30).optional(),
  precautions: z.string().max(2000).optional(),
});
export type MemberHealthDeclarationInput = z.infer<
  typeof memberHealthDeclarationSchema
>;

export const addMemberDocumentSchema = z.object({
  type: memberDocumentTypeSchema,
  fileName: z.string().min(1).max(300),
  fileUrl: z.string().min(1).max(2000),
  mimeType: z.string().max(100).optional(),
  sizeBytes: z.number().int().positive().optional(),
});
export type AddMemberDocumentInput = z.infer<typeof addMemberDocumentSchema>;

export const importMembersSchema = z.object({
  branchId: z.string(),
  csv: z.string().min(1).max(5_000_000),
});
export type ImportMembersInput = z.infer<typeof importMembersSchema>;

export const exportMembersQuerySchema = listMembersQuerySchema.omit({
  page: true,
});
export type ExportMembersQuery = z.infer<typeof exportMembersQuerySchema>;

export const listMemberApprovalRequestsQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
  entityId: z.string().optional(),
});
export type ListMemberApprovalRequestsQuery = z.infer<
  typeof listMemberApprovalRequestsQuerySchema
>;
