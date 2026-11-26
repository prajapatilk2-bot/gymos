import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { checkOutVisitor } from "@/server/modules/members/visitors.service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const visitor = await checkOutVisitor(ctx, id);
    return NextResponse.json({ visitor });
  } catch (error) {
    return handleApiError(error);
  }
}
