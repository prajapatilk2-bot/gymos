import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { listMembershipApprovalRequestsQuerySchema } from "@/server/modules/memberships/schema";
import { listMembershipApprovalRequests } from "@/server/modules/memberships/service";

export async function GET(req: Request) {
  try {
    const ctx = await requireApiContext();
    const query = listMembershipApprovalRequestsQuerySchema.parse(
      Object.fromEntries(new URL(req.url).searchParams),
    );
    const approvalRequests = await listMembershipApprovalRequests(ctx, query);
    return NextResponse.json({ approvalRequests });
  } catch (error) {
    return handleApiError(error);
  }
}
