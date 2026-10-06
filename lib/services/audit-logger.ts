import prisma from '../db';

export interface AuditLogEntry {
  userId?: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLogger {
  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: entry.userId,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId,
          metadata: entry.metadata,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
        },
      });
    } catch (error) {
      // Don't fail the request if audit logging fails
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Log equipment creation
   */
  async logEquipmentCreated(equipmentId: string, userId: string): Promise<void> {
    await this.log({
      userId,
      action: 'EQUIPMENT_CREATED',
      entity: 'Equipment',
      entityId: equipmentId,
    });
  }

  /**
   * Log maintenance report creation
   */
  async logMaintenanceReportCreated(reportId: string, userId: string): Promise<void> {
    await this.log({
      userId,
      action: 'MAINTENANCE_REPORT_CREATED',
      entity: 'MaintenanceReport',
      entityId: reportId,
    });
  }

  /**
   * Log triage analysis generation
   */
  async logTriageAnalysisGenerated(
    analysisId: string,
    userId: string,
    aiSucceeded: boolean,
    retrievalSucceeded: boolean
  ): Promise<void> {
    await this.log({
      userId,
      action: 'TRIAGE_ANALYSIS_GENERATED',
      entity: 'TriageAnalysis',
      entityId: analysisId,
      metadata: {
        aiSucceeded,
        retrievalSucceeded,
      },
    });
  }

  /**
   * Log work order creation
   */
  async logWorkOrderCreated(workOrderId: string, userId: string): Promise<void> {
    await this.log({
      userId,
      action: 'WORK_ORDER_CREATED',
      entity: 'WorkOrder',
      entityId: workOrderId,
    });
  }

  /**
   * Log work order edit
   */
  async logWorkOrderEdited(workOrderId: string, userId: string, changes: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      action: 'WORK_ORDER_EDITED',
      entity: 'WorkOrder',
      entityId: workOrderId,
      metadata: { changes },
    });
  }

  /**
   * Log work order approval
   */
  async logWorkOrderApproved(workOrderId: string, userId: string): Promise<void> {
    await this.log({
      userId,
      action: 'WORK_ORDER_APPROVED',
      entity: 'WorkOrder',
      entityId: workOrderId,
    });
  }

  /**
   * Log work order rejection
   */
  async logWorkOrderRejected(workOrderId: string, userId: string, reason: string): Promise<void> {
    await this.log({
      userId,
      action: 'WORK_ORDER_REJECTED',
      entity: 'WorkOrder',
      entityId: workOrderId,
      metadata: { reason },
    });
  }

  /**
   * Log document upload
   */
  async logDocumentUploaded(documentId: string, userId: string, filename: string): Promise<void> {
    await this.log({
      userId,
      action: 'DOCUMENT_UPLOADED',
      entity: 'KnowledgeDocument',
      entityId: documentId,
      metadata: { filename },
    });
  }

  /**
   * Log document processing completion
   */
  async logDocumentProcessed(
    documentId: string,
    userId: string,
    success: boolean,
    chunksCreated: number
  ): Promise<void> {
    await this.log({
      userId,
      action: 'DOCUMENT_PROCESSED',
      entity: 'KnowledgeDocument',
      entityId: documentId,
      metadata: {
        success,
        chunksCreated,
      },
    });
  }
}

export const auditLogger = new AuditLogger();
