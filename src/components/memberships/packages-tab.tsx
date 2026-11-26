"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Archive, Loader2, Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import {
  EMPTY_PACKAGE_FORM,
  PackageForm,
  PackageFormValues,
  toPackagePayload,
  type BranchOption,
} from "@/components/memberships/package-form";

interface PackageRow {
  id: string;
  name: string;
  category: string;
  durationUnit: string;
  durationValue: number;
  priceInPaise: number;
  status: "active" | "inactive" | "archived";
  allBranches: boolean;
  branchRestrictions: { branchId: string }[];
}

const STATUS_VARIANT: Record<string, "success" | "secondary" | "outline"> = {
  active: "success",
  inactive: "outline",
  archived: "secondary",
};

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export function PackagesTab({ branches }: { branches: BranchOption[] }) {
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<PackageRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/packages");
      const body = await res.json();
      if (res.ok) setPackages(body.packages);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function archive(pkg: PackageRow) {
    if (
      !confirm(`Archive "${pkg.name}"? Existing members on it are unaffected.`)
    )
      return;
    const res = await fetch(`/api/v1/packages/${pkg.id}/archive`, {
      method: "POST",
    });
    const body = await res.json();
    if (!res.ok) {
      toast.error(body.error ?? "Could not archive package.");
      return;
    }
    toast.success("Package archived.");
    load();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {packages.length} package(s)
        </p>
        <CreatePackageDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          branches={branches}
          onCreated={load}
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Branches</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20" />
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
            ) : packages.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground py-8 text-center"
                >
                  No packages yet.
                </TableCell>
              </TableRow>
            ) : (
              packages.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="capitalize">
                    {p.category.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell>
                    {p.durationValue} {p.durationUnit}
                    {p.durationValue > 1 ? "s" : ""}
                  </TableCell>
                  <TableCell>{formatRupees(p.priceInPaise)}</TableCell>
                  <TableCell>
                    {p.allBranches
                      ? "All branches"
                      : `${p.branchRestrictions.length} branch(es)`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[p.status] ?? "outline"}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditing(p)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      {p.status !== "archived" ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => archive(p)}
                        >
                          <Archive className="size-4" />
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

      {editing ? (
        <EditPackageDialog
          pkg={editing}
          open={Boolean(editing)}
          onOpenChange={(open) => !open && setEditing(null)}
          branches={branches}
          onSaved={load}
        />
      ) : null}
    </div>
  );
}

function CreatePackageDialog({
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
  const [value, setValue] = useState<PackageFormValues>(EMPTY_PACKAGE_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPackagePayload(value)),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not create package.");
        return;
      }
      toast.success(`Package "${body.package.name}" created.`);
      setValue(EMPTY_PACKAGE_FORM);
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
          <Plus className="size-4" /> New package
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create package</DialogTitle>
          <DialogDescription>D2 package configuration.</DialogDescription>
        </DialogHeader>
        <PackageForm
          value={value}
          onChange={(p) => setValue((v) => ({ ...v, ...p }))}
          branches={branches}
        />
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        <DialogFooter>
          <Button
            onClick={submit}
            disabled={submitting || !value.name || !value.priceRupees}
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Create package
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditPackageDialog({
  pkg,
  open,
  onOpenChange,
  branches,
  onSaved,
}: {
  pkg: PackageRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branches: BranchOption[];
  onSaved: () => void;
}) {
  const [value, setValue] = useState<PackageFormValues | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch(`/api/v1/packages/${pkg.id}`)
      .then((r) => r.json())
      .then((body) => {
        const p = body.package;
        setValue({
          ...EMPTY_PACKAGE_FORM,
          name: p.name,
          description: p.description ?? "",
          durationUnit: p.durationUnit,
          durationValue: String(p.durationValue),
          category: p.category,
          isTrial: p.isTrial,
          isLimitedVisit: p.isLimitedVisit,
          visitLimit: p.visitLimit != null ? String(p.visitLimit) : "",
          priceRupees: String(p.priceInPaise / 100),
          joiningFeeRupees: String(p.joiningFeeInPaise / 100),
          registrationFeeRupees: String(p.registrationFeeInPaise / 100),
          isTaxable: p.isTaxable,
          defaultDiscountPercent:
            p.defaultDiscountPercent != null
              ? String(p.defaultDiscountPercent)
              : "",
          earlyRenewalDiscountPercent:
            p.earlyRenewalDiscountPercent != null
              ? String(p.earlyRenewalDiscountPercent)
              : "",
          couponCode: p.couponCode ?? "",
          ptSessionsIncluded: String(p.ptSessionsIncluded),
          groupClassesIncluded: String(p.groupClassesIncluded),
          guestPassesIncluded: String(p.guestPassesIncluded),
          accessWindowStart: p.accessWindowStart ?? "",
          accessWindowEnd: p.accessWindowEnd ?? "",
          allBranches: p.allBranches,
          branchIds: p.branchRestrictions.map(
            (b: { branchId: string }) => b.branchId,
          ),
          cancellationPolicy: p.cancellationPolicy ?? "",
          freezeAllowed: p.freezeAllowed,
          freezeMaxDaysPerYear: String(p.freezeMaxDaysPerYear),
          freezeMaxCount: String(p.freezeMaxCount),
          freezeMinNoticeDays: String(p.freezeMinNoticeDays),
          transferAllowed: p.transferAllowed,
          refundPolicy: p.refundPolicy ?? "",
        });
      })
      .catch(() => undefined);
  }, [open, pkg.id]);

  async function submit() {
    if (!value) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/packages/${pkg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPackagePayload(value)),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not update package.");
        return;
      }
      toast.success("Package updated.");
      onOpenChange(false);
      onSaved();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit {pkg.name}</DialogTitle>
        </DialogHeader>
        {!value ? (
          <Loader2 className="mx-auto size-5 animate-spin" />
        ) : (
          <>
            <PackageForm
              value={value}
              onChange={(p) => setValue((v) => (v ? { ...v, ...p } : v))}
              branches={branches}
            />
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            <DialogFooter>
              <Button onClick={submit} disabled={submitting}>
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Save changes
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
