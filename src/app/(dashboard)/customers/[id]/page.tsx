// src/app/(dashboard)/customers/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  ShoppingCart,
  Package,
  Edit2,
  Trash2,
  Save,
  X,
  Plus,
  CheckCircle,
  Calendar,
  TrendingUp,
  DollarSign,
  Award,
  History,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  deleteDoc,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Customer, Order, Address } from '@/lib/types/order';
import toast from 'react-hot-toast';

export default function CustomerDetailPage() {
  const { id: customerId } = useParams<{ id: string }>();
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState<Customer | null>(null);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCustomerData();
  }, [customerId]);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, 'customers', customerId));

      if (!snap.exists()) {
        toast.error('Customer not found');
        router.push('/customers');
        return;
      }

      const data = {
        id: snap.id,
        ...snap.data(),
        createdAt: snap.data().createdAt?.toDate(),
        updatedAt: snap.data().updatedAt?.toDate(),
      } as Customer;

      setCustomer(data);
      setEditedCustomer(JSON.parse(JSON.stringify(data)));

      const ordersQuery = query(
        collection(db, 'orders'),
        where('customerId', '==', customerId),
        orderBy('createdAt', 'desc')
      );

      const ordersSnap = await getDocs(ordersQuery);
      setOrders(
        ordersSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as Order[]
      );
    } catch (e) {
      console.error(e);
      toast.error('Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedCustomer) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'customers', customerId), {
        name: editedCustomer.name,
        email: editedCustomer.email.toLowerCase(),
        phone: editedCustomer.phone,
        addresses: editedCustomer.addresses,
        updatedAt: new Date(),
      });

      setCustomer(editedCustomer);
      setEditMode(false);
      setEditingAddressId(null);
      toast.success('Customer updated');
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (orders.length > 0) {
      toast.error('Customer has orders');
      return;
    }
    if (!confirm('Delete this customer?')) return;

    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'customers', customerId));
      toast.success('Customer deleted');
      router.push('/customers');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAddress = async (address: Address) => {
    if (!confirm('Delete this address?')) return;

    await updateDoc(doc(db, 'customers', customerId), {
      addresses: arrayRemove(address),
      updatedAt: new Date(),
    });

    const updated = editedCustomer!.addresses.filter(a => a.id !== address.id);
    setEditedCustomer({ ...editedCustomer!, addresses: updated });
    setCustomer({ ...customer!, addresses: updated });
  };

  const handleSetDefaultAddress = (id: string) => {
    setEditedCustomer({
      ...editedCustomer!,
      addresses: editedCustomer!.addresses.map(a => ({
        ...a,
        isDefault: a.id === id,
      })),
    });
  };

  const handleAddNewAddress = () => {
    const addr: Address = {
      id: `addr_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      label: '',
      isDefault: editedCustomer!.addresses.length === 0,
      createdAt: new Date().toISOString(),
    };

    setEditedCustomer({
      ...editedCustomer!,
      addresses: [...editedCustomer!.addresses, addr],
    });
    setEditingAddressId(addr.id);
  };

  if (loading) return <div className="p-8 text-center">Loading…</div>;
  if (!customer) return null;

  const isVIP = customer.totalSpent > 10000;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/customers">
          <ArrowLeft />
        </Link>
        <h1 className="text-2xl font-bold">{customer.name}</h1>
        {isVIP && (
          <div title="VIP Customer">
            <Award className="text-amber-500" />
          </div>
        )}
      </div>

      {/* Addresses */}
      <Card>
        <div className="flex justify-between mb-3">
          <h2 className="font-bold">Addresses</h2>
          <Badge>{editedCustomer?.addresses.length}</Badge>
        </div>

        {editedCustomer?.addresses.map(addr => (
          <div key={addr.id} className="border p-3 rounded mb-2">
            <p className="font-semibold">{addr.street}</p>
            <p className="text-sm text-gray-600">
              {addr.city}, {addr.state} {addr.postalCode}
            </p>

            {editMode && (
              <div className="flex gap-2 mt-2">
                {!addr.isDefault && (
                  <Button size="sm" onClick={() => handleSetDefaultAddress(addr.id)}>
                    Set Default
                  </Button>
                )}
                <Button size="sm" variant="danger" onClick={() => handleDeleteAddress(addr)}>
                  Delete
                </Button>
              </div>
            )}
          </div>
        ))}

        {editMode && (
          <Button variant="outline" onClick={handleAddNewAddress}>
            <Plus className="mr-1" /> Add Address
          </Button>
        )}
      </Card>

      {/* Orders */}
      <Card>
        <h2 className="font-bold mb-3">Orders</h2>
        {orders.map(o => (
          <Link key={o.id} href={`/orders/${o.id}`}>
            <div className="border p-3 rounded mb-2">
              <div className="flex justify-between">
                <strong>{o.orderNumber}</strong>
                <OrderStatusBadge status={o.status} />
              </div>
            </div>
          </Link>
        ))}
      </Card>

      <div className="flex gap-2">
        {!editMode ? (
          <Button onClick={() => setEditMode(true)}>Edit</Button>
        ) : (
          <>
            <Button onClick={handleSave} loading={saving}>
              Save
            </Button>
            <Button variant="outline" onClick={() => setEditMode(false)}>
              Cancel
            </Button>
          </>
        )}
        <Button
          variant="danger"
          onClick={handleDeleteCustomer}
          disabled={orders.length > 0}
          loading={deleting}
        >
          Delete Customer
        </Button>
      </div>
    </div>
  );
}
