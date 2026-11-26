"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PackageOption {
  id: string;
  name: string;
  priceInPaise: number;
}

interface MembershipDetail {
  id: string;
  derivedStatus: "active" | "frozen" | "cancelled" | "expired";
  startDate: string;
  expiryDate: string;
  originalExpiryDate: string;
  priceAtPurchaseInPaise: number;
  paymentDueAmountInPaise: number;
  paymentStatus: string;
  ptSessionsRemaining: number;
  groupClassesRemaining: number;
  guestPassesRemaining: number;
  freezeDaysUsed: number;
  freezeCount: number;
  package: { id: string; name: string };
  branch: { id: string; name: string };
}

interface ApprovalRequestRow {
  id: string;
  requestType: string;
  reason: string | null;
  requestedBy: { name: string };
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

const REQUEST_TYPE_LABELS: Record<string, string> = {
  membership_freeze: "Freeze",
  membership_cancel: "Cancellation",
  membership_transfer: "Transfer",
  membership_refund: "Refund",
};

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export function MembershipTab({ memberId }: { memberId: string }) {
  const [membership, setMembership] = useState<MembershipDetail | null>(null);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<
    ApprovalRequestRow[]
  >([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/members/${memberId}/membership`);
      const body = await res.json();
      if (res.ok) setMembership(body.membership);

      const packagesRes = await fetch("/api/v1/packages?status=active");
      const packagesBody = await packagesRes.json();
      if (packagesRes.ok) setPackages(packagesBody.packages);

      if (body.membership) {
        const approvalsRes = await fetch(
          `/api/v1/memberships/approvals?entityId=${body.membership.id}&status=pending`,
        );
        const approvalsBody = await approvalsRes.json();
        if (approvalsRes.ok)
          setPendingApprovals(approvalsBody.approvalRequests ?? []);
      } else {
        setPendingApprovals([]);
      }
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(
    approvalRequestId: string,
    decision: "approved" | "rejected",
  ) {
    const res = await fetch("/api/v1/memberships/approvals/decide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvalRequestId, decision }),
    });
    const body = await res.json();
    if (!res.ok) {
      toast.error(body.error ?? "Could not decide request.");
      return;
    }
    toast.success(`Request ${decision}.`);
    load();
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="mx-auto size-5 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!membership) {
    return (
      <NoMembershipCard
        memberId={memberId}
        packages={packages}
        onChanged={load}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {pendingApprovals.length > 0 ? (
        <Card className="border-amber-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldAlert className="size-4" /> Pending approval
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {pendingApprovals.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span>
                  {REQUEST_TYPE_LABELS[a.requestType] ?? a.requestType}{" "}
                  requested by {a.requestedBy.name}
                  {a.reason ? ` — ${a.reason}` : ""}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => decide(a.id, "approved")}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => decide(a.id, "rejected")}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {membership.package.name}
              <Badge
                variant={STATUS_VARIANT[membership.derivedStatus] ?? "outline"}
              >
                {membership.derivedStatus}
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Branch</dt>
              <dd>{membership.branch.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Start date</dt>
              <dd>{new Date(membership.startDate).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Expiry date</dt>
              <dd>{new Date(membership.expiryDate).toLocaleDateString()}</dd>
            </div>
            {membership.expiryDate !== membership.originalExpiryDate ? (
              <div>
                <dt className="text-muted-foreground">Original expiry</dt>
                <dd>
                  {new Date(membership.originalExpiryDate).toLocaleDateString()}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="text-muted-foreground">Price paid</dt>
              <dd>{formatRupees(membership.priceAtPurchaseInPaise)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Payment status</dt>
              <dd className="capitalize">
                {membership.paymentStatus.replace(/_/g, " ")} — due{" "}
                {formatRupees(membership.paymentDueAmountInPaise)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">PT sessions left</dt>
              <dd>{membership.ptSessionsRemaining}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Group classes left</dt>
              <dd>{membership.groupClassesRemaining}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Guest passes left</dt>
              <dd>{membership.guestPassesRemaining}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Freezes used</dt>
              <dd>
                {membership.freezeCount} freeze(s), {membership.freezeDaysUsed}{" "}
                day(s)
              </dd>
            </div>
          </dl>

          <MembershipActions
            membership={membership}
            packages={packages}
            onChanged={load}
          />
        </CardContent>
      </Card>

      <MembershipTimeline membershipId={membership.id} />
    </div>
  );
}

function NoMembershipCard({
  memberId,
  packages,
  onChanged,
}: {
  memberId: string;
  packages: PackageOption[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [packageId, setPackageId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const memberRes = await fetch(`/api/v1/members/${memberId}`);
      const memberBody = await memberRes.json();
      const res = await fetch("/api/v1/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          packageId,
          branchId: memberBody.member.branch.id,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not create membership.");
        return;
      }
      toast.success("Membership created.");
      setOpen(false);
      onChanged();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center text-sm">
        <p className="text-muted-foreground">No active membership yet.</p>
        <Button onClick={() => setOpen(true)}>Assign a package</Button>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign a package</DialogTitle>
          </DialogHeader>
          <Select value={packageId} onValueChange={setPackageId}>
            <SelectTrigger className="w-full">
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
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <DialogFooter>
            <Button onClick={submit} disabled={submitting || !packageId}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Create membership
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function MembershipActions({
  membership,
  packages,
  onChanged,
}: {
  membership: MembershipDetail;
  packages: PackageOption[];
  onChanged: () => void;
}) {
  const [dialog, setDialog] = useState<
    | "renew"
    | "upgrade"
    | "downgrade"
    | "extend"
    | "freeze"
    | "cancel"
    | "transfer"
    | "refund"
    | null
  >(null);

  async function post(path: string, body?: unknown) {
    const res = await fetch(`/api/v1/memberships/${membership.id}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await res.json();
    if (!res.ok) {
      toast.error(result.error ?? "Action failed.");
      return false;
    }
    return true;
  }

  async function unfreeze() {
    if (await post("/unfreeze")) {
      toast.success("Membership unfrozen.");
      onChanged();
    }
  }

  async function reactivate() {
    if (await post("/reactivate")) {
      toast.success("Membership reactivated.");
      onChanged();
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setDialog("renew")}>
          Renew
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setDialog("upgrade")}
        >
          Upgrade
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setDialog("downgrade")}
        >
          Downgrade
        </Button>
        <Button size="sm" variant="outline" onClick={() => setDialog("extend")}>
          Extend
        </Button>
        {membership.derivedStatus === "frozen" ? (
          <Button size="sm" variant="outline" onClick={unfreeze}>
            Unfreeze
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDialog("freeze")}
          >
            Request freeze
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => setDialog("cancel")}>
          Request cancel
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setDialog("transfer")}
        >
          Request transfer
        </Button>
        <Button size="sm" variant="outline" onClick={() => setDialog("refund")}>
          Request refund
        </Button>
        {membership.derivedStatus === "cancelled" ||
        membership.derivedStatus === "expired" ? (
          <Button size="sm" variant="outline" onClick={reactivate}>
            Reactivate
          </Button>
        ) : null}
      </div>

