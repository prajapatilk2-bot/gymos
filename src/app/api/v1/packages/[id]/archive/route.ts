import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { archivePackage } from "@/server/modules/memberships/packages.service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const pkg = await archivePackage(ctx, id);
    return NextResponse.json({ package: pkg });
  } catch (error) {
    return handleApiError(error);
  }
}
