/*
  Warnings:

  - Added the required column `numberOfMembersNeeded` to the `ProjectQualification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProjectQualification" ADD COLUMN     "numberOfMembersNeeded" INTEGER NOT NULL;