      <RenewDialog
        open={dialog === "renew"}
        onOpenChange={(o) => !o && setDialog(null)}
        onSubmit={async () => {
          if (await post("/renew", {})) {
            toast.success("Membership renewed.");
            setDialog(null);
            onChanged();
          }
        }}
      />
      <ChangePackageDialog
        open={dialog === "upgrade" || dialog === "downgrade"}
        title={dialog === "upgrade" ? "Upgrade package" : "Downgrade package"}
        packages={packages.filter((p) => p.id !== membership.package.id)}
        onOpenChange={(o) => !o && setDialog(null)}
        onSubmit={async (packageId) => {
          const path = dialog === "upgrade" ? "/upgrade" : "/downgrade";
          if (await post(path, { packageId })) {
            toast.success(`Membership ${dialog}d.`);
            setDialog(null);
            onChanged();
          }
        }}
      />
      <ExtendDialog
        open={dialog === "extend"}
        onOpenChange={(o) => !o && setDialog(null)}
        onSubmit={async (additionalDays, reason) => {
          if (await post("/extend", { additionalDays, reason })) {
            toast.success("Membership extended.");
            setDialog(null);
            onChanged();
          }
        }}
      />
      <FreezeDialog
        open={dialog === "freeze"}
        onOpenChange={(o) => !o && setDialog(null)}
        onSubmit={async (startDate, endDate, reason) => {
          if (
            await post("/freeze-request", {
              startDate,
              endDate: endDate || undefined,
              reason,
            })
          ) {
            toast.success("Freeze request submitted for approval.");
            setDialog(null);
            onChanged();
          }
        }}
      />
      <ReasonDialog
        open={dialog === "cancel"}
        title="Request cancellation"
        description="Sent for approval — the membership stays active until approved."
        submitLabel="Submit"
        requireReason
        onOpenChange={(o) => !o && setDialog(null)}
        onSubmit={async (reason) => {
          if (await post("/cancel-request", { reason })) {
            toast.success("Cancellation request submitted.");
            setDialog(null);
            onChanged();
          }
        }}
      />
      <TransferDialog
        open={dialog === "transfer"}
        onOpenChange={(o) => !o && setDialog(null)}
        onSubmit={async (targetMemberId, reason) => {
          if (await post("/transfer-request", { targetMemberId, reason })) {
            toast.success("Transfer request submitted.");
            setDialog(null);
            onChanged();
          }
        }}
      />
      <RefundDialog
        open={dialog === "refund"}
        onOpenChange={(o) => !o && setDialog(null)}
        onSubmit={async (amountInPaise, reason) => {
          if (await post("/refund-request", { amountInPaise, reason })) {
            toast.success(
              "Refund request submitted for approval. No refund is processed here — see Module O.",
            );
            setDialog(null);
            onChanged();
          }
        }}
      />
    </>
  );
}

function RenewDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Renew membership</DialogTitle>
          <DialogDescription>
            Extends from the later of today or the current expiry date, for one
            more package duration.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onSubmit}>Renew</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChangePackageDialog({
  open,
  title,
  packages,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  title: string;
  packages: PackageOption[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (packageId: string) => void;
}) {
  const [packageId, setPackageId] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Starts a fresh cycle today on the new package; remaining
            time/benefits on the current package are not carried over.
          </DialogDescription>
        </DialogHeader>
        <Select value={packageId} onValueChange={setPackageId}>
          <SelectTrigger className="w-full">
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
        <DialogFooter>
          <Button onClick={() => onSubmit(packageId)} disabled={!packageId}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExtendDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (additionalDays: number, reason: string | undefined) => void;
}) {
  const [days, setDays] = useState("7");
  const [reason, setReason] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Extend membership</DialogTitle>
          <DialogDescription>
            Manual goodwill extension — applied immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="extend-days">Additional days</Label>
            <Input
              id="extend-days"
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="extend-reason">Reason</Label>
            <Input
              id="extend-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() =>
              onSubmit(Number.parseInt(days, 10), reason || undefined)
            }
            disabled={!days}
          >
            Extend
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FreezeDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    startDate: string,
    endDate: string,
    reason: string | undefined,
  ) => void;
}) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Request freeze</DialogTitle>
          <DialogDescription>
            Sent for approval. Leave end date blank for an open-ended freeze.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="freeze-start">Start date</Label>
            <Input
              id="freeze-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="freeze-end">End date (optional)</Label>
            <Input
              id="freeze-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="freeze-reason">Reason</Label>
            <Input
              id="freeze-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => onSubmit(startDate, endDate, reason || undefined)}
            disabled={!startDate}
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReasonDialog({
  open,
  title,
  description,
  submitLabel,
  requireReason,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  title: string;
  description: string;
  submitLabel: string;
  requireReason?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="reason-dialog-reason">Reason</Label>
          <Input
            id="reason-dialog-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button
            onClick={() => onSubmit(reason)}
            disabled={requireReason && !reason}
          >
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TransferDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (targetMemberId: string, reason: string | undefined) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { id: string; name: string; memberCode: string }[]
  >([]);
  const [target, setTarget] = useState<{
    id: string;
    name: string;
    memberCode: string;
  } | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!query || target) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      fetch(`/api/v1/members?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((body) => setResults(body.items ?? []))
        .catch(() => undefined);
    }, 300);
    return () => clearTimeout(handle);
  }, [query, target]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Request transfer</DialogTitle>
          <DialogDescription>
            Sent for approval. On approval, remaining validity and benefits move
            to the target member and this membership closes.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="transfer-target">Target member</Label>
            <Input
              id="transfer-target"
              placeholder="Search by name, mobile or member ID"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setTarget(null);
              }}
            />
            {results.length > 0 ? (
              <div className="max-h-32 overflow-y-auto rounded-md border">
                {results.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="hover:bg-accent flex w-full items-center justify-between px-3 py-2 text-left text-sm"
                    onClick={() => {
                      setTarget(m);
                      setQuery(`${m.name} (${m.memberCode})`);
                      setResults([]);
                    }}
                  >
                    <span>{m.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {m.memberCode}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="transfer-reason">Reason</Label>
            <Input
              id="transfer-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => target && onSubmit(target.id, reason || undefined)}
            disabled={!target}
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RefundDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (amountInPaise: number, reason: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Request refund</DialogTitle>
          <DialogDescription>
            Sent for approval only — no refund is processed here. Real refund
            processing arrives with billing (Module O, Phase 1.3).
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="refund-amount">Amount (₹)</Label>
            <Input
              id="refund-amount"
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="refund-reason">Reason</Label>
            <Input
              id="refund-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() =>
              onSubmit(Math.round(Number.parseFloat(amount) * 100), reason)
            }
            disabled={!amount || !reason}
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MembershipTimeline({ membershipId }: { membershipId: string }) {
  const [entries, setEntries] = useState<
    {
      id: string;
      action: string;
      createdAt: string;
      user: { name: string } | null;
    }[]
  >([]);

  useEffect(() => {
    fetch(`/api/v1/memberships/${membershipId}/timeline`)
      .then((r) => r.json())
      .then((body) => setEntries(body.timeline ?? []))
      .catch(() => undefined);
  }, [membershipId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Membership history</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {entries.length === 0 ? (
          <p className="text-muted-foreground">No activity recorded yet.</p>
        ) : (
          entries.map((e) => (
            <div
              key={e.id}
              className="flex justify-between gap-2 border-b pb-2 last:border-0"
            >
              <span className="font-medium">{e.action.replace(/_/g, " ")}</span>
              <span className="text-muted-foreground">
                {e.user?.name ?? "System"} ·{" "}
                {new Date(e.createdAt).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
