"use client";

import { useEffect, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PackagesTab } from "@/components/memberships/packages-tab";
import { MembershipsDirectoryTab } from "@/components/memberships/memberships-directory-tab";
import { ApprovalsTab } from "@/components/memberships/approvals-tab";
import type { BranchOption } from "@/components/memberships/package-form";

export default function MembershipsPage() {
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
        <h1 className="text-2xl font-semibold tracking-tight">Memberships</h1>
        <p className="text-muted-foreground text-sm">
          Package configuration (D1–D2) and the membership lifecycle — create,
          renew, upgrade/downgrade, freeze, cancel and transfer (D3).
        </p>
      </div>

      <Tabs defaultValue="memberships">
        <TabsList>
          <TabsTrigger value="memberships">Memberships</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
        </TabsList>
        <TabsContent value="memberships">
          <MembershipsDirectoryTab branches={branches} />
        </TabsContent>
        <TabsContent value="packages">
          <PackagesTab branches={branches} />
        </TabsContent>
        <TabsContent value="approvals">
          <ApprovalsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
