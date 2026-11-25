import { MODULES, type ModuleDefinition } from "@/server/modules/registry";
import { getUserPermissionKeys } from "@/server/modules/permissions/service";
import type { RequestContext } from "@/server/auth/session";

/** Modules the user can see in the sidebar — anywhere in the organization. */
export async function getVisibleModules(
  ctx: RequestContext,
): Promise<ModuleDefinition[]> {
  const granted = await getUserPermissionKeys(ctx.userId, ctx.organizationId);
  return MODULES.filter((moduleDef) => granted.has(`${moduleDef.slug}.view`));
}
