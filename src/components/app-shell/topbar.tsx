import { MobileSidebar } from "@/components/app-shell/mobile-sidebar";
import {
  BranchSwitcher,
  type BranchOption,
} from "@/components/app-shell/branch-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/app-shell/user-menu";
import type { ModuleDefinition } from "@/server/modules/registry";

export function Topbar({
  modules,
  branches,
  currentBranchId,
}: {
  modules: ModuleDefinition[];
  branches: BranchOption[];
  currentBranchId: string | null;
}) {
  return (
    <header className="bg-background flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <MobileSidebar modules={modules} />
      <div className="flex-1" />
      <BranchSwitcher branches={branches} currentBranchId={currentBranchId} />
      <ThemeToggle />
      <UserMenu />
    </header>
  );
}
