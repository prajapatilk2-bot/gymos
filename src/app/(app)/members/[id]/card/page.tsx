import { notFound } from "next/navigation";

import { prisma } from "@/server/db/prisma";
import { getSessionContext } from "@/server/auth/session";
import { getMemberById } from "@/server/modules/members/service";
import { PrintButton } from "@/components/members/print-button";

export default async function MemberCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getSessionContext();
  if (!ctx) notFound();

  // Just the organization's display name for the card header — not gated
  // behind admin.view like the full profile, since front-desk staff who
  // only hold members.* permissions need to print cards too.
  const [member, organization] = await Promise.all([
    getMemberById(ctx, id),
    prisma.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
      select: { name: true },
    }),
  ]);
  if (!member) notFound();

  return (
    <div className="flex flex-col items-center gap-6 py-10 print:py-0">
      <PrintButton />
      <div
        className="flex h-56 w-96 flex-col justify-between rounded-xl border-2 p-5 shadow-md print:shadow-none"
        style={{
          background: "linear-gradient(135deg, #0f172a, #1e3a8a)",
          color: "white",
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold tracking-wide uppercase">
            {organization.name}
          </span>
          <span className="text-xs uppercase opacity-80">Membership Card</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">
            {member.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold">{member.name}</p>
            <p className="text-xs opacity-80">{member.branch.name}</p>
          </div>
        </div>

        <div className="flex items-end justify-between text-xs">
          <div>
            <p className="opacity-70">Member ID</p>
            <p className="font-mono font-semibold">{member.memberCode}</p>
          </div>
          <div>
            <p className="opacity-70">Card No.</p>
            <p className="font-mono font-semibold">
              {member.cardNumber ?? "—"}
            </p>
          </div>
          <div>
            <p className="opacity-70">Mobile</p>
            <p className="font-mono font-semibold">{member.mobile}</p>
          </div>
        </div>
      </div>
      <p className="text-muted-foreground max-w-96 text-center text-xs print:hidden">
        Printable HTML view (C1 &quot;member ID card printing&quot;). A PDF
        export can be layered on later without changing this template.
      </p>
    </div>
  );
}
