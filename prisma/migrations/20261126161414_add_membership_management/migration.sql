-- CreateEnum
CREATE TYPE "PackageDurationUnit" AS ENUM ('day', 'week', 'month', 'year');

-- CreateEnum
CREATE TYPE "PackageCategory" AS ENUM ('general', 'student', 'couple', 'family', 'corporate', 'off_peak', 'premium', 'vip', 'cardio_only', 'group_class', 'bundled', 'custom');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('active', 'inactive', 'archived');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('active', 'frozen', 'cancelled');

-- CreateEnum
CREATE TYPE "MembershipPaymentStatus" AS ENUM ('unpaid', 'partially_paid', 'paid');

-- CreateTable
CREATE TABLE "package" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "durationUnit" "PackageDurationUnit" NOT NULL,
    "durationValue" INTEGER NOT NULL,
    "category" "PackageCategory" NOT NULL DEFAULT 'general',
    "isTrial" BOOLEAN NOT NULL DEFAULT false,
    "isLimitedVisit" BOOLEAN NOT NULL DEFAULT false,
    "visitLimit" INTEGER,
    "priceInPaise" INTEGER NOT NULL,
    "joiningFeeInPaise" INTEGER NOT NULL DEFAULT 0,
    "registrationFeeInPaise" INTEGER NOT NULL DEFAULT 0,
    "isTaxable" BOOLEAN NOT NULL DEFAULT true,
    "defaultDiscountPercent" INTEGER,
    "earlyRenewalDiscountPercent" INTEGER,
    "couponCode" TEXT,
    "ptSessionsIncluded" INTEGER NOT NULL DEFAULT 0,
    "groupClassesIncluded" INTEGER NOT NULL DEFAULT 0,
    "guestPassesIncluded" INTEGER NOT NULL DEFAULT 0,
    "freebieEntitlements" JSONB,
    "accessWindowStart" TEXT,
    "accessWindowEnd" TEXT,
    "allBranches" BOOLEAN NOT NULL DEFAULT true,
    "cancellationPolicy" TEXT,
    "freezeAllowed" BOOLEAN NOT NULL DEFAULT true,
    "freezeMaxDaysPerYear" INTEGER NOT NULL DEFAULT 30,
    "freezeMaxCount" INTEGER NOT NULL DEFAULT 2,
    "freezeMinNoticeDays" INTEGER NOT NULL DEFAULT 0,
    "transferAllowed" BOOLEAN NOT NULL DEFAULT true,
    "refundPolicy" TEXT,
    "status" "PackageStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_branch" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "originalExpiryDate" TIMESTAMP(3) NOT NULL,
    "priceAtPurchaseInPaise" INTEGER NOT NULL,
    "joiningFeeChargedInPaise" INTEGER NOT NULL DEFAULT 0,
    "discountAppliedInPaise" INTEGER NOT NULL DEFAULT 0,
    "couponCode" TEXT,
    "ptSessionsRemaining" INTEGER NOT NULL DEFAULT 0,
    "groupClassesRemaining" INTEGER NOT NULL DEFAULT 0,
    "guestPassesRemaining" INTEGER NOT NULL DEFAULT 0,
    "freezeDaysUsed" INTEGER NOT NULL DEFAULT 0,
    "freezeCount" INTEGER NOT NULL DEFAULT 0,
    "paymentDueAmountInPaise" INTEGER NOT NULL DEFAULT 0,
    "paymentStatus" "MembershipPaymentStatus" NOT NULL DEFAULT 'unpaid',
    "renewedFromId" TEXT,
    "upgradedFromId" TEXT,
    "downgradedFromId" TEXT,
    "transferredFromId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_freeze" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "reason" TEXT,
    "approvalRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "membership_freeze_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "package_organizationId_status_idx" ON "package"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "package_branch_packageId_branchId_key" ON "package_branch"("packageId", "branchId");

-- CreateIndex
CREATE INDEX "membership_organizationId_status_idx" ON "membership"("organizationId", "status");

-- CreateIndex
CREATE INDEX "membership_organizationId_memberId_idx" ON "membership"("organizationId", "memberId");

-- CreateIndex
CREATE INDEX "membership_organizationId_branchId_idx" ON "membership"("organizationId", "branchId");

-- CreateIndex
CREATE INDEX "membership_organizationId_expiryDate_idx" ON "membership"("organizationId", "expiryDate");

-- CreateIndex
CREATE INDEX "membership_freeze_organizationId_membershipId_idx" ON "membership_freeze"("organizationId", "membershipId");

-- AddForeignKey
ALTER TABLE "package" ADD CONSTRAINT "package_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_branch" ADD CONSTRAINT "package_branch_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_branch" ADD CONSTRAINT "package_branch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_renewedFromId_fkey" FOREIGN KEY ("renewedFromId") REFERENCES "membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_upgradedFromId_fkey" FOREIGN KEY ("upgradedFromId") REFERENCES "membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_downgradedFromId_fkey" FOREIGN KEY ("downgradedFromId") REFERENCES "membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_transferredFromId_fkey" FOREIGN KEY ("transferredFromId") REFERENCES "membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_freeze" ADD CONSTRAINT "membership_freeze_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_freeze" ADD CONSTRAINT "membership_freeze_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
