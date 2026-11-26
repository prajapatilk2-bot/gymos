import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { convertGuestPassSchema } from "@/server/modules/members/guest-passes.schema";
import { convertGuestPassToMember } from "@/server/modules/members/guest-passes.service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const input = convertGuestPassSchema.parse(await req.json());
    const guestPass = await convertGuestPassToMember(ctx, id, input);
    return NextResponse.json({ guestPass });
  } catch (error) {
    return handleApiError(error);
  }
}
