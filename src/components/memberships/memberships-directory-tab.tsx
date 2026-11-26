"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

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
import type { BranchOption } from "@/components/memberships/package-form";

interface MembershipRow {
  id: string;
  derivedStatus: "active" | "frozen" | "cancelled" | "expired";
  startDate: string;
  expiryDate: string;
  member: { id: string; name: string; memberCode: string };
  package: { id: string; name: string };
  branch: { id: string; name: string };
}

interface PackageOption {
  id: string;
  name: string;
}

interface MemberSearchResult {
  id: string;
  name: string;
  memberCode: string;
  mobile: string;
  branch: { id: string; name: string };
}

const STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "destructive" | "secondary"
> = {
  active: "success",
  frozen: "warning",
  cancelled: "destructive",
  expired: "secondary",
};

export function MembershipsDirectoryTab({
  branches,
}: {
  branches: BranchOption[];
}) {
  const [items, setItems] = useState<MembershipRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [packageId, setPackageId] = useState("all");
  const [expiringSoon, setExpiringSoon] = useState(false);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    fetch("/api/v1/packages")
      .then((r) => r.json())
      .then((body) => setPackages(body.packages ?? []))
      .catch(() => undefined);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (packageId !== "all") params.set("packageId", packageId);
      if (expiringSoon) params.set("expiringSoonDays", "7");
      const res = await fetch(`/api/v1/memberships?${params.toString()}`);
      const body = await res.json();
      if (res.ok) {
        setItems(body.items);
        setTotal(body.total);
      }
    } finally {
      setLoading(false);
    }
  }, [status, packageId, expiringSoon]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="frozen">Frozen</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={packageId} onValueChange={setPackageId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All packages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All packages</SelectItem>
              {packages.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={expiringSoon ? "default" : "outline"}
            size="sm"
            onClick={() => setExpiringSoon((v) => !v)}
          >
            Expiring soon
          </Button>
        </div>
        <CreateMembershipDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          branches={branches}
          packages={packages}
          onCreated={load}
        />
      </div>

      <p className="text-muted-foreground text-sm">{total} membership(s)</p>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>Expiry</TableHead>
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
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-8 text-center"
                >
                  No memberships yet.
                </TableCell>
              </TableRow>
            ) : (
              items.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <Link
                      href={`/members/${m.member.id}`}
                      className="font-medium hover:underline"
                    >
                      {m.member.name}
                    </Link>
                    <span className="text-muted-foreground ml-2 text-xs">
                      {m.member.memberCode}
                    </span>
                  </TableCell>
                  <TableCell>{m.package.name}</TableCell>
                  <TableCell>{m.branch.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={STATUS_VARIANT[m.derivedStatus] ?? "outline"}
                    >
                      {m.derivedStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(m.startDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(m.expiryDate).toLocaleDateString()}
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

function CreateMembershipDialog({
  open,
  onOpenChange,
  branches,
  packages,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branches: BranchOption[];
  packages: PackageOption[];
  onCreated: () => void;
}) {
  const [memberQuery, setMemberQuery] = useState("");
  const [memberResults, setMemberResults] = useState<MemberSearchResult[]>([]);
  const [selectedMember, setSelectedMember] =
    useState<MemberSearchResult | null>(null);
  const [packageId, setPackageId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!memberQuery || selectedMember) {
      setMemberResults([]);
      return;
    }
    const handle = setTimeout(() => {
      fetch(`/api/v1/members?q=${encodeURIComponent(memberQuery)}`)
        .then((r) => r.json())
        .then((body) => setMemberResults(body.items ?? []))
        .catch(() => undefined);
    }, 300);
    return () => clearTimeout(handle);
  }, [memberQuery, selectedMember]);

  function selectMember(m: MemberSearchResult) {
    setSelectedMember(m);
    setMemberQuery(`${m.name} (${m.memberCode})`);
    setMemberResults([]);
    setBranchId(m.branch.id);
  }

  async function submit() {
    if (!selectedMember || !packageId || !branchId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMember.id,
          packageId,
          branchId,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not create membership.");
        return;
      }
      toast.success("Membership created.");
      setSelectedMember(null);
      setMemberQuery("");
      setPackageId("");
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
          <Plus className="size-4" /> New membership
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create membership</DialogTitle>
          <DialogDescription>
            Subscribe a member to a package.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="membership-member">Member</Label>
            <Input
              id="membership-member"
              placeholder="Search by name, mobile or member ID"
              value={memberQuery}
              onChange={(e) => {
                setMemberQuery(e.target.value);
                setSelectedMember(null);
              }}
            />
            {memberResults.length > 0 ? (
              <div className="max-h-40 overflow-y-auto rounded-md border">
                {memberResults.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="hover:bg-accent flex w-full flex-col items-start px-3 py-2 text-left text-sm"
                    onClick={() => selectMember(m)}
                  >
                    <span className="font-medium">{m.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {m.memberCode} · {m.mobile}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="membership-package">Package</Label>
            <Select value={packageId} onValueChange={setPackageId}>
              <SelectTrigger id="membership-package" className="w-full">
                <SelectValue placeholder="Select a package" />
              </SelectTrigger>
              <SelectContent>
                {packages.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="membership-branch">Branch</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger id="membership-branch" className="w-full">
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
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button
            onClick={submit}
            disabled={submitting || !selectedMember || !packageId || !branchId}
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Create membership
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
