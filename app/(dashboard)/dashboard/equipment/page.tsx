'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

interface Equipment {
  id: string;
  identifier: string;
  name: string;
  type: string;
  location: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  installDate?: string;
  status: 'OPERATIONAL' | 'WARNING' | 'CRITICAL' | 'MAINTENANCE' | 'OFFLINE';
  _count?: {
    sensors: number;
    reports: number;
  };
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const { showToast } = useToast();

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/equipment', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setEquipment(data.data || []);
      } else {
        showToast('Failed to load equipment', 'error');
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
      showToast('Error loading equipment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'OPERATIONAL':
        return 'success';
      case 'WARNING':
        return 'warning';
      case 'CRITICAL':
        return 'danger';
      case 'MAINTENANCE':
        return 'info';
      case 'OFFLINE':
        return 'gray';
      default:
        return 'default';
    }
  };

  const filteredEquipment = equipment.filter((item) => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const statusCounts = {
    all: equipment.length,
    OPERATIONAL: equipment.filter((e) => e.status === 'OPERATIONAL').length,
    WARNING: equipment.filter((e) => e.status === 'WARNING').length,
    CRITICAL: equipment.filter((e) => e.status === 'CRITICAL').length,
    MAINTENANCE: equipment.filter((e) => e.status === 'MAINTENANCE').length,
    OFFLINE: equipment.filter((e) => e.status === 'OFFLINE').length,
  };

  if (loading) {
    return <LoadingPage message="Loading equipment..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Equipment Management</h2>
          <p className="text-gray-600 mt-1">Manage and monitor all equipment</p>
        </div>
        <Link href="/dashboard/equipment/new">
          <Button>
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Equipment
          </Button>
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <Card padding="none">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            {[
              { key: 'all', label: 'All', count: statusCounts.all },
              { key: 'OPERATIONAL', label: 'Operational', count: statusCounts.OPERATIONAL },
              { key: 'WARNING', label: 'Warning', count: statusCounts.WARNING },
              { key: 'CRITICAL', label: 'Critical', count: statusCounts.CRITICAL },
              { key: 'MAINTENANCE', label: 'Maintenance', count: statusCounts.MAINTENANCE },
              { key: 'OFFLINE', label: 'Offline', count: statusCounts.OFFLINE },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`
                  px-6 py-3 border-b-2 font-medium text-sm whitespace-nowrap
                  ${filter === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>
      </Card>

      {/* Equipment Grid */}
      {filteredEquipment.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
          title="No equipment found"
          description={filter === 'all' ? "Add equipment to get started with monitoring and maintenance." : `No equipment with ${filter} status.`}
          action={{
            label: 'Add Equipment',
            onClick: () => window.location.href = '/dashboard/equipment/new',
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.map((item) => (
            <Card key={item.id} hover className="flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{item.name}</h3>
                  <p className="text-sm text-gray-600">{item.identifier}</p>
                </div>
                <Badge variant={getStatusBadgeVariant(item.status)}>
                  {item.status}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 mb-4 flex-1">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="font-medium">Type:</span> <span className="ml-1">{item.type}</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-medium">Location:</span> <span className="ml-1">{item.location}</span>
                </div>
                {item.manufacturer && (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="font-medium">Manufacturer:</span> <span className="ml-1">{item.manufacturer}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-4 mb-4 pt-4 border-t border-gray-100">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {item._count?.sensors || 0} sensors
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {item._count?.reports || 0} reports
                </div>
              </div>
              
              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Link href={`/dashboard/equipment/${item.id}`}>
                  <Button variant="secondary" size="sm" fullWidth>
                    View Details
                  </Button>
                </Link>
                <Link href={`/dashboard/reports/new?equipment=${item.id}`}>
                  <Button variant="primary" size="sm" fullWidth>
                    Create Report
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

