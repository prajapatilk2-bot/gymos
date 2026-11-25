import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { updateUserSchema } from "@/server/modules/users/schema";
import { getUserById, updateUser } from "@/server/modules/users/service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const user = await getUserById(ctx, id);
    if (!user)
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    return NextResponse.json({ user });
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
    const input = updateUserSchema.parse(await req.json());
    const user = await updateUser(ctx, id, input);
    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
