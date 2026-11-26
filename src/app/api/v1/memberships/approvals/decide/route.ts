import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { decideMembershipApprovalSchema } from "@/server/modules/memberships/schema";
import { decideMembershipApprovalRequest } from "@/server/modules/memberships/service";

export async function POST(req: Request) {
  try {
    const ctx = await requireApiContext();
    const input = decideMembershipApprovalSchema.parse(await req.json());
    const approvalRequest = await decideMembershipApprovalRequest(ctx, input);
    return NextResponse.json({ approvalRequest });
  } catch (error) {
    return handleApiError(error);
  }
}
