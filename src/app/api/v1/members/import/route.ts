import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { importMembersSchema } from "@/server/modules/members/schema";
import { importMembersCsv } from "@/server/modules/members/service";

export async function POST(req: Request) {
  try {
    const ctx = await requireApiContext();
    const input = importMembersSchema.parse(await req.json());
    const results = await importMembersCsv(ctx, input);
    return NextResponse.json({ results });
  } catch (error) {
    return handleApiError(error);
  }
}
