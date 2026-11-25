import { headers as nextHeaders } from "next/headers";

import { auth } from "@/server/auth/auth";
import { prisma } from "@/server/db/prisma";

export type RequestContext = {
  userId: string;
  organizationId: string;
  sessionId: string;
  ipAddress: string | null;
  userAgent: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    organizationId: string;
    isActive: boolean;
    mustChangePassword: boolean;
    employeeCode: string | null;
    phone: string | null;
  };
};

const DEFAULT_INACTIVITY_TIMEOUT_MINUTES = 30;

async function getInactivityTimeoutMinutes(
  organizationId: string,
): Promise<number> {
  const setting = await prisma.organizationSetting.findUnique({
    where: {
      organizationId_key: {
        organizationId,
        key: "session.inactivityTimeoutMinutes",
      },
    },
  });

  if (setting && typeof setting.value === "number") {
    return setting.value;
  }

  const envValue = Number(process.env.SESSION_INACTIVITY_TIMEOUT_MINUTES);
  return Number.isFinite(envValue) && envValue > 0
    ? envValue
    : DEFAULT_INACTIVITY_TIMEOUT_MINUTES;
}

/**
 * Resolves the current request's authenticated staff context, enforcing:
 * - the user must still be active (not deactivated / soft-deleted)
 * - the session must not have been idle longer than the organization's
 *   configurable inactivity timeout (W3 "automatic logout after inactivity")
 *
 * Returns null when there is no valid, active session — callers (page
 * layouts, API routes) decide how to respond (redirect, 401, ...).
 */
export async function getSessionContext(): Promise<RequestContext | null> {
  const headerList = await nextHeaders();
  const result = await auth.api.getSession({ headers: headerList });

  if (!result?.session || !result.user) {
    return null;
  }

  const user = result.user as typeof result.user & {
    organizationId: string;
    isActive: boolean;
    mustChangePassword: boolean;
    employeeCode: string | null;
    phone: string | null;
  };

  if (!user.isActive) {
    await auth.api.revokeSession({
      headers: headerList,
      body: { token: result.session.token },
    });
    return null;
  }

  const idleMinutes =
    (Date.now() - new Date(result.session.updatedAt).getTime()) / 60_000;
  const timeoutMinutes = await getInactivityTimeoutMinutes(user.organizationId);

  if (idleMinutes > timeoutMinutes) {
    await auth.api.revokeSession({
      headers: headerList,
      body: { token: result.session.token },
    });
    return null;
  }

  return {
    userId: user.id,
    organizationId: user.organizationId,
    sessionId: result.session.id,
    ipAddress: result.session.ipAddress ?? null,
    userAgent: result.session.userAgent ?? null,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      organizationId: user.organizationId,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
      employeeCode: user.employeeCode ?? null,
      phone: user.phone ?? null,
    },
  };
}

/** Like getSessionContext, but throws a plain Error when unauthenticated. */
export async function requireSessionContext(): Promise<RequestContext> {
  const ctx = await getSessionContext();
  if (!ctx) {
    throw new Error("UNAUTHENTICATED");
  }
  return ctx;
}

export function getRequestMeta(req: Request) {
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent");
  return { ipAddress, userAgent };
}
