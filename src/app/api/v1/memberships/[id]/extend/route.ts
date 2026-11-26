import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { extendMembershipSchema } from "@/server/modules/memberships/schema";
import { extendMembership } from "@/server/modules/memberships/service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const input = extendMembershipSchema.parse(await req.json());
    const membership = await extendMembership(ctx, id, input);
    return NextResponse.json({ membership });
  } catch (error) {
    return handleApiError(error);
  }
}
