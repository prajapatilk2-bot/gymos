import { NextResponse } from "next/server";

import { auth } from "@/server/auth/auth";
import { prisma } from "@/server/db/prisma";
import { getRequestMeta } from "@/server/auth/session";
import { loginSchema } from "@/server/modules/auth/schema";

/**
 * Custom login endpoint (wraps Better Auth's sign-in-email) so that every
 * attempt — successful or not — is recorded in LoginHistory (W3), and so
 * deactivated users are rejected before a password is even checked.
 */
export async function POST(req: Request) {
  const { ipAddress, userAgent } = getRequestMeta(req);
  const json = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email and password." },
      { status: 400 },
    );
  }
  const { email, password } = parsed.data;

  const recordAttempt = (
    success: boolean,
    reason?: string,
    userId?: string,
    organizationId?: string,
  ) =>
    prisma.loginHistory.create({
      data: {
        email,
        success,
        reason,
        ipAddress,
        userAgent,
        userId,
        organizationId,
      },
    });

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    await recordAttempt(false, "unknown_email");
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  if (!user.isActive || user.deletedAt) {
    await recordAttempt(false, "user_inactive", user.id, user.organizationId);
    return NextResponse.json(
      {
        error: "This account has been deactivated. Contact your administrator.",
      },
      { status: 403 },
    );
  }

  try {
    const response = await auth.api.signInEmail({
      body: { email, password },
      headers: req.headers,
      asResponse: true,
    });

    if (!response.ok) {
      await recordAttempt(
        false,
        "invalid_password",
        user.id,
        user.organizationId,
      );
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    await Promise.all([
      recordAttempt(true, undefined, user.id, user.organizationId),
      prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
    ]);

    return response;
  } catch {
    await recordAttempt(
      false,
      "invalid_password",
      user.id,
      user.organizationId,
    );
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }
}
