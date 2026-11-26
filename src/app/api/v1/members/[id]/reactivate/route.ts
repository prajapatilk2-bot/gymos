import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { setMemberActive } from "@/server/modules/members/service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const member = await setMemberActive(ctx, id, true);
    return NextResponse.json({ member });
  } catch (error) {
    return handleApiError(error);
  }
}
