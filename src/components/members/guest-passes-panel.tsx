"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle, Loader2, Plus } from "lucide-react";

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

interface GuestPassRow {
  id: string;
  type: "guest_pass" | "trial_pass";
  name: string;
  phone: string | null;
  validFrom: string;
  validTo: string;
  usedAt: string | null;
  branch: { id: string; name: string };
}

export function GuestPassesPanel({ branches }: { branches: BranchOption[] }) {
  const [items, setItems] = useState<GuestPassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/guest-passes");
      const body = await res.json();
      if (res.ok) setItems(body.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markUsed(id: string) {
    const res = await fetch(`/api/v1/guest-passes/${id}/use`, {
      method: "POST",
    });
    const body = await res.json();
    if (!res.ok) {
      toast.error(body.error ?? "Could not mark pass as used.");
      return;
    }
    toast.success("Pass marked as used.");
    load();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{items.length} pass(es)</p>
        <CreateGuestPassDialog
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
              <TableHead>Type</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Valid from</TableHead>
              <TableHead>Valid to</TableHead>
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
                  No passes issued yet.
                </TableCell>
              </TableRow>
            ) : (
              items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>
                    {p.type === "guest_pass" ? "Guest pass" : "Trial pass"}
                  </TableCell>
                  <TableCell>{p.branch.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(p.validFrom).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(p.validTo).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.usedAt ? "outline" : "success"}>
                      {p.usedAt ? "Used" : "Unused"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {!p.usedAt ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => markUsed(p.id)}
                      >
                        <CheckCircle className="size-4" />
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

function CreateGuestPassDialog({
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
  const [type, setType] = useState<"guest_pass" | "trial_pass">("guest_pass");
  const [branchId, setBranchId] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/guest-passes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone: phone || undefined,
          type,
          branchId,
          validFrom: new Date(validFrom).toISOString(),
          validTo: new Date(validTo).toISOString(),
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error ?? "Could not issue pass.");
        return;
      }
      toast.success("Pass issued.");
      setName("");
      setPhone("");
      setValidFrom("");
      setValidTo("");
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
          <Plus className="size-4" /> Issue pass
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Issue guest / trial pass</DialogTitle>
          <DialogDescription>
            Not a full member profile — no login created.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="pass-branch">Branch</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger id="pass-branch" className="w-full">
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
            <Label htmlFor="pass-type">Type</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as typeof type)}
            >
              <SelectTrigger id="pass-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="guest_pass">Guest pass</SelectItem>
                <SelectItem value="trial_pass">Trial pass</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pass-name">Name</Label>
            <Input
              id="pass-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pass-phone">Phone</Label>
            <Input
              id="pass-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pass-from">Valid from</Label>
              <Input
                id="pass-from"
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pass-to">Valid to</Label>
              <Input
                id="pass-to"
                type="date"
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting || !branchId}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Issue pass
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
