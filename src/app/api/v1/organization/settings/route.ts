import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { setOrganizationSettingSchema } from "@/server/modules/organization-settings/schema";
import {
  listOrganizationSettings,
  setOrganizationSetting,
} from "@/server/modules/organization-settings/service";

export async function GET() {
  try {
    const ctx = await requireApiContext();
    const settings = await listOrganizationSettings(ctx);
    return NextResponse.json({ settings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request) {
  try {
    const ctx = await requireApiContext();
    const input = setOrganizationSettingSchema.parse(await req.json());
    const setting = await setOrganizationSetting(ctx, input);
    return NextResponse.json({ setting });
  } catch (error) {
    return handleApiError(error);
  }
}
