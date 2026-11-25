import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiContext, handleApiError } from "@/server/http";
import { setUserActive } from "@/server/modules/users/service";

const bodySchema = z.object({ isActive: z.boolean() });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const { isActive } = bodySchema.parse(await req.json());
    const user = await setUserActive(ctx, id, isActive);
    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
