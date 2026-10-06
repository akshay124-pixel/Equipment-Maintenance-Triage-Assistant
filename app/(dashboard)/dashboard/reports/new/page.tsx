'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface Equipment {
  id: string;
  identifier: string;
  name: string;
  sensors?: Array<{
    id: string;
    name: string;
    unit: string;
    sensorType: string;
  }>;
}

interface SensorReading {
  sensorDefinitionId: string;
  value: number;
}

export default function NewReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [equipmentLoading, setEquipmentLoading] = useState(true);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  
  const [formData, setFormData] = useState({
    equipmentId: searchParams?.get('equipment') || '',
    issueDescription: '',
    operatingEvents: [''],
    sensorReadings: [] as SensorReading[],
  });

  useEffect(() => {
    fetchEquipment();
  }, []);

  useEffect(() => {
    if (formData.equipmentId) {
      const selected = equipment.find(e => e.id === formData.equipmentId);
      setSelectedEquipment(selected || null);
      if (selected && selected.sensors) {
        // Initialize sensor readings
        setFormData(prev => ({
          ...prev,
          sensorReadings: selected.sensors!.map(s => ({
            sensorDefinitionId: s.id,
            value: 0,
          })),
        }));
      }
    }
  }, [formData.equipmentId, equipment]);

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
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
      showToast('Error loading equipment', 'error');
    } finally {
      setEquipmentLoading(false);
    }
  };

  const handleAddOperatingEvent = () => {
    setFormData(prev => ({
      ...prev,
      operatingEvents: [...prev.operatingEvents, ''],
    }));
  };

  const handleRemoveOperatingEvent = (index: number) => {
    setFormData(prev => ({
      ...prev,
      operatingEvents: prev.operatingEvents.filter((_, i) => i !== index),
    }));
  };

  const handleOperatingEventChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      operatingEvents: prev.operatingEvents.map((event, i) => i === index ? value : event),
    }));
  };

  const handleSensorReadingChange = (sensorId: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      sensorReadings: prev.sensorReadings.map(reading =>
        reading.sensorDefinitionId === sensorId
          ? { ...reading, value }
          : reading
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Filter out empty operating events and zero sensor readings
      const cleanedData = {
        equipmentId: formData.equipmentId,
        issueDescription: formData.issueDescription,
        operatingEvents: formData.operatingEvents.filter(e => e.trim() !== ''),
        sensorReadings: formData.sensorReadings.filter(r => r.value !== 0),
      };

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      });

      if (response.ok) {
        const data = await response.json();
        showToast('Report created successfully', 'success');
        router.push(`/dashboard/reports/${data.data.id}`);
      } else {
        const error = await response.json();
        showToast(error.error?.message || 'Failed to create report', 'error');
      }
    } catch (error) {
      console.error('Error creating report:', error);
      showToast('Error creating report', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (equipmentLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/reports">
          <Button variant="ghost" size="sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create Maintenance Report</h2>
          <p className="text-gray-600">Report equipment issues for triage and analysis</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Equipment Selection */}
        <Card className="mb-6">
          <CardHeader>Equipment Information</CardHeader>
          <CardContent>
            <Select
              label="Select Equipment"
              required
              options={[
                { value: '', label: 'Select equipment...' },
                ...equipment.map(e => ({
                  value: e.id,
                  label: `${e.name} (${e.identifier})`,
                })),
              ]}
              value={formData.equipmentId}
              onChange={(e) => setFormData({ ...formData, equipmentId: e.target.value })}
            />
          </CardContent>
        </Card>

        {/* Issue Description */}
        <Card className="mb-6">
          <CardHeader>Issue Description</CardHeader>
          <CardContent>
            <Textarea
              label="Describe the issue"
              placeholder="Provide detailed description of the problem observed..."
              required
              rows={6}
              value={formData.issueDescription}
              onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
              helperText="Be specific about symptoms, unusual behavior, sounds, vibrations, etc."
            />
          </CardContent>
        </Card>

        {/* Operating Events */}
        <Card className="mb-6">
          <CardHeader
            actions={
              <Button type="button" size="sm" onClick={handleAddOperatingEvent}>
                Add Event
              </Button>
            }
          >
            Recent Operating Events
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              List recent events like startups, shutdowns, load changes, or unusual conditions
            </p>
            <div className="space-y-3">
              {formData.operatingEvents.map((event, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Event ${index + 1} (e.g., "Started under heavy load", "Shutdown at 14:30")`}
                    value={event}
                    onChange={(e) => handleOperatingEventChange(index, e.target.value)}
                  />
                  {formData.operatingEvents.length > 1 && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveOperatingEvent(index)}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sensor Readings */}
        {selectedEquipment && selectedEquipment.sensors && selectedEquipment.sensors.length > 0 && (
          <Card className="mb-6">
            <CardHeader>Sensor Readings (Optional)</CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Enter current sensor values for deterministic threshold analysis
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedEquipment.sensors.map((sensor) => {
                  const reading = formData.sensorReadings.find(
                    r => r.sensorDefinitionId === sensor.id
                  );
                  return (
                    <div key={sensor.id}>
                      <Input
                        label={`${sensor.name} (${sensor.unit})`}
                        type="number"
                        step="0.01"
                        placeholder="0"
                        value={reading?.value || ''}
                        onChange={(e) => handleSensorReadingChange(
                          sensor.id,
                          parseFloat(e.target.value) || 0
                        )}
                        helperText={`Type: ${sensor.sensorType}`}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard/reports">
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
          <Button type="submit" loading={loading}>
            Create Report
          </Button>
        </div>
      </form>
    </div>
  );
}
