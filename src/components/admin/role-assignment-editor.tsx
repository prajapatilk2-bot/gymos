"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface RoleOption {
  id: string;
  name: string;
}
export interface BranchOption {
  id: string;
  name: string;
}
export interface RoleAssignmentDraft {
  roleId: string;
  branchId: string | null;
}

const ALL_BRANCHES = "__all__";

export function RoleAssignmentEditor({
  roles,
  branches,
  value,
  onChange,
}: {
  roles: RoleOption[];
  branches: BranchOption[];
  value: RoleAssignmentDraft[];
  onChange: (next: RoleAssignmentDraft[]) => void;
}) {
  function addRow() {
    if (roles.length === 0) return;
    onChange([...value, { roleId: roles[0].id, branchId: null }]);
  }

  function updateRow(index: number, patch: Partial<RoleAssignmentDraft>) {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeRow(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      {value.length === 0 ? (
        <p className="text-muted-foreground text-sm">No roles assigned yet.</p>
      ) : null}
      {value.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          <Select
            value={row.roleId}
            onValueChange={(roleId) => updateRow(index, { roleId })}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={row.branchId ?? ALL_BRANCHES}
            onValueChange={(branchId) =>
              updateRow(index, {
                branchId: branchId === ALL_BRANCHES ? null : branchId,
              })
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_BRANCHES}>All branches</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeRow(index)}
          >
            <Trash2 className="size-4" />
            <span className="sr-only">Remove</span>
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={addRow}
      >
        <Plus className="size-4" /> Add role assignment
      </Button>
    </div>
  );
}
