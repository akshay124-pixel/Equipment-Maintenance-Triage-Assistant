import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { rejectWorkOrderSchema } from '@/lib/validators/work-order';
import { auditLogger } from '@/lib/services/audit-logger';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['TECHNICIAN', 'ADMIN']);
    const body = await request.json();
    const validated = rejectWorkOrderSchema.parse(body);

    const workOrder = await prisma.workOrder.findUnique({
      where: { id: params.id },
    });

    if (!workOrder) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Work order not found' } },
        { status: 404 }
      );
    }

    if (workOrder.status === 'APPROVED') {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_APPROVED', message: 'Cannot reject approved work order' } },
        { status: 400 }
      );
    }

    if (workOrder.status === 'REJECTED') {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_REJECTED', message: 'Work order already rejected' } },
        { status: 400 }
      );
    }

    const updated = await prisma.workOrder.update({
      where: { id: params.id },
      data: {
        status: 'REJECTED',
        rejectedById: session.userId,
        rejectedAt: new Date(),
        rejectionReason: validated.rejectionReason,
      },
    });

    await auditLogger.logWorkOrderRejected(updated.id, session.userId, validated.rejectionReason);

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
