import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/http", async () => {
  const actual =
    await vi.importActual<typeof import("@/server/http")>("@/server/http");
  return {
    ...actual,
    requireApiContext: vi.fn(),
  };
});

import { requireApiContext } from "@/server/http";
import { GET } from "@/app/api/v1/approval-requests/route";
import {
  assignRole,
  createOrganization,
  createRoleWithPermissions,
  createUser,
  toRequestContext,
} from "./fixtures";

/**
 * Regression test for a gap found in review: GET /api/v1/approval-requests
 * listed every ApprovalRequest in the organization (including sensitive
 * payloads such as refund amounts and stock adjustments) with no permission
 * check at all. Only requireApiContext (authentication) is mocked here —
 * the permission check itself runs for real against a real role/permission
 * fixture, so this fails again if the route's requirePermission call is
 * ever removed or weakened.
 */
describe("GET /api/v1/approval-requests", () => {
  afterEach(() => {
    vi.mocked(requireApiContext).mockReset();
  });

  it("returns 403 for a user without admin.approve", async () => {
    const org = await createOrganization();
    const user = await createUser(org.id);
    vi.mocked(requireApiContext).mockResolvedValue(
      toRequestContext(org.id, user),
    );

    const response = await GET(
      new Request("http://localhost/api/v1/approval-requests"),
    );

    expect(response.status).toBe(403);
  });

  it("returns 200 for a user with admin.approve", async () => {
    const org = await createOrganization();
    const user = await createUser(org.id);
    const role = await createRoleWithPermissions(org.id, ["admin.approve"]);
    await assignRole({
      userId: user.id,
      roleId: role.id,
      organizationId: org.id,
      branchId: null,
    });
    vi.mocked(requireApiContext).mockResolvedValue(
      toRequestContext(org.id, user),
    );

    const response = await GET(
      new Request("http://localhost/api/v1/approval-requests"),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.items).toEqual([]);
  });
});
