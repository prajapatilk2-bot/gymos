-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('active', 'inactive', 'expired', 'suspended', 'frozen');

-- CreateEnum
CREATE TYPE "MemberTag" AS ENUM ('vip', 'personal_training', 'trial', 'corporate', 'couple', 'family');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');

-- CreateEnum
CREATE TYPE "MemberDocumentType" AS ENUM ('id_proof', 'address_proof', 'photo', 'agreement', 'waiver', 'medical_certificate', 'other');

-- CreateEnum
CREATE TYPE "MemberConsentType" AS ENUM ('waiver', 'terms_and_conditions', 'marketing_communication', 'data_processing', 'photo_video_usage', 'health_data_processing');

-- CreateEnum
CREATE TYPE "GuestPassType" AS ENUM ('guest_pass', 'trial_pass');

-- AlterTable
ALTER TABLE "organization" ADD COLUMN     "memberSequence" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "member" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "memberCode" TEXT NOT NULL,
    "cardNumber" TEXT,
    "name" TEXT NOT NULL,
    "photoUrl" TEXT,
    "mobile" TEXT NOT NULL,
    "whatsappNumber" TEXT,
    "email" TEXT,
    "dateOfBirth" TEXT,
    "gender" "Gender",
    "address" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelation" TEXT,
    "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joiningDate" TIMESTAMP(3),
    "leadSource" TEXT,
    "occupation" TEXT,
    "fitnessGoals" TEXT,
    "assignedTrainerId" TEXT,
    "membershipPreference" TEXT,
    "status" "MemberStatus" NOT NULL DEFAULT 'active',
    "tags" "MemberTag"[],
    "mergedIntoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_health_declaration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "hasMedicalConditions" BOOLEAN NOT NULL DEFAULT false,
    "medicalConditions" TEXT,
    "injuries" TEXT,
    "medications" TEXT,
    "allergies" TEXT,
    "physicianName" TEXT,
    "physicianPhone" TEXT,
    "precautions" TEXT,
    "declaredAt" TIMESTAMP(3),
    "declaredById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "member_health_declaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_document" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "type" "MemberDocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "member_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_consent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "type" "MemberConsentType" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "member_consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitor" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "purpose" TEXT,
    "hostMemberId" TEXT,
    "checkInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "visitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_pass" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "type" "GuestPassType" NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "issuedByMemberId" TEXT,
    "issuedById" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "convertedToMemberId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "guest_pass_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "member_organizationId_status_idx" ON "member"("organizationId", "status");

-- CreateIndex
CREATE INDEX "member_organizationId_branchId_idx" ON "member"("organizationId", "branchId");

-- CreateIndex
CREATE INDEX "member_organizationId_mobile_idx" ON "member"("organizationId", "mobile");

-- CreateIndex
CREATE INDEX "member_organizationId_email_idx" ON "member"("organizationId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "member_organizationId_memberCode_key" ON "member"("organizationId", "memberCode");

-- CreateIndex
CREATE UNIQUE INDEX "member_organizationId_cardNumber_key" ON "member"("organizationId", "cardNumber");

-- CreateIndex
CREATE UNIQUE INDEX "member_health_declaration_memberId_key" ON "member_health_declaration"("memberId");

-- CreateIndex
CREATE INDEX "member_health_declaration_organizationId_idx" ON "member_health_declaration"("organizationId");

-- CreateIndex
CREATE INDEX "member_document_organizationId_memberId_idx" ON "member_document"("organizationId", "memberId");

-- CreateIndex
CREATE INDEX "member_consent_organizationId_memberId_idx" ON "member_consent"("organizationId", "memberId");

-- CreateIndex
CREATE INDEX "visitor_organizationId_branchId_idx" ON "visitor"("organizationId", "branchId");

-- CreateIndex
CREATE INDEX "visitor_organizationId_checkInAt_idx" ON "visitor"("organizationId", "checkInAt");

-- CreateIndex
CREATE INDEX "guest_pass_organizationId_branchId_idx" ON "guest_pass"("organizationId", "branchId");

-- CreateIndex
CREATE INDEX "guest_pass_organizationId_type_idx" ON "guest_pass"("organizationId", "type");

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_mergedIntoId_fkey" FOREIGN KEY ("mergedIntoId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_health_declaration" ADD CONSTRAINT "member_health_declaration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_health_declaration" ADD CONSTRAINT "member_health_declaration_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_document" ADD CONSTRAINT "member_document_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_document" ADD CONSTRAINT "member_document_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_consent" ADD CONSTRAINT "member_consent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_consent" ADD CONSTRAINT "member_consent_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor" ADD CONSTRAINT "visitor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor" ADD CONSTRAINT "visitor_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_pass" ADD CONSTRAINT "guest_pass_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_pass" ADD CONSTRAINT "guest_pass_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_pass" ADD CONSTRAINT "guest_pass_issuedByMemberId_fkey" FOREIGN KEY ("issuedByMemberId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
