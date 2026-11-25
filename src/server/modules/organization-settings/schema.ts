import { z } from "zod";

export const updateOrganizationProfileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  logoUrl: z.string().url().max(2000).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  email: z.string().email().nullable().optional(),
  gstin: z.string().max(20).nullable().optional(),
  financialYearStartMonth: z.number().int().min(1).max(12).optional(),
  timeZone: z.string().max(60).optional(),
  dateFormat: z.enum(["DD-MM-YYYY", "MM-DD-YYYY", "YYYY-MM-DD"]).optional(),
  currency: z.string().max(10).optional(),
});
export type UpdateOrganizationProfileInput = z.infer<
  typeof updateOrganizationProfileSchema
>;

export const setOrganizationSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.unknown(),
});
export type SetOrganizationSettingInput = z.infer<
  typeof setOrganizationSettingSchema
>;
