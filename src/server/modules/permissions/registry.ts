import { MODULES } from "@/server/modules/registry";

export const PERMISSION_ACTIONS = [
  "view",
  "create",
  "edit",
  "delete",
  "export",
  "approve",
] as const;

export type PermissionActionKey = (typeof PERMISSION_ACTIONS)[number];

export const SENSITIVE_CATEGORIES = ["health", "financial", "payroll"] as const;
export type SensitiveCategoryKey = (typeof SENSITIVE_CATEGORIES)[number];

export interface PermissionDefinition {
  key: string;
  module: string; // module id, e.g. "C"
  action: PermissionActionKey;
  isSensitive: boolean;
  sensitiveCategory: SensitiveCategoryKey | null;
  description: string;
}

/**
 * One "<module-slug>.<action>" permission per module (A–X) × the six
 * standard actions (W2). Generated from the module registry so adding a new
 * module automatically gets a full set of permission keys — nothing to keep
 * in sync by hand.
 */
function buildModulePermissions(): PermissionDefinition[] {
  return MODULES.flatMap((moduleDef) =>
    PERMISSION_ACTIONS.map((action) => ({
      key: `${moduleDef.slug}.${action}`,
      module: moduleDef.id,
      action,
      isSensitive: false,
      sensitiveCategory: null,
      description: `${action[0].toUpperCase()}${action.slice(1)} access to ${moduleDef.name} (${moduleDef.id}).`,
    })),
  );
}

/**
 * Cross-cutting "sensitive data" gates (W2, Y4). These are combined with a
 * module permission at the call site — e.g. reading a member's health
 * declaration requires BOTH "members.view" AND "sensitive.health.view" — so
 * a role can see ordinary member data without automatically seeing health,
 * financial or payroll details. See docs/ARCHITECTURE.md.
 */
function buildSensitivePermissions(): PermissionDefinition[] {
  return SENSITIVE_CATEGORIES.flatMap((category) =>
    (["view", "edit"] as const).map((action) => ({
      key: `sensitive.${category}.${action}`,
      module: "W",
      action,
      isSensitive: true,
      sensitiveCategory: category,
      description: `${action[0].toUpperCase()}${action.slice(1)} access to ${category} data across all modules.`,
    })),
  );
}

export const PERMISSIONS: PermissionDefinition[] = [
  ...buildModulePermissions(),
  ...buildSensitivePermissions(),
];

export const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

export function isKnownPermissionKey(key: string): boolean {
  return PERMISSION_KEYS.includes(key);
}
