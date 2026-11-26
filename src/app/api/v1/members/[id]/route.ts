import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { updateMemberSchema } from "@/server/modules/members/schema";
import { getMemberById, updateMember } from "@/server/modules/members/service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const member = await getMemberById(ctx, id);
    if (!member) {
      return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }
    return NextResponse.json({ member });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const input = updateMemberSchema.parse(await req.json());
    const member = await updateMember(ctx, id, input);
    return NextResponse.json({ member });
  } catch (error) {
    return handleApiError(error);
  }
}
