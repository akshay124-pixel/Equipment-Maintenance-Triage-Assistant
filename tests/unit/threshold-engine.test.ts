import { ThresholdEngine } from '@/lib/services/threshold-engine';
import { ThresholdOperator, ThresholdSeverity } from '@prisma/client';

describe('ThresholdEngine', () => {
  let engine: ThresholdEngine;

  beforeEach(() => {
    engine = new ThresholdEngine();
  });

  describe('checkThreshold', () => {
    test('should detect GREATER_THAN violation', () => {
      const result = (engine as any).checkThreshold(95, ThresholdOperator.GREATER_THAN, 90);
      expect(result).toBe(true);
    });

    test('should not violate GREATER_THAN when equal', () => {
      const result = (engine as any).checkThreshold(90, ThresholdOperator.GREATER_THAN, 90);
      expect(result).toBe(false);
    });

    test('should detect LESS_THAN violation', () => {
      const result = (engine as any).checkThreshold(4, ThresholdOperator.LESS_THAN, 5);
      expect(result).toBe(true);
    });

    test('should not violate LESS_THAN when equal', () => {
      const result = (engine as any).checkThreshold(5, ThresholdOperator.LESS_THAN, 5);
      expect(result).toBe(false);
    });

    test('should detect EQUALS match', () => {
      const result = (engine as any).checkThreshold(90, ThresholdOperator.EQUALS, 90);
      expect(result).toBe(true);
    });

    test('should handle GREATER_THAN_OR_EQUAL', () => {
      const result1 = (engine as any).checkThreshold(90, ThresholdOperator.GREATER_THAN_OR_EQUAL, 90);
      const result2 = (engine as any).checkThreshold(91, ThresholdOperator.GREATER_THAN_OR_EQUAL, 90);
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });
  });

  describe('detectConflicts', () => {
    test('should detect conflicting sensor readings', () => {
      const readings = [
        { sensor: 'Temperature', value: 92, source: 'Sensor A' },
        { sensor: 'Temperature', value: 71, source: 'Sensor B' },
      ];

      const conflicts = engine.detectConflicts(readings);
      expect(conflicts.length).toBe(1);
      expect(conflicts[0].sensor).toBe('Temperature');
      expect(conflicts[0].readings.length).toBe(2);
    });

    test('should not detect conflicts for consistent readings', () => {
      const readings = [
        { sensor: 'Temperature', value: 92, source: 'Sensor A' },
        { sensor: 'Temperature', value: 93, source: 'Sensor B' },
      ];

      const conflicts = engine.detectConflicts(readings);
      expect(conflicts.length).toBe(0);
    });

    test('should ignore null values in conflict detection', () => {
      const readings = [
        { sensor: 'Temperature', value: 92, source: 'Sensor A' },
        { sensor: 'Temperature', value: null, source: 'Sensor B' },
      ];

      const conflicts = engine.detectConflicts(readings);
      expect(conflicts.length).toBe(0);
    });

    test('should handle multiple sensors independently', () => {
      const readings = [
        { sensor: 'Temperature', value: 92, source: 'Sensor A' },
        { sensor: 'Temperature', value: 71, source: 'Sensor B' },
        { sensor: 'Pressure', value: 4.2, source: 'Sensor C' },
        { sensor: 'Pressure', value: 4.3, source: 'Sensor D' },
      ];

      const conflicts = engine.detectConflicts(readings);
      expect(conflicts.length).toBe(1);
      expect(conflicts[0].sensor).toBe('Temperature');
    });
  });

  describe('createConflictingResult', () => {
    test('should create conflicting result with proper format', () => {
      const readings = [
        { value: 92, source: 'Sensor A' },
        { value: 71, source: 'Sensor B' },
      ];

      const result = engine.createConflictingResult('Temperature', '°C', readings);

      expect(result.sensor).toBe('Temperature');
      expect(result.value).toBeNull();
      expect(result.status).toBe('CONFLICTING');
      expect(result.severity).toBe('HIGH');
      expect(result.message).toContain('CONFLICTING SENSOR DATA');
      expect(result.message).toContain('Sensor A: 92 °C');
      expect(result.message).toContain('Sensor B: 71 °C');
    });
  });

  describe('formatOperator', () => {
    test('should format operators correctly', () => {
      expect((engine as any).formatOperator(ThresholdOperator.GREATER_THAN)).toBe('>');
      expect((engine as any).formatOperator(ThresholdOperator.LESS_THAN)).toBe('<');
      expect((engine as any).formatOperator(ThresholdOperator.EQUALS)).toBe('=');
      expect((engine as any).formatOperator(ThresholdOperator.NOT_EQUALS)).toBe('!=');
      expect((engine as any).formatOperator(ThresholdOperator.GREATER_THAN_OR_EQUAL)).toBe('>=');
      expect((engine as any).formatOperator(ThresholdOperator.LESS_THAN_OR_EQUAL)).toBe('<=');
    });
  });
});
