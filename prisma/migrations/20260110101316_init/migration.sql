-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('APARTMENT', 'OUTDOOR', 'BUILDING_COMMON');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cat" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hungerLevel" INTEGER NOT NULL DEFAULT 0,
    "lastFedAt" TIMESTAMP(3),
    "lastHungerUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Apartment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Apartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutdoorLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutdoorLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationReport" (
    "id" TEXT NOT NULL,
    "catId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locationType" "LocationType" NOT NULL,
    "apartmentId" TEXT,
    "outdoorLocationId" TEXT,
    "buildingAreaName" TEXT,
    "entryTime" TIMESTAMP(3) NOT NULL,
    "exitTime" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocationReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Cat_name_idx" ON "Cat"("name");

-- CreateIndex
CREATE INDEX "Apartment_userId_idx" ON "Apartment"("userId");

-- CreateIndex
CREATE INDEX "LocationReport_catId_entryTime_idx" ON "LocationReport"("catId", "entryTime");

-- CreateIndex
CREATE INDEX "LocationReport_userId_idx" ON "LocationReport"("userId");

-- CreateIndex
CREATE INDEX "LocationReport_apartmentId_idx" ON "LocationReport"("apartmentId");

-- CreateIndex
CREATE INDEX "LocationReport_outdoorLocationId_idx" ON "LocationReport"("outdoorLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "AppSettings_key_key" ON "AppSettings"("key");

-- CreateIndex
CREATE INDEX "AppSettings_key_idx" ON "AppSettings"("key");

-- AddForeignKey
ALTER TABLE "Apartment" ADD CONSTRAINT "Apartment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationReport" ADD CONSTRAINT "LocationReport_catId_fkey" FOREIGN KEY ("catId") REFERENCES "Cat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationReport" ADD CONSTRAINT "LocationReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationReport" ADD CONSTRAINT "LocationReport_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationReport" ADD CONSTRAINT "LocationReport_outdoorLocationId_fkey" FOREIGN KEY ("outdoorLocationId") REFERENCES "OutdoorLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
