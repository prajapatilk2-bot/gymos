import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { requestMemberDataExport } from "@/server/modules/members/service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const data = await requestMemberDataExport(ctx, id);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
