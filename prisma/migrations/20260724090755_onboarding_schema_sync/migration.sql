-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');

-- CreateEnum
CREATE TYPE "HighestEducation" AS ENUM ('ILLITERATE', 'PRIMARY', 'SECONDARY', 'HIGHER_SECONDARY', 'ITI', 'DIPLOMA', 'GRADUATE', 'POST_GRADUATE', 'DOCTORATE', 'OTHER');

-- AlterEnum
ALTER TYPE "Gender" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "accountHolderName" TEXT,
ADD COLUMN     "currentCity" TEXT,
ADD COLUMN     "currentPinCode" TEXT,
ADD COLUMN     "currentState" TEXT,
ADD COLUMN     "drivingLicence" TEXT,
ADD COLUMN     "education" "HighestEducation" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "maritalStatus" "MaritalStatus" NOT NULL DEFAULT 'SINGLE',
ADD COLUMN     "nomineeMobile" TEXT,
ADD COLUMN     "nomineeName" TEXT,
ADD COLUMN     "nomineePercentage" INTEGER,
ADD COLUMN     "nomineeRelation" TEXT,
ADD COLUMN     "permanentPoliceStation" TEXT,
ALTER COLUMN "pan" DROP NOT NULL,
ALTER COLUMN "branch" DROP NOT NULL,
ALTER COLUMN "micr" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Unit" ADD COLUMN     "requiredFields" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "Bank" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bank_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bank_name_key" ON "Bank"("name");
