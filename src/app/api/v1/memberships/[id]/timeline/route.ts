import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { getMembershipTimeline } from "@/server/modules/memberships/service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const timeline = await getMembershipTimeline(ctx, id);
    return NextResponse.json({ timeline });
  } catch (error) {
    return handleApiError(error);
  }
}
