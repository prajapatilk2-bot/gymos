import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { withdrawMemberConsentSchema } from "@/server/modules/members/schema";
import { withdrawMemberConsent } from "@/server/modules/members/service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const input = withdrawMemberConsentSchema.parse(await req.json());
    const consent = await withdrawMemberConsent(ctx, id, input);
    return NextResponse.json({ consent });
  } catch (error) {
    return handleApiError(error);
  }
}
