import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { markGuestPassUsed } from "@/server/modules/members/guest-passes.service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const guestPass = await markGuestPassUsed(ctx, id);
    return NextResponse.json({ guestPass });
  } catch (error) {
    return handleApiError(error);
  }
}
