import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { updateRoleSchema } from "@/server/modules/roles/schema";
import {
  deleteRole,
  getRole,
  updateRole,
} from "@/server/modules/roles/service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const role = await getRole(ctx, id);
    if (!role)
      return NextResponse.json({ error: "Role not found." }, { status: 404 });
    return NextResponse.json({ role });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const input = updateRoleSchema.parse(await req.json());
    const role = await updateRole(ctx, id, input);
    return NextResponse.json({ role });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    await deleteRole(ctx, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
