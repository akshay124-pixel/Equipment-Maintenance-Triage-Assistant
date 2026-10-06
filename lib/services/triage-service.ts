import prisma from '../db';
import { createAIProvider } from '../ai/provider-factory';
import { thresholdEngine } from './threshold-engine';
import { ragRetrieval } from './rag-retrieval';
import { TriageInput } from '../ai/types';
import { MaintenancePriority } from '@prisma/client';

export interface TriageRequest {
  maintenanceReportId: string;
}

export interface TriageResponse {
  triageAnalysisId: string;
  success: boolean;
  aiSucceeded: boolean;
  retrievalSucceeded: boolean;
  error?: string;
}

export class TriageService {
  /**
   * Perform complete triage analysis
   */
  async performTriage(request: TriageRequest): Promise<TriageResponse> {
    const { maintenanceReportId } = request;

    try {
      // Fetch the maintenance report with all related data
      const report = await prisma.maintenanceReport.findUnique({
        where: { id: maintenanceReportId },
        include: {
          equipment: {
            include: {
              sensorDefinitions: {
                include: {
                  thresholds: true,
                },
              },
            },
          },
          sensorReadings: {
            include: {
              sensorDefinition: true,
            },
          },
          equipmentEvents: true,
        },
      });

      if (!report) {
        throw new Error('Maintenance report not found');
      }

      // Step 1: Evaluate sensor thresholds deterministically
      const sensorResults = await this.evaluateSensorThresholds(report);

      // Step 2: Retrieve relevant knowledge base chunks
      let retrievedChunks;
      let retrievalSucceeded = true;
      
      try {
        const query = ragRetrieval.buildRetrievalQuery(
          report.equipment.type,
          report.issueDescription,
          report.operatingEvents
        );
        
        retrievedChunks = await ragRetrieval.retrieveRelevantChunks(query, {
          equipmentType: report.equipment.type,
        });
      } catch (error) {
        console.error('Retrieval failed:', error);
        retrievedChunks = [];
        retrievalSucceeded = false;
      }

      // Step 3: Get recent maintenance history
      const maintenanceHistory = await this.getRecentMaintenanceHistory(report.equipment.id);

      // Step 4: Build AI input
      const aiInput: TriageInput = {
        equipmentType: report.equipment.type,
        equipmentIdentifier: report.equipment.identifier,
        issueDescription: report.issueDescription,
        operatingEvents: report.operatingEvents,
        sensorResults: sensorResults.map(r => ({
          sensor: r.sensor,
          value: r.value,
          unit: r.unit,
          threshold: r.threshold,
          operator: r.operator,
          status: r.status,
          severity: r.severity,
          message: r.message,
        })),
        retrievedContext: retrievedChunks,
        maintenanceHistory,
      };

      // Step 5: Call AI provider
      let aiResult;
      let aiSucceeded = true;
      let aiError: string | undefined;

      try {
        const aiProvider = createAIProvider();
        aiResult = await aiProvider.generateTriageAnalysis(aiInput);
      } catch (error) {
        console.error('AI analysis failed:', error);
        aiSucceeded = false;
        aiError = error instanceof Error ? error.message : 'AI analysis failed';
        
        // Create fallback analysis based on deterministic results only
        aiResult = this.createFallbackAnalysis(sensorResults, retrievalSucceeded);
      }

      // Step 6: Store triage analysis
      const triageAnalysis = await prisma.triageAnalysis.create({
        data: {
          maintenanceReportId,
          observations: aiResult.observations,
          possibleCauses: aiResult.possibleCauses,
          confirmedFindings: aiResult.confirmedFindings,
          followUpQuestions: aiResult.followUpQuestions,
          inspectionSteps: aiResult.inspectionSteps.map(s => s.step),
          priority: aiResult.priority as MaintenancePriority,
          reasoningSummary: aiResult.reasoningSummary,
          retrievalSucceeded,
          aiSucceeded,
          aiError,
        },
      });

      // Step 7: Store evidence
      for (const evidence of aiResult.evidence) {
        const knowledgeChunkId = retrievedChunks.find(
          c => c.section === evidence.section || c.page === evidence.page
        )?.chunkId;

        await prisma.evidence.create({
          data: {
            triageAnalysisId: triageAnalysis.id,
            type: evidence.type,
            description: evidence.description,
            sourceType: evidence.sourceType,
            sourceId: evidence.sourceId,
            knowledgeChunkId,
            section: evidence.section,
            page: evidence.page,
          },
        });
      }

      // Step 8: Update sensor readings with threshold results
      for (const result of sensorResults) {
        const reading = report.sensorReadings.find(
          r => r.sensorDefinition.name === result.sensor
        );
        
        if (reading) {
          await prisma.sensorReading.update({
            where: { id: reading.id },
            data: {
              status: result.status,
              severity: result.severity,
              violatedThresholdId: result.violatedThresholdId,
              notes: result.message,
            },
          });
        }
      }

      return {
        triageAnalysisId: triageAnalysis.id,
        success: true,
        aiSucceeded,
        retrievalSucceeded,
      };

    } catch (error) {
      console.error('Triage failed:', error);
      return {
        triageAnalysisId: '',
        success: false,
        aiSucceeded: false,
        retrievalSucceeded: false,
        error: error instanceof Error ? error.message : 'Triage failed',
      };
    }
  }

