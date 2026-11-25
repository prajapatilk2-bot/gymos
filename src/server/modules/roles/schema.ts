import { z } from "zod";

export const createRoleSchema = z.object({
  key: z
    .string()
    .min(2)
    .max(50)
    .regex(
      /^[a-z][a-z0-9_]*$/,
      "Use lowercase letters, numbers and underscores only.",
    ),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  permissionKeys: z.array(z.string()).default([]),
});
export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
});
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export const updateRolePermissionsSchema = z.object({
  permissionKeys: z.array(z.string()),
});
export type UpdateRolePermissionsInput = z.infer<
  typeof updateRolePermissionsSchema
>;
