"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface ApprovalRequestRow {
  id: string;
  requestType: string;
  status: string;
  reason: string | null;
  payload: Record<string, unknown>;
  requestedBy: { name: string };
  approver: { name: string } | null;
  createdAt: string;
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  membership_freeze: "Freeze request",
  membership_cancel: "Cancellation request",
  membership_transfer: "Transfer request",
  membership_refund: "Refund request",
};

/**
 * Module-wide approvals inbox for memberships.approve holders — unlike
 * Module C (which only surfaces a member's own pending requests inline on
 * their profile), this lists every pending membership request across
 * members so an approver doesn't have to visit each one individually.
 */
export function ApprovalsTab() {
  const [requests, setRequests] = useState<ApprovalRequestRow[]>([]);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/memberships/approvals?status=${status}`);
      const body = await res.json();
      if (res.ok) setRequests(body.approvalRequests ?? []);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(id: string, decision: "approved" | "rejected") {
    const res = await fetch("/api/v1/memberships/approvals/decide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvalRequestId: id, decision }),
    });
    const body = await res.json();
    if (!res.ok) {
      toast.error(body.error ?? "Could not decide request.");
      return;
    }
    toast.success(`Request ${decision}.`);
    load();
  }

  return (
    <div className="flex flex-col gap-4">
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>

      {loading ? (
        <Loader2 className="mx-auto size-5 animate-spin" />
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-8 text-center text-sm">
            No {status} requests.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {requests.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-center justify-between gap-4 py-4 text-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {REQUEST_TYPE_LABELS[r.requestType] ?? r.requestType}
                    </span>
                    <Badge variant="outline">{r.status}</Badge>
                  </div>
                  <p className="text-muted-foreground mt-1">
                    Requested by {r.requestedBy.name}
                    {r.reason ? ` — ${r.reason}` : ""}
                    {r.approver ? ` · Decided by ${r.approver.name}` : ""}
                  </p>
                </div>
                {r.status === "pending" ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => decide(r.id, "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => decide(r.id, "rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
