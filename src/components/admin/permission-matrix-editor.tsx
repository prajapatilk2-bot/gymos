"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MODULES } from "@/server/modules/registry";
import {
  PERMISSION_ACTIONS,
  SENSITIVE_CATEGORIES,
} from "@/server/modules/permissions/registry";

export function PermissionMatrixEditor({
  selectedKeys,
  onChange,
}: {
  selectedKeys: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  function toggle(key: string, checked: boolean) {
    const next = new Set(selectedKeys);
    if (checked) next.add(key);
    else next.delete(key);
    onChange(next);
  }

  function toggleRow(moduleSlug: string, checked: boolean) {
    const next = new Set(selectedKeys);
    for (const action of PERMISSION_ACTIONS) {
      const key = `${moduleSlug}.${action}`;
      if (checked) next.add(key);
      else next.delete(key);
    }
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[220px]">Module</TableHead>
              {PERMISSION_ACTIONS.map((action) => (
                <TableHead key={action} className="text-center capitalize">
                  {action}
                </TableHead>
              ))}
              <TableHead className="text-center">All</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MODULES.map((moduleDef) => {
              const rowKeys = PERMISSION_ACTIONS.map(
                (a) => `${moduleDef.slug}.${a}`,
              );
              const allChecked = rowKeys.every((k) => selectedKeys.has(k));
              return (
                <TableRow key={moduleDef.id}>
                  <TableCell className="font-medium">
                    <span className="bg-muted mr-2 inline-flex size-5 items-center justify-center rounded text-[10px] font-semibold">
                      {moduleDef.id}
                    </span>
                    {moduleDef.name}
                  </TableCell>
                  {PERMISSION_ACTIONS.map((action) => {
                    const key = `${moduleDef.slug}.${action}`;
                    return (
                      <TableCell key={action} className="text-center">
                        <Checkbox
                          checked={selectedKeys.has(key)}
                          onCheckedChange={(checked) =>
                            toggle(key, checked === true)
                          }
                        />
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center">
                    <Checkbox
                      checked={allChecked}
                      onCheckedChange={(checked) =>
                        toggleRow(moduleDef.slug, checked === true)
                      }
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-lg border p-4">
        <p className="mb-3 text-sm font-medium">Sensitive data access</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {SENSITIVE_CATEGORIES.map((category) => (
            <div
              key={category}
              className="flex flex-col gap-2 rounded-md border p-3"
            >
              <p className="text-sm font-medium capitalize">{category}</p>
              {(["view", "edit"] as const).map((action) => {
                const key = `sensitive.${category}.${action}`;
                return (
                  <label
                    key={action}
                    className="flex items-center gap-2 text-sm capitalize"
                  >
                    <Checkbox
                      checked={selectedKeys.has(key)}
                      onCheckedChange={(checked) =>
                        toggle(key, checked === true)
                      }
                    />
                    {action}
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
