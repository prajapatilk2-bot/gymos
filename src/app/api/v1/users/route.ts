import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import {
  createUserSchema,
  listUsersQuerySchema,
} from "@/server/modules/users/schema";
import { createUser, listUsers } from "@/server/modules/users/service";

export async function GET(req: Request) {
  try {
    const ctx = await requireApiContext();
    const query = listUsersQuerySchema.parse(
      Object.fromEntries(new URL(req.url).searchParams),
    );
    const result = await listUsers(ctx, query);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireApiContext();
    const input = createUserSchema.parse(await req.json());
    const user = await createUser(ctx, input, req.headers);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
