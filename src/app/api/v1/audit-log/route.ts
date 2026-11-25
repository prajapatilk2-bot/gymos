import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { auditLogFilterSchema } from "@/server/modules/audit/schema";
import { listAuditLogs } from "@/server/modules/audit/service";
import { requirePermission } from "@/server/modules/permissions/service";

export async function GET(req: Request) {
  try {
    const ctx = await requireApiContext();
    await requirePermission(ctx, "admin.view");
    const filter = auditLogFilterSchema.parse(
      Object.fromEntries(new URL(req.url).searchParams),
    );
    const result = await listAuditLogs(ctx, filter);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
