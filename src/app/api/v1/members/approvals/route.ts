import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { listMemberApprovalRequestsQuerySchema } from "@/server/modules/members/schema";
import { listMemberApprovalRequests } from "@/server/modules/members/service";

export async function GET(req: Request) {
  try {
    const ctx = await requireApiContext();
    const query = listMemberApprovalRequestsQuerySchema.parse(
      Object.fromEntries(new URL(req.url).searchParams),
    );
    const approvalRequests = await listMemberApprovalRequests(ctx, query);
    return NextResponse.json({ approvalRequests });
  } catch (error) {
    return handleApiError(error);
  }
}
