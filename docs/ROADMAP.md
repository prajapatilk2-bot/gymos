# Roadmap

Phase plan from the session brief, as a checklist. Requirement IDs refer to
`docs/SPEC.md`. Check an item only once it is actually built, tested and
merged — not when a page merely exists as a placeholder.

## Phase 0 — Foundation (W1–W4 basics, Y)

- [x] Project scaffold: Next.js (App Router) + TypeScript strict + Tailwind
      + pnpm; scripts for dev/build/lint/typecheck/test/test:e2e/db:migrate/db:seed
- [x] PostgreSQL + Prisma, migrations committed
- [x] Better Auth email/password login for staff (W3 basics): sessions,
      strong password rules, inactivity auto-logout (configurable), login
      history, deactivated users blocked
- [x] RBAC (W1, W2): permission registry for all 24 modules × 6 actions +
      sensitive-data gates; 11 default system roles with a documented
      permission matrix; custom roles; server-side `requirePermission` +
      branch-scope helpers; tests for allowed *and* prohibited actions
- [x] App shell: login page, responsive collapsible sidebar (24 modules,
      grouped, permission-filtered), branch switcher, user menu/logout,
      light/dark theme; placeholder page per not-yet-built module
- [x] Admin screens (W1, W4): Users, Roles, Organization settings,
      Branches, Audit log viewer
- [x] Audit logging + generic approval-request workflow (service layer)
- [x] Seed script: demo org, "Main Branch", one user per default role,
      super admin from env vars
- [x] Tests: Vitest unit tests (permissions, scoping, audit), Playwright
      smoke test (login → dashboard placeholder → logout)
- [x] CI (GitHub Actions): install, lint, typecheck, format, unit tests,
      build, E2E on every PR
- [ ] First deploy to Vercel + Neon (deliberately not done this session —
      see `docs/PROGRESS.md`)

## Phase 1 — Core operations

- [ ] 1.1 Members (C1–C4)
- [ ] 1.2 Packages & membership lifecycle (D1–D3)
- [ ] 1.3 Billing, GST invoices, payments, refunds with approval (O1–O2)
- [ ] 1.4 Attendance & QR check-in, access rules (E1–E3, WF2)
- [ ] 1.5 Form builder, QR codes, enquiries/leads (B1–B3, WF1)
- [ ] 1.6 Main dashboard & core reports, exports (A1–A4, T1–T2)
- [ ] 1.7 Hardening & first deploy

## Phase 2 — Member experience

- [ ] 2.1 Notification engine + WhatsApp/SMS/email (V1–V3, N4)
- [ ] 2.2 CRM pipeline & renewals (N1–N3, WF8, WF9)
- [ ] 2.3 Trainers & PT (H1–H4, WF5)
- [ ] 2.4 Exercise library & workouts (I1–I2)
- [ ] 2.5 Body assessments & diet (I3, I3a, I4)
- [ ] 2.6 Member PWA + online payments (S1–S3, X1 Razorpay)
- [ ] 2.7 Group classes (M1–M4)

## Phase 3 — Retail & engagement

- [ ] 3.1 Catalogue, procurement, stock ledger (F1, F2, F4–F6)
- [ ] 3.2 POS (F7, WF3)
- [ ] 3.3 Canteen (F3)
- [ ] 3.4 Freebies & rewards (G1–G4, WF4)
- [ ] 3.5 Birthdays & celebrations (K1–K4, WF6)
- [ ] 3.6 Gym screens (L1–L4)
- [ ] 3.7 Challenges & leaderboards (J1–J6, WF7)

## Phase 4 — Back office

- [ ] 4.1 Expenses, vendors, accounting & GST reports (O3–O4)
- [ ] 4.2 Staff, HR, payroll (P1–P4)
- [ ] 4.3 Equipment & assets (Q1–Q3, WF10)
- [ ] 4.4 Facility, lockers, housekeeping, safety (R1–R3)

## Phase 5 — Scale

- [ ] 5.1 Multi-branch & franchise (U1–U2)
- [ ] 5.2 Advanced analytics & scheduled reports (T3–T6)
- [ ] 5.3 Public API, webhooks, integrations (X1, X3)
- [ ] 5.4 White-label

## Phase 6 — Intelligence & hardware

- [ ] 6.1 AI assistant & churn prediction (T6)
- [ ] 6.2 Hardware/wearables (X2, E1 hardware)
