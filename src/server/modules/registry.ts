// The 24 primary-sidebar modules (A–X) from docs/SPEC.md's Document Map,
// plus the phase each module's build starts in (see docs/ROADMAP.md).
// This is the single source of truth for sidebar navigation, module
// placeholder pages and the permission registry (permissions/registry.ts
// generates one permission key per module × action from this list).

export type ModuleId =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L"
  | "M"
  | "N"
  | "O"
  | "P"
  | "Q"
  | "R"
  | "S"
  | "T"
  | "U"
  | "V"
  | "W"
  | "X";

export type ModuleGroup =
  | "operations"
  | "fitness"
  | "commercial"
  | "engagement"
  | "business"
  | "platform";

export interface ModuleDefinition {
  id: ModuleId;
  name: string;
  description: string;
  group: ModuleGroup;
  phase: number;
  /** URL segment under /dashboard/<slug> */
  slug: string;
}

export const MODULES: ModuleDefinition[] = [
  {
    id: "A",
    name: "Main Dashboard",
    description:
      "The command centre for owners and managers: live stats, alerts and quick actions.",
    group: "operations",
    phase: 1,
    slug: "dashboard",
  },
  {
    id: "B",
    name: "Customer Enquiry & QR Form Management",
    description:
      "Build backend-configured enquiry forms, publish them via QR codes, and manage leads.",
    group: "operations",
    phase: 1,
    slug: "enquiries",
  },
  {
    id: "C",
    name: "Member Management",
    description: "The central member database used by every other module.",
    group: "operations",
    phase: 1,
    slug: "members",
  },
  {
    id: "D",
    name: "Membership & Package Management",
    description:
      "Flexible membership products and their full lifecycle: create, renew, freeze, cancel.",
    group: "operations",
    phase: 1,
    slug: "memberships",
  },
  {
    id: "E",
    name: "Attendance & Access Management",
    description:
      "QR/biometric check-in, access rules and attendance reporting.",
    group: "operations",
    phase: 1,
    slug: "attendance",
  },
  {
    id: "F",
    name: "Supplement & Canteen Management",
    description:
      "Retail catalogue, procurement, stock ledger, canteen and POS.",
    group: "commercial",
    phase: 3,
    slug: "retail",
  },
  {
    id: "G",
    name: "Freebies, Complimentary Items & Rewards",
    description:
      "Freebie eligibility, issuance, redemption and loyalty rewards.",
    group: "commercial",
    phase: 3,
    slug: "freebies",
  },
  {
    id: "H",
    name: "Personal Training & Trainer Management",
    description:
      "Trainer profiles, PT packages, session scheduling and performance.",
    group: "fitness",
    phase: 2,
    slug: "personal-training",
  },
  {
    id: "I",
    name: "Workout, Fitness & Body Assessment",
    description:
      "Exercise library, workout plans, body assessments and diet/nutrition.",
    group: "fitness",
    phase: 2,
    slug: "fitness",
  },
  {
    id: "J",
    name: "Running Challenges & Competitions",
    description:
      "Challenge creation, activity tracking, leaderboards and winners.",
    group: "engagement",
    phase: 3,
    slug: "challenges",
  },
  {
    id: "K",
    name: "Birthday, Celebrations & Member Recognition",
    description:
      "Automated birthday messages, gym-screen wishes and other celebrations.",
    group: "engagement",
    phase: 3,
    slug: "celebrations",
  },
  {
    id: "L",
    name: "Gym Screen & Digital Display Management",
    description:
      "Screens, playlists and scheduled content for in-gym digital signage.",
    group: "engagement",
    phase: 3,
    slug: "screens",
  },
  {
    id: "M",
    name: "Group Classes & Bookings",
    description: "Class catalogue, scheduling, bookings and attendance.",
    group: "fitness",
    phase: 2,
    slug: "classes",
  },
  {
    id: "N",
    name: "Marketing, CRM & Member Retention",
    description:
      "CRM pipeline, campaigns, retention and communication templates.",
    group: "engagement",
    phase: 2,
    slug: "crm",
  },
  {
    id: "O",
    name: "Finance, Billing & Accounting",
    description:
      "Invoices, payments, expenses, vendors and accounting reports.",
    group: "business",
    phase: 1,
    slug: "finance",
  },
  {
    id: "P",
    name: "Staff & HR Management",
    description: "Employee directory, attendance/shifts, payroll and tasks.",
    group: "platform",
    phase: 4,
    slug: "staff",
  },
  {
    id: "Q",
    name: "Equipment & Asset Management",
    description: "Equipment register, maintenance/repairs and asset lifecycle.",
    group: "platform",
    phase: 4,
    slug: "equipment",
  },
  {
    id: "R",
    name: "Facility, Housekeeping & Safety",
    description:
      "Lockers, housekeeping checklists and safety/incident records.",
    group: "platform",
    phase: 4,
    slug: "facility",
  },
  {
    id: "S",
    name: "Member Mobile App & Self-Service Portal",
    description: "What members see in the mobile app / self-service portal.",
    group: "engagement",
    phase: 2,
    slug: "member-app",
  },
  {
    id: "T",
    name: "Reports & Business Analytics",
    description: "Cross-module reports, exports and business intelligence.",
    group: "business",
    phase: 1,
    slug: "reports",
  },
  {
    id: "U",
    name: "Multi-Branch & Franchise Management",
    description:
      "Branch setup, centralized reporting and franchise operations.",
    group: "business",
    phase: 5,
    slug: "branches",
  },
  {
    id: "V",
    name: "Notifications & Automation Centre",
    description:
      "WhatsApp/SMS/email templates, automation rules and delivery tracking.",
    group: "platform",
    phase: 2,
    slug: "notifications",
  },
  {
    id: "W",
    name: "Admin Panel, User Roles & Security",
    description:
      "Users, roles & permissions, organization settings, audit logs.",
    group: "platform",
    phase: 0,
    slug: "admin",
  },
  {
    id: "X",
    name: "Integrations & API Management",
    description:
      "Payment, communication, accounting and hardware integrations.",
    group: "platform",
    phase: 5,
    slug: "integrations",
  },
];

export const MODULE_GROUP_LABELS: Record<ModuleGroup, string> = {
  operations: "Operations",
  fitness: "Fitness & Training",
  commercial: "Retail & Commercial",
  engagement: "Engagement & Marketing",
  business: "Business & Finance",
  platform: "Platform & Admin",
};

export function getModule(id: ModuleId): ModuleDefinition {
  const moduleDef = MODULES.find((m) => m.id === id);
  if (!moduleDef) throw new Error(`Unknown module id: ${id}`);
  return moduleDef;
}

export function getModuleBySlug(slug: string): ModuleDefinition | undefined {
  return MODULES.find((m) => m.slug === slug);
}
