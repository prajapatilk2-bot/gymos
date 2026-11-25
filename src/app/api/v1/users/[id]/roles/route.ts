import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { setUserRolesSchema } from "@/server/modules/users/schema";
import { setUserRoles } from "@/server/modules/users/service";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const input = setUserRolesSchema.parse(await req.json());
    await setUserRoles(ctx, id, input);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
