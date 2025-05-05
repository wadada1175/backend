/*
  Warnings:

  - Added the required column `checkInPlace` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `checkOutPlace` to the `Attendance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "checkInPlace" TEXT NOT NULL,
ADD COLUMN     "checkOutPlace" TEXT NOT NULL;
