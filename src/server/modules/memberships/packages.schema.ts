import { z } from "zod";

export const packageDurationUnitSchema = z.enum([
  "day",
  "week",
  "month",
  "year",
]);

export const packageCategorySchema = z.enum([
  "general",
  "student",
  "couple",
  "family",
  "corporate",
  "off_peak",
  "premium",
  "vip",
  "cardio_only",
  "group_class",
  "bundled",
  "custom",
]);

export const packageStatusSchema = z.enum(["active", "inactive", "archived"]);

const packageCoreFields = {
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  durationUnit: packageDurationUnitSchema,
  durationValue: z.number().int().positive(),
  category: packageCategorySchema.optional(),
  isTrial: z.boolean().optional(),
  isLimitedVisit: z.boolean().optional(),
  visitLimit: z.number().int().positive().optional(),
  priceInPaise: z.number().int().min(0),
  joiningFeeInPaise: z.number().int().min(0).optional(),
  registrationFeeInPaise: z.number().int().min(0).optional(),
  isTaxable: z.boolean().optional(),
  defaultDiscountPercent: z.number().int().min(0).max(100).optional(),
  earlyRenewalDiscountPercent: z.number().int().min(0).max(100).optional(),
  couponCode: z.string().max(50).optional(),
  ptSessionsIncluded: z.number().int().min(0).optional(),
  groupClassesIncluded: z.number().int().min(0).optional(),
  guestPassesIncluded: z.number().int().min(0).optional(),
  freebieEntitlements: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        quantity: z.number().int().positive(),
      }),
    )
    .optional(),
  accessWindowStart: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Use HH:mm.")
    .optional(),
  accessWindowEnd: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Use HH:mm.")
    .optional(),
  allBranches: z.boolean().optional(),
  branchIds: z.array(z.string()).optional(),
  cancellationPolicy: z.string().max(2000).optional(),
  freezeAllowed: z.boolean().optional(),
  freezeMaxDaysPerYear: z.number().int().min(0).optional(),
  freezeMaxCount: z.number().int().min(0).optional(),
  freezeMinNoticeDays: z.number().int().min(0).optional(),
  transferAllowed: z.boolean().optional(),
  refundPolicy: z.string().max(2000).optional(),
};

export const createPackageSchema = z.object(packageCoreFields);
export type CreatePackageInput = z.infer<typeof createPackageSchema>;

export const updatePackageSchema = z.object(packageCoreFields).partial();
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;

export const listPackagesQuerySchema = z.object({
  status: packageStatusSchema.optional(),
  category: packageCategorySchema.optional(),
  branchId: z.string().optional(),
});
export type ListPackagesQuery = z.infer<typeof listPackagesQuerySchema>;
