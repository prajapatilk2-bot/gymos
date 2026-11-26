import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { memberHealthDeclarationSchema } from "@/server/modules/members/schema";
import {
  getMemberHealthDeclaration,
  upsertMemberHealthDeclaration,
} from "@/server/modules/members/service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const healthDeclaration = await getMemberHealthDeclaration(ctx, id);
    return NextResponse.json({ healthDeclaration });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const input = memberHealthDeclarationSchema.parse(await req.json());
    const healthDeclaration = await upsertMemberHealthDeclaration(
      ctx,
      id,
      input,
    );
    return NextResponse.json({ healthDeclaration });
  } catch (error) {
    return handleApiError(error);
  }
}
