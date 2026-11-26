import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import {
  createMembershipSchema,
  listMembershipsQuerySchema,
} from "@/server/modules/memberships/schema";
import {
  createMembership,
  listMemberships,
} from "@/server/modules/memberships/service";

export async function GET(req: Request) {
  try {
    const ctx = await requireApiContext();
    const query = listMembershipsQuerySchema.parse(
      Object.fromEntries(new URL(req.url).searchParams),
    );
    const result = await listMemberships(ctx, query);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireApiContext();
    const input = createMembershipSchema.parse(await req.json());
    const membership = await createMembership(ctx, input);
    return NextResponse.json({ membership }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
