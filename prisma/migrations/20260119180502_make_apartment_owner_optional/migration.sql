-- DropIndex
DROP INDEX "Apartment_userId_key";

-- AlterTable
ALTER TABLE "Apartment" ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Apartment_userId_idx" ON "Apartment"("userId");
