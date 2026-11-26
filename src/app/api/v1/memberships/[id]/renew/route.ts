import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { renewMembershipSchema } from "@/server/modules/memberships/schema";
import { renewMembership } from "@/server/modules/memberships/service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const input = renewMembershipSchema.parse(
      await req.json().catch(() => ({})),
    );
    const membership = await renewMembership(ctx, id, input);
    return NextResponse.json({ membership }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
