import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth/session';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const report = await prisma.maintenanceReport.findUnique({
      where: { id },
      include: {
        equipment: true,
        reportedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sensorReadings: {
          include: {
            sensorDefinition: {
              include: {
                thresholds: true,
              },
            },
          },
        },
        equipmentEvents: true,
        triageAnalysis: {
          include: {
            evidence: {
              include: {
                knowledgeChunk: {
                  include: {
                    document: {
                      select: {
                        title: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        workOrder: {
          include: {
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
            rejectedBy: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Report not found' } },
        { status: 404 }
      );
    }

    // Check authorization: users can only see their own reports
    if (session.role === 'USER' && report.reportedById !== session.userId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: report,
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
