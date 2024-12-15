-- CreateTable
CREATE TABLE "StaffAccount" (
    "id" SERIAL NOT NULL,
    "staffId" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "StaffAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffProfile" (
    "id" SERIAL NOT NULL,
    "staffId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "romanname" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "phonenumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "birthday" TIMESTAMP(3) NOT NULL,
    "hiredate" TIMESTAMP(3) NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "StaffProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" SERIAL NOT NULL,
    "nameOfEmergency" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "staffProfileId" INTEGER NOT NULL,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NGStaff" (
    "id" SERIAL NOT NULL,
    "staffProfileId" INTEGER NOT NULL,
    "ngStaffId" INTEGER NOT NULL,

    CONSTRAINT "NGStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffQualification" (
    "id" SERIAL NOT NULL,
    "staffProfileId" INTEGER NOT NULL,
    "qualificationId" INTEGER NOT NULL,

    CONSTRAINT "StaffQualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Qualification" (
    "id" SERIAL NOT NULL,
    "qualificationName" TEXT NOT NULL,

    CONSTRAINT "Qualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "companyName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phonenumber" TEXT NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "projectName" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectDescription" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "workDate" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "address" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "phonenumber" TEXT NOT NULL,
    "managerName" TEXT NOT NULL,
    "needmember" INTEGER NOT NULL,
    "needQualificationMember" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "workTimeType" TEXT NOT NULL,
    "memo" TEXT NOT NULL,

    CONSTRAINT "ProjectDescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectQualification" (
    "id" SERIAL NOT NULL,
    "projectDescriptionId" INTEGER NOT NULL,
    "qualificationId" INTEGER NOT NULL,

    CONSTRAINT "ProjectQualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "id" SERIAL NOT NULL,
    "projectDescriptionId" INTEGER NOT NULL,
    "staffProfileId" INTEGER NOT NULL,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" SERIAL NOT NULL,
    "staffProfileId" INTEGER NOT NULL,
    "ProjectMemberId" INTEGER NOT NULL,
    "clockIn" BOOLEAN NOT NULL,
    "clockOut" BOOLEAN NOT NULL,
    "clockInTime" TIMESTAMP(3) NOT NULL,
    "clockOutTime" TIMESTAMP(3) NOT NULL,
    "submitPaper" TEXT NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftReq" (
    "id" SERIAL NOT NULL,
    "staffProfileId" INTEGER NOT NULL,
    "projectDescriptionId" INTEGER NOT NULL,
    "workDate" TIMESTAMP(3) NOT NULL,
    "reqOffDate" TIMESTAMP(3) NOT NULL,
    "memo" TEXT NOT NULL,

    CONSTRAINT "ShiftReq_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffAccount_staffId_key" ON "StaffAccount"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_staffId_key" ON "StaffProfile"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_email_key" ON "StaffProfile"("email");

-- AddForeignKey
ALTER TABLE "StaffAccount" ADD CONSTRAINT "StaffAccount_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffProfile"("staffId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "StaffProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NGStaff" ADD CONSTRAINT "NGStaff_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "StaffProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NGStaff" ADD CONSTRAINT "NGStaff_ngStaffId_fkey" FOREIGN KEY ("ngStaffId") REFERENCES "StaffProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffQualification" ADD CONSTRAINT "StaffQualification_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "StaffProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffQualification" ADD CONSTRAINT "StaffQualification_qualificationId_fkey" FOREIGN KEY ("qualificationId") REFERENCES "Qualification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDescription" ADD CONSTRAINT "ProjectDescription_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectQualification" ADD CONSTRAINT "ProjectQualification_projectDescriptionId_fkey" FOREIGN KEY ("projectDescriptionId") REFERENCES "ProjectDescription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectQualification" ADD CONSTRAINT "ProjectQualification_qualificationId_fkey" FOREIGN KEY ("qualificationId") REFERENCES "Qualification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectDescriptionId_fkey" FOREIGN KEY ("projectDescriptionId") REFERENCES "ProjectDescription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "StaffProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "StaffProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_ProjectMemberId_fkey" FOREIGN KEY ("ProjectMemberId") REFERENCES "ProjectMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftReq" ADD CONSTRAINT "ShiftReq_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "StaffProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
