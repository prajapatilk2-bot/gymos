import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import {
  createVisitorSchema,
  listVisitorsQuerySchema,
} from "@/server/modules/members/visitors.schema";
import {
  createVisitor,
  listVisitors,
} from "@/server/modules/members/visitors.service";

export async function GET(req: Request) {
  try {
    const ctx = await requireApiContext();
    const query = listVisitorsQuerySchema.parse(
      Object.fromEntries(new URL(req.url).searchParams),
    );
    const result = await listVisitors(ctx, query);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireApiContext();
    const input = createVisitorSchema.parse(await req.json());
    const visitor = await createVisitor(ctx, input);
    return NextResponse.json({ visitor }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
