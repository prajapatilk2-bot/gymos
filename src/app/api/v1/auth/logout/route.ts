import { auth } from "@/server/auth/auth";
import { getSessionContext } from "@/server/auth/session";
import { writeAuditLog } from "@/server/modules/audit/service";

export async function POST(req: Request) {
  const ctx = await getSessionContext();

  const response = await auth.api.signOut({
    headers: req.headers,
    asResponse: true,
  });

  if (ctx) {
    await writeAuditLog(ctx, {
      action: "logout",
      entityType: "Session",
      entityId: ctx.sessionId,
    });
  }

  return response;
}
