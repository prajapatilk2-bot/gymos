import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { updateRolePermissionsSchema } from "@/server/modules/roles/schema";
import { updateRolePermissions } from "@/server/modules/roles/service";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const input = updateRolePermissionsSchema.parse(await req.json());
    await updateRolePermissions(ctx, id, input);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
