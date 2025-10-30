/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Invite` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `Invite` table. All the data in the column will be lost.
  - You are about to drop the column `token` on the `Invite` table. All the data in the column will be lost.
  - You are about to drop the column `active` on the `Member` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email,organizationId]` on the table `Invite` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `expireAt` to the `Invite` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Organization` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Invite_organizationId_idx";

-- DropIndex
DROP INDEX "public"."Invite_token_key";

-- AlterTable
ALTER TABLE "Invite" DROP COLUMN "createdAt",
DROP COLUMN "expiresAt",
DROP COLUMN "token",
ADD COLUMN     "expireAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Member" DROP COLUMN "active";

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Invite_email_organizationId_key" ON "Invite"("email", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
