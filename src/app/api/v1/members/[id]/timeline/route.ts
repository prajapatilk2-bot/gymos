import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { getMemberTimeline } from "@/server/modules/members/service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const timeline = await getMemberTimeline(ctx, id);
    return NextResponse.json({ timeline });
  } catch (error) {
    return handleApiError(error);
  }
}
