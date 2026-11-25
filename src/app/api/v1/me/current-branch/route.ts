import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiContext, handleApiError } from "@/server/http";
import { assertBranchAccess } from "@/server/modules/permissions/scope";

const bodySchema = z.object({ branchId: z.string() });

export const CURRENT_BRANCH_COOKIE = "gymos_branch_id";

export async function POST(req: Request) {
  try {
    const ctx = await requireApiContext();
    const { branchId } = bodySchema.parse(await req.json());
    await assertBranchAccess(ctx, branchId);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(CURRENT_BRANCH_COOKIE, branchId, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
