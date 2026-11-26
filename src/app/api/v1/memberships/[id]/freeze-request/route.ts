import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { requestFreezeMembershipSchema } from "@/server/modules/memberships/schema";
import { requestFreezeMembership } from "@/server/modules/memberships/service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const input = requestFreezeMembershipSchema.parse(await req.json());
    const approvalRequest = await requestFreezeMembership(ctx, id, input);
    return NextResponse.json({ approvalRequest }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
