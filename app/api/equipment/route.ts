import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth/session';
import { createEquipmentSchema } from '@/lib/validators/equipment';
import { auditLogger } from '@/lib/services/audit-logger';

export async function GET() {
  try {
    await requireAuth();

    const equipment = await prisma.equipment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            maintenanceReports: true,
            sensorDefinitions: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: equipment,
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
    const session = await requireRole(['ADMIN', 'TECHNICIAN']);
    const body = await request.json();
    const validated = createEquipmentSchema.parse(body);

    // Check for duplicate identifier
    const existing = await prisma.equipment.findUnique({
      where: { identifier: validated.identifier },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE_IDENTIFIER', message: 'Equipment identifier already exists' } },
        { status: 409 }
      );
    }

    const equipment = await prisma.equipment.create({
      data: validated,
    });

    await auditLogger.logEquipmentCreated(equipment.id, session.userId);

    return NextResponse.json(
      {
        success: true,
        data: equipment,
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
