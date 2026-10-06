/**
 * Generate unique work order number
 */
export function generateWorkOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `WO-${timestamp}${random}`;
}

/**
 * Format work order status for display
 */
export function formatWorkOrderStatus(status: string): string {
  return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Get status color class
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'DRAFT':
      return 'text-gray-600 bg-gray-100';
    case 'PENDING_APPROVAL':
      return 'text-yellow-700 bg-yellow-100';
    case 'APPROVED':
      return 'text-green-700 bg-green-100';
    case 'REJECTED':
      return 'text-red-700 bg-red-100';
    case 'IN_PROGRESS':
      return 'text-blue-700 bg-blue-100';
    case 'COMPLETED':
      return 'text-green-800 bg-green-200';
    case 'CANCELLED':
      return 'text-gray-700 bg-gray-200';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

/**
 * Get priority color class
 */
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'LOW':
      return 'text-blue-700 bg-blue-100';
    case 'MEDIUM':
      return 'text-yellow-700 bg-yellow-100';
    case 'HIGH':
      return 'text-orange-700 bg-orange-100';
    case 'CRITICAL':
      return 'text-red-700 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}
