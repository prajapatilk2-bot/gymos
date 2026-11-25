import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { PermissionError } from "@/server/modules/permissions/service";
import { ScopeError } from "@/server/modules/permissions/scope";
import { ApprovalError } from "@/server/modules/approvals/service";
import { getSessionContext, type RequestContext } from "@/server/auth/session";

export class UnauthenticatedError extends Error {
  constructor() {
    super("You must be signed in.");
    this.name = "UnauthenticatedError";
  }
}

export async function requireApiContext(): Promise<RequestContext> {
  const ctx = await getSessionContext();
  if (!ctx) throw new UnauthenticatedError();
  return ctx;
}

/** Normalizes every thrown error from a route handler into a JSON response. */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof UnauthenticatedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof PermissionError || error instanceof ScopeError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid request.", issues: error.issues },
      { status: 400 },
    );
  }
  if (error instanceof ApprovalError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
}
