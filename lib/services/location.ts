import { prisma } from '@/lib/db';
import { LocationType } from '@prisma/client';

interface ReportLocationParams {
  catId: string;
  userId: string;
  locationType: LocationType;
  apartmentId?: string;
  outdoorLocationId?: string;
  buildingAreaName?: string;
  entryTime: Date;
  notes?: string;
}

export async function reportLocation(params: ReportLocationParams) {
  const {
    catId,
    userId,
    locationType,
    apartmentId,
    outdoorLocationId,
    buildingAreaName,
    entryTime,
    notes,
  } = params;

  // Get the current/most recent location (one without exit time)
  const currentLocation = await prisma.locationReport.findFirst({
    where: {
      catId,
      exitTime: null,
    },
    orderBy: {
      entryTime: 'desc',
    },
  });

  // Auto-fill exit time of previous location
  if (currentLocation) {
    await prisma.locationReport.update({
      where: { id: currentLocation.id },
      data: { exitTime: entryTime },
    });
  }

  // Create new location report
  const newReport = await prisma.locationReport.create({
    data: {
      catId,
      userId,
      locationType,
      apartmentId,
      outdoorLocationId,
      buildingAreaName,
      entryTime,
      exitTime: null, // Current location
      notes,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      apartment: true,
      outdoorLocation: true,
    },
  });

  return newReport;
}

export async function getCurrentLocation(catId: string) {
  return await prisma.locationReport.findFirst({
    where: {
      catId,
      exitTime: null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      apartment: true,
      outdoorLocation: true,
    },
    orderBy: {
      entryTime: 'desc',
    },
  });
}

export async function getLocationTimeline(catId: string, limit: number = 50) {
  return await prisma.locationReportV2.findMany({
    where: { catId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      location: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      apartment: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      entryTime: 'desc',
    },
    take: limit,
  });
}
