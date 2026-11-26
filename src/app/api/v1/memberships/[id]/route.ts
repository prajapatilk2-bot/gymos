import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { getMembershipById } from "@/server/modules/memberships/service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const membership = await getMembershipById(ctx, id);
    return NextResponse.json({ membership });
  } catch (error) {
    return handleApiError(error);
  }
}
