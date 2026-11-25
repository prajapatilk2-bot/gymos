import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { updateOrganizationProfileSchema } from "@/server/modules/organization-settings/schema";
import {
  getOrganizationProfile,
  updateOrganizationProfile,
} from "@/server/modules/organization-settings/service";

export async function GET() {
  try {
    const ctx = await requireApiContext();
    const organization = await getOrganizationProfile(ctx);
    return NextResponse.json({ organization });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const ctx = await requireApiContext();
    const input = updateOrganizationProfileSchema.parse(await req.json());
    const organization = await updateOrganizationProfile(ctx, input);
    return NextResponse.json({ organization });
  } catch (error) {
    return handleApiError(error);
  }
}
