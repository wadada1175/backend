/*
  Warnings:

  - You are about to drop the column `needQualificationMember` on the `ProjectDescription` table. All the data in the column will be lost.
  - You are about to drop the column `needmember` on the `ProjectDescription` table. All the data in the column will be lost.
  - Added the required column `qualifiedMembersNeeded` to the `ProjectDescription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requiredMembers` to the `ProjectDescription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProjectDescription" DROP COLUMN "needQualificationMember",
DROP COLUMN "needmember",
ADD COLUMN     "qualifiedMembersNeeded" INTEGER NOT NULL,
ADD COLUMN     "requiredMembers" INTEGER NOT NULL;
