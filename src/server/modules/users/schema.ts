import { z } from "zod";

import { passwordSchema } from "@/server/auth/password";

const roleAssignmentSchema = z.object({
  roleId: z.string(),
  branchId: z.string().nullable(),
});

export const createUserSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  password: passwordSchema,
  employeeCode: z.string().max(50).optional(),
  phone: z.string().max(30).optional(),
  roleAssignments: z.array(roleAssignmentSchema).optional(),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  employeeCode: z.string().max(50).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const resetPasswordSchema = z.object({
  newPassword: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const setUserRolesSchema = z.object({
  roleAssignments: z.array(roleAssignmentSchema),
});
export type SetUserRolesInput = z.infer<typeof setUserRolesSchema>;

export const listUsersQuerySchema = z.object({
  q: z.string().optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  roleId: z.string().optional(),
  branchId: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
