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

export const PACKAGE_CATEGORIES = [
  "general",
  "student",
  "couple",
  "family",
  "corporate",
  "off_peak",
  "premium",
  "vip",
  "cardio_only",
  "group_class",
  "bundled",
  "custom",
] as const;

export const PACKAGE_CATEGORY_LABELS: Record<string, string> = {
  general: "General",
  student: "Student",
  couple: "Couple",
  family: "Family",
  corporate: "Corporate",
  off_peak: "Off-peak",
  premium: "Premium",
  vip: "VIP",
  cardio_only: "Cardio only",
  group_class: "Group class",
  bundled: "Bundled",
  custom: "Custom",
};

export interface PackageFormValues {
  name: string;
  description: string;
  durationUnit: "day" | "week" | "month" | "year";
  durationValue: string;
  category: string;
  isTrial: boolean;
  isLimitedVisit: boolean;
  visitLimit: string;
  priceRupees: string;
  joiningFeeRupees: string;
  registrationFeeRupees: string;
  isTaxable: boolean;
  defaultDiscountPercent: string;
  earlyRenewalDiscountPercent: string;
  couponCode: string;
  ptSessionsIncluded: string;
  groupClassesIncluded: string;
  guestPassesIncluded: string;
  accessWindowStart: string;
  accessWindowEnd: string;
  allBranches: boolean;
  branchIds: string[];
  cancellationPolicy: string;
  freezeAllowed: boolean;
  freezeMaxDaysPerYear: string;
  freezeMaxCount: string;
  freezeMinNoticeDays: string;
  transferAllowed: boolean;
  refundPolicy: string;
}

export const EMPTY_PACKAGE_FORM: PackageFormValues = {
  name: "",
  description: "",
  durationUnit: "month",
  durationValue: "1",
  category: "general",
  isTrial: false,
  isLimitedVisit: false,
  visitLimit: "",
  priceRupees: "",
  joiningFeeRupees: "",
  registrationFeeRupees: "",
  isTaxable: true,
  defaultDiscountPercent: "",
  earlyRenewalDiscountPercent: "",
  couponCode: "",
  ptSessionsIncluded: "",
  groupClassesIncluded: "",
  guestPassesIncluded: "",
  accessWindowStart: "",
  accessWindowEnd: "",
  allBranches: true,
  branchIds: [],
  cancellationPolicy: "",
  freezeAllowed: true,
  freezeMaxDaysPerYear: "30",
  freezeMaxCount: "2",
  freezeMinNoticeDays: "0",
  transferAllowed: true,
  refundPolicy: "",
};

