import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { changePackageMembershipSchema } from "@/server/modules/memberships/schema";
import { upgradeMembership } from "@/server/modules/memberships/service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const input = changePackageMembershipSchema.parse(await req.json());
    const membership = await upgradeMembership(ctx, id, input);
    return NextResponse.json({ membership }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
