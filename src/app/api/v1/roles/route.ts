import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { createRoleSchema } from "@/server/modules/roles/schema";
import { createRole, listRoles } from "@/server/modules/roles/service";

export async function GET() {
  try {
    const ctx = await requireApiContext();
    const roles = await listRoles(ctx);
    return NextResponse.json({ roles });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireApiContext();
    const input = createRoleSchema.parse(await req.json());
    const role = await createRole(ctx, input);
    return NextResponse.json({ role }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
