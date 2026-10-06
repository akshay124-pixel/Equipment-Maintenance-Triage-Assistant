import {
  generateWorkOrderNumber,
  formatWorkOrderStatus,
  getStatusColor,
  getPriorityColor,
} from '@/lib/utils/work-order';

describe('Work Order Utilities', () => {
  describe('generateWorkOrderNumber', () => {
    test('should generate unique work order numbers', () => {
      const wo1 = generateWorkOrderNumber();
      const wo2 = generateWorkOrderNumber();

      expect(wo1).toMatch(/^WO-/);
      expect(wo2).toMatch(/^WO-/);
      expect(wo1).not.toBe(wo2);
    });

    test('should have consistent format', () => {
      const wo = generateWorkOrderNumber();
      expect(wo).toMatch(/^WO-[A-Z0-9]+$/);
    });
  });

  describe('formatWorkOrderStatus', () => {
    test('should format status with proper casing', () => {
      expect(formatWorkOrderStatus('DRAFT')).toBe('Draft');
      expect(formatWorkOrderStatus('PENDING_APPROVAL')).toBe('Pending Approval');
      expect(formatWorkOrderStatus('IN_PROGRESS')).toBe('In Progress');
    });
  });

  describe('getStatusColor', () => {
    test('should return correct colors for each status', () => {
      expect(getStatusColor('DRAFT')).toContain('gray');
      expect(getStatusColor('PENDING_APPROVAL')).toContain('yellow');
      expect(getStatusColor('APPROVED')).toContain('green');
      expect(getStatusColor('REJECTED')).toContain('red');
      expect(getStatusColor('IN_PROGRESS')).toContain('blue');
      expect(getStatusColor('COMPLETED')).toContain('green');
      expect(getStatusColor('CANCELLED')).toContain('gray');
    });

    test('should have default color for unknown status', () => {
      expect(getStatusColor('UNKNOWN_STATUS')).toContain('gray');
    });
  });

  describe('getPriorityColor', () => {
    test('should return correct colors for each priority', () => {
      expect(getPriorityColor('LOW')).toContain('blue');
      expect(getPriorityColor('MEDIUM')).toContain('yellow');
      expect(getPriorityColor('HIGH')).toContain('orange');
      expect(getPriorityColor('CRITICAL')).toContain('red');
    });

    test('should have default color for unknown priority', () => {
      expect(getPriorityColor('UNKNOWN')).toContain('gray');
    });
  });
});
