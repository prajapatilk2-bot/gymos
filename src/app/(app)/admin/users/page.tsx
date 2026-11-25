"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  KeyRound,
  Loader2,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  UserX,
  UserCheck,
} from "lucide-react";

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RoleAssignmentEditor,
  type BranchOption,
  type RoleAssignmentDraft,
  type RoleOption,
} from "@/components/admin/role-assignment-editor";

interface UserRow {
  id: string;
  name: string;
  email: string;
  employeeCode: string | null;
  phone: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  userRoles: {
    id: string;
    branchId: string | null;
    branch: { id: string; name: string } | null;
    role: { id: string; key: string; name: string };
  }[];
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes, branchesRes] = await Promise.all([
        fetch("/api/v1/users"),
        fetch("/api/v1/roles"),
        fetch("/api/v1/branches"),
      ]);
      const usersBody = await usersRes.json();
      const rolesBody = await rolesRes.json();
      const branchesBody = await branchesRes.json();
      if (usersRes.ok) setUsers(usersBody.items);
      if (rolesRes.ok)
        setRoles(
          rolesBody.roles.map((r: { id: string; name: string }) => ({
            id: r.id,
            name: r.name,
          })),
        );
      if (branchesRes.ok)
        setBranches(
          branchesBody.branches.map((b: { id: string; name: string }) => ({
            id: b.id,
            name: b.name,
          })),
        );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(user: UserRow) {
    const res = await fetch(`/api/v1/users/${user.id}/active`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    const body = await res.json();
    if (!res.ok) {
      toast.error(body.error ?? "Could not update user.");
      return;
    }
    toast.success(user.isActive ? "User deactivated." : "User reactivated.");
    load();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{users.length} user(s)</p>
        <CreateUserDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          roles={roles}
          branches={branches}
          onCreated={load}
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last login</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-8 text-center"
                >
                  <Loader2 className="mx-auto size-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-8 text-center"
                >
                  No users yet.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <UserRowItem
                  key={user.id}
                  user={user}
                  roles={roles}
                  branches={branches}
                  onToggleActive={() => toggleActive(user)}
                  onChanged={load}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function UserRowItem({
  user,
  roles,
  branches,
  onToggleActive,
  onChanged,
}: {
  user: UserRow;
  roles: RoleOption[];
  branches: BranchOption[];
  onToggleActive: () => void;
  onChanged: () => void;
}) {
  const [resetOpen, setResetOpen] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);

  return (
    <TableRow>
      <TableCell className="font-medium">
        {user.name}
        {user.employeeCode ? (
          <span className="text-muted-foreground ml-2 text-xs">
            #{user.employeeCode}
          </span>
        ) : null}
      </TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {user.userRoles.length === 0 ? (
            <span className="text-muted-foreground text-xs">No roles</span>
          ) : (
            user.userRoles.map((ur) => (
              <Badge key={ur.id} variant="secondary">
                {ur.role.name}
                {ur.branch ? ` · ${ur.branch.name}` : ""}
              </Badge>
            ))
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={user.isActive ? "success" : "outline"}>
          {user.isActive ? "Active" : "Deactivated"}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {user.lastLoginAt
          ? new Date(user.lastLoginAt).toLocaleString()
          : "Never"}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setRolesOpen(true)}>
              <ShieldCheck className="size-4" /> Manage roles
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setResetOpen(true)}>
              <KeyRound className="size-4" /> Reset password
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onToggleActive}
              variant={user.isActive ? "destructive" : "default"}
            >
              {user.isActive ? (
                <UserX className="size-4" />
              ) : (
                <UserCheck className="size-4" />
              )}
              {user.isActive ? "Deactivate" : "Reactivate"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ResetPasswordDialog
          userId={user.id}
          open={resetOpen}
          onOpenChange={setResetOpen}
        />
        <ManageRolesDialog
          userId={user.id}
          roles={roles}
          branches={branches}
          initial={user.userRoles.map((ur) => ({
            roleId: ur.role.id,
            branchId: ur.branchId,
          }))}
          open={rolesOpen}
          onOpenChange={setRolesOpen}
          onSaved={onChanged}
        />
      </TableCell>
    </TableRow>
  );
}

function CreateUserDialog({
  open,
  onOpenChange,
  roles,
  branches,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: RoleOption[];
  branches: BranchOption[];
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [phone, setPhone] = useState("");
  const [assignments, setAssignments] = useState<RoleAssignmentDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          employeeCode: employeeCode || undefined,
          phone: phone || undefined,
          roleAssignments: assignments,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not create user.");
        return;
      }
      toast.success("User created.");
      onOpenChange(false);
      setName("");
      setEmail("");
      setPassword("");
      setEmployeeCode("");
      setPhone("");
      setAssignments([]);
      onCreated();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Add user
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add staff user</DialogTitle>
          <DialogDescription>
            Creates a staff login. They will be asked to change their password
            on first sign-in.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="password">Temporary password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-muted-foreground text-xs">
                At least 10 characters, with uppercase, lowercase, a digit and a
                symbol.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="employeeCode">Employee code</Label>
              <Input
                id="employeeCode"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Roles</Label>
            <RoleAssignmentEditor
              roles={roles}
              branches={branches}
              value={assignments}
              onChange={setAssignments}
            />
          </div>

          {error ? <p className="text-destructive text-sm">{error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Create user
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({
  userId,
  open,
  onOpenChange,
}: {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/users/${userId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not reset password.");
        return;
      }
      toast.success("Password reset.");
      setNewPassword("");
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            The user must change this password on next sign-in.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Reset password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ManageRolesDialog({
  userId,
  roles,
  branches,
  initial,
  open,
  onOpenChange,
  onSaved,
}: {
  userId: string;
  roles: RoleOption[];
  branches: BranchOption[];
  initial: RoleAssignmentDraft[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [assignments, setAssignments] =
    useState<RoleAssignmentDraft[]>(initial);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setAssignments(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function onSave() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/users/${userId}/roles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleAssignments: assignments }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error ?? "Could not update roles.");
        return;
      }
      toast.success("Roles updated.");
      onOpenChange(false);
      onSaved();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage roles</DialogTitle>
          <DialogDescription>
            Assign one or more roles, each organization-wide or scoped to one
            branch.
          </DialogDescription>
        </DialogHeader>
        <RoleAssignmentEditor
          roles={roles}
          branches={branches}
          value={assignments}
          onChange={setAssignments}
        />
        <DialogFooter>
          <Button onClick={onSave} disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Save roles
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
