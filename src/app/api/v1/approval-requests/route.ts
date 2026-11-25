import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { requirePermission } from "@/server/modules/permissions/service";
import {
  createApprovalRequestSchema,
  listApprovalRequestsSchema,
} from "@/server/modules/approvals/schema";
import {
  createApprovalRequest,
  listApprovalRequests,
} from "@/server/modules/approvals/service";

export async function GET(req: Request) {
  try {
    const ctx = await requireApiContext();
    // ApprovalRequest rows can carry sensitive payloads (refund amounts,
    // stock adjustments, manual overrides, ...), so listing them needs its
    // own gate — "admin.approve" for now, since Phase 0 has no
    // module-specific approval requests yet. Once a later phase creates
    // approval requests tied to a specific module (e.g. "finance.approve"
    // for refunds), this should accept that module's own ".approve" key
    // too, not just admin.approve.
    await requirePermission(ctx, "admin.approve");
    const filter = listApprovalRequestsSchema.parse(
      Object.fromEntries(new URL(req.url).searchParams),
    );
    const result = await listApprovalRequests(ctx, filter);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireApiContext();
    const input = createApprovalRequestSchema.parse(await req.json());
    const request = await createApprovalRequest(ctx, input);
    return NextResponse.json({ request }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
