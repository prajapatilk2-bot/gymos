import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import {
  createGuestPassSchema,
  listGuestPassesQuerySchema,
} from "@/server/modules/members/guest-passes.schema";
import {
  createGuestPass,
  listGuestPasses,
} from "@/server/modules/members/guest-passes.service";

export async function GET(req: Request) {
  try {
    const ctx = await requireApiContext();
    const query = listGuestPassesQuerySchema.parse(
      Object.fromEntries(new URL(req.url).searchParams),
    );
    const result = await listGuestPasses(ctx, query);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireApiContext();
    const input = createGuestPassSchema.parse(await req.json());
    const guestPass = await createGuestPass(ctx, input);
    return NextResponse.json({ guestPass }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
