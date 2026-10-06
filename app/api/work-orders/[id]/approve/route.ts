import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { auditLogger } from '@/lib/services/audit-logger';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(['TECHNICIAN', 'ADMIN']);
    const { id } = await params;

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Work order not found' } },
        { status: 404 }
      );
    }

    if (workOrder.status === 'APPROVED') {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_APPROVED', message: 'Work order already approved' } },
        { status: 400 }
      );
    }

    if (workOrder.status === 'REJECTED') {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_REJECTED', message: 'Cannot approve rejected work order' } },
        { status: 400 }
      );
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: session.userId,
        approvedAt: new Date(),
      },
    });

    await auditLogger.logWorkOrderApproved(updated.id, session.userId);

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
