import { z } from 'zod';

export const sensorReadingSchema = z.object({
  sensorDefinitionId: z.string().uuid(),
  value: z.number().nullable(),
});

export const createMaintenanceReportSchema = z.object({
  equipmentId: z.string().uuid('Invalid equipment ID'),
  issueDescription: z.string().min(10, 'Issue description must be at least 10 characters').max(2000),
  operatingEvents: z.array(z.string()).min(1, 'At least one operating event is required'),
  equipmentEventIds: z.array(z.string().uuid()).optional().default([]),
  sensorReadings: z.array(sensorReadingSchema).optional().default([]),
});

export type CreateMaintenanceReportInput = z.infer<typeof createMaintenanceReportSchema>;
export type SensorReadingInput = z.infer<typeof sensorReadingSchema>;
