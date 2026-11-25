import { z } from "zod";

export const auditLogFilterSchema = z.object({
  userId: z.string().optional(),
  entityType: z.string().optional(),
  action: z.string().optional(),
  branchId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
});

export type AuditLogFilter = z.infer<typeof auditLogFilterSchema>;
