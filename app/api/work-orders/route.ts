import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth/session';
import { generateWorkOrderNumber } from '@/lib/utils/work-order';
import { auditLogger } from '@/lib/services/audit-logger';
import { z } from 'zod';

const createWorkOrderSchema = z.object({
  maintenanceReportId: z.string().uuid(),
  triageAnalysisId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  recommendedActions: z.array(z.string()),
});

export async function GET() {
  try {
    const session = await requireAuth();

    // Technicians and admins see all, users see work orders related to their reports
    const where =
      session.role === 'USER'
        ? {
            maintenanceReport: {
              reportedById: session.userId,
            },
          }
        : {};

    const workOrders = await prisma.workOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        maintenanceReport: {
          include: {
            equipment: {
              select: {
                identifier: true,
                name: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
        approvedBy: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: workOrders,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(['TECHNICIAN', 'ADMIN']);
    const body = await request.json();
    const validated = createWorkOrderSchema.parse(body);

    // Check if work order already exists for this report
    const existing = await prisma.workOrder.findUnique({
      where: { maintenanceReportId: validated.maintenanceReportId },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'WORK_ORDER_EXISTS',
            message: 'Work order already exists for this maintenance report',
          },
        },
        { status: 409 }
      );
    }

    const workOrder = await prisma.workOrder.create({
      data: {
        workOrderNumber: generateWorkOrderNumber(),
        maintenanceReportId: validated.maintenanceReportId,
        triageAnalysisId: validated.triageAnalysisId,
        title: validated.title,
        description: validated.description,
        priority: validated.priority,
        recommendedActions: validated.recommendedActions,
        status: 'DRAFT',
        createdById: session.userId,
      },
      include: {
        maintenanceReport: {
          include: {
            equipment: true,
          },
        },
      },
    });

    await auditLogger.logWorkOrderCreated(workOrder.id, session.userId);

    return NextResponse.json(
      {
        success: true,
        data: workOrder,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input data' } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
