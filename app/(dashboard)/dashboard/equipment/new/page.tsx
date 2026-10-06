'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';

export default function NewEquipmentPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '',
    name: '',
    type: '',
    location: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    installDate: '',
    status: 'OPERATIONAL',
    specifications: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/equipment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          specifications: formData.specifications ? JSON.parse(formData.specifications) : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showToast('Equipment created successfully', 'success');
        router.push(`/dashboard/equipment/${data.data.id}`);
      } else {
        const error = await response.json();
        showToast(error.error?.message || 'Failed to create equipment', 'error');
      }
    } catch (error) {
      console.error('Error creating equipment:', error);
      showToast('Error creating equipment', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/equipment">
          <Button variant="ghost" size="sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Add New Equipment</h2>
          <p className="text-gray-600">Register new equipment in the system</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>Equipment Information</CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Equipment Identifier"
                  placeholder="e.g., COMP-102"
                  required
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                />
                <Input
                  label="Equipment Name"
                  placeholder="e.g., Industrial Compressor"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Type"
                  placeholder="e.g., Compressor, Pump, Motor"
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                />
                <Input
                  label="Location"
                  placeholder="e.g., Building A, Floor 2"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Manufacturer"
                  placeholder="e.g., Atlas Copco"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                />
                <Input
                  label="Model"
                  placeholder="e.g., GA55"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Serial Number"
                  placeholder="e.g., SN-123456"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                />
                <Input
                  label="Install Date"
                  type="date"
                  value={formData.installDate}
                  onChange={(e) => setFormData({ ...formData, installDate: e.target.value })}
                />
              </div>

              <Select
                label="Status"
                required
                options={[
                  { value: 'OPERATIONAL', label: 'Operational' },
                  { value: 'WARNING', label: 'Warning' },
                  { value: 'CRITICAL', label: 'Critical' },
                  { value: 'MAINTENANCE', label: 'Under Maintenance' },
                  { value: 'OFFLINE', label: 'Offline' },
                ]}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              />

              <Textarea
                label="Specifications (JSON)"
                placeholder='{"power": "55kW", "pressure": "8bar"}'
                rows={4}
                helperText="Optional: Enter specifications as JSON object"
                value={formData.specifications}
                onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Link href="/dashboard/equipment">
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
          <Button type="submit" loading={loading}>
            Create Equipment
          </Button>
        </div>
      </form>
    </div>
  );
}
