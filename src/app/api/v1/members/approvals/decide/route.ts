import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { decideMemberApprovalSchema } from "@/server/modules/members/schema";
import { decideMemberApprovalRequest } from "@/server/modules/members/service";

export async function POST(req: Request) {
  try {
    const ctx = await requireApiContext();
    const input = decideMemberApprovalSchema.parse(await req.json());
    const approvalRequest = await decideMemberApprovalRequest(ctx, input);
    return NextResponse.json({ approvalRequest });
  } catch (error) {
    return handleApiError(error);
  }
}
