import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiContext, handleApiError } from "@/server/http";
import { setPackageStatus } from "@/server/modules/memberships/packages.service";

const bodySchema = z.object({ status: z.enum(["active", "inactive"]) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const { status } = bodySchema.parse(await req.json());
    const pkg = await setPackageStatus(ctx, id, status);
    return NextResponse.json({ package: pkg });
  } catch (error) {
    return handleApiError(error);
  }
}
