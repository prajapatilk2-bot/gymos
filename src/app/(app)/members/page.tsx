"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Download, Loader2, Plus, Upload } from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EMPTY_MEMBER_FORM,
  MemberForm,
  MemberFormValues,
  MEMBER_TAG_LABELS,
  toCreateMemberPayload,
  type BranchOption,
} from "@/components/members/member-form";
import { VisitorsPanel } from "@/components/members/visitors-panel";
import { GuestPassesPanel } from "@/components/members/guest-passes-panel";

interface MemberRow {
  id: string;
  memberCode: string;
  name: string;
  mobile: string;
  email: string | null;
  status: string;
  tags: string[];
  branch: { id: string; name: string };
  joiningDate: string | null;
}

const STATUS_VARIANT: Record<
  string,
  "success" | "secondary" | "destructive" | "warning" | "outline"
> = {
  active: "success",
  inactive: "outline",
  expired: "secondary",
  suspended: "destructive",
  frozen: "warning",
};

export default function MembersPage() {
  const [branches, setBranches] = useState<BranchOption[]>([]);

  useEffect(() => {
    fetch("/api/v1/branches")
      .then((r) => r.json())
      .then((body) => setBranches(body.branches ?? []))
      .catch(() => undefined);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        <p className="text-muted-foreground text-sm">
          The central member database (C1–C4) plus front-desk visitor and
          guest/trial pass records.
        </p>
      </div>

      <Tabs defaultValue="directory">
        <TabsList>
          <TabsTrigger value="directory">Directory</TabsTrigger>
          <TabsTrigger value="visitors">Visitor register</TabsTrigger>
          <TabsTrigger value="guest-passes">
            Guest &amp; trial passes
          </TabsTrigger>
        </TabsList>
        <TabsContent value="directory">
          <MemberDirectory branches={branches} />
        </TabsContent>
        <TabsContent value="visitors">
          <VisitorsPanel branches={branches} />
        </TabsContent>
        <TabsContent value="guest-passes">
          <GuestPassesPanel branches={branches} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MemberDirectory({ branches }: { branches: BranchOption[] }) {
  const [items, setItems] = useState<MemberRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status !== "all") params.set("status", status);
      const res = await fetch(`/api/v1/members?${params.toString()}`);
      const body = await res.json();
      if (res.ok) {
        setItems(body.items);
        setTotal(body.total);
      }
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search name, member ID, mobile or email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-64"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="frozen">Frozen</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="size-4" /> Import CSV
          </Button>
          <Button variant="outline" asChild>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download, not a page navigation */}
            <a href="/api/v1/members/export">
              <Download className="size-4" /> Export CSV
            </a>
          </Button>
          <CreateMemberDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            branches={branches}
            onCreated={load}
          />
        </div>
      </div>

      <p className="text-muted-foreground text-sm">{total} member(s)</p>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
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
                  No members yet.
                </TableCell>
              </TableRow>
            ) : (
              items.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <Link
                      href={`/members/${m.id}`}
                      className="font-medium hover:underline"
                    >
                      {m.name}
                    </Link>
                    <span className="text-muted-foreground ml-2 text-xs">
                      {m.memberCode}
                    </span>
                  </TableCell>
                  <TableCell>{m.mobile}</TableCell>
                  <TableCell>{m.branch.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {m.tags.map((t) => (
                        <Badge key={t} variant="secondary">
                          {MEMBER_TAG_LABELS[t] ?? t}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[m.status] ?? "outline"}>
                      {m.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {m.joiningDate
                      ? new Date(m.joiningDate).toLocaleDateString()
                      : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ImportMembersDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        branches={branches}
        onImported={load}
      />
    </div>
  );
}

function CreateMemberDialog({
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
  const [value, setValue] = useState<MemberFormValues>(EMPTY_MEMBER_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<
    { id: string; name: string; mobile: string; email: string | null }[] | null
  >(null);

  async function submit(allowDuplicate: boolean) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...toCreateMemberPayload(value),
          allowDuplicate,
        }),
      });
      const body = await res.json();
      if (res.status === 409 && body.matches) {
        setDuplicates(body.matches);
        return;
      }
      if (!res.ok) {
        setError(body.error ?? "Could not create member.");
        return;
      }
      toast.success(`Member ${body.member.memberCode} created.`);
      setValue(EMPTY_MEMBER_FORM);
      setDuplicates(null);
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
          <Plus className="size-4" /> New member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Register new member</DialogTitle>
          <DialogDescription>
            Captures the C1 registration fields. A unique member ID and card
            number are generated automatically.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(false);
          }}
          className="flex flex-col gap-4"
        >
          <MemberForm
            value={value}
            onChange={(p) => setValue((v) => ({ ...v, ...p }))}
            branches={branches}
            mode="create"
          />

          {duplicates && duplicates.length > 0 ? (
            <div className="rounded-md border border-amber-400 bg-amber-50 p-3 text-sm dark:bg-amber-950">
              <p className="font-medium">Possible duplicate member(s) found:</p>
              <ul className="mt-1 list-disc pl-5">
                {duplicates.map((d) => (
                  <li key={d.id}>
                    {d.name} — {d.mobile} {d.email ? `· ${d.email}` : ""}
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => submit(true)}
              >
                Create anyway
              </Button>
            </div>
          ) : null}

          {error ? <p className="text-destructive text-sm">{error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={submitting || !value.branchId}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Register member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ImportMembersDialog({
  open,
  onOpenChange,
  branches,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branches: BranchOption[];
  onImported: () => void;
}) {
  const [branchId, setBranchId] = useState("");
  const [csv, setCsv] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<
    { row: number; name: string; status: string; message?: string }[] | null
  >(null);

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/members/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId, csv }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error ?? "Import failed.");
        return;
      }
      setResults(body.results);
      onImported();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setResults(null);
          setCsv("");
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk import members (CSV)</DialogTitle>
          <DialogDescription>
            Header row: name,mobile,email,whatsappNumber,dateOfBirth,gender,tags
            (tags separated by &quot;;&quot;). Each row is created
            independently.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="import-branch">Branch</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger id="import-branch" className="w-full">
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
            <Label htmlFor="import-csv">CSV contents</Label>
            <textarea
              id="import-csv"
              className="border-input min-h-32 rounded-md border bg-transparent p-2 text-sm"
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              placeholder={
                "name,mobile,email\nJane Doe,9876543210,jane@example.com"
              }
            />
          </div>
          {results ? (
            <div className="max-h-48 overflow-y-auto rounded-md border p-2 text-sm">
              {results.map((r) => (
                <div key={r.row} className="flex justify-between gap-2">
                  <span>
                    Row {r.row}: {r.name || "—"}
                  </span>
                  <span
                    className={
                      r.status === "created"
                        ? "text-green-600"
                        : r.status === "skipped_duplicate"
                          ? "text-amber-600"
                          : "text-destructive"
                    }
                  >
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={submitting || !branchId || !csv}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
