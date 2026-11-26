import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { checkDuplicateMemberSchema } from "@/server/modules/members/schema";
import { findPotentialDuplicateMembers } from "@/server/modules/members/service";

export async function GET(req: Request) {
  try {
    const ctx = await requireApiContext();
    const query = checkDuplicateMemberSchema.parse(
      Object.fromEntries(new URL(req.url).searchParams),
    );
    const matches = await findPotentialDuplicateMembers(ctx, query);
    return NextResponse.json({ matches });
  } catch (error) {
    return handleApiError(error);
  }
}
