"use client";

import { useEffect, useState } from "react";
import { ChevronsLeft, ChevronsRight, Dumbbell } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import type { ModuleDefinition } from "@/server/modules/registry";

const STORAGE_KEY = "gymos.sidebar.collapsed";

export function Sidebar({ modules }: { modules: ModuleDefinition[] }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // ignore (private mode / blocked storage)
    }
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground hidden shrink-0 flex-col border-r transition-[width] duration-200 md:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-md">
          <Dumbbell className="size-4" />
        </div>
        {!collapsed && <span className="truncate font-semibold">GymOS</span>}
      </div>
      <div className="flex-1 overflow-y-auto">
        <SidebarNav modules={modules} collapsed={collapsed} />
      </div>
      <div className="border-t p-2">
        <Button variant="ghost" size="icon" className="w-full" onClick={toggle}>
          {collapsed ? (
            <ChevronsRight className="size-4" />
          ) : (
            <ChevronsLeft className="size-4" />
          )}
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>
    </aside>
  );
}
