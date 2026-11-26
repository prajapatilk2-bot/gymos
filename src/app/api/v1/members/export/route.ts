import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { exportMembersQuerySchema } from "@/server/modules/members/schema";
import { exportMembersCsv } from "@/server/modules/members/service";

export async function GET(req: Request) {
  try {
    const ctx = await requireApiContext();
    const query = exportMembersQuerySchema.parse(
      Object.fromEntries(new URL(req.url).searchParams),
    );
    const csv = await exportMembersCsv(ctx, query);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="members.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
