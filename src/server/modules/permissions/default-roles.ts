import { getModule, type ModuleId } from "@/server/modules/registry";
import type {
  PermissionActionKey,
  SensitiveCategoryKey,
} from "@/server/modules/permissions/registry";

export type AccessLevel = "full" | "manage" | "edit" | "view" | "none";

const LEVEL_ACTIONS: Record<AccessLevel, PermissionActionKey[]> = {
  full: ["view", "create", "edit", "delete", "export", "approve"],
  manage: ["view", "create", "edit", "export"],
  edit: ["view", "create", "edit"],
  view: ["view", "export"],
  none: [],
};

export interface ModuleAccess {
  level: AccessLevel;
  /** Grant "approve" on top of the level, without granting full "delete". */
  approve?: boolean;
}

export interface SystemRoleDefinition {
  key: string;
  name: string;
  description: string;
  modules: Partial<Record<ModuleId, ModuleAccess>>;
  sensitive: Partial<Record<SensitiveCategoryKey, "view" | "edit" | "none">>;
}

/**
 * Default permission matrix for the W1 system roles. Documented in full in
 * docs/ARCHITECTURE.md. A module not listed for a role gets no access at
 * all. These are starting points seeded per organization — every
 * organization can edit its own copy (Role rows are organization-scoped)
 * and create further custom roles; editing this file only changes what
 * *new* organizations are seeded with.
 */
