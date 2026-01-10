import { z } from 'zod';

export const createApartmentSchema = z.object({
  name: z.string().min(1, 'Apartment name is required'),
  description: z.string().optional(),
});

export const updateApartmentSchema = z.object({
  name: z.string().min(1, 'Apartment name is required').optional(),
  description: z.string().optional(),
});

export type CreateApartmentInput = z.infer<typeof createApartmentSchema>;
export type UpdateApartmentInput = z.infer<typeof updateApartmentSchema>;
