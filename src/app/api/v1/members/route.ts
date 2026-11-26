import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import {
  createMemberSchema,
  listMembersQuerySchema,
} from "@/server/modules/members/schema";
import {
  createMember,
  DuplicateMemberError,
  listMembers,
} from "@/server/modules/members/service";

export async function GET(req: Request) {
  try {
    const ctx = await requireApiContext();
    const query = listMembersQuerySchema.parse(
      Object.fromEntries(new URL(req.url).searchParams),
    );
    const result = await listMembers(ctx, query);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireApiContext();
    const input = createMemberSchema.parse(await req.json());
    const member = await createMember(ctx, input);
    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateMemberError) {
      return NextResponse.json(
        { error: error.message, matches: error.matches },
        { status: 409 },
      );
    }
    return handleApiError(error);
  }
}
