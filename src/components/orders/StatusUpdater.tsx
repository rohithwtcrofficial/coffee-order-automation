// src/components/orders/StatusUpdater.tsx
'use client';

import { useState } from 'react';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { OrderStatus } from '@/lib/types';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface StatusUpdaterProps {
  orderId: string;
  currentStatus: OrderStatus;
  currentTrackingId?: string;
}

const statusOptions = [
  { value: 'RECEIVED', label: 'Order Received' },
  { value: 'ACCEPTED', label: 'Order Accepted' },
  { value: 'PACKED', label: 'Order Packed' },
  { value: 'SHIPPED', label: 'Order Shipped' },
  { value: 'DELIVERED', label: 'Order Delivered' },
  { value: 'CANCELLED', label: 'Order Cancelled' },
];

export function StatusUpdater({ 
  orderId, 
  currentStatus, 
  currentTrackingId 
}: StatusUpdaterProps) {
  const [status, setStatus] = useState(currentStatus);
  const [trackingId, setTrackingId] = useState(currentTrackingId || '');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdate = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          trackingId: trackingId || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }

      toast.success('Order updated successfully');
      router.refresh();
    } catch {
      toast.error('Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = status !== currentStatus || trackingId !== (currentTrackingId || '');

  return (
    <div className="space-y-4 p-6 bg-white rounded-lg border">
      <Select
        label="Order Status"
        value={status}
        onChange={(e) => setStatus(e.target.value as OrderStatus)}
        options={statusOptions}
      />

      {(status === 'SHIPPED' || status === 'DELIVERED') && (
        <Input
          label="Tracking ID"
          value={trackingId}
          onChange={(e) => setTrackingId(e.target.value)}
          placeholder="Enter tracking number"
        />
      )}

      <button
        onClick={handleUpdate}
        disabled={!hasChanges || loading}
        className={`
          w-full px-4 py-2 rounded-lg font-medium
          transition-colors duration-200
          ${hasChanges && !loading
            ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }
        `}
      >
        {loading ? 'Updating...' : 'Update Order'}
      </button>

      {status !== currentStatus && (
        <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
          ⚠️ Updating status will trigger an automated email to the customer
        </div>
      )}
    </div>
  );
}