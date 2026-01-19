-- DropForeignKey
ALTER TABLE "LocationReport" DROP CONSTRAINT "LocationReport_userId_fkey";

-- DropForeignKey
ALTER TABLE "LocationReportV2" DROP CONSTRAINT "LocationReportV2_userId_fkey";

-- AlterTable
ALTER TABLE "LocationReport" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LocationReportV2" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "LocationReport" ADD CONSTRAINT "LocationReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationReportV2" ADD CONSTRAINT "LocationReportV2_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
