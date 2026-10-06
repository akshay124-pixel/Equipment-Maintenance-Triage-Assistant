'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: 'all',
    entityType: 'all',
    userId: '',
    search: '',
  });
  const { showToast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/audit-logs', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data.data || []);
      } else {
        showToast('Failed to load audit logs', 'error');
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      showToast('Error loading audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.startsWith('CREATE')) return 'success';
    if (action.startsWith('UPDATE')) return 'info';
    if (action.startsWith('DELETE')) return 'danger';
    if (action.startsWith('APPROVE') || action.startsWith('LOGIN')) return 'success';
    if (action.startsWith('REJECT')) return 'danger';
    return 'default';
  };

  const getEntityIcon = (entityType: string) => {
    const icons: any = {
      Equipment: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      MaintenanceReport: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      WorkOrder: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      User: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      KnowledgeDocument: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    };
    return icons[entityType] || (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  const filteredLogs = logs.filter((log) => {
    if (filters.action !== 'all' && !log.action.includes(filters.action)) return false;
    if (filters.entityType !== 'all' && log.entityType !== filters.entityType) return false;
    if (filters.userId && log.user.id !== filters.userId) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        log.action.toLowerCase().includes(searchLower) ||
        log.entityType.toLowerCase().includes(searchLower) ||
        log.user.name.toLowerCase().includes(searchLower) ||
        log.user.email.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Get unique users for filter
  const uniqueUsers = Array.from(
    new Map(logs.map(log => [log.user.id, log.user])).values()
  );

  if (loading) {
    return <LoadingPage message="Loading audit logs..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Audit Logs</h2>
        <p className="text-gray-600 mt-1">Complete system activity audit trail</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>Filters</CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Action"
              options={[
                { value: 'all', label: 'All Actions' },
                { value: 'CREATE', label: 'Create' },
                { value: 'UPDATE', label: 'Update' },
                { value: 'DELETE', label: 'Delete' },
                { value: 'APPROVE', label: 'Approve' },
                { value: 'REJECT', label: 'Reject' },
                { value: 'LOGIN', label: 'Login' },
              ]}
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            />
            <Select
              label="Entity Type"
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'Equipment', label: 'Equipment' },
                { value: 'MaintenanceReport', label: 'Reports' },
                { value: 'WorkOrder', label: 'Work Orders' },
                { value: 'User', label: 'Users' },
                { value: 'KnowledgeDocument', label: 'Documents' },
              ]}
              value={filters.entityType}
              onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
            />
            <Select
              label="User"
              options={[
                { value: '', label: 'All Users' },
                ...uniqueUsers.map(user => ({
                  value: user.id,
                  label: user.name,
                })),
              ]}
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            />
            <Input
              label="Search"
              placeholder="Search logs..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              icon={
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader>
          Activity Log ({filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'})
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              title="No audit logs found"
              description="No activity matches your current filters."
            />
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1 text-gray-400">
                      {getEntityIcon(log.entityType)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant={getActionBadgeVariant(log.action) as any}>
                          {log.action}
                        </Badge>
                        <span className="text-sm text-gray-600">on</span>
                        <Badge variant="gray">{log.entityType}</Badge>
                        {log.entityId && (
                          <span className="text-xs text-gray-500 font-mono">
                            {log.entityId.slice(0, 8)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {log.user.name}
                        </span>
                        <span className="text-gray-400">•</span>
                        <Badge variant="info" size="sm">{log.user.role}</Badge>
                        <span className="text-gray-400">•</span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {log.ipAddress && (
                        <div className="text-xs text-gray-500">
                          IP: {log.ipAddress}
                        </div>
                      )}

                      {/* Changes (if any) */}
                      {log.changes && Object.keys(log.changes).length > 0 && (
                        <details className="mt-3">
                          <summary className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer">
                            View Changes
                          </summary>
                          <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                            <pre className="text-xs text-gray-700 overflow-x-auto">
                              {JSON.stringify(log.changes, null, 2)}
                            </pre>
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Total Events</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{logs.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Unique Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{uniqueUsers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Today's Events</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {logs.filter(log => {
                  const today = new Date();
                  const logDate = new Date(log.createdAt);
                  return logDate.toDateString() === today.toDateString();
                }).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Filtered Results</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{filteredLogs.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
