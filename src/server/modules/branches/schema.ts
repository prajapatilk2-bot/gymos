import { z } from "zod";

export const createBranchSchema = z.object({
  name: z.string().min(1).max(200),
  code: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[A-Z0-9_-]+$/, "Use uppercase letters, numbers, - and _ only."),
  address: z.string().max(500).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
  operatingHoursStart: z.string().max(5).optional(),
  operatingHoursEnd: z.string().max(5).optional(),
  timeZone: z.string().max(60).optional(),
  isDefault: z.boolean().optional(),
});
export type CreateBranchInput = z.infer<typeof createBranchSchema>;

export const updateBranchSchema = createBranchSchema.partial().extend({
  isActive: z.boolean().optional(),
});
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
