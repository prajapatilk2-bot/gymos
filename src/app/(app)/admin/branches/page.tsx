"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BranchRow {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  isDefault: boolean;
  isActive: boolean;
}

interface BranchFormState {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  isDefault: boolean;
  isActive: boolean;
}

const EMPTY_FORM: BranchFormState = {
  name: "",
  code: "",
  address: "",
  phone: "",
  email: "",
  isDefault: false,
  isActive: true,
};

export default function BranchesAdminPage() {
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/branches");
      const body = await res.json();
      if (res.ok) setBranches(body.branches);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {branches.length} branch(es)
        </p>
        <BranchDialog
          title="Add branch"
          open={createOpen}
          onOpenChange={setCreateOpen}
          initial={EMPTY_FORM}
          trigger={
            <Button>
              <Plus className="size-4" /> Add branch
            </Button>
          }
          onSubmit={async (form) => {
            const res = await fetch("/api/v1/branches", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(toPayload(form)),
            });
            return res;
          }}
          onDone={load}
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
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
              branches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell className="font-medium">
                    {branch.name}
                    {branch.isDefault ? (
                      <Badge variant="outline" className="ml-2">
                        Default
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {branch.code}
                  </TableCell>
                  <TableCell>{branch.phone ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={branch.isActive ? "success" : "outline"}>
                      {branch.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingBranch(branch)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editingBranch ? (
        <BranchDialog
          title={`Edit ${editingBranch.name}`}
          open={Boolean(editingBranch)}
          onOpenChange={(open) => !open && setEditingBranch(null)}
          initial={{
            name: editingBranch.name,
            code: editingBranch.code,
            address: editingBranch.address ?? "",
            phone: editingBranch.phone ?? "",
            email: editingBranch.email ?? "",
            isDefault: editingBranch.isDefault,
            isActive: editingBranch.isActive,
          }}
          onSubmit={async (form) => {
            const res = await fetch(`/api/v1/branches/${editingBranch.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(toPayload(form)),
            });
            return res;
          }}
          onDone={load}
        />
      ) : null}
    </div>
  );
}

function toPayload(form: BranchFormState) {
  return {
    name: form.name,
    code: form.code,
    address: form.address || undefined,
    phone: form.phone || undefined,
    email: form.email || undefined,
    isDefault: form.isDefault,
    isActive: form.isActive,
  };
}

function BranchDialog({
  title,
  open,
  onOpenChange,
  initial,
  trigger,
  onSubmit,
  onDone,
}: {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: BranchFormState;
  trigger?: React.ReactNode;
  onSubmit: (form: BranchFormState) => Promise<Response>;
  onDone: () => void;
}) {
  const [form, setForm] = useState<BranchFormState>(initial);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setForm(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await onSubmit(form);
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not save branch.");
        return;
      }
      toast.success("Branch saved.");
      onOpenChange(false);
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Branches are the unit of location-scoped access and data.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Code</Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          <label className="flex items-center justify-between rounded-md border p-3 text-sm">
            Default branch
            <Switch
              checked={form.isDefault}
              onCheckedChange={(checked) =>
                setForm({ ...form, isDefault: checked })
              }
            />
          </label>
          <label className="flex items-center justify-between rounded-md border p-3 text-sm">
            Active
            <Switch
              checked={form.isActive}
              onCheckedChange={(checked) =>
                setForm({ ...form, isActive: checked })
              }
            />
          </label>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
