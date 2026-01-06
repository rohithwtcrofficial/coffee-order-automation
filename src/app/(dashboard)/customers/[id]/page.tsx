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
  ArrowLeft, User, Mail, Phone, MapPin, ShoppingCart, Package, 
  Edit2, Trash2, Save, X, Plus, CheckCircle 
} from 'lucide-react';
import Link from 'next/link';
import { doc, getDoc, collection, query, where, orderBy, getDocs, updateDoc, deleteDoc, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Customer, Order, Address } from '@/lib/types/order';
import toast from 'react-hot-toast';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState<any>(null);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCustomerData();
  }, [customerId]);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      // Fetch customer
      const customerDoc = await getDoc(doc(db, 'customers', customerId));
      
      if (!customerDoc.exists()) {
        toast.error('Customer not found');
        router.push('/customers');
        return;
      }

      const customerData = {
        id: customerDoc.id,
        ...customerDoc.data(),
        createdAt: customerDoc.data().createdAt?.toDate() || new Date(),
        updatedAt: customerDoc.data().updatedAt?.toDate() || new Date(),
      } as Customer;

      // Handle legacy address format
      if (customerData.address && !customerData.addresses) {
        customerData.addresses = [{
          id: `addr_legacy_${Date.now()}`,
          street: customerData.address.street,
          city: customerData.address.city,
          state: customerData.address.state,
          postalCode: customerData.address.postalCode,
          country: customerData.address.country,
          label: 'Default',
          isDefault: true,
          createdAt: new Date().toISOString(),
        }];
      }

      setCustomer(customerData);
      setEditedCustomer(JSON.parse(JSON.stringify(customerData)));

      // Fetch orders
      const ordersQuery = query(
        collection(db, 'orders'),
        where('customerId', '==', customerId),
        orderBy('createdAt', 'desc')
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Order[];

      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast.error('Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const customerRef = doc(db, 'customers', customerId);
      await updateDoc(customerRef, {
        name: editedCustomer.name,
        email: editedCustomer.email.toLowerCase(),
        phone: editedCustomer.phone,
        addresses: editedCustomer.addresses,
        updatedAt: new Date(),
      });

      setCustomer(editedCustomer);
      setEditMode(false);
      setEditingAddressId(null);
      toast.success('Customer updated successfully');
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Failed to update customer');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }

    if (orders.length > 0) {
      toast.error('Cannot delete customer with existing orders');
      return;
    }

    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'customers', customerId));
      toast.success('Customer deleted successfully');
      router.push('/customers');
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      const addressToDelete = editedCustomer.addresses.find((a: Address) => a.id === addressId);
      const customerRef = doc(db, 'customers', customerId);
      
      await updateDoc(customerRef, {
        addresses: arrayRemove(addressToDelete),
        updatedAt: new Date(),
      });

      const updatedAddresses = editedCustomer.addresses.filter((a: Address) => a.id !== addressId);
      setEditedCustomer({ ...editedCustomer, addresses: updatedAddresses });
      setCustomer({ ...customer!, addresses: updatedAddresses });
      
      toast.success('Address deleted successfully');
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    const updatedAddresses = editedCustomer.addresses.map((addr: Address) => ({
      ...addr,
      isDefault: addr.id === addressId,
    }));

    setEditedCustomer({ ...editedCustomer, addresses: updatedAddresses });
  };

  const handleUpdateAddress = (addressId: string, field: string, value: string) => {
    const updatedAddresses = editedCustomer.addresses.map((addr: Address) => 
      addr.id === addressId ? { ...addr, [field]: value } : addr
    );
    setEditedCustomer({ ...editedCustomer, addresses: updatedAddresses });
  };

  const handleAddNewAddress = () => {
    const newAddress: Address = {
      id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      label: '',
      isDefault: editedCustomer.addresses?.length === 0,
      createdAt: new Date().toISOString(),
    };

    setEditedCustomer({
      ...editedCustomer,
      addresses: [...(editedCustomer.addresses || []), newAddress],
    });
    setEditingAddressId(newAddress.id);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  const formatDateShort = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Customer not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Link 
          href="/customers"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Customers
        </Link>

        <div className="flex gap-2">
          {!editMode ? (
            <>
              <Button
                onClick={() => setEditMode(true)}
                variant="outline"
                size="sm"
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                onClick={handleDeleteCustomer}
                variant="outline"
                size="sm"
                loading={deleting}
                disabled={orders.length > 0}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => {
                  setEditMode(false);
                  setEditingAddressId(null);
                  setEditedCustomer(JSON.parse(JSON.stringify(customer)));
                }}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                variant="default"
                size="sm"
                loading={saving}
              >
                <Save className="w-4 h-4 mr-1" />
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
        <p className="text-gray-600 mt-1">Customer since {formatDateShort(customer.createdAt)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info Sidebar */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
            </div>
            
            {editMode ? (
              <div className="space-y-3">
                <Input
                  label="Name *"
                  value={editedCustomer.name}
                  onChange={(e) => setEditedCustomer({ ...editedCustomer, name: e.target.value })}
                />
                <Input
                  label="Email *"
                  type="email"
                  value={editedCustomer.email}
                  onChange={(e) => setEditedCustomer({ ...editedCustomer, email: e.target.value })}
                />
                <Input
                  label="Phone *"
                  type="tel"
                  value={editedCustomer.phone}
                  onChange={(e) => setEditedCustomer({ ...editedCustomer, phone: e.target.value })}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900">{customer.email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900">{customer.phone}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Addresses */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Addresses</h2>
              </div>
              <Badge variant="info">{editedCustomer.addresses?.length || 0}</Badge>
            </div>
            
            {editedCustomer.addresses && editedCustomer.addresses.length > 0 ? (
              <div className="space-y-3">
                {editedCustomer.addresses.map((address: Address) => (
                  <div 
                    key={address.id}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    {editMode && editingAddressId === address.id ? (
                      // Edit Mode for Address
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-700">Editing Address</span>
                          <Button
                            onClick={() => setEditingAddressId(null)}
                            variant="ghost"
                            size="sm"
                          >
                            Done
                          </Button>
                        </div>
                        
                        <Input
                          label="Label"
                          value={address.label || ''}
                          onChange={(e) => handleUpdateAddress(address.id, 'label', e.target.value)}
                          placeholder="Home, Office, etc."
                        />
                        <Input
                          label="Street Address *"
                          value={address.street}
                          onChange={(e) => handleUpdateAddress(address.id, 'street', e.target.value)}
                          placeholder="123 Main St"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            label="City *"
                            value={address.city}
                            onChange={(e) => handleUpdateAddress(address.id, 'city', e.target.value)}
                            placeholder="Bangalore"
                          />
                          <Input
                            label="State *"
                            value={address.state}
                            onChange={(e) => handleUpdateAddress(address.id, 'state', e.target.value)}
                            placeholder="Karnataka"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            label="Postal Code *"
                            value={address.postalCode}
                            onChange={(e) => handleUpdateAddress(address.id, 'postalCode', e.target.value)}
                            placeholder="560001"
                          />
                          <Input
                            label="Country *"
                            value={address.country}
                            onChange={(e) => handleUpdateAddress(address.id, 'country', e.target.value)}
                            placeholder="India"
                          />
                        </div>
                      </div>
                    ) : (
                      // View Mode for Address
                      <>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {address.label && (
                              <span className="px-2 py-0.5 bg-white text-gray-700 rounded text-xs font-semibold border border-gray-200">
                                {address.label}
                              </span>
                            )}
                            {address.isDefault && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                                Default
                              </span>
                            )}
                          </div>
                          
                          {editMode && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => setEditingAddressId(address.id)}
                                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                title="Edit address"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {!address.isDefault && (
                                <button
                                  onClick={() => handleSetDefaultAddress(address.id)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Set as default"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              {editedCustomer.addresses.length > 1 && (
                                <button
                                  onClick={() => handleDeleteAddress(address.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="Delete address"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-900 space-y-1">
                          <p className="font-medium">{address.street}</p>
                          <p className="text-gray-600">
                            {address.city}, {address.state} {address.postalCode}
                          </p>
                          <p className="text-gray-600">{address.country}</p>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No addresses saved</p>
              </div>
            )}
            
            {editMode && (
              <Button
                onClick={handleAddNewAddress}
                variant="outline"
                size="sm"
                className="w-full mt-3"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add New Address
              </Button>
            )}
          </Card>

          {/* Stats */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Orders</span>
                <Badge variant="info">{customer.totalOrders}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Spent</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(customer.totalSpent)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Order</span>
                <span className="text-sm font-semibold text-gray-900">
                  {customer.totalOrders > 0
                    ? formatCurrency(customer.totalSpent / customer.totalOrders)
                    : '₹0'}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Orders List */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center gap-2 mb-6">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Order History</h2>
              <Badge variant="default">{orders.length}</Badge>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Link 
                    key={order.id} 
                    href={`/orders/${order.id}`}
                    className="block"
                  >
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <OrderStatusBadge status={order.status} />
                      </div>

                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">
                              {item.productName} ({item.grams}g) × {item.quantity}
                            </span>
                            <span className="font-medium text-gray-900">
                              {formatCurrency(item.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Total</span>
                        <span className="text-lg font-bold text-gray-900">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>

                      {order.trackingId && (
                        <div className="mt-2 text-xs text-gray-600">
                          Tracking: {order.trackingId}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}