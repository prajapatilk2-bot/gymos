import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { resetPasswordSchema } from "@/server/modules/users/schema";
import { resetUserPassword } from "@/server/modules/users/service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const input = resetPasswordSchema.parse(await req.json());
    await resetUserPassword(ctx, id, input, req.headers);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
