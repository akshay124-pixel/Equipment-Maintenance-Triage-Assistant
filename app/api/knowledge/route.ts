import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { documentProcessor } from '@/lib/services/document-processor';
import { auditLogger } from '@/lib/services/audit-logger';

export async function GET() {
  try {
    await requireRole(['TECHNICIAN', 'ADMIN']);

    const documents = await prisma.knowledgeDocument.findMany({
      orderBy: { uploadedAt: 'desc' },
      include: {
        _count: {
          select: {
            chunks: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: documents,
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

export async function POST(request: Request) {
  try {
    const session = await requireRole(['ADMIN']);
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const equipmentType = formData.get('equipmentType') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FILE', message: 'No file provided' } },
        { status: 400 }
      );
    }

    if (!equipmentType) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_EQUIPMENT_TYPE', message: 'Equipment type required' } },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_FILE_TYPE', message: 'Only PDF and text files supported' } },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: { code: 'FILE_TOO_LARGE', message: 'File size exceeds 10MB limit' } },
        { status: 400 }
      );
    }

    // Create document record
    const document = await prisma.knowledgeDocument.create({
      data: {
        title: file.name,
        equipmentType,
        filename: file.name,
        fileSize: file.size,
        mimeType: file.type,
        processingStatus: 'pending',
      },
    });

    await auditLogger.logDocumentUploaded(document.id, session.userId, file.name);

    // Process document asynchronously
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Start processing (in production, this would be a background job)
    documentProcessor.processDocument(document.id, buffer, file.type).then(result => {
      auditLogger.logDocumentProcessed(
        document.id,
        session.userId,
        result.success,
        result.chunksCreated
      );
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: document.id,
          title: document.title,
          processingStatus: 'pending',
        },
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

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
