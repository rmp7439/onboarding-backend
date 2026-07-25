/*
  Warnings:

  - You are about to drop the column `email` on the `Admin` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `Admin` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `Admin` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Admin_email_key";

ALTER TABLE "Admin"
ADD COLUMN "username" TEXT;

UPDATE "Admin"
SET "username" = 'dev'
WHERE "username" IS NULL;

ALTER TABLE "Admin"
ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX "Admin_username_key"
ON "Admin"("username");