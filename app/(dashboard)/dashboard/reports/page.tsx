'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

interface MaintenanceReport {
  id: string;
  issueDescription: string;
  operatingEvents: string[];
  createdAt: string;
  updatedAt: string;
  equipment: {
    id: string;
    name: string;
    identifier: string;
  };
  reportedBy: {
    id: string;
    name: string;
  };
  triageAnalysis?: {
    id: string;
    priority: string;
    reasoningSummary: string;
  };
  workOrder?: {
    id: string;
    workOrderNumber: string;
    status: string;
  };
  sensorReadings: Array<{
    id: string;
    value: number;
    unit: string;
    sensorDefinition: {
      name: string;
    };
  }>;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<MaintenanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const { showToast } = useToast();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reports', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setReports(data.data || []);
      } else {
        showToast('Failed to load reports', 'error');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      showToast('Error loading reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadgeVariant = (priority?: string) => {
    if (!priority) return 'gray';
    const map: any = {
      LOW: 'info',
      MEDIUM: 'warning',
      HIGH: 'warning',
      CRITICAL: 'danger',
    };
    return map[priority] || 'default';
  };

  const getWorkOrderStatusBadge = (status?: string) => {
    if (!status) return 'gray';
    const map: any = {
      PENDING: 'warning',
      APPROVED: 'success',
      IN_PROGRESS: 'info',
      COMPLETED: 'gray',
      REJECTED: 'danger',
    };
    return map[status] || 'default';
  };

  const filteredReports = reports.filter((report) => {
    if (filter === 'all') return true;
    if (filter === 'triaged') return !!report.triageAnalysis;
    if (filter === 'untriaged') return !report.triageAnalysis;
    if (filter === 'with-workorder') return !!report.workOrder;
    return true;
  });

  if (loading) {
    return <LoadingPage message="Loading maintenance reports..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header - Modern Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-8 shadow-2xl shadow-amber-500/30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-red-400/20 rounded-full blur-2xl" />
        
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white drop-shadow-lg">Maintenance Reports</h2>
            </div>
            <p className="text-orange-100 text-lg ml-15">Track equipment issues and maintenance requests</p>
          </div>
          <Link href="/dashboard/reports/new">
            <Button variant="secondary" size="lg">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Report
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs - Modern Glassmorphism */}
      <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
        <div className="border-b border-gray-200/50">
          <nav className="flex -mb-px overflow-x-auto">
            {[
              { key: 'all', label: 'All Reports', count: reports.length },
              { key: 'triaged', label: 'Triaged', count: reports.filter(r => r.triageAnalysis).length },
              { key: 'untriaged', label: 'Needs Triage', count: reports.filter(r => !r.triageAnalysis).length },
              { key: 'with-workorder', label: 'With Work Order', count: reports.filter(r => r.workOrder).length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`
                  group relative px-6 py-4 font-semibold text-sm whitespace-nowrap transition-all duration-300
                  ${filter === tab.key
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  {tab.label}
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs font-bold
                    ${filter === tab.key
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                    }
                  `}>
                    {tab.count}
                  </span>
                </span>
                {filter === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-full shadow-lg shadow-blue-500/50" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          title="No reports found"
          description={filter === 'all' ? "Create a maintenance report to track equipment issues." : `No ${filter} reports found.`}
          action={{
            label: 'Create Report',
            onClick: () => window.location.href = '/dashboard/reports/new',
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <Link key={report.id} href={`/dashboard/reports/${report.id}`}>
              <div className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] hover:border-blue-200">
                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                
                <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-4 mb-3">
                      <div className="flex-shrink-0 mt-1 p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {report.equipment.name}
                        </h3>
                        <p className="text-gray-700 mb-3 line-clamp-2 leading-relaxed">
                          {report.issueDescription}
                        </p>
                        <div className="flex flex-wrap gap-3 text-sm">
                          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-medium">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            {report.equipment.identifier}
                          </span>
                          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg font-medium">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {report.reportedBy.name}
                          </span>
                          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg font-medium">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                          {report.sensorReadings.length > 0 && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg font-medium">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              {report.sensorReadings.length} sensors
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 lg:items-end">
                    {report.triageAnalysis && (
                      <Badge variant={getPriorityBadgeVariant(report.triageAnalysis.priority)} size="lg">
                        Priority: {report.triageAnalysis.priority}
                      </Badge>
                    )}
                    {!report.triageAnalysis && (
                      <Badge variant="warning" size="lg">
                        Needs Triage
                      </Badge>
                    )}
                    {report.workOrder && (
                      <Badge variant={getWorkOrderStatusBadge(report.workOrder.status)}>
                        WO: {report.workOrder.workOrderNumber}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

