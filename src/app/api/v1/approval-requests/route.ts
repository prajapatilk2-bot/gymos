import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
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
