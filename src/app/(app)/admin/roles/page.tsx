"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Settings2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PermissionMatrixEditor } from "@/components/admin/permission-matrix-editor";

interface RoleRow {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  rolePermissions: { permission: { key: string } }[];
  _count: { userRoles: number };
}

export default function RolesAdminPage() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/roles");
      const body = await res.json();
      if (res.ok) setRoles(body.roles);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function deleteRole(role: RoleRow) {
    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/v1/roles/${role.id}`, { method: "DELETE" });
    const body = await res.json();
    if (!res.ok) {
      toast.error(body.error ?? "Could not delete role.");
      return;
    }
    toast.success("Role deleted.");
    load();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{roles.length} role(s)</p>
        <CreateRoleDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={load}
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Users</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground py-8 text-center"
                >
                  <Loader2 className="mx-auto size-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    {role.name}
                    {role.isSystem ? (
                      <Badge variant="outline" className="ml-2">
                        System
                      </Badge>
                    ) : null}
                    {role.description ? (
                      <p className="text-muted-foreground text-xs">
                        {role.description}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {role.key}
                  </TableCell>
                  <TableCell>{role.rolePermissions.length}</TableCell>
                  <TableCell>{role._count.userRoles}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingRole(role)}
                      >
                        <Settings2 className="size-4" />
                      </Button>
                      {!role.isSystem ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteRole(role)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editingRole ? (
        <EditPermissionsDialog
          role={editingRole}
          open={Boolean(editingRole)}
          onOpenChange={(open) => !open && setEditingRole(null)}
          onSaved={load}
        />
      ) : null}
    </div>
  );
}

function CreateRoleDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissionKeys, setPermissionKeys] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          name,
          description,
          permissionKeys: Array.from(permissionKeys),
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not create role.");
        return;
      }
      toast.success("Role created.");
      onOpenChange(false);
      setKey("");
      setName("");
      setDescription("");
      setPermissionKeys(new Set());
      onCreated();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Create role
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create custom role</DialogTitle>
          <DialogDescription>
            Pick exactly the modules and actions this role needs.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="key">Key (slug)</Label>
              <Input
                id="key"
                value={key}
                onChange={(e) => setKey(e.target.value.toLowerCase())}
                placeholder="front_desk_lead"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Display name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <PermissionMatrixEditor
            selectedKeys={permissionKeys}
            onChange={setPermissionKeys}
          />

          {error ? <p className="text-destructive text-sm">{error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Create role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditPermissionsDialog({
  role,
  open,
  onOpenChange,
  onSaved,
}: {
  role: RoleRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [permissionKeys, setPermissionKeys] = useState<Set<string>>(
    new Set(role.rolePermissions.map((rp) => rp.permission.key)),
  );
  const [submitting, setSubmitting] = useState(false);

  async function onSave() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/roles/${role.id}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionKeys: Array.from(permissionKeys) }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error ?? "Could not update permissions.");
        return;
      }
      toast.success("Permissions updated.");
      onOpenChange(false);
      onSaved();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Permissions — {role.name}</DialogTitle>
          <DialogDescription>
            {role.isSystem
              ? "This is a default system role. Changes apply to this organization only."
              : "Custom role."}
          </DialogDescription>
        </DialogHeader>
        <PermissionMatrixEditor
          selectedKeys={permissionKeys}
          onChange={setPermissionKeys}
        />
        <DialogFooter>
          <Button onClick={onSave} disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Save permissions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
