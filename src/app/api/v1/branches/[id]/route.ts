import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { updateBranchSchema } from "@/server/modules/branches/schema";
import { updateBranch } from "@/server/modules/branches/service";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const input = updateBranchSchema.parse(await req.json());
    const branch = await updateBranch(ctx, id, input);
    return NextResponse.json({ branch });
  } catch (error) {
    return handleApiError(error);
  }
}
