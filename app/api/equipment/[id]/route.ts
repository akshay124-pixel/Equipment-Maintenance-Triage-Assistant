import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth/session';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        sensorDefinitions: {
          include: {
            thresholds: true,
          },
        },
        maintenanceReports: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            reportedBy: {
              select: {
                name: true,
                email: true,
              },
            },
            triageAnalysis: {
              select: {
                priority: true,
                createdAt: true,
              },
            },
          },
        },
        maintenanceHistory: {
          orderBy: { completedAt: 'desc' },
          take: 10,
          include: {
            workOrder: {
              select: {
                workOrderNumber: true,
                title: true,
                priority: true,
              },
            },
            completedBy: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!equipment) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Equipment not found' } },
        { status: 404 }
      );
    }

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
