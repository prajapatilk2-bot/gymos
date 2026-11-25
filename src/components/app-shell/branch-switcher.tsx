"use client";

import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface BranchOption {
  id: string;
  name: string;
}

export function BranchSwitcher({
  branches,
  currentBranchId,
}: {
  branches: BranchOption[];
  currentBranchId: string | null;
}) {
  const router = useRouter();

  if (branches.length === 0) return null;

  if (branches.length === 1) {
    return (
      <div className="text-muted-foreground hidden items-center gap-2 rounded-md border px-3 py-1.5 text-sm sm:flex">
        <Building2 className="size-4" />
        {branches[0].name}
      </div>
    );
  }

  async function onChange(branchId: string) {
    await fetch("/api/v1/me/current-branch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branchId }),
    });
    router.refresh();
  }

  return (
    <Select
      defaultValue={currentBranchId ?? branches[0].id}
      onValueChange={onChange}
    >
      <SelectTrigger className="w-[180px]">
        <Building2 className="size-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {branches.map((branch) => (
          <SelectItem key={branch.id} value={branch.id}>
            {branch.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
