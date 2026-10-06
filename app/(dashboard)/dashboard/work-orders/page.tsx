'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

interface WorkOrder {
  id: string;
  workOrderNumber: string;
  priority: string;
  status: string;
  scheduledDate?: string;
  completedDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: string;
  maintenanceReport: {
    id: string;
    issueDescription: string;
    equipment: {
      id: string;
      name: string;
      identifier: string;
    };
  };
  triageAnalysis: {
    id: string;
    reasoningSummary: string;
  };
  approvedBy?: {
    name: string;
  };
  assignedTo?: {
    name: string;
  };
}

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const { showToast } = useToast();

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/work-orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setWorkOrders(data.data || []);
      } else {
        showToast('Failed to load work orders', 'error');
      }
    } catch (error) {
      console.error('Error fetching work orders:', error);
      showToast('Error loading work orders', 'error');
    } finally {
      setLoading(false);
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

  const filteredWorkOrders = workOrders.filter((wo) => {
    if (filter === 'all') return true;
    return wo.status === filter;
  });

  const statusCounts = {
    all: workOrders.length,
    PENDING: workOrders.filter((w) => w.status === 'PENDING').length,
    APPROVED: workOrders.filter((w) => w.status === 'APPROVED').length,
    IN_PROGRESS: workOrders.filter((w) => w.status === 'IN_PROGRESS').length,
    COMPLETED: workOrders.filter((w) => w.status === 'COMPLETED').length,
    REJECTED: workOrders.filter((w) => w.status === 'REJECTED').length,
  };

  if (loading) {
    return <LoadingPage message="Loading work orders..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header - Modern Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-8 shadow-2xl shadow-emerald-500/30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-cyan-400/20 rounded-full blur-2xl" />
        
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white drop-shadow-lg">Work Orders</h2>
            </div>
            <p className="text-teal-100 text-lg ml-15">Manage maintenance work orders and approvals</p>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs - Modern Glassmorphism */}
      <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
        <div className="border-b border-gray-200/50">
          <nav className="flex -mb-px overflow-x-auto">
            {[
              { key: 'all', label: 'All', count: statusCounts.all },
              { key: 'PENDING', label: 'Pending', count: statusCounts.PENDING },
              { key: 'APPROVED', label: 'Approved', count: statusCounts.APPROVED },
              { key: 'IN_PROGRESS', label: 'In Progress', count: statusCounts.IN_PROGRESS },
              { key: 'COMPLETED', label: 'Completed', count: statusCounts.COMPLETED },
              { key: 'REJECTED', label: 'Rejected', count: statusCounts.REJECTED },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`
                  group relative px-6 py-4 font-semibold text-sm whitespace-nowrap transition-all duration-300
                  ${filter === tab.key
                    ? 'text-emerald-600'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  {tab.label}
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs font-bold
                    ${filter === tab.key
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                    }
                  `}>
                    {tab.count}
                  </span>
                </span>
                {filter === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-t-full shadow-lg shadow-emerald-500/50" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Work Orders List */}
      {filteredWorkOrders.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          }
          title="No work orders found"
          description={filter === 'all' ? "Work orders are created after triage analysis." : `No ${filter.toLowerCase()} work orders.`}
        />
      ) : (
        <div className="space-y-4">
          {filteredWorkOrders.map((workOrder) => (
            <Link key={workOrder.id} href={`/dashboard/work-orders/${workOrder.id}`}>
              <div className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] hover:border-emerald-200">
                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                
                <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-4 mb-3">
                      <div className="flex-shrink-0 mt-1 p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                            {workOrder.workOrderNumber}
                          </h3>
                          <Badge variant={getPriorityBadgeVariant(workOrder.priority)}>
                            {workOrder.priority}
                          </Badge>
                        </div>
                        <p className="text-gray-800 font-semibold mb-2">
                          <span>{workOrder.maintenanceReport.equipment.name}</span>
                          <span className="text-gray-600 font-normal text-sm ml-2">
                            ({workOrder.maintenanceReport.equipment.identifier})
                          </span>
                        </p>
                        <p className="text-gray-700 text-sm line-clamp-2 mb-3 leading-relaxed">
                          {workOrder.maintenanceReport.issueDescription}
                        </p>
                        <div className="flex flex-wrap gap-3 text-sm">
                          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-medium">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {new Date(workOrder.createdAt).toLocaleDateString()}
                          </span>
                          {workOrder.scheduledDate && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg font-medium">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {new Date(workOrder.scheduledDate).toLocaleDateString()}
                            </span>
                          )}
                          {workOrder.assignedTo && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg font-medium">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {workOrder.assignedTo.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 lg:items-end">
                    <Badge variant={getStatusBadgeVariant(workOrder.status)} size="lg">
                      {workOrder.status.replace('_', ' ')}
                    </Badge>
                    {workOrder.estimatedHours && (
                      <span className="text-sm text-gray-600 font-medium px-3 py-1 bg-gray-50 rounded-lg">
                        Est: {workOrder.estimatedHours}h
                        {workOrder.actualHours && ` / ${workOrder.actualHours}h`}
                      </span>
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

