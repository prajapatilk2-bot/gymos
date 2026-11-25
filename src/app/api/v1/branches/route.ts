import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { createBranchSchema } from "@/server/modules/branches/schema";
import { createBranch, listBranches } from "@/server/modules/branches/service";

export async function GET() {
  try {
    const ctx = await requireApiContext();
    const branches = await listBranches(ctx);
    return NextResponse.json({ branches });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireApiContext();
    const input = createBranchSchema.parse(await req.json());
    const branch = await createBranch(ctx, input);
    return NextResponse.json({ branch }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
