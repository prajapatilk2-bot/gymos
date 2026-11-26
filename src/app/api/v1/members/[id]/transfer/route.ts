import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { transferMemberBranchSchema } from "@/server/modules/members/schema";
import { transferMemberBranch } from "@/server/modules/members/service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const input = transferMemberBranchSchema.parse(await req.json());
    const member = await transferMemberBranch(ctx, id, input);
    return NextResponse.json({ member });
  } catch (error) {
    return handleApiError(error);
  }
}
