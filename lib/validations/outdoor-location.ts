import { z } from 'zod';

export const createOutdoorLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
  description: z.string().optional(),
});

export const updateOutdoorLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required').optional(),
  description: z.string().optional(),
});

export type CreateOutdoorLocationInput = z.infer<typeof createOutdoorLocationSchema>;
export type UpdateOutdoorLocationInput = z.infer<typeof updateOutdoorLocationSchema>;
