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

interface Report {
  id: string;
  issueDescription: string;
  operatingEvents: string[];
  createdAt: string;
  equipment: {
    id: string;
    name: string;
    identifier: string;
  };
  reportedBy: {
    name: string;
    email: string;
  };
  sensorReadings: Array<{
    id: string;
    value: number;
    unit: string;
    timestamp: string;
    sensorDefinition: {
      name: string;
      sensorType: string;
    };
  }>;
  triageAnalysis?: {
    id: string;
    observations: string[];
    possibleCauses: string[];
    confirmedFindings: string[];
    followUpQuestions: string[];
    inspectionSteps: string[];
    priority: string;
    reasoningSummary: string;
    retrievalSucceeded: boolean;
    aiSucceeded: boolean;
    evidence: Array<{
      id: string;
      sourceType: string;
      sourceReference: string;
      content: string;
    }>;
  };
  workOrder?: {
    id: string;
    workOrderNumber: string;
    status: string;
  };
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [triaging, setTriaging] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchReport();
    }
  }, [params.id]);

  const fetchReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setReport(data.data);
      } else {
        showToast('Report not found', 'error');
        router.push('/dashboard/reports');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      showToast('Error loading report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRunTriage = async () => {
    setTriaging(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maintenanceReportId: params.id,
        }),
      });

      if (response.ok) {
        showToast('Triage analysis completed successfully', 'success');
        await fetchReport(); // Reload to show analysis
      } else {
        const error = await response.json();
        showToast(error.error?.message || 'Triage analysis failed', 'error');
      }
    } catch (error) {
      console.error('Error running triage:', error);
      showToast('Error running triage analysis', 'error');
    } finally {
      setTriaging(false);
    }
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
    return <LoadingPage message="Loading report details..." />;
  }

  if (!report) {
    return <Alert variant="danger">Report not found</Alert>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/dashboard/reports">
              <Button variant="ghost" size="sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Button>
            </Link>
            <h2 className="text-2xl font-bold text-gray-900">Maintenance Report</h2>
          </div>
          <p className="text-gray-600 ml-12">{report.equipment.name} ({report.equipment.identifier})</p>
        </div>
        {!report.triageAnalysis && (
          <Button onClick={handleRunTriage} loading={triaging}>
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Run AI Triage
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Details */}
          <Card>
            <CardHeader>Issue Description</CardHeader>
            <CardContent>
              <p className="text-gray-900 whitespace-pre-wrap">{report.issueDescription}</p>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Reported by:</span> {report.reportedBy.name} ({report.reportedBy.email})
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Date:</span> {new Date(report.createdAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Operating Events */}
          {report.operatingEvents.length > 0 && (
            <Card>
              <CardHeader>Operating Events</CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.operatingEvents.map((event, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-900">{event}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Sensor Readings */}
          {report.sensorReadings.length > 0 && (
            <Card>
              <CardHeader>Sensor Readings</CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {report.sensorReadings.map((reading) => (
                    <div key={reading.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">{reading.sensorDefinition.name}</h4>
                        <span className="text-2xl font-bold text-blue-600">
                          {reading.value}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{reading.unit}</p>
                      <p className="text-xs text-gray-500 mt-1">Type: {reading.sensorDefinition.sensorType}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Triage Analysis Results */}
          {report.triageAnalysis && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <span>AI Triage Analysis</span>
                    <Badge variant={getPriorityBadgeVariant(report.triageAnalysis.priority)} size="lg">
                      Priority: {report.triageAnalysis.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Reasoning Summary */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Summary</h4>
                    <p className="text-gray-700">{report.triageAnalysis.reasoningSummary}</p>
                  </div>

                  {/* Observations */}
                  {report.triageAnalysis.observations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Observations</h4>
                      <ul className="space-y-1">
                        {report.triageAnalysis.observations.map((obs, i) => (
                          <li key={i} className="flex items-start text-gray-700">
                            <span className="text-blue-500 mr-2">•</span>
                            <span>{obs}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Possible Causes */}
                  {report.triageAnalysis.possibleCauses.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Possible Causes</h4>
                      <ul className="space-y-1">
                        {report.triageAnalysis.possibleCauses.map((cause, i) => (
                          <li key={i} className="flex items-start text-gray-700">
                            <span className="text-yellow-500 mr-2">•</span>
                            <span>{cause}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Confirmed Findings */}
                  {report.triageAnalysis.confirmedFindings.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Confirmed Findings</h4>
                      <ul className="space-y-1">
                        {report.triageAnalysis.confirmedFindings.map((finding, i) => (
                          <li key={i} className="flex items-start text-gray-700">
                            <span className="text-green-500 mr-2">✓</span>
                            <span>{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Follow-up Questions */}
                  {report.triageAnalysis.followUpQuestions.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Follow-up Questions</h4>
                      <ul className="space-y-1">
                        {report.triageAnalysis.followUpQuestions.map((q, i) => (
                          <li key={i} className="flex items-start text-gray-700">
                            <span className="text-purple-500 mr-2">?</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Inspection Steps */}
                  {report.triageAnalysis.inspectionSteps.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Recommended Inspection Steps</h4>
                      <ol className="space-y-2">
                        {report.triageAnalysis.inspectionSteps.map((step, i) => (
                          <li key={i} className="flex items-start text-gray-700">
                            <span className="font-semibold text-blue-600 mr-2">{i + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Analysis Status */}
                  <div className="flex gap-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center">
                      {report.triageAnalysis.aiSucceeded ? (
                        <Badge variant="success">AI Analysis: Success</Badge>
                      ) : (
                        <Badge variant="warning">AI Analysis: Partial</Badge>
                      )}
                    </div>
                    <div className="flex items-center">
                      {report.triageAnalysis.retrievalSucceeded ? (
                        <Badge variant="success">RAG Retrieval: Success</Badge>
                      ) : (
                        <Badge variant="warning">RAG Retrieval: Unavailable</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Evidence/Citations */}
              {report.triageAnalysis.evidence && report.triageAnalysis.evidence.length > 0 && (
                <Card>
                  <CardHeader>Evidence & Citations</CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {report.triageAnalysis.evidence.map((evidence) => (
                        <div key={evidence.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="info" size="sm">{evidence.sourceType}</Badge>
                            <span className="text-sm text-gray-600">{evidence.sourceReference}</span>
                          </div>
                          <p className="text-sm text-gray-700">{evidence.content}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>Actions</CardHeader>
            <CardContent>
              <div className="space-y-2">
                {!report.triageAnalysis && (
                  <Button fullWidth onClick={handleRunTriage} loading={triaging}>
                    Run AI Triage Analysis
                  </Button>
                )}
                {report.triageAnalysis && !report.workOrder && (
                  <Button fullWidth>
                    Create Work Order
                  </Button>
                )}
                {report.workOrder && (
                  <Link href={`/dashboard/work-orders/${report.workOrder.id}`}>
                    <Button fullWidth variant="secondary">
                      View Work Order
                    </Button>
                  </Link>
                )}
                <Link href={`/dashboard/equipment/${report.equipment.id}`}>
                  <Button fullWidth variant="secondary">
                    View Equipment
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Status Summary */}
          <Card>
            <CardHeader>Status</CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Triage Status</label>
                  <p className="text-gray-900">
                    {report.triageAnalysis ? (
                      <Badge variant="success">Completed</Badge>
                    ) : (
                      <Badge variant="warning">Pending</Badge>
                    )}
                  </p>
                </div>
                {report.workOrder && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Work Order</label>
                    <p className="text-gray-900">
                      <Badge variant="info">{report.workOrder.workOrderNumber}</Badge>
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
