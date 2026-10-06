import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth/session';
import { createMaintenanceReportSchema } from '@/lib/validators/maintenance-report';
import { auditLogger } from '@/lib/services/audit-logger';

export async function GET() {
  try {
    const session = await requireAuth();

    // Users see only their reports, technicians and admins see all
    const where = session.role === 'USER' ? { reportedById: session.userId } : {};

    const reports = await prisma.maintenanceReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        equipment: {
          select: {
            identifier: true,
            name: true,
            type: true,
          },
        },
        reportedBy: {
          select: {
            name: true,
            email: true,
          },
        },
        triageAnalysis: {
          select: {
            priority: true,
            aiSucceeded: true,
            retrievalSucceeded: true,
          },
        },
        workOrder: {
          select: {
            workOrderNumber: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: reports,
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
    const session = await requireAuth();
    const body = await request.json();
    const validated = createMaintenanceReportSchema.parse(body);

    // Verify equipment exists
    const equipment = await prisma.equipment.findUnique({
      where: { id: validated.equipmentId },
    });

    if (!equipment) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Equipment not found' } },
        { status: 404 }
      );
    }

    // Create the report with sensor readings
    const report = await prisma.maintenanceReport.create({
      data: {
        equipmentId: validated.equipmentId,
        reportedById: session.userId,
        issueDescription: validated.issueDescription,
        operatingEvents: validated.operatingEvents,
        equipmentEventIds: validated.equipmentEventIds,
        sensorReadings: {
          create: validated.sensorReadings.map((reading) => ({
            sensorDefinitionId: reading.sensorDefinitionId,
            value: reading.value,
          })),
        },
      },
      include: {
        equipment: true,
        sensorReadings: {
          include: {
            sensorDefinition: true,
          },
        },
      },
    });

    await auditLogger.logMaintenanceReportCreated(report.id, session.userId);

    return NextResponse.json(
      {
        success: true,
        data: report,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
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
