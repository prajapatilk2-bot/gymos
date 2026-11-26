"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface BranchOption {
  id: string;
  name: string;
}

export const MEMBER_TAGS = [
  "vip",
  "personal_training",
  "trial",
  "corporate",
  "couple",
  "family",
] as const;

export const MEMBER_TAG_LABELS: Record<string, string> = {
  vip: "VIP",
  personal_training: "Personal training",
  trial: "Trial",
  corporate: "Corporate",
  couple: "Couple",
  family: "Family",
};

export interface MemberFormValues {
  branchId: string;
  name: string;
  mobile: string;
  whatsappNumber: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  joiningDate: string;
  leadSource: string;
  occupation: string;
  fitnessGoals: string;
  assignedTrainerId: string;
  membershipPreference: string;
  tags: string[];
  waiverAccepted: boolean;
}

export const EMPTY_MEMBER_FORM: MemberFormValues = {
  branchId: "",
  name: "",
  mobile: "",
  whatsappNumber: "",
  email: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelation: "",
  joiningDate: "",
  leadSource: "",
  occupation: "",
  fitnessGoals: "",
  assignedTrainerId: "",
  membershipPreference: "",
  tags: [],
  waiverAccepted: false,
};

/**
 * Registration/edit fields for C1, hardcoded for now but kept in one
 * sectioned component so the Phase 1.5 dynamic form builder can wire these
 * same sections to backend-configured fields later without redesigning the
 * page around it.
 */
export function MemberForm({
  value,
  onChange,
  branches,
  mode,
}: {
  value: MemberFormValues;
  onChange: (patch: Partial<MemberFormValues>) => void;
  branches: BranchOption[];
  mode: "create" | "edit";
}) {
  function set<K extends keyof MemberFormValues>(
    key: K,
    v: MemberFormValues[K],
  ) {
    onChange({ [key]: v } as Partial<MemberFormValues>);
  }

  function toggleTag(tag: string) {
    set(
      "tags",
      value.tags.includes(tag)
        ? value.tags.filter((t) => t !== tag)
        : [...value.tags, tag],
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Identity</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 flex flex-col gap-2">
            <Label htmlFor="member-name">Full name</Label>
            <Input
              id="member-name"
              value={value.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </div>
          {mode === "create" ? (
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="member-branch">Branch</Label>
              <Select
                value={value.branchId}
                onValueChange={(v) => set("branchId", v)}
              >
                <SelectTrigger id="member-branch" className="w-full">
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
          ) : null}
          <div className="flex flex-col gap-2">
            <Label htmlFor="member-mobile">Mobile number</Label>
            <Input
              id="member-mobile"
              value={value.mobile}
              onChange={(e) => set("mobile", e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="member-whatsapp">WhatsApp number</Label>
            <Input
              id="member-whatsapp"
              value={value.whatsappNumber}
              onChange={(e) => set("whatsappNumber", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="member-email">Email</Label>
            <Input
              id="member-email"
              type="email"
              value={value.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="member-dob">Date of birth</Label>
            <Input
              id="member-dob"
              type="date"
              value={value.dateOfBirth}
              onChange={(e) => set("dateOfBirth", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="member-gender">Gender</Label>
            <Select
              value={value.gender || undefined}
              onValueChange={(v) => set("gender", v)}
            >
              <SelectTrigger id="member-gender" className="w-full">
                <SelectValue placeholder="Not specified" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer_not_to_say">
                  Prefer not to say
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 flex flex-col gap-2">
            <Label htmlFor="member-address">Address</Label>
            <Input
              id="member-address"
              value={value.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Emergency contact</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="member-ec-name">Name</Label>
            <Input
              id="member-ec-name"
              value={value.emergencyContactName}
              onChange={(e) => set("emergencyContactName", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="member-ec-phone">Phone</Label>
            <Input
              id="member-ec-phone"
              value={value.emergencyContactPhone}
              onChange={(e) => set("emergencyContactPhone", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="member-ec-relation">Relationship</Label>
            <Input
              id="member-ec-relation"
              value={value.emergencyContactRelation}
              onChange={(e) => set("emergencyContactRelation", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Registration details</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="member-joining-date">Joining date</Label>
            <Input
              id="member-joining-date"
              type="date"
              value={value.joiningDate}
              onChange={(e) => set("joiningDate", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="member-lead-source">Lead source</Label>
            <Input
              id="member-lead-source"
              value={value.leadSource}
              onChange={(e) => set("leadSource", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="member-occupation">Occupation</Label>
            <Input
              id="member-occupation"
              value={value.occupation}
              onChange={(e) => set("occupation", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="member-trainer">
              Assigned trainer (staff user id)
            </Label>
            <Input
              id="member-trainer"
              value={value.assignedTrainerId}
              onChange={(e) => set("assignedTrainerId", e.target.value)}
              placeholder="Optional — full trainer directory arrives in Module H"
            />
          </div>
          <div className="col-span-2 flex flex-col gap-2">
            <Label htmlFor="member-fitness-goals">Fitness goals</Label>
            <Input
              id="member-fitness-goals"
              value={value.fitnessGoals}
              onChange={(e) => set("fitnessGoals", e.target.value)}
            />
          </div>
          <div className="col-span-2 flex flex-col gap-2">
            <Label htmlFor="member-membership-preference">
              Membership of interest
            </Label>
            <Input
              id="member-membership-preference"
              value={value.membershipPreference}
              onChange={(e) => set("membershipPreference", e.target.value)}
              placeholder="Free-text note — real package selection arrives in Module D"
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Member type</h3>
        <div className="flex flex-wrap gap-4">
          {MEMBER_TAGS.map((tag) => (
            <label key={tag} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={value.tags.includes(tag)}
                onCheckedChange={() => toggleTag(tag)}
              />
              {MEMBER_TAG_LABELS[tag]}
            </label>
          ))}
        </div>
      </section>

      {mode === "create" ? (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Waiver &amp; consent</h3>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={value.waiverAccepted}
              onCheckedChange={(checked) =>
                set("waiverAccepted", checked === true)
              }
            />
            Member has read and accepted the waiver / terms &amp; conditions
          </label>
        </section>
      ) : null}
    </div>
  );
}

export function toCreateMemberPayload(value: MemberFormValues) {
  return {
    branchId: value.branchId,
    name: value.name,
    mobile: value.mobile,
    whatsappNumber: value.whatsappNumber || undefined,
    email: value.email || undefined,
    dateOfBirth: value.dateOfBirth || undefined,
    gender: (value.gender || undefined) as
      "male" | "female" | "other" | "prefer_not_to_say" | undefined,
    address: value.address || undefined,
    emergencyContactName: value.emergencyContactName || undefined,
    emergencyContactPhone: value.emergencyContactPhone || undefined,
    emergencyContactRelation: value.emergencyContactRelation || undefined,
    joiningDate: value.joiningDate || undefined,
    leadSource: value.leadSource || undefined,
    occupation: value.occupation || undefined,
    fitnessGoals: value.fitnessGoals || undefined,
    assignedTrainerId: value.assignedTrainerId || undefined,
    membershipPreference: value.membershipPreference || undefined,
    tags: value.tags,
    waiverAccepted: value.waiverAccepted,
  };
}

export function toUpdateMemberPayload(value: MemberFormValues) {
  const { branchId, waiverAccepted, ...rest } = toCreateMemberPayload(value);
  void branchId;
  void waiverAccepted;
  return rest;
}
