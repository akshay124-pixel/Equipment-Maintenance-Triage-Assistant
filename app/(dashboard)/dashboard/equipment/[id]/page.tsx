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
  status: string;
  specifications?: any;
  sensors?: Array<{
    id: string;
    name: string;
    unit: string;
    sensorType: string;
    thresholds: Array<{
      id: string;
      severity: string;
      operator: string;
      value: number;
    }>;
  }>;
  reports?: Array<{
    id: string;
    issueDescription: string;
    createdAt: string;
    reportedBy: { name: string };
  }>;
}

export default function EquipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchEquipment();
    }
  }, [params.id]);

  const fetchEquipment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/equipment/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setEquipment(data.data);
      } else {
        showToast('Equipment not found', 'error');
        router.push('/dashboard/equipment');
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
      showToast('Error loading equipment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    const map: any = {
      OPERATIONAL: 'success',
      WARNING: 'warning',
      CRITICAL: 'danger',
      MAINTENANCE: 'info',
      OFFLINE: 'gray',
    };
    return map[status] || 'default';
  };

  const getSeverityBadgeVariant = (severity: string) => {
    const map: any = {
      INFO: 'info',
      WARNING: 'warning',
      CRITICAL: 'danger',
    };
    return map[severity] || 'default';
  };

  if (loading) {
    return <LoadingPage message="Loading equipment details..." />;
  }

  if (!equipment) {
    return (
      <Alert variant="danger">
        Equipment not found
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/dashboard/equipment">
              <Button variant="ghost" size="sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Button>
            </Link>
            <h2 className="text-2xl font-bold text-gray-900">{equipment.name}</h2>
            <Badge variant={getStatusBadgeVariant(equipment.status)} size="lg">
              {equipment.status}
            </Badge>
          </div>
          <p className="text-gray-600 ml-12">{equipment.identifier}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/equipment/${equipment.id}/edit`}>
            <Button variant="secondary">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Button>
          </Link>
          <Link href={`/dashboard/reports/new?equipment=${equipment.id}`}>
            <Button>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Report
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>Equipment Information</CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <p className="text-gray-900">{equipment.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <p className="text-gray-900">{equipment.location}</p>
                </div>
                {equipment.manufacturer && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Manufacturer</label>
                    <p className="text-gray-900">{equipment.manufacturer}</p>
                  </div>
                )}
                {equipment.model && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Model</label>
                    <p className="text-gray-900">{equipment.model}</p>
                  </div>
                )}
                {equipment.serialNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Serial Number</label>
                    <p className="text-gray-900">{equipment.serialNumber}</p>
                  </div>
                )}
                {equipment.installDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Install Date</label>
                    <p className="text-gray-900">
                      {new Date(equipment.installDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sensors */}
          <Card>
            <CardHeader
              actions={
                <Link href={`/dashboard/equipment/${equipment.id}/sensors/new`}>
                  <Button size="sm">Add Sensor</Button>
                </Link>
              }
            >
              Sensors ({equipment.sensors?.length || 0})
            </CardHeader>
            <CardContent>
              {!equipment.sensors || equipment.sensors.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No sensors configured</p>
              ) : (
                <div className="space-y-4">
                  {equipment.sensors.map((sensor) => (
                    <div key={sensor.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{sensor.name}</h4>
                          <p className="text-sm text-gray-600">
                            Type: {sensor.sensorType} | Unit: {sensor.unit}
                          </p>
                        </div>
                        <Link href={`/dashboard/equipment/${equipment.id}/sensors/${sensor.id}`}>
                          <Button variant="ghost" size="sm">Configure</Button>
                        </Link>
                      </div>
                      {sensor.thresholds && sensor.thresholds.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs font-medium text-gray-500">Thresholds:</p>
                          {sensor.thresholds.map((threshold) => (
                            <div key={threshold.id} className="flex items-center gap-2 text-sm">
                              <Badge variant={getSeverityBadgeVariant(threshold.severity)} size="sm">
                                {threshold.severity}
                              </Badge>
                              <span className="text-gray-600">
                                {threshold.operator} {threshold.value} {sensor.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Reports */}
          <Card>
            <CardHeader>Recent Reports</CardHeader>
            <CardContent>
              {!equipment.reports || equipment.reports.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No reports yet</p>
              ) : (
                <div className="space-y-3">
                  {equipment.reports.slice(0, 5).map((report) => (
                    <Link key={report.id} href={`/dashboard/reports/${report.id}`}>
                      <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <p className="text-gray-900 mb-1">{report.issueDescription}</p>
                        <div className="flex justify-between items-center text-sm text-gray-600">
                          <span>By {report.reportedBy.name}</span>
                          <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions & Stats */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>Quick Actions</CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href={`/dashboard/reports/new?equipment=${equipment.id}`}>
                  <Button fullWidth variant="primary">
                    Create Maintenance Report
                  </Button>
                </Link>
                <Link href={`/dashboard/equipment/${equipment.id}/sensors/new`}>
                  <Button fullWidth variant="secondary">
                    Add Sensor
                  </Button>
                </Link>
                <Link href={`/dashboard/equipment/${equipment.id}/edit`}>
                  <Button fullWidth variant="secondary">
                    Edit Equipment
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>Statistics</CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Sensors</label>
                  <p className="text-2xl font-bold text-gray-900">{equipment.sensors?.length || 0}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Reports</label>
                  <p className="text-2xl font-bold text-gray-900">{equipment.reports?.length || 0}</p>
                </div>
                {equipment.installDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Days in Service</label>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.floor((Date.now() - new Date(equipment.installDate).getTime()) / (1000 * 60 * 60 * 24))}
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
