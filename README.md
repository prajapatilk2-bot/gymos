# GymOS

A complete gym management operating system, built incrementally across
many phases. The full product specification is in
[`docs/SPEC.md`](docs/SPEC.md); the build is tracked phase-by-phase in
[`docs/ROADMAP.md`](docs/ROADMAP.md). **Start with
[`CLAUDE.md`](CLAUDE.md)** for the architecture rules every module must
follow, and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how auth,
RBAC, scoping, audit and approvals are designed.

Currently at **Phase 0 — Foundation**: authentication, roles &
permissions, organization/branch setup, audit logging and the admin panel.
Business modules (members, billing, attendance, ...) start in Phase 1.

## Stack

Next.js (App Router) · TypeScript (strict) · Tailwind CSS v4 ·
hand-written shadcn/ui-style components · PostgreSQL + Prisma ·
Better Auth · Zod · Vitest · Playwright.

## Getting started

```bash
cp .env.example .env     # fill in DATABASE_URL etc.
pnpm install
pnpm db:migrate
pnpm db:seed              # demo org, branch, roles, 1 user per role + super admin
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from your `.env` (or any of the
`<role_key>@gymos-demo.test` / `Demo@12345` demo accounts the seed script
prints).

See [`CLAUDE.md`](CLAUDE.md) → "Running, testing, adding a module" for the
full command reference (lint, typecheck, tests, E2E, adding a new module).
