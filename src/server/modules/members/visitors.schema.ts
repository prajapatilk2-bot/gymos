import { z } from "zod";

export const createVisitorSchema = z.object({
  branchId: z.string(),
  name: z.string().min(1).max(200),
  phone: z.string().max(30).optional(),
  purpose: z.string().max(300).optional(),
  hostMemberId: z.string().optional(),
  notes: z.string().max(1000).optional(),
});
export type CreateVisitorInput = z.infer<typeof createVisitorSchema>;

export const listVisitorsQuerySchema = z.object({
  branchId: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
});
export type ListVisitorsQuery = z.infer<typeof listVisitorsQuerySchema>;