  /**
   * Evaluate sensor thresholds for all readings in a report
   */
  private async evaluateSensorThresholds(report: any) {
    const results = [];

    for (const reading of report.sensorReadings) {
      const result = await thresholdEngine.evaluateSensorReading(
        reading.sensorDefinitionId,
        reading.value
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Get recent maintenance history for equipment
   */
  private async getRecentMaintenanceHistory(equipmentId: string): Promise<string[]> {
    const history = await prisma.maintenanceHistory.findMany({
      where: { equipmentId },
      orderBy: { completedAt: 'desc' },
      take: 5,
      include: {
        workOrder: true,
      },
    });

    return history.map(h => 
      `${h.completedAt.toISOString().split('T')[0]}: ${h.workOrder.title} - ${h.outcome}`
    );
  }

  /**
   * Create fallback analysis when AI fails
   */
  private createFallbackAnalysis(sensorResults: any[], retrievalSucceeded: boolean) {
    const observations = sensorResults
      .filter(r => r.value !== null)
      .map(r => {
        if (r.status === 'EXCEEDED') {
          return `${r.sensor} reading of ${r.value} ${r.unit} exceeds threshold (${r.operator} ${r.threshold} ${r.unit})`;
        }
        return `${r.sensor}: ${r.value} ${r.unit}`;
      });

    const missingData = sensorResults
      .filter(r => r.status === 'MISSING')
      .map(r => `${r.sensor} data unavailable`);

    if (missingData.length > 0) {
      observations.push(...missingData);
    }

    const exceededCount = sensorResults.filter(r => r.status === 'EXCEEDED').length;
    const priority = exceededCount >= 2 ? 'HIGH' : exceededCount === 1 ? 'MEDIUM' : 'LOW';

    let reasoningSummary = 'AI analysis unavailable. Deterministic sensor checks completed successfully.';
    if (!retrievalSucceeded) {
      reasoningSummary += ' Knowledge base retrieval failed.';
    }
    reasoningSummary += ' Please retry AI analysis or continue with manual inspection.';

    return {
      observations,
      possibleCauses: [],
      confirmedFindings: [],
      followUpQuestions: ['Manual inspection required due to AI unavailability'],
      inspectionSteps: [{ step: 'Perform visual inspection of equipment' }],
      priority,
      reasoningSummary,
      evidence: sensorResults
        .filter(r => r.status === 'EXCEEDED')
        .map(r => ({
          type: 'Threshold Violation',
          description: r.message || 'Threshold exceeded',
          sourceType: 'SENSOR' as const,
          sourceId: r.sensor,
        })),
    };
  }
}

export const triageService = new TriageService();
