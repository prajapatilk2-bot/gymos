import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { recordMemberConsentSchema } from "@/server/modules/members/schema";
import {
  listMemberConsents,
  recordMemberConsent,
} from "@/server/modules/members/service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const consents = await listMemberConsents(ctx, id);
    return NextResponse.json({ consents });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const input = recordMemberConsentSchema.parse(await req.json());
    const consent = await recordMemberConsent(ctx, id, input);
    return NextResponse.json({ consent }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
