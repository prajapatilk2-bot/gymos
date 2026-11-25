import { notFound } from "next/navigation";

import { getModuleBySlug } from "@/server/modules/registry";
import { getSessionContext } from "@/server/auth/session";
import { hasPermission } from "@/server/modules/permissions/service";
import { ModulePlaceholder } from "@/components/module-placeholder";
import { AccessDenied } from "@/components/access-denied";

export default async function ModulePage({
  params,
}: {
  params: Promise<{ moduleSlug: string }>;
}) {
  const { moduleSlug } = await params;
  const moduleDef = getModuleBySlug(moduleSlug);
  if (!moduleDef) notFound();

  const ctx = await getSessionContext();
  if (!ctx) notFound();

  const allowed = await hasPermission(ctx, `${moduleDef.slug}.view`);
  if (!allowed) return <AccessDenied />;

  return <ModulePlaceholder module={moduleDef} />;
}
