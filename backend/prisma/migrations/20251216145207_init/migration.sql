-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MemberState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Practitioner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Practitioner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "License" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "practitionerId" TEXT NOT NULL,
    "issuingStateId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "issueDate" DATETIME,
    "expirationDate" DATETIME,
    "selfReportedStatus" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "evidenceUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "License_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "Practitioner" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "License_issuingStateId_fkey" FOREIGN KEY ("issuingStateId") REFERENCES "MemberState" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QualifyingLicenseDesignation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "practitionerId" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "effectiveFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QualifyingLicenseDesignation_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "Practitioner" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QualifyingLicenseDesignation_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LicenseStatusHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "licenseId" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL,
    "note" TEXT,
    "actorUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LicenseStatusHistory_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LicenseStatusHistory_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PrivilegeApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "practitionerId" TEXT NOT NULL,
    "remoteStateId" TEXT NOT NULL,
    "qualifyingLicenseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "applicantNote" TEXT,
    "reviewerNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PrivilegeApplication_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "Practitioner" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PrivilegeApplication_remoteStateId_fkey" FOREIGN KEY ("remoteStateId") REFERENCES "MemberState" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PrivilegeApplication_qualifyingLicenseId_fkey" FOREIGN KEY ("qualifyingLicenseId") REFERENCES "License" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApplicationStatusHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "actorUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApplicationStatusHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "PrivilegeApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ApplicationStatusHistory_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attestation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "acceptedAt" DATETIME,
    "text" TEXT,
    CONSTRAINT "Attestation_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "PrivilegeApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUIRES_PAYMENT',
    "amount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaymentTransaction_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "PrivilegeApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Privilege" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "practitionerId" TEXT NOT NULL,
    "remoteStateId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "qualifyingLicenseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Privilege_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "Practitioner" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Privilege_remoteStateId_fkey" FOREIGN KEY ("remoteStateId") REFERENCES "MemberState" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Privilege_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "PrivilegeApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Privilege_qualifyingLicenseId_fkey" FOREIGN KEY ("qualifyingLicenseId") REFERENCES "License" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PrivilegeStatusHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "privilegeId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "actorUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrivilegeStatusHistory_privilegeId_fkey" FOREIGN KEY ("privilegeId") REFERENCES "Privilege" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PrivilegeStatusHistory_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_firstName_lastName_idx" ON "User"("firstName", "lastName");

-- CreateIndex
CREATE UNIQUE INDEX "MemberState_code_key" ON "MemberState"("code");

-- CreateIndex
CREATE INDEX "MemberState_isActive_idx" ON "MemberState"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Practitioner_userId_key" ON "Practitioner"("userId");

-- CreateIndex
CREATE INDEX "License_practitionerId_idx" ON "License"("practitionerId");

-- CreateIndex
CREATE INDEX "License_issuingStateId_idx" ON "License"("issuingStateId");

-- CreateIndex
CREATE INDEX "License_licenseNumber_idx" ON "License"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "QualifyingLicenseDesignation_practitionerId_key" ON "QualifyingLicenseDesignation"("practitionerId");

-- CreateIndex
CREATE UNIQUE INDEX "QualifyingLicenseDesignation_licenseId_key" ON "QualifyingLicenseDesignation"("licenseId");

-- CreateIndex
CREATE INDEX "LicenseStatusHistory_licenseId_createdAt_idx" ON "LicenseStatusHistory"("licenseId", "createdAt");

-- CreateIndex
CREATE INDEX "PrivilegeApplication_remoteStateId_status_idx" ON "PrivilegeApplication"("remoteStateId", "status");

-- CreateIndex
CREATE INDEX "PrivilegeApplication_practitionerId_status_idx" ON "PrivilegeApplication"("practitionerId", "status");

-- CreateIndex
CREATE INDEX "PrivilegeApplication_qualifyingLicenseId_idx" ON "PrivilegeApplication"("qualifyingLicenseId");

-- CreateIndex
CREATE INDEX "ApplicationStatusHistory_applicationId_createdAt_idx" ON "ApplicationStatusHistory"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "Attestation_applicationId_type_idx" ON "Attestation"("applicationId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_applicationId_key" ON "PaymentTransaction"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "Privilege_applicationId_key" ON "Privilege"("applicationId");

-- CreateIndex
CREATE INDEX "Privilege_remoteStateId_status_idx" ON "Privilege"("remoteStateId", "status");

-- CreateIndex
CREATE INDEX "Privilege_practitionerId_status_idx" ON "Privilege"("practitionerId", "status");

-- CreateIndex
CREATE INDEX "PrivilegeStatusHistory_privilegeId_createdAt_idx" ON "PrivilegeStatusHistory"("privilegeId", "createdAt");
