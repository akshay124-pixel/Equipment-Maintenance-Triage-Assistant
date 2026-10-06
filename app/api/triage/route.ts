import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { triageService } from '@/lib/services/triage-service';
import { auditLogger } from '@/lib/services/audit-logger';
import { z } from 'zod';

const triageRequestSchema = z.object({
  maintenanceReportId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const validated = triageRequestSchema.parse(body);

    // Perform triage analysis
    const result = await triageService.performTriage({
      maintenanceReportId: validated.maintenanceReportId,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TRIAGE_FAILED',
            message: result.error || 'Triage analysis failed',
          },
        },
        { status: 500 }
      );
    }

    // Log the triage analysis
    await auditLogger.logTriageAnalysisGenerated(
      result.triageAnalysisId,
      session.userId,
      result.aiSucceeded,
      result.retrievalSucceeded
    );

    return NextResponse.json({
      success: true,
      data: {
        triageAnalysisId: result.triageAnalysisId,
        aiSucceeded: result.aiSucceeded,
        retrievalSucceeded: result.retrievalSucceeded,
      },
    });
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
