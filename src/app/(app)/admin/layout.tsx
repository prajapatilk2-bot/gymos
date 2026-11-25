import { getSessionContext } from "@/server/auth/session";
import { hasPermission } from "@/server/modules/permissions/service";
import { AccessDenied } from "@/components/access-denied";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getSessionContext();
  if (!ctx) return null; // handled by (app) layout

  const allowed = await hasPermission(ctx, "admin.view");
  if (!allowed) return <AccessDenied />;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground text-sm">
          Users, roles &amp; permissions, organization settings and audit logs
          (W1-W4).
        </p>
      </div>
      <AdminNav />
      <div>{children}</div>
    </div>
  );
}
