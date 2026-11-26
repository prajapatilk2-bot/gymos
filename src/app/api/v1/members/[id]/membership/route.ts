import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { getCurrentMembershipForMember } from "@/server/modules/memberships/service";

// Member-scoped convenience read for the member detail page's Membership
// tab — the actual Membership CRUD/lifecycle lives under /api/v1/memberships.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const membership = await getCurrentMembershipForMember(ctx, id);
    return NextResponse.json({ membership });
  } catch (error) {
    return handleApiError(error);
  }
}
