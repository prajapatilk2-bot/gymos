"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import {
  MODULE_GROUP_LABELS,
  type ModuleDefinition,
  type ModuleGroup,
} from "@/server/modules/registry";

const GROUP_ORDER: ModuleGroup[] = [
  "operations",
  "fitness",
  "commercial",
  "engagement",
  "business",
  "platform",
];

function groupModules(
  modules: ModuleDefinition[],
): [ModuleGroup, ModuleDefinition[]][] {
  const map = new Map<ModuleGroup, ModuleDefinition[]>();
  for (const moduleDef of modules) {
    if (!map.has(moduleDef.group)) map.set(moduleDef.group, []);
    map.get(moduleDef.group)!.push(moduleDef);
  }
  return GROUP_ORDER.filter((group) => map.has(group)).map((group) => [
    group,
    map.get(group)!,
  ]);
}

export function SidebarNav({
  modules,
  collapsed,
  onNavigate,
}: {
  modules: ModuleDefinition[];
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const groups = groupModules(modules);

  return (
    <nav className="flex flex-col gap-4 px-2 py-4">
      {groups.map(([group, items]) => (
        <div key={group} className="flex flex-col gap-1">
          {!collapsed && (
            <p className="text-sidebar-foreground/50 px-2 pb-1 text-xs font-semibold tracking-wide uppercase">
              {MODULE_GROUP_LABELS[group]}
            </p>
          )}
          {items.map((moduleDef) => {
            const href = `/${moduleDef.slug}`;
            const isActive =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={moduleDef.id}
                href={href}
                onClick={onNavigate}
                title={collapsed ? moduleDef.name : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  collapsed && "justify-center px-0",
                )}
              >
                <span className="bg-sidebar-primary/10 text-sidebar-primary flex size-6 shrink-0 items-center justify-center rounded text-[11px] font-semibold">
                  {moduleDef.id}
                </span>
                {!collapsed && (
                  <span className="truncate">{moduleDef.name}</span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
