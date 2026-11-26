import { z } from "zod";

export const guestPassTypeSchema = z.enum(["guest_pass", "trial_pass"]);

export const createGuestPassSchema = z.object({
  branchId: z.string(),
  type: guestPassTypeSchema,
  name: z.string().min(1).max(200),
  phone: z.string().max(30).optional(),
  email: z.string().email().max(300).optional(),
  issuedByMemberId: z.string().optional(),
  validFrom: z.string(),
  validTo: z.string(),
  notes: z.string().max(500).optional(),
});
export type CreateGuestPassInput = z.infer<typeof createGuestPassSchema>;

export const listGuestPassesQuerySchema = z.object({
  branchId: z.string().optional(),
  type: guestPassTypeSchema.optional(),
  page: z.coerce.number().int().min(1).optional(),
});
export type ListGuestPassesQuery = z.infer<typeof listGuestPassesQuerySchema>;

export const convertGuestPassSchema = z.object({
  memberId: z.string(),
});
export type ConvertGuestPassInput = z.infer<typeof convertGuestPassSchema>;
