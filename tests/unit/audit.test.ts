import { describe, expect, it } from "vitest";

import { listAuditLogs, writeAuditLog } from "@/server/modules/audit/service";
import { createOrganization, createUser, toRequestContext } from "./fixtures";

describe("audit log", () => {
  it("records who/when/entity/action and before/after state", async () => {
    const org = await createOrganization();
    const user = await createUser(org.id);
    const ctx = toRequestContext(org.id, user);

    await writeAuditLog(ctx, {
      action: "update",
      entityType: "Branch",
      entityId: "branch-1",
      before: { name: "Old" },
      after: { name: "New" },
    });

    const result = await listAuditLogs(ctx, {});
    expect(result.items).toHaveLength(1);
    const entry = result.items[0];
    expect(entry.action).toBe("update");
    expect(entry.entityType).toBe("Branch");
    expect(entry.entityId).toBe("branch-1");
    expect(entry.before).toEqual({ name: "Old" });
    expect(entry.after).toEqual({ name: "New" });
    expect(entry.user?.id).toBe(user.id);
    expect(entry.ipAddress).toBe("127.0.0.1");
  });

  it("never leaks another organization's audit log entries", async () => {
    const orgA = await createOrganization();
    const orgB = await createOrganization();
    const userA = await createUser(orgA.id);
    const userB = await createUser(orgB.id);
    const ctxA = toRequestContext(orgA.id, userA);
    const ctxB = toRequestContext(orgB.id, userB);

    await writeAuditLog(ctxA, {
      action: "create",
      entityType: "User",
      entityId: "a-1",
    });
    await writeAuditLog(ctxB, {
      action: "create",
      entityType: "User",
      entityId: "b-1",
    });

    const resultA = await listAuditLogs(ctxA, {});
    const resultB = await listAuditLogs(ctxB, {});

    expect(resultA.items.every((item) => item.entityId !== "b-1")).toBe(true);
    expect(resultB.items.every((item) => item.entityId !== "a-1")).toBe(true);
  });

  it("filters by action and entityType", async () => {
    const org = await createOrganization();
    const user = await createUser(org.id);
    const ctx = toRequestContext(org.id, user);

    await writeAuditLog(ctx, {
      action: "create",
      entityType: "Role",
      entityId: "r-1",
    });
    await writeAuditLog(ctx, {
      action: "delete",
      entityType: "Role",
      entityId: "r-1",
    });
    await writeAuditLog(ctx, {
      action: "create",
      entityType: "Branch",
      entityId: "br-1",
    });

    const deletes = await listAuditLogs(ctx, { action: "delete" });
    expect(deletes.items).toHaveLength(1);
    expect(deletes.items[0].entityType).toBe("Role");

    const roleEntries = await listAuditLogs(ctx, { entityType: "Role" });
    expect(roleEntries.items).toHaveLength(2);
  });
});
