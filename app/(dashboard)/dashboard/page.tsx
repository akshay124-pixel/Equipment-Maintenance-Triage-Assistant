'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';

interface DashboardStats {
  equipment: {
    total: number;
    operational: number;
    warning: number;
    critical: number;
  };
  reports: {
    total: number;
    pending: number;
    triaged: number;
  };
  workOrders: {
    total: number;
    pending: number;
    inProgress: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'report' | 'workorder' | 'equipment';
    title: string;
    description: string;
    timestamp: string;
    status?: string;
    priority?: string;
  }>;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch equipment stats
      const equipmentRes = await fetch('/api/equipment', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const equipmentData = await equipmentRes.json();
      const equipment = equipmentData.data || [];

      // Fetch reports stats
      const reportsRes = await fetch('/api/reports', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const reportsData = await reportsRes.json();
      const reports = reportsData.data || [];

      // Fetch work orders stats
      const workOrdersRes = await fetch('/api/work-orders', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const workOrdersData = await workOrdersRes.json();
      const workOrders = workOrdersData.data || [];

      // Process stats
      const dashboardStats: DashboardStats = {
        equipment: {
          total: equipment.length,
          operational: equipment.filter((e: any) => e.status === 'OPERATIONAL').length,
          warning: equipment.filter((e: any) => e.status === 'WARNING').length,
          critical: equipment.filter((e: any) => e.status === 'CRITICAL').length,
        },
        reports: {
          total: reports.length,
          pending: reports.filter((r: any) => !r.triageAnalysis).length,
          triaged: reports.filter((r: any) => r.triageAnalysis).length,
        },
        workOrders: {
          total: workOrders.length,
          pending: workOrders.filter((w: any) => w.status === 'PENDING').length,
          inProgress: workOrders.filter((w: any) => w.status === 'IN_PROGRESS').length,
        },
        recentActivity: [
          ...reports.slice(0, 3).map((r: any) => ({
            id: r.id,
            type: 'report' as const,
            title: `New Report: ${r.equipment?.name || 'Equipment'}`,
            description: r.issueDescription?.substring(0, 100) + '...',
            timestamp: r.createdAt,
            status: r.triageAnalysis ? 'Triaged' : 'Pending',
          })),
          ...workOrders.slice(0, 2).map((w: any) => ({
            id: w.id,
            type: 'workorder' as const,
            title: `Work Order: ${w.workOrderNumber}`,
            description: w.maintenanceReport?.issueDescription?.substring(0, 100) + '...',
            timestamp: w.createdAt,
            status: w.status,
            priority: w.priority,
          })),
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5),
      };

      setStats(dashboardStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showToast('Error loading dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return <LoadingPage message="Loading dashboard..." />;
  }

  const quickActions = [
    {
      title: 'Create Report',
      description: 'Report equipment issues',
      href: '/dashboard/reports/new',
      icon: '📋',
      color: 'bg-blue-500',
    },
    {
      title: 'View Equipment',
      description: 'Browse all equipment',
      href: '/dashboard/equipment',
      icon: '⚙️',
      color: 'bg-green-500',
    },
    {
      title: 'Work Orders',
      description: 'Manage maintenance tasks',
      href: '/dashboard/work-orders',
      icon: '📝',
      color: 'bg-yellow-500',
    },
    {
      title: 'Knowledge Base',
      description: 'Search documentation',
      href: '/dashboard/knowledge',
      icon: '📚',
      color: 'bg-purple-500',
    },
  ];

  const getActivityIcon = (type: string) => {
    if (type === 'report') {
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
    if (type === 'workorder') {
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section - Modern Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 shadow-2xl shadow-blue-500/30">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl" />
        
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-3 drop-shadow-lg">
              Welcome back, {user?.name}! 👋
            </h2>
            <p className="text-blue-100 text-lg">
              Here's an overview of your equipment maintenance system.
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="text-right bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-sm text-blue-100 font-medium mb-1">Current Date</p>
              <p className="text-lg font-bold text-white">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Modern Gradient Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Equipment Stats */}
        <div 
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-6 shadow-xl shadow-blue-500/30 cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/40"
          onClick={() => window.location.href = '/dashboard/equipment'}
        >
          {/* Decorative gradient orb */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-white drop-shadow-lg">{stats.equipment.total}</p>
              </div>
            </div>
            <p className="text-sm font-semibold text-white/90 mb-3">Total Equipment</p>
            <div className="flex gap-2 text-xs flex-wrap">
              <span className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white rounded-lg font-medium">
                {stats.equipment.operational} OK
              </span>
              {stats.equipment.warning > 0 && (
                <span className="px-2 py-1 bg-yellow-400/30 backdrop-blur-sm text-white rounded-lg font-medium">
                  {stats.equipment.warning} Warning
                </span>
              )}
              {stats.equipment.critical > 0 && (
                <span className="px-2 py-1 bg-red-400/30 backdrop-blur-sm text-white rounded-lg font-medium">
                  {stats.equipment.critical} Critical
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Reports Stats */}
        <div 
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 shadow-xl shadow-amber-500/30 cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-amber-500/40"
          onClick={() => window.location.href = '/dashboard/reports'}
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-white drop-shadow-lg">{stats.reports.total}</p>
              </div>
            </div>
            <p className="text-sm font-semibold text-white/90 mb-3">Maintenance Reports</p>
            <div className="flex gap-2 text-xs flex-wrap">
              <span className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white rounded-lg font-medium">
                {stats.reports.triaged} Triaged
              </span>
              {stats.reports.pending > 0 && (
                <span className="px-2 py-1 bg-yellow-300/30 backdrop-blur-sm text-white rounded-lg font-medium">
                  {stats.reports.pending} Pending
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Work Orders Stats */}
        <div 
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 shadow-xl shadow-emerald-500/30 cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/40"
          onClick={() => window.location.href = '/dashboard/work-orders'}
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-white drop-shadow-lg">{stats.workOrders.total}</p>
              </div>
            </div>
            <p className="text-sm font-semibold text-white/90 mb-3">Work Orders</p>
            <div className="flex gap-2 text-xs flex-wrap">
              {stats.workOrders.pending > 0 && (
                <span className="px-2 py-1 bg-yellow-300/30 backdrop-blur-sm text-white rounded-lg font-medium">
                  {stats.workOrders.pending} Pending
                </span>
              )}
              {stats.workOrders.inProgress > 0 && (
                <span className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white rounded-lg font-medium">
                  {stats.workOrders.inProgress} Active
                </span>
              )}
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 p-6 shadow-xl shadow-purple-500/30 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/40">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-white drop-shadow-lg">
                  {stats.equipment.total > 0 
                    ? Math.round((stats.equipment.operational / stats.equipment.total) * 100)
                    : 0}%
                </p>
              </div>
            </div>
            <p className="text-sm font-semibold text-white/90 mb-3">System Health</p>
            <div className="w-full bg-white/20 backdrop-blur-sm rounded-full h-3 overflow-hidden">
              <div 
                className="bg-white h-3 rounded-full transition-all duration-1000 shadow-lg"
                style={{ 
                  width: `${stats.equipment.total > 0 
                    ? (stats.equipment.operational / stats.equipment.total) * 100 
                    : 0}%` 
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              actions={
                <Link href="/dashboard/audit-logs">
                  <Button variant="ghost" size="sm">
                    View All →
                  </Button>
                </Link>
              }
            >
              Recent Activity
            </CardHeader>
            <CardContent>
              {stats.recentActivity.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {stats.recentActivity.map((activity) => (
                    <Link
                      key={activity.id}
                      href={`/dashboard/${activity.type === 'workorder' ? 'work-orders' : 'reports'}/${activity.id}`}
                    >
                      <div className="group flex items-start gap-4 p-4 rounded-xl bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 border border-gray-100 hover:border-blue-200 hover:shadow-lg transform hover:scale-[1.01]">
                        <div className="flex-shrink-0 mt-1 p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30 group-hover:scale-110 transition-transform">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold text-gray-900 text-sm">{activity.title}</p>
                            {activity.status && (
                              <Badge variant="gray" size="sm">{activity.status}</Badge>
                            )}
                            {activity.priority && (
                              <Badge 
                                variant={activity.priority === 'CRITICAL' ? 'danger' : 'warning'} 
                                size="sm"
                              >
                                {activity.priority}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-1 mb-2">{activity.description}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-gray-400 group-hover:text-blue-600 transition-colors">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card>
            <CardHeader>Quick Actions</CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quickActions.map((action) => (
                  <Link key={action.title} href={action.href}>
                    <div className="group flex items-center gap-4 p-4 rounded-xl bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 border border-gray-100 hover:border-blue-200 hover:shadow-lg cursor-pointer transform hover:scale-[1.02]">
                      <div className={`${action.color} w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                        {action.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm mb-1">{action.title}</p>
                        <p className="text-xs text-gray-600">{action.description}</p>
                      </div>
                      <div className="flex-shrink-0 text-gray-400 group-hover:text-blue-600 transition-colors group-hover:translate-x-1 transition-transform">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Features Info - Enhanced */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              System Capabilities
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="group relative text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-xl hover:scale-[1.03] transition-all duration-300 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-200/30 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
              <div className="relative">
                <div className="text-4xl mb-3">🔍</div>
                <h4 className="font-bold text-gray-900 mb-2">AI Triage</h4>
                <p className="text-sm text-gray-600">Automated analysis with priority assessment</p>
              </div>
            </div>
            <div className="group relative text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 hover:shadow-xl hover:scale-[1.03] transition-all duration-300 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-200/30 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
              <div className="relative">
                <div className="text-4xl mb-3">📊</div>
                <h4 className="font-bold text-gray-900 mb-2">Threshold Engine</h4>
                <p className="text-sm text-gray-600">Deterministic sensor evaluation</p>
              </div>
            </div>
            <div className="group relative text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100 hover:shadow-xl hover:scale-[1.03] transition-all duration-300 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-200/30 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
              <div className="relative">
                <div className="text-4xl mb-3">📚</div>
                <h4 className="font-bold text-gray-900 mb-2">RAG Search</h4>
                <p className="text-sm text-gray-600">Knowledge base retrieval with vectors</p>
              </div>
            </div>
            <div className="group relative text-center p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100 hover:shadow-xl hover:scale-[1.03] transition-all duration-300 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-200/30 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
              <div className="relative">
                <div className="text-4xl mb-3">✅</div>
                <h4 className="font-bold text-gray-900 mb-2">Work Orders</h4>
                <p className="text-sm text-gray-600">Human-approved maintenance workflow</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

