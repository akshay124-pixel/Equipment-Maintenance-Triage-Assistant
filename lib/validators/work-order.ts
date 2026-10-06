import { z } from 'zod';

export const updateWorkOrderSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  recommendedActions: z.array(z.string()).optional(),
});

export const approveWorkOrderSchema = z.object({
  approvedById: z.string().uuid(),
});

export const rejectWorkOrderSchema = z.object({
  rejectedById: z.string().uuid(),
  rejectionReason: z.string().min(10, 'Rejection reason must be at least 10 characters'),
});

export type UpdateWorkOrderInput = z.infer<typeof updateWorkOrderSchema>;
export type ApproveWorkOrderInput = z.infer<typeof approveWorkOrderSchema>;
export type RejectWorkOrderInput = z.infer<typeof rejectWorkOrderSchema>;
