import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import {
  createPackageSchema,
  listPackagesQuerySchema,
} from "@/server/modules/memberships/packages.schema";
import {
  createPackage,
  listPackages,
} from "@/server/modules/memberships/packages.service";

export async function GET(req: Request) {
  try {
    const ctx = await requireApiContext();
    const query = listPackagesQuerySchema.parse(
      Object.fromEntries(new URL(req.url).searchParams),
    );
    const packages = await listPackages(ctx, query);
    return NextResponse.json({ packages });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireApiContext();
    const input = createPackageSchema.parse(await req.json());
    const pkg = await createPackage(ctx, input);
    return NextResponse.json({ package: pkg }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
