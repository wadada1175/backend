-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- DropForeignKey
ALTER TABLE "StaffAccount" DROP CONSTRAINT "StaffAccount_staffId_fkey";

-- AddForeignKey
ALTER TABLE "StaffAccount" ADD CONSTRAINT "StaffAccount_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffProfile"("staffId") ON DELETE CASCADE ON UPDATE CASCADE;
