"use client";

import { useState } from "react";
import { Dumbbell, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import type { ModuleDefinition } from "@/server/modules/registry";

export function MobileSidebar({ modules }: { modules: ModuleDefinition[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="size-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 gap-0 p-0">
        <SheetHeader className="flex-row items-center gap-2 border-b p-4">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-md">
            <Dumbbell className="size-4" />
          </div>
          <SheetTitle>GymOS</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav modules={modules} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
