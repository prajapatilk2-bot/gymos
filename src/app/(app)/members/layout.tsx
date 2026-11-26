import { getSessionContext } from "@/server/auth/session";
import { hasPermission } from "@/server/modules/permissions/service";
import { AccessDenied } from "@/components/access-denied";

export default async function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getSessionContext();
  if (!ctx) return null; // handled by (app) layout

  const allowed = await hasPermission(ctx, "members.view");
  if (!allowed) return <AccessDenied />;

  return <div className="flex flex-col gap-6 p-4 md:p-6">{children}</div>;
}
