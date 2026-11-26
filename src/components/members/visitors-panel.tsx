"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, LogOut, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { BranchOption } from "@/components/members/member-form";

interface VisitorRow {
  id: string;
  name: string;
  phone: string | null;
  purpose: string | null;
  checkInAt: string;
  checkOutAt: string | null;
  branch: { id: string; name: string };
}

export function VisitorsPanel({ branches }: { branches: BranchOption[] }) {
  const [items, setItems] = useState<VisitorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/visitors");
      const body = await res.json();
      if (res.ok) setItems(body.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function checkOut(id: string) {
    const res = await fetch(`/api/v1/visitors/${id}/check-out`, {
      method: "POST",
    });
    const body = await res.json();
    if (!res.ok) {
      toast.error(body.error ?? "Could not check out visitor.");
      return;
    }
    toast.success("Visitor checked out.");
    load();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {items.length} visitor(s)
        </p>
        <CreateVisitorDialog
          open={open}
          onOpenChange={setOpen}
          branches={branches}
          onCreated={load}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Checked in</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground py-8 text-center"
                >
                  <Loader2 className="mx-auto size-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground py-8 text-center"
                >
                  No visitors logged yet.
                </TableCell>
              </TableRow>
            ) : (
              items.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.name}</TableCell>
                  <TableCell>{v.phone ?? "—"}</TableCell>
                  <TableCell>{v.purpose ?? "—"}</TableCell>
                  <TableCell>{v.branch.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(v.checkInAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={v.checkOutAt ? "outline" : "success"}>
                      {v.checkOutAt ? "Checked out" : "On premises"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {!v.checkOutAt ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => checkOut(v.id)}
                      >
                        <LogOut className="size-4" />
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function CreateVisitorDialog({
  open,
  onOpenChange,
  branches,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branches: BranchOption[];
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [branchId, setBranchId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone: phone || undefined,
          purpose: purpose || undefined,
          branchId,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error ?? "Could not log visitor.");
        return;
      }
      toast.success("Visitor logged in.");
      setName("");
      setPhone("");
      setPurpose("");
      onOpenChange(false);
      onCreated();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Log visitor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Log a visitor</DialogTitle>
          <DialogDescription>
            Front-desk visitor register — no login or member profile created.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="visitor-branch">Branch</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger id="visitor-branch" className="w-full">
                <SelectValue placeholder="Select a branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="visitor-name">Name</Label>
            <Input
              id="visitor-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="visitor-phone">Phone</Label>
            <Input
              id="visitor-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="visitor-purpose">Purpose of visit</Label>
            <Input
              id="visitor-purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting || !branchId}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Log visitor
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
