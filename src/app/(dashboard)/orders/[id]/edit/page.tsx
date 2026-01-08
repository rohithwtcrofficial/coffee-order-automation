'use client';

import { use , useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export default function OrderEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ✅ UNWRAP PARAMS
  const { id: orderId } = use(params);

  const router = useRouter();
  const [status, setStatus] = useState('RECEIVED');
  const [trackingId, setTrackingId] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    setLoading(true);
    await updateDoc(doc(db, 'orders', orderId), {
      status,
      trackingId: status === 'SHIPPED' ? trackingId : null,
      updatedAt: serverTimestamp(),
    });

    router.push(`/orders/${orderId}`);
    router.refresh();
  }

  return (
    <div className="max-w-xl space-y-6">
      <Link href={`/orders/${orderId}`} className="flex items-center gap-1 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <Card>
        <h1 className="text-xl font-bold mb-4">Update Order Status</h1>

        <Select
  value={status}
  onChange={(e) => setStatus(e.target.value)}
  options={[
    { label: 'Order Received', value: 'RECEIVED' },
    { label: 'Order Accepted', value: 'ACCEPTED' },
    { label: 'Order Packed', value: 'PACKED' },
    { label: 'Order Shipped', value: 'SHIPPED' },
    { label: 'Order Delivered', value: 'DELIVERED' },
    { label: 'Order Cancelled', value: 'CANCELLED' },
  ]}
/>



        {status === 'SHIPPED' && (
          <Input
            placeholder="Tracking ID"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
          />
        )}

        <Button onClick={handleUpdate} disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          Update Order
        </Button>
      </Card>
    </div>
  );
}
