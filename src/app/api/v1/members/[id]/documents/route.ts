import { NextResponse } from "next/server";

import { requireApiContext, handleApiError } from "@/server/http";
import { addMemberDocumentSchema } from "@/server/modules/members/schema";
import {
  addMemberDocument,
  listMemberDocuments,
} from "@/server/modules/members/service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const documents = await listMemberDocuments(ctx, id);
    return NextResponse.json({ documents });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiContext();
    const { id } = await params;
    const input = addMemberDocumentSchema.parse(await req.json());
    const document = await addMemberDocument(ctx, id, input);
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
