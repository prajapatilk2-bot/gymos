import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { decideApprovalRequestSchema } from "@/server/modules/approvals/schema";
import { decideApprovalRequest } from "@/server/modules/approvals/service";
import { requirePermission } from "@/server/modules/permissions/service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    await requirePermission(ctx, "admin.approve");
    const { id } = await params;
    const body = await req.json();
    const input = decideApprovalRequestSchema.parse({ ...body, id });
    const request = await decideApprovalRequest(ctx, input);
    return NextResponse.json({ request });
  } catch (error) {
    return handleApiError(error);
  }
}
