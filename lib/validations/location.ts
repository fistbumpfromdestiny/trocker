import { z } from 'zod';
import { LocationType } from '@prisma/client';

export const reportLocationSchema = z.object({
  catId: z.string(),
  locationType: z.nativeEnum(LocationType),
  apartmentId: z.string().optional(),
  outdoorLocationId: z.string().optional(),
  buildingAreaName: z.string().optional(),
  entryTime: z.string().or(z.date()).transform((val) => new Date(val)),
  notes: z.string().optional(),
});

export type ReportLocationInput = z.infer<typeof reportLocationSchema>;