export const DEFAULT_SYSTEM_ROLES: SystemRoleDefinition[] = [
  {
    key: "super_admin",
    name: "Super Admin",
    description:
      "Full access to every module, every branch and all sensitive data. Manages the platform itself.",
    modules: Object.fromEntries(
      (
        [
          "A",
          "B",
          "C",
          "D",
          "E",
          "F",
          "G",
          "H",
          "I",
          "J",
          "K",
          "L",
          "M",
          "N",
          "O",
          "P",
          "Q",
          "R",
          "S",
          "T",
          "U",
          "V",
          "W",
          "X",
        ] as ModuleId[]
      ).map((id) => [id, { level: "full" }]),
    ),
    sensitive: { health: "edit", financial: "edit", payroll: "edit" },
  },
  {
    key: "owner",
    name: "Owner",
    description:
      "Business owner. Full operational and financial visibility across all branches.",
    modules: Object.fromEntries(
      (
        [
          "A",
          "B",
          "C",
          "D",
          "E",
          "F",
          "G",
          "H",
          "I",
          "J",
          "K",
          "L",
          "M",
          "N",
          "O",
          "P",
          "Q",
          "R",
          "S",
          "T",
          "U",
          "V",
          "X",
        ] as ModuleId[]
      ).map((id) => [id, { level: "full" }]),
    ),
    sensitive: { health: "view", financial: "edit", payroll: "edit" },
  },
  {
    key: "general_manager",
    name: "General Manager",
    description:
      "Runs day-to-day operations across branches; approves routine exceptions.",
    modules: {
      A: { level: "view" },
      B: { level: "manage", approve: true },
      C: { level: "manage" },
      D: { level: "manage", approve: true },
      E: { level: "manage", approve: true },
      F: { level: "manage", approve: true },
      G: { level: "manage", approve: true },
      H: { level: "manage" },
      I: { level: "manage" },
      J: { level: "manage", approve: true },
      K: { level: "manage" },
      L: { level: "manage" },
      M: { level: "manage" },
      N: { level: "manage" },
      O: { level: "view" },
      P: { level: "view" },
      Q: { level: "manage", approve: true },
      R: { level: "manage" },
      T: { level: "view" },
      V: { level: "manage" },
      W: { level: "view" },
    },
    sensitive: { health: "view", financial: "view", payroll: "view" },
  },
  {
    key: "branch_manager",
    name: "Branch Manager",
    description:
      "Manages one branch's operations, staff and facility (scoped via branch assignment).",
    modules: {
      A: { level: "view" },
      B: { level: "manage", approve: true },
      C: { level: "manage" },
      D: { level: "manage", approve: true },
      E: { level: "manage", approve: true },
      F: { level: "manage", approve: true },
      G: { level: "manage", approve: true },
      H: { level: "manage" },
      I: { level: "manage" },
      J: { level: "manage" },
      K: { level: "manage" },
      L: { level: "manage" },
      M: { level: "manage" },
      N: { level: "manage" },
      O: { level: "view" },
      P: { level: "view" },
      Q: { level: "manage", approve: true },
      R: { level: "manage" },
      T: { level: "view" },
      W: { level: "view" },
    },
    sensitive: { health: "view", financial: "view", payroll: "none" },
  },
  {
    key: "receptionist",
    name: "Receptionist",
    description:
      "Front-desk: registration, enquiries, check-in, renewals and basic billing.",
    modules: {
      A: { level: "view" },
      B: { level: "manage" },
      C: { level: "manage" },
      D: { level: "edit" },
      E: { level: "manage" },
      F: { level: "edit" },
      G: { level: "edit" },
      N: { level: "view" },
      O: { level: "edit" },
      T: { level: "view" },
    },
    sensitive: { health: "view", financial: "none", payroll: "none" },
  },
  {
    key: "trainer",
    name: "Trainer",
    description:
      "Personal training, workouts and body assessments for assigned clients.",
    modules: {
      A: { level: "view" },
      C: { level: "view" },
      G: { level: "view" },
      H: { level: "manage" },
      I: { level: "manage" },
      J: { level: "view" },
      K: { level: "view" },
      M: { level: "edit" },
      T: { level: "view" },
    },
    sensitive: { health: "edit", financial: "none", payroll: "none" },
  },
  {
    key: "accountant",
    name: "Accountant",
    description:
      "Billing, payments, expenses, payroll processing and accounting reports.",
    modules: {
      A: { level: "view" },
      C: { level: "view" },
      D: { level: "view" },
      O: { level: "full" },
      P: { level: "manage" },
      T: { level: "view" },
    },
    sensitive: { health: "none", financial: "edit", payroll: "edit" },
  },
  {
    key: "salesperson",
    name: "Salesperson",
    description:
      "Converts enquiries into members and sells memberships; tracks personal targets.",
    modules: {
      A: { level: "view" },
      B: { level: "manage" },
      C: { level: "edit" },
      D: { level: "edit" },
      N: { level: "manage" },
      T: { level: "view" },
    },
    sensitive: { health: "none", financial: "none", payroll: "none" },
  },
  {
    key: "store_manager",
    name: "Store Manager",
    description:
      "Supplement store and canteen: catalogue, procurement, stock and POS sales.",
    modules: {
      A: { level: "view" },
      C: { level: "view" },
      F: { level: "full" },
      G: { level: "manage" },
      O: { level: "view" },
      T: { level: "view" },
    },
    sensitive: { health: "none", financial: "view", payroll: "none" },
  },
  {
    key: "housekeeping",
    name: "Housekeeping",
    description: "Daily cleaning checklists and equipment fault reporting.",
    modules: {
      Q: { level: "edit" },
      R: { level: "manage" },
    },
    sensitive: { health: "none", financial: "none", payroll: "none" },
  },
  {
    key: "security",
    name: "Security",
    description: "Access logs, incident register and facility safety.",
    modules: {
      E: { level: "view" },
      R: { level: "manage" },
    },
    sensitive: { health: "none", financial: "none", payroll: "none" },
  },
];

export function expandModulePermissionKeys(
  slug: string,
  access: ModuleAccess,
): string[] {
  const actions = new Set<PermissionActionKey>(LEVEL_ACTIONS[access.level]);
  if (access.approve) actions.add("approve");
  return Array.from(actions, (action) => `${slug}.${action}`);
}

export function expandSensitiveKeys(
  category: SensitiveCategoryKey,
  mode: "view" | "edit" | "none",
): string[] {
  if (mode === "none") return [];
  if (mode === "view") return [`sensitive.${category}.view`];
  return [`sensitive.${category}.view`, `sensitive.${category}.edit`];
}

/** Expands a system role definition into the full flat list of permission keys. */
export function resolveSystemRolePermissionKeys(
  role: SystemRoleDefinition,
): string[] {
  const moduleKeys = (
    Object.entries(role.modules) as [ModuleId, ModuleAccess][]
  ).flatMap(([moduleId, access]) =>
    expandModulePermissionKeys(getModule(moduleId).slug, access),
  );
  const sensitiveKeys = (
    Object.entries(role.sensitive) as [
      SensitiveCategoryKey,
      "view" | "edit" | "none",
    ][]
  ).flatMap(([category, mode]) => expandSensitiveKeys(category, mode));

  return Array.from(new Set([...moduleKeys, ...sensitiveKeys]));
}
