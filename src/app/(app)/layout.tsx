import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { Sidebar } from "@/components/app-shell/sidebar";
import { Topbar } from "@/components/app-shell/topbar";
import { getSessionContext } from "@/server/auth/session";
import { getVisibleModules } from "@/server/modules/permissions/visible-modules";
import { listBranchesForCurrentUser } from "@/server/modules/branches/service";
import { CURRENT_BRANCH_COOKIE } from "@/app/api/v1/me/current-branch/route";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getSessionContext();
  if (!ctx) {
    redirect("/login");
  }

  const [modules, branches, cookieStore] = await Promise.all([
    getVisibleModules(ctx),
    listBranchesForCurrentUser(ctx),
    cookies(),
  ]);

  const cookieBranchId = cookieStore.get(CURRENT_BRANCH_COOKIE)?.value ?? null;
  const currentBranchId =
    branches.find((b) => b.id === cookieBranchId)?.id ??
    branches.find((b) => b.isDefault)?.id ??
    branches[0]?.id ??
    null;

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar modules={modules} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          modules={modules}
          branches={branches.map((b) => ({ id: b.id, name: b.name }))}
          currentBranchId={currentBranchId}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
