import { ThresholdOperator, ThresholdSeverity, ThresholdStatus } from '@prisma/client';
import prisma from '../db';

export interface ThresholdCheckResult {
  sensor: string;
  value: number | null;
  unit: string;
  threshold?: number;
  operator?: string;
  status: ThresholdStatus;
  severity: ThresholdSeverity;
  message?: string;
  violatedThresholdId?: string;
}

export interface ConflictingReading {
  sensor: string;
  readings: Array<{
    value: number;
    source: string;
  }>;
}

export class ThresholdEngine {
  /**
   * Evaluate sensor reading against defined thresholds
   */
  async evaluateSensorReading(
    sensorDefinitionId: string,
    value: number | null
  ): Promise<ThresholdCheckResult> {
    const sensorDef = await prisma.sensorDefinition.findUnique({
      where: { id: sensorDefinitionId },
      include: {
        thresholds: {
          orderBy: { severity: 'desc' },
        },
      },
    });

    if (!sensorDef) {
      throw new Error(`Sensor definition not found: ${sensorDefinitionId}`);
    }

    // Handle missing sensor data
    if (value === null) {
      return {
        sensor: sensorDef.name,
        value: null,
        unit: sensorDef.unit,
        status: ThresholdStatus.MISSING,
        severity: ThresholdSeverity.INFO,
        message: `${sensorDef.name} data unavailable. ${sensorDef.name}-based assessment could not be completed.`,
      };
    }

    // Check thresholds in order of severity (highest first)
    for (const threshold of sensorDef.thresholds) {
      const violated = this.checkThreshold(value, threshold.operator, threshold.value);

      if (violated) {
        return {
          sensor: sensorDef.name,
          value,
          unit: sensorDef.unit,
          threshold: threshold.value,
          operator: this.formatOperator(threshold.operator),
          status: ThresholdStatus.EXCEEDED,
          severity: threshold.severity,
          message: threshold.description || `${sensorDef.name} threshold exceeded`,
          violatedThresholdId: threshold.id,
        };
      }
    }

    // No thresholds violated
    return {
      sensor: sensorDef.name,
      value,
      unit: sensorDef.unit,
      status: ThresholdStatus.NORMAL,
      severity: ThresholdSeverity.INFO,
    };
  }

  /**
   * Detect conflicting sensor readings for the same sensor type
   */
  detectConflicts(
    readings: Array<{ sensor: string; value: number | null; source: string }>
  ): ConflictingReading[] {
    const groupedBySensor = readings.reduce((acc, reading) => {
      if (reading.value === null) return acc;
      
      if (!acc[reading.sensor]) {
        acc[reading.sensor] = [];
      }
      acc[reading.sensor].push({
        value: reading.value,
        source: reading.source,
      });
      return acc;
    }, {} as Record<string, Array<{ value: number; source: string }>>);

    const conflicts: ConflictingReading[] = [];

    for (const [sensor, values] of Object.entries(groupedBySensor)) {
      if (values.length < 2) continue;

      // Calculate variance to detect conflicts
      const mean = values.reduce((sum, v) => sum + v.value, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v.value - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      // If standard deviation is more than 10% of mean, consider it conflicting
      const threshold = mean * 0.1;
      
      if (stdDev > threshold && stdDev > 0.01) {
        conflicts.push({
          sensor,
          readings: values,
        });
      }
    }

    return conflicts;
  }

  /**
   * Generate conflicting data result
   */
  createConflictingResult(
    sensorName: string,
    unit: string,
    readings: Array<{ value: number; source: string }>
  ): ThresholdCheckResult {
    const valueList = readings.map(r => `${r.source}: ${r.value} ${unit}`).join(', ');
    
    return {
      sensor: sensorName,
      value: null,
      unit,
      status: ThresholdStatus.CONFLICTING,
      severity: ThresholdSeverity.HIGH,
      message: `CONFLICTING SENSOR DATA - ${valueList}. Status: UNRELIABLE. Manual verification recommended.`,
    };
  }

  /**
   * Check if a value violates a threshold
   */
  private checkThreshold(value: number, operator: ThresholdOperator, threshold: number): boolean {
    switch (operator) {
      case ThresholdOperator.GREATER_THAN:
        return value > threshold;
      case ThresholdOperator.GREATER_THAN_OR_EQUAL:
        return value >= threshold;
      case ThresholdOperator.LESS_THAN:
        return value < threshold;
      case ThresholdOperator.LESS_THAN_OR_EQUAL:
        return value <= threshold;
      case ThresholdOperator.EQUALS:
        return Math.abs(value - threshold) < 0.0001;
      case ThresholdOperator.NOT_EQUALS:
        return Math.abs(value - threshold) >= 0.0001;
      default:
        return false;
    }
  }

  /**
   * Format operator for display
   */
  private formatOperator(operator: ThresholdOperator): string {
    switch (operator) {
      case ThresholdOperator.GREATER_THAN:
        return '>';
      case ThresholdOperator.GREATER_THAN_OR_EQUAL:
        return '>=';
      case ThresholdOperator.LESS_THAN:
        return '<';
      case ThresholdOperator.LESS_THAN_OR_EQUAL:
        return '<=';
      case ThresholdOperator.EQUALS:
        return '=';
      case ThresholdOperator.NOT_EQUALS:
        return '!=';
      default:
        return operator;
    }
  }

  /**
   * Batch evaluate multiple sensor readings
   */
  async evaluateMultipleSensors(
    readings: Array<{ sensorDefinitionId: string; value: number | null }>
  ): Promise<ThresholdCheckResult[]> {
    const results: ThresholdCheckResult[] = [];

    for (const reading of readings) {
      const result = await this.evaluateSensorReading(
        reading.sensorDefinitionId,
        reading.value
      );
      results.push(result);
    }

    return results;
  }
}

export const thresholdEngine = new ThresholdEngine();
