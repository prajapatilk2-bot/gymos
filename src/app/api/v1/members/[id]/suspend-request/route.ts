import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { requestMemberSuspensionSchema } from "@/server/modules/members/schema";
import { requestMemberSuspension } from "@/server/modules/members/service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const input = requestMemberSuspensionSchema.parse(await req.json());
    const approvalRequest = await requestMemberSuspension(ctx, id, input);
    return NextResponse.json({ approvalRequest }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
