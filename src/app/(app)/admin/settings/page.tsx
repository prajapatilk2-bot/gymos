"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrganizationProfile {
  name: string;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  financialYearStartMonth: number;
  timeZone: string;
  dateFormat: string;
  currency: string;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function OrganizationSettingsPage() {
  const [profile, setProfile] = useState<OrganizationProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/organization");
      const body = await res.json();
      if (res.ok) setProfile(body.organization);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          logoUrl: profile.logoUrl || null,
          address: profile.address || null,
          phone: profile.phone || null,
          email: profile.email || null,
          gstin: profile.gstin || null,
          financialYearStartMonth: profile.financialYearStartMonth,
          timeZone: profile.timeZone,
          dateFormat: profile.dateFormat,
          currency: profile.currency,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error ?? "Could not save settings.");
        return;
      }
      toast.success("Organization settings saved.");
      setProfile(body.organization);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !profile) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="text-muted-foreground size-5 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Organization profile</CardTitle>
        <CardDescription>
          Gym identity, tax and locale settings (W4).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-2">
              <Label>Gym name</Label>
              <Input
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
              />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label>Logo URL</Label>
              <Input
                placeholder="https://..."
                value={profile.logoUrl ?? ""}
                onChange={(e) =>
                  setProfile({ ...profile, logoUrl: e.target.value })
                }
              />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label>Address</Label>
              <Input
                value={profile.address ?? ""}
                onChange={(e) =>
                  setProfile({ ...profile, address: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Phone</Label>
              <Input
                value={profile.phone ?? ""}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Email</Label>
              <Input
                value={profile.email ?? ""}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>GSTIN</Label>
              <Input
                value={profile.gstin ?? ""}
                onChange={(e) =>
                  setProfile({ ...profile, gstin: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Currency</Label>
              <Input
                value={profile.currency}
                onChange={(e) =>
                  setProfile({ ...profile, currency: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Financial year starts</Label>
              <Select
                value={String(profile.financialYearStartMonth)}
                onValueChange={(v) =>
                  setProfile({ ...profile, financialYearStartMonth: Number(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, index) => (
                    <SelectItem key={month} value={String(index + 1)}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Date format</Label>
              <Select
                value={profile.dateFormat}
                onValueChange={(v) => setProfile({ ...profile, dateFormat: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
                  <SelectItem value="MM-DD-YYYY">MM-DD-YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label>Time zone</Label>
              <Input
                value={profile.timeZone}
                onChange={(e) =>
                  setProfile({ ...profile, timeZone: e.target.value })
                }
              />
            </div>
          </div>
          <Button type="submit" disabled={submitting} className="self-start">
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
