import { z } from 'zod';

export const createEquipmentSchema = z.object({
  identifier: z.string().min(1, 'Equipment identifier is required').max(50),
  name: z.string().min(1, 'Equipment name is required').max(200),
  type: z.string().min(1, 'Equipment type is required').max(100),
  description: z.string().max(1000).optional(),
  location: z.string().min(1, 'Location is required').max(200),
  status: z.enum(['OPERATIONAL', 'MAINTENANCE_REQUIRED', 'IN_MAINTENANCE', 'OUT_OF_SERVICE', 'DECOMMISSIONED']).optional(),
});

export const updateEquipmentSchema = createEquipmentSchema.partial();

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
