import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { updatePackageSchema } from "@/server/modules/memberships/packages.schema";
import {
  deletePackage,
  getPackageById,
  updatePackage,
} from "@/server/modules/memberships/packages.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const pkg = await getPackageById(ctx, id);
    return NextResponse.json({ package: pkg });
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
    const input = updatePackageSchema.parse(await req.json());
    const pkg = await updatePackage(ctx, id, input);
    return NextResponse.json({ package: pkg });
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
    await deletePackage(ctx, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
