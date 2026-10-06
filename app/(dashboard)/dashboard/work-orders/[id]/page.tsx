'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';

interface WorkOrder {
  id: string;
  workOrderNumber: string;
  priority: string;
  status: string;
  scheduledDate?: string;
  completedDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  notes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  maintenanceReport: {
    id: string;
    issueDescription: string;
    operatingEvents: string[];
    equipment: {
      id: string;
      name: string;
      identifier: string;
    };
    sensorReadings: Array<{
      value: number;
      unit: string;
      sensorDefinition: { name: string };
    }>;
  };
  triageAnalysis: {
    id: string;
    observations: string[];
    possibleCauses: string[];
    confirmedFindings: string[];
    followUpQuestions: string[];
    inspectionSteps: string[];
    priority: string;
    reasoningSummary: string;
  };
  approvedBy?: {
    name: string;
    email: string;
  };
  approvedAt?: string;
  assignedTo?: {
    name: string;
    email: string;
  };
  maintenanceHistory?: {
    id: string;
    workPerformed: string;
    partsReplaced: string[];
    actualHours: number;
    completedAt: string;
    performedBy: { name: string };
  };
}

export default function WorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchWorkOrder();
    }
  }, [params.id]);

  const fetchWorkOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/work-orders/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setWorkOrder(data.data);
      } else {
        showToast('Work order not found', 'error');
        router.push('/dashboard/work-orders');
      }
    } catch (error) {
      console.error('Error fetching work order:', error);
      showToast('Error loading work order', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/work-orders/${params.id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        showToast('Work order approved successfully', 'success');
        await fetchWorkOrder();
      } else {
        const error = await response.json();
        showToast(error.error?.message || 'Failed to approve work order', 'error');
      }
    } catch (error) {
      console.error('Error approving work order:', error);
      showToast('Error approving work order', 'error');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showToast('Please provide a rejection reason', 'warning');
      return;
    }

    setRejecting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/work-orders/${params.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      if (response.ok) {
        showToast('Work order rejected', 'success');
        setShowRejectModal(false);
        await fetchWorkOrder();
      } else {
        const error = await response.json();
        showToast(error.error?.message || 'Failed to reject work order', 'error');
      }
    } catch (error) {
      console.error('Error rejecting work order:', error);
      showToast('Error rejecting work order', 'error');
    } finally {
      setRejecting(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    const map: any = {
      PENDING: 'warning',
      APPROVED: 'success',
      IN_PROGRESS: 'info',
      COMPLETED: 'gray',
      REJECTED: 'danger',
    };
    return map[status] || 'default';
  };

  const getPriorityBadgeVariant = (priority: string) => {
    const map: any = {
      LOW: 'info',
      MEDIUM: 'warning',
      HIGH: 'warning',
      CRITICAL: 'danger',
    };
    return map[priority] || 'default';
  };

  if (loading) {
    return <LoadingPage message="Loading work order..." />;
  }

  if (!workOrder) {
    return <Alert variant="danger">Work order not found</Alert>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/dashboard/work-orders">
              <Button variant="ghost" size="sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Button>
            </Link>
            <h2 className="text-2xl font-bold text-gray-900">{workOrder.workOrderNumber}</h2>
            <Badge variant={getStatusBadgeVariant(workOrder.status)} size="lg">
              {workOrder.status.replace('_', ' ')}
            </Badge>
            <Badge variant={getPriorityBadgeVariant(workOrder.priority)} size="lg">
              {workOrder.priority} Priority
            </Badge>
          </div>
        </div>
        {workOrder.status === 'PENDING' && (
          <div className="flex gap-2">
            <Button variant="danger" onClick={() => setShowRejectModal(true)}>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject
            </Button>
            <Button variant="success" onClick={handleApprove} loading={approving}>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Approve
            </Button>
          </div>
        )}
      </div>

      {/* Rejection Alert */}
      {workOrder.status === 'REJECTED' && workOrder.rejectionReason && (
        <Alert variant="danger" title="Work Order Rejected">
          <p className="font-medium mb-1">Reason:</p>
          <p>{workOrder.rejectionReason}</p>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Equipment & Issue */}
          <Card>
            <CardHeader>Equipment & Issue</CardHeader>
            <CardContent>
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-500">Equipment</label>
                <Link href={`/dashboard/equipment/${workOrder.maintenanceReport.equipment.id}`}>
                  <p className="text-lg font-semibold text-blue-600 hover:text-blue-700">
                    {workOrder.maintenanceReport.equipment.name}
                  </p>
                </Link>
                <p className="text-sm text-gray-600">{workOrder.maintenanceReport.equipment.identifier}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Issue Description</label>
                <p className="text-gray-900 whitespace-pre-wrap mt-1">
                  {workOrder.maintenanceReport.issueDescription}
                </p>
              </div>
              <Link href={`/dashboard/reports/${workOrder.maintenanceReport.id}`} className="mt-4 inline-block">
                <Button variant="ghost" size="sm">
                  View Full Report →
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Triage Analysis Summary */}
          <Card>
            <CardHeader>Triage Analysis Summary</CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Summary</h4>
                <p className="text-gray-700">{workOrder.triageAnalysis.reasoningSummary}</p>
              </div>

              {workOrder.triageAnalysis.confirmedFindings.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Confirmed Findings</h4>
                  <ul className="space-y-1">
                    {workOrder.triageAnalysis.confirmedFindings.map((finding, i) => (
                      <li key={i} className="flex items-start text-gray-700">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {workOrder.triageAnalysis.inspectionSteps.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Recommended Inspection Steps</h4>
                  <ol className="space-y-2">
                    {workOrder.triageAnalysis.inspectionSteps.map((step, i) => (
                      <li key={i} className="flex items-start text-gray-700">
                        <span className="font-semibold text-blue-600 mr-2">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sensor Readings */}
          {workOrder.maintenanceReport.sensorReadings.length > 0 && (
            <Card>
              <CardHeader>Sensor Readings at Time of Report</CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {workOrder.maintenanceReport.sensorReadings.map((reading, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-3">
                      <p className="text-sm text-gray-600">{reading.sensorDefinition.name}</p>
                      <p className="text-xl font-bold text-gray-900">
                        {reading.value} {reading.unit}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Maintenance History */}
          {workOrder.maintenanceHistory && (
            <Card>
              <CardHeader>Maintenance History</CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Work Performed</label>
                    <p className="text-gray-900">{workOrder.maintenanceHistory.workPerformed}</p>
                  </div>
                  {workOrder.maintenanceHistory.partsReplaced.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Parts Replaced</label>
                      <ul className="mt-1 space-y-1">
                        {workOrder.maintenanceHistory.partsReplaced.map((part, i) => (
                          <li key={i} className="text-gray-900">• {part}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>
                      <span className="font-medium text-gray-500">Performed by:</span>{' '}
                      {workOrder.maintenanceHistory.performedBy.name}
                    </span>
                    <span>
                      <span className="font-medium text-gray-500">Hours:</span>{' '}
                      {workOrder.maintenanceHistory.actualHours}h
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>Actions</CardHeader>
            <CardContent>
              <div className="space-y-2">
                {workOrder.status === 'PENDING' && (
                  <>
                    <Button fullWidth variant="success" onClick={handleApprove} loading={approving}>
                      Approve Work Order
                    </Button>
                    <Button fullWidth variant="danger" onClick={() => setShowRejectModal(true)}>
                      Reject Work Order
                    </Button>
                  </>
                )}
                <Link href={`/dashboard/reports/${workOrder.maintenanceReport.id}`}>
                  <Button fullWidth variant="secondary">
                    View Maintenance Report
                  </Button>
                </Link>
                <Link href={`/dashboard/equipment/${workOrder.maintenanceReport.equipment.id}`}>
                  <Button fullWidth variant="secondary">
                    View Equipment
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>Details</CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-gray-900">
                    <Badge variant={getStatusBadgeVariant(workOrder.status)}>
                      {workOrder.status.replace('_', ' ')}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Priority</label>
                  <p className="text-gray-900">
                    <Badge variant={getPriorityBadgeVariant(workOrder.priority)}>
                      {workOrder.priority}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-gray-900">{new Date(workOrder.createdAt).toLocaleString()}</p>
                </div>
                {workOrder.scheduledDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Scheduled</label>
                    <p className="text-gray-900">{new Date(workOrder.scheduledDate).toLocaleDateString()}</p>
                  </div>
                )}
                {workOrder.estimatedHours && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Estimated Hours</label>
                    <p className="text-gray-900">{workOrder.estimatedHours}h</p>
                  </div>
                )}
                {workOrder.approvedBy && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Approved By</label>
                    <p className="text-gray-900">{workOrder.approvedBy.name}</p>
                    {workOrder.approvedAt && (
                      <p className="text-sm text-gray-600">
                        {new Date(workOrder.approvedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
                {workOrder.assignedTo && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Assigned To</label>
                    <p className="text-gray-900">{workOrder.assignedTo.name}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {workOrder.notes && (
            <Card>
              <CardHeader>Notes</CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{workOrder.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Work Order"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReject} loading={rejecting}>
              Reject Work Order
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Alert variant="warning">
            Please provide a reason for rejecting this work order. This will help improve future triage analyses.
          </Alert>
          <Textarea
            label="Rejection Reason"
            required
            rows={4}
            placeholder="Explain why this work order is being rejected..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
