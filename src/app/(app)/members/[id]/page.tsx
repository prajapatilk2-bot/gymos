"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Download,
  IdCard,
  Loader2,
  Pencil,
  ShieldAlert,
  UserCheck,
  UserX,
} from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EMPTY_MEMBER_FORM,
  MemberForm,
  MemberFormValues,
  MEMBER_TAG_LABELS,
  toUpdateMemberPayload,
  type BranchOption,
} from "@/components/members/member-form";

interface MemberDetail {
  id: string;
  memberCode: string;
  cardNumber: string | null;
  name: string;
  mobile: string;
  whatsappNumber: string | null;
  email: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  registrationDate: string;
  joiningDate: string | null;
  leadSource: string | null;
  occupation: string | null;
  fitnessGoals: string | null;
  assignedTrainerId: string | null;
  membershipPreference: string | null;
  status: string;
  tags: string[];
  branch: { id: string; name: string };
}

interface ApprovalRequestRow {
  id: string;
  requestType: string;
  status: string;
  payload: { action?: string };
  reason: string | null;
  requestedBy: { name: string };
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

export default function MemberDetailPage() {
  const params = useParams<{ id: string }>();
  const memberId = params.id;

  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingApprovals, setPendingApprovals] = useState<
    ApprovalRequestRow[]
  >([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [memberRes, approvalsRes, branchesRes] = await Promise.all([
        fetch(`/api/v1/members/${memberId}`),
        fetch(`/api/v1/members/approvals?entityId=${memberId}&status=pending`),
        fetch("/api/v1/branches"),
      ]);
      const memberBody = await memberRes.json();
      if (memberRes.ok) setMember(memberBody.member);
      if (approvalsRes.ok) {
        const body = await approvalsRes.json();
        setPendingApprovals(body.approvalRequests ?? []);
      }
      const branchesBody = await branchesRes.json();
      if (branchesRes.ok) setBranches(branchesBody.branches ?? []);
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
    const res = await fetch("/api/v1/members/approvals/decide", {
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
      <div className="flex justify-center p-10">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-muted-foreground p-6 text-sm">Member not found.</div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {member.name}
            </h1>
            <Badge variant={STATUS_VARIANT[member.status] ?? "outline"}>
              {member.status}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {member.memberCode} · {member.branch.name} · {member.mobile}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {member.tags.map((t) => (
              <Badge key={t} variant="secondary">
                {MEMBER_TAG_LABELS[t] ?? t}
              </Badge>
            ))}
          </div>
        </div>
        <MemberActions member={member} branches={branches} onChanged={load} />
      </div>

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
                  {a.requestType === "member_merge"
                    ? "Merge duplicate profile"
                    : `${a.payload.action === "suspend" ? "Suspend" : "Unsuspend"} member`}{" "}
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

      <Tabs defaultValue="profile">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="membership">Membership</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="consents">Consents</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab member={member} />
        </TabsContent>
        <TabsContent value="membership">
          <PlaceholderCard text="No active membership yet. Membership lifecycle (create, renew, freeze, cancel) arrives in Module D (Phase 1.2)." />
        </TabsContent>
        <TabsContent value="payments">
          <PlaceholderCard text="No payment history yet. Billing and invoices arrive in Module O (Phase 1.3)." />
        </TabsContent>
        <TabsContent value="attendance">
          <PlaceholderCard text="No attendance history yet. Check-in/check-out tracking arrives in Module E (Phase 1.4)." />
        </TabsContent>
        <TabsContent value="health">
          <HealthTab memberId={member.id} />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsTab memberId={member.id} />
        </TabsContent>
        <TabsContent value="consents">
          <ConsentsTab memberId={member.id} />
        </TabsContent>
        <TabsContent value="timeline">
          <TimelineTab memberId={member.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PlaceholderCard({ text }: { text: string }) {
  return (
    <Card>
      <CardContent className="text-muted-foreground py-8 text-center text-sm">
        {text}
      </CardContent>
    </Card>
  );
}

function ProfileTab({ member }: { member: MemberDetail }) {
  const rows: [string, string][] = [
    ["Member ID", member.memberCode],
    ["Card number", member.cardNumber ?? "—"],
    ["Mobile", member.mobile],
    ["WhatsApp", member.whatsappNumber ?? "—"],
    ["Email", member.email ?? "—"],
    ["Date of birth", member.dateOfBirth ?? "—"],
    ["Gender", member.gender ?? "—"],
    ["Address", member.address ?? "—"],
    ["Emergency contact", member.emergencyContactName ?? "—"],
    ["Emergency phone", member.emergencyContactPhone ?? "—"],
    ["Emergency relation", member.emergencyContactRelation ?? "—"],
    [
      "Registration date",
      new Date(member.registrationDate).toLocaleDateString(),
    ],
    [
      "Joining date",
      member.joiningDate
        ? new Date(member.joiningDate).toLocaleDateString()
        : "—",
    ],
    ["Lead source", member.leadSource ?? "—"],
    ["Occupation", member.occupation ?? "—"],
    ["Fitness goals", member.fitnessGoals ?? "—"],
    ["Assigned trainer", member.assignedTrainerId ?? "—"],
    ["Membership of interest", member.membershipPreference ?? "—"],
  ];

  return (
    <Card>
      <CardContent>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function HealthTab({ memberId }: { memberId: string }) {
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [fields, setFields] = useState({
    hasMedicalConditions: false,
    medicalConditions: "",
    injuries: "",
    medications: "",
    allergies: "",
    physicianName: "",
    physicianPhone: "",
    precautions: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/members/${memberId}/health-declaration`);
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      const body = await res.json();
      if (res.ok) {
        setData(body.healthDeclaration);
        if (body.healthDeclaration) {
          setFields({
            hasMedicalConditions:
              body.healthDeclaration.hasMedicalConditions ?? false,
            medicalConditions: body.healthDeclaration.medicalConditions ?? "",
            injuries: body.healthDeclaration.injuries ?? "",
            medications: body.healthDeclaration.medications ?? "",
            allergies: body.healthDeclaration.allergies ?? "",
            physicianName: body.healthDeclaration.physicianName ?? "",
            physicianPhone: body.healthDeclaration.physicianPhone ?? "",
            precautions: body.healthDeclaration.precautions ?? "",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    const res = await fetch(`/api/v1/members/${memberId}/health-declaration`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    const body = await res.json();
    if (!res.ok) {
      toast.error(body.error ?? "Could not save health declaration.");
      return;
    }
    toast.success("Health declaration saved.");
    setEditOpen(false);
    load();
  }

  if (loading) return <Loader2 className="size-5 animate-spin" />;
  if (forbidden) {
    return (
      <PlaceholderCard text="Restricted — you do not have permission to view health information for this member." />
    );
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-sm">Health declaration</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil className="size-4" /> Edit
        </Button>
      </CardHeader>
      <CardContent className="text-sm">
        {!data ? (
          <p className="text-muted-foreground">
            No health declaration on file yet.
          </p>
        ) : (
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-muted-foreground">Medical conditions</dt>
              <dd>{String(data.medicalConditions ?? "—")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Injuries</dt>
              <dd>{String(data.injuries ?? "—")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Medications</dt>
              <dd>{String(data.medications ?? "—")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Allergies</dt>
              <dd>{String(data.allergies ?? "—")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Physician</dt>
              <dd>
                {String(data.physicianName ?? "—")}{" "}
                {String(data.physicianPhone ?? "")}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Precautions</dt>
              <dd>{String(data.precautions ?? "—")}</dd>
            </div>
          </dl>
        )}
      </CardContent>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Health declaration</DialogTitle>
            <DialogDescription>
              Restricted access — only visible to staff with the
              sensitive.health permission.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {(
              [
                ["medicalConditions", "Medical conditions"],
                ["injuries", "Injuries"],
                ["medications", "Medications"],
                ["allergies", "Allergies"],
                ["physicianName", "Physician name"],
                ["physicianPhone", "Physician phone"],
                ["precautions", "Precautions"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex flex-col gap-2">
                <Label htmlFor={`health-${key}`}>{label}</Label>
                <Input
                  id={`health-${key}`}
                  value={fields[key]}
                  onChange={(e) =>
                    setFields((f) => ({ ...f, [key]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function DocumentsTab({ memberId }: { memberId: string }) {
  const [documents, setDocuments] = useState<
    { id: string; type: string; fileName: string; fileUrl: string }[]
  >([]);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("id_proof");
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/v1/members/${memberId}/documents`);
    const body = await res.json();
    if (res.ok) setDocuments(body.documents);
  }, [memberId]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit() {
    const res = await fetch(`/api/v1/members/${memberId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, fileName, fileUrl }),
    });
    const body = await res.json();
    if (!res.ok) {
      toast.error(body.error ?? "Could not add document.");
      return;
    }
    toast.success("Document added.");
    setOpen(false);
    setFileName("");
    setFileUrl("");
    load();
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-sm">Documents</CardTitle>
        <Button size="sm" onClick={() => setOpen(true)}>
          Add document
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {documents.length === 0 ? (
          <p className="text-muted-foreground">No documents uploaded yet.</p>
        ) : (
          documents.map((d) => (
            <a
              key={d.id}
              href={d.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex justify-between hover:underline"
            >
              <span>{d.fileName}</span>
              <span className="text-muted-foreground">{d.type}</span>
            </a>
          ))
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add document</DialogTitle>
            <DialogDescription>
              File-upload integration arrives later — paste a URL/key for now.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="doc-type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="doc-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id_proof">ID proof</SelectItem>
                  <SelectItem value="address_proof">Address proof</SelectItem>
                  <SelectItem value="photo">Photo</SelectItem>
                  <SelectItem value="agreement">Agreement</SelectItem>
                  <SelectItem value="waiver">Waiver</SelectItem>
                  <SelectItem value="medical_certificate">
                    Medical certificate
                  </SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="doc-name">File name</Label>
              <Input
                id="doc-name"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="doc-url">File URL</Label>
              <Input
                id="doc-url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submit} disabled={!fileName || !fileUrl}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ConsentsTab({ memberId }: { memberId: string }) {
  const [consents, setConsents] = useState<
    {
      id: string;
      type: string;
      granted: boolean;
      grantedAt: string;
      revokedAt: string | null;
    }[]
  >([]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/v1/members/${memberId}/consents`);
    const body = await res.json();
    if (res.ok) setConsents(body.consents);
  }, [memberId]);

  useEffect(() => {
    load();
  }, [load]);

  async function withdraw(type: string) {
    const res = await fetch(`/api/v1/members/${memberId}/consents/withdraw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    const body = await res.json();
    if (!res.ok) {
      toast.error(body.error ?? "Could not withdraw consent.");
      return;
    }
    toast.success("Consent withdrawn.");
    load();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Consent history</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {consents.length === 0 ? (
          <p className="text-muted-foreground">No consent records yet.</p>
        ) : (
          consents.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2">
              <span>
                {c.type} — {c.granted ? "granted" : "declined"} on{" "}
                {new Date(c.grantedAt).toLocaleDateString()}
                {c.revokedAt
                  ? ` (withdrawn ${new Date(c.revokedAt).toLocaleDateString()})`
                  : ""}
              </span>
              {c.granted && !c.revokedAt ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => withdraw(c.type)}
                >
                  Withdraw
                </Button>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function TimelineTab({ memberId }: { memberId: string }) {
  const [entries, setEntries] = useState<
    {
      id: string;
      action: string;
      createdAt: string;
      user: { name: string } | null;
    }[]
  >([]);

  useEffect(() => {
    fetch(`/api/v1/members/${memberId}/timeline`)
      .then((r) => r.json())
      .then((body) => setEntries(body.timeline ?? []))
      .catch(() => undefined);
  }, [memberId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Activity timeline</CardTitle>
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

function MemberActions({
  member,
  branches,
  onChanged,
}: {
  member: MemberDetail;
  branches: BranchOption[];
  onChanged: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [editValue, setEditValue] =
    useState<MemberFormValues>(EMPTY_MEMBER_FORM);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferBranchId, setTransferBranchId] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendOpen, setSuspendOpen] = useState(false);

  function openEdit() {
    setEditValue({
      ...EMPTY_MEMBER_FORM,
      name: member.name,
      mobile: member.mobile,
      whatsappNumber: member.whatsappNumber ?? "",
      email: member.email ?? "",
      dateOfBirth: member.dateOfBirth ?? "",
      gender: member.gender ?? "",
      address: member.address ?? "",
      emergencyContactName: member.emergencyContactName ?? "",
      emergencyContactPhone: member.emergencyContactPhone ?? "",
      emergencyContactRelation: member.emergencyContactRelation ?? "",
      joiningDate: member.joiningDate ? member.joiningDate.slice(0, 10) : "",
      leadSource: member.leadSource ?? "",
      occupation: member.occupation ?? "",
      fitnessGoals: member.fitnessGoals ?? "",
      assignedTrainerId: member.assignedTrainerId ?? "",
      membershipPreference: member.membershipPreference ?? "",
      tags: member.tags,
    });
    setEditOpen(true);
  }

  async function saveEdit() {
    const res = await fetch(`/api/v1/members/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toUpdateMemberPayload(editValue)),
    });
    const body = await res.json();
    if (!res.ok) {
      toast.error(body.error ?? "Could not update member.");
      return;
    }
    toast.success("Member updated.");
    setEditOpen(false);
    onChanged();
  }

  async function toggleActive() {
    const action = member.status === "inactive" ? "reactivate" : "deactivate";
    const res = await fetch(`/api/v1/members/${member.id}/${action}`, {
      method: "POST",
    });
    const body = await res.json();
    if (!res.ok) {
      toast.error(body.error ?? "Could not update member.");
      return;
    }
    toast.success(
      action === "reactivate" ? "Member reactivated." : "Member deactivated.",
    );
    onChanged();
  }

  async function submitSuspendRequest() {
    const action = member.status === "suspended" ? "unsuspend" : "suspend";
    const res = await fetch(`/api/v1/members/${member.id}/suspend-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason: suspendReason || undefined }),
    });
    const body = await res.json();
    if (!res.ok) {
      toast.error(body.error ?? "Could not submit request.");
      return;
    }
    toast.success("Submitted for approval.");
    setSuspendOpen(false);
    setSuspendReason("");
    onChanged();
  }

  async function submitTransfer() {
    const res = await fetch(`/api/v1/members/${member.id}/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branchId: transferBranchId }),
    });
    const body = await res.json();
    if (!res.ok) {
      toast.error(body.error ?? "Could not transfer member.");
      return;
    }
    toast.success("Member transferred.");
    setTransferOpen(false);
    onChanged();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={openEdit}>
        <Pencil className="size-4" /> Edit
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href={`/members/${member.id}/card`}>
          <IdCard className="size-4" /> ID card
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a href={`/api/v1/members/${member.id}/export`}>
          <Download className="size-4" /> Export data
        </a>
      </Button>
      <Button variant="outline" size="sm" onClick={() => setTransferOpen(true)}>
        Transfer branch
      </Button>
      <Button variant="outline" size="sm" onClick={() => setSuspendOpen(true)}>
        {member.status === "suspended"
          ? "Request unsuspend"
          : "Request suspend"}
      </Button>
      <Button variant="outline" size="sm" onClick={toggleActive}>
        {member.status === "inactive" ? (
          <>
            <UserCheck className="size-4" /> Reactivate
          </>
        ) : (
          <>
            <UserX className="size-4" /> Deactivate
          </>
        )}
      </Button>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit member</DialogTitle>
          </DialogHeader>
          <MemberForm
            value={editValue}
            onChange={(p) => setEditValue((v) => ({ ...v, ...p }))}
            branches={branches}
            mode="edit"
          />
          <DialogFooter>
            <Button onClick={saveEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Transfer to another branch</DialogTitle>
          </DialogHeader>
          <Select value={transferBranchId} onValueChange={setTransferBranchId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a branch" />
            </SelectTrigger>
            <SelectContent>
              {branches
                .filter((b) => b.id !== member.branch.id)
                .map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button onClick={submitTransfer} disabled={!transferBranchId}>
              Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {member.status === "suspended"
                ? "Request unsuspend"
                : "Request suspend"}
            </DialogTitle>
            <DialogDescription>
              Sent for approval — the change only takes effect once approved
              (CLAUDE.md approvals rule).
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="suspend-reason">Reason</Label>
            <Input
              id="suspend-reason"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={submitSuspendRequest}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