/** D2 package configuration fields, all in one sectioned form (create + edit). */
export function PackageForm({
  value,
  onChange,
  branches,
}: {
  value: PackageFormValues;
  onChange: (patch: Partial<PackageFormValues>) => void;
  branches: BranchOption[];
}) {
  function set<K extends keyof PackageFormValues>(
    key: K,
    v: PackageFormValues[K],
  ) {
    onChange({ [key]: v } as Partial<PackageFormValues>);
  }

  function toggleBranch(branchId: string) {
    set(
      "branchIds",
      value.branchIds.includes(branchId)
        ? value.branchIds.filter((b) => b !== branchId)
        : [...value.branchIds, branchId],
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Basics</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 flex flex-col gap-2">
            <Label htmlFor="pkg-name">Name</Label>
            <Input
              id="pkg-name"
              value={value.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </div>
          <div className="col-span-2 flex flex-col gap-2">
            <Label htmlFor="pkg-description">Description</Label>
            <Input
              id="pkg-description"
              value={value.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pkg-duration-value">Duration</Label>
            <Input
              id="pkg-duration-value"
              type="number"
              min={1}
              value={value.durationValue}
              onChange={(e) => set("durationValue", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pkg-duration-unit">Duration unit</Label>
            <Select
              value={value.durationUnit}
              onValueChange={(v) =>
                set("durationUnit", v as PackageFormValues["durationUnit"])
              }
            >
              <SelectTrigger id="pkg-duration-unit" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day(s)</SelectItem>
                <SelectItem value="week">Week(s)</SelectItem>
                <SelectItem value="month">Month(s)</SelectItem>
                <SelectItem value="year">Year(s)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pkg-category">Category</Label>
            <Select
              value={value.category}
              onValueChange={(v) => set("category", v)}
            >
              <SelectTrigger id="pkg-category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PACKAGE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {PACKAGE_CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4 pt-6">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={value.isTrial}
                onCheckedChange={(c) => set("isTrial", c === true)}
              />
              Trial plan
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={value.isLimitedVisit}
                onCheckedChange={(c) => set("isLimitedVisit", c === true)}
              />
              Limited-visit
            </label>
          </div>
          {value.isLimitedVisit ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="pkg-visit-limit">Visit limit</Label>
              <Input
                id="pkg-visit-limit"
                type="number"
                min={1}
                value={value.visitLimit}
                onChange={(e) => set("visitLimit", e.target.value)}
              />
            </div>
          ) : null}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Pricing &amp; fees (₹)</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="pkg-price">Price</Label>
            <Input
              id="pkg-price"
              type="number"
              min={0}
              step="0.01"
              value={value.priceRupees}
              onChange={(e) => set("priceRupees", e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pkg-joining-fee">Joining fee</Label>
            <Input
              id="pkg-joining-fee"
              type="number"
              min={0}
              step="0.01"
              value={value.joiningFeeRupees}
              onChange={(e) => set("joiningFeeRupees", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pkg-registration-fee">Registration fee</Label>
            <Input
              id="pkg-registration-fee"
              type="number"
              min={0}
              step="0.01"
              value={value.registrationFeeRupees}
              onChange={(e) => set("registrationFeeRupees", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pkg-discount">Promotional discount (%)</Label>
            <Input
              id="pkg-discount"
              type="number"
              min={0}
              max={100}
              value={value.defaultDiscountPercent}
              onChange={(e) => set("defaultDiscountPercent", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pkg-early-renewal-discount">
              Early-renewal discount (%)
            </Label>
            <Input
              id="pkg-early-renewal-discount"
              type="number"
              min={0}
              max={100}
              value={value.earlyRenewalDiscountPercent}
              onChange={(e) =>
                set("earlyRenewalDiscountPercent", e.target.value)
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pkg-coupon">Coupon code</Label>
            <Input
              id="pkg-coupon"
              value={value.couponCode}
              onChange={(e) => set("couponCode", e.target.value)}
            />
          </div>
          <label className="col-span-3 flex items-center gap-2 text-sm">
            <Checkbox
              checked={value.isTaxable}
              onCheckedChange={(c) => set("isTaxable", c === true)}
            />
            Taxable (real GST calculation arrives in Module O, Phase 1.3)
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Included benefits</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="pkg-pt">PT sessions</Label>
            <Input
              id="pkg-pt"
              type="number"
              min={0}
              value={value.ptSessionsIncluded}
              onChange={(e) => set("ptSessionsIncluded", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pkg-classes">Group classes</Label>
            <Input
              id="pkg-classes"
              type="number"
              min={0}
              value={value.groupClassesIncluded}
              onChange={(e) => set("groupClassesIncluded", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pkg-guest-passes">Guest passes</Label>
            <Input
              id="pkg-guest-passes"
              type="number"
              min={0}
              value={value.guestPassesIncluded}
              onChange={(e) => set("guestPassesIncluded", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Access &amp; branches</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="pkg-access-start">Access window start</Label>
            <Input
              id="pkg-access-start"
              type="time"
              value={value.accessWindowStart}
              onChange={(e) => set("accessWindowStart", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pkg-access-end">Access window end</Label>
            <Input
              id="pkg-access-end"
              type="time"
              value={value.accessWindowEnd}
              onChange={(e) => set("accessWindowEnd", e.target.value)}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={value.allBranches}
            onCheckedChange={(c) => set("allBranches", c === true)}
          />
          Available at all branches
        </label>
        {!value.allBranches ? (
          <div className="flex flex-wrap gap-4 rounded-md border p-3">
            {branches.map((b) => (
              <label key={b.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={value.branchIds.includes(b.id)}
                  onCheckedChange={() => toggleBranch(b.id)}
                />
                {b.name}
              </label>
            ))}
          </div>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Policies</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 flex flex-col gap-2">
            <Label htmlFor="pkg-cancellation-policy">Cancellation policy</Label>
            <Input
              id="pkg-cancellation-policy"
              value={value.cancellationPolicy}
              onChange={(e) => set("cancellationPolicy", e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={value.freezeAllowed}
              onCheckedChange={(c) => set("freezeAllowed", c === true)}
            />
            Freezing allowed
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={value.transferAllowed}
              onCheckedChange={(c) => set("transferAllowed", c === true)}
            />
            Transfer allowed
          </label>
          {value.freezeAllowed ? (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="pkg-freeze-max-days">
                  Max freeze days/year
                </Label>
                <Input
                  id="pkg-freeze-max-days"
                  type="number"
                  min={0}
                  value={value.freezeMaxDaysPerYear}
                  onChange={(e) => set("freezeMaxDaysPerYear", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="pkg-freeze-max-count">Max freeze count</Label>
                <Input
                  id="pkg-freeze-max-count"
                  type="number"
                  min={0}
                  value={value.freezeMaxCount}
                  onChange={(e) => set("freezeMaxCount", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="pkg-freeze-notice">Min notice (days)</Label>
                <Input
                  id="pkg-freeze-notice"
                  type="number"
                  min={0}
                  value={value.freezeMinNoticeDays}
                  onChange={(e) => set("freezeMinNoticeDays", e.target.value)}
                />
              </div>
            </>
          ) : null}
          <div className="col-span-2 flex flex-col gap-2">
            <Label htmlFor="pkg-refund-policy">Refund policy</Label>
            <Input
              id="pkg-refund-policy"
              value={value.refundPolicy}
              onChange={(e) => set("refundPolicy", e.target.value)}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function toInt(v: string): number | undefined {
  if (v.trim() === "") return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

function toPaise(rupees: string): number | undefined {
  if (rupees.trim() === "") return undefined;
  const n = Number.parseFloat(rupees);
  return Number.isFinite(n) ? Math.round(n * 100) : undefined;
}

export function toPackagePayload(value: PackageFormValues) {
  return {
    name: value.name,
    description: value.description || undefined,
    durationUnit: value.durationUnit,
    durationValue: toInt(value.durationValue) ?? 1,
    category: value.category as
      | "general"
      | "student"
      | "couple"
      | "family"
      | "corporate"
      | "off_peak"
      | "premium"
      | "vip"
      | "cardio_only"
      | "group_class"
      | "bundled"
      | "custom",
    isTrial: value.isTrial,
    isLimitedVisit: value.isLimitedVisit,
    visitLimit: value.isLimitedVisit ? toInt(value.visitLimit) : undefined,
    priceInPaise: toPaise(value.priceRupees) ?? 0,
    joiningFeeInPaise: toPaise(value.joiningFeeRupees) ?? 0,
    registrationFeeInPaise: toPaise(value.registrationFeeRupees) ?? 0,
    isTaxable: value.isTaxable,
    defaultDiscountPercent: toInt(value.defaultDiscountPercent),
    earlyRenewalDiscountPercent: toInt(value.earlyRenewalDiscountPercent),
    couponCode: value.couponCode || undefined,
    ptSessionsIncluded: toInt(value.ptSessionsIncluded) ?? 0,
    groupClassesIncluded: toInt(value.groupClassesIncluded) ?? 0,
    guestPassesIncluded: toInt(value.guestPassesIncluded) ?? 0,
    accessWindowStart: value.accessWindowStart || undefined,
    accessWindowEnd: value.accessWindowEnd || undefined,
    allBranches: value.allBranches,
    branchIds: value.allBranches ? [] : value.branchIds,
    cancellationPolicy: value.cancellationPolicy || undefined,
    freezeAllowed: value.freezeAllowed,
    freezeMaxDaysPerYear: toInt(value.freezeMaxDaysPerYear) ?? 0,
    freezeMaxCount: toInt(value.freezeMaxCount) ?? 0,
    freezeMinNoticeDays: toInt(value.freezeMinNoticeDays) ?? 0,
    transferAllowed: value.transferAllowed,
    refundPolicy: value.refundPolicy || undefined,
  };
}
