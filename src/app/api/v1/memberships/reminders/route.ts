import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { listMembershipRemindersQuerySchema } from "@/server/modules/memberships/schema";
import { listMembershipsNeedingReminder } from "@/server/modules/memberships/service";

// Read-only — see listMembershipsNeedingReminder's doc comment. No reminder
// is actually sent by this endpoint; Module V (Phase 2) will call it.
export async function GET(req: Request) {
  try {
    const ctx = await requireApiContext();
    const query = listMembershipRemindersQuerySchema.parse(
      Object.fromEntries(new URL(req.url).searchParams),
    );
    const memberships = await listMembershipsNeedingReminder(ctx, query);
    return NextResponse.json({ memberships });
  } catch (error) {
    return handleApiError(error);
  }
}
