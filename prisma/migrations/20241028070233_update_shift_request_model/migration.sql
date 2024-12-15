/*
  Warnings:

  - You are about to drop the `ShiftReq` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('SHIFT', 'LEAVE');

-- DropForeignKey
ALTER TABLE "ShiftReq" DROP CONSTRAINT "ShiftReq_staffProfileId_fkey";

-- DropTable
DROP TABLE "ShiftReq";

-- CreateTable
CREATE TABLE "ShiftRequest" (
    "id" SERIAL NOT NULL,
    "staffProfileId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "requestType" "RequestType" NOT NULL,
    "memo" TEXT,
    "projectDescriptionId" INTEGER,

    CONSTRAINT "ShiftRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShiftRequest_staffProfileId_idx" ON "ShiftRequest"("staffProfileId");

-- CreateIndex
CREATE INDEX "ShiftRequest_projectDescriptionId_idx" ON "ShiftRequest"("projectDescriptionId");

-- AddForeignKey
ALTER TABLE "ShiftRequest" ADD CONSTRAINT "ShiftRequest_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "StaffProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftRequest" ADD CONSTRAINT "ShiftRequest_projectDescriptionId_fkey" FOREIGN KEY ("projectDescriptionId") REFERENCES "ProjectDescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
