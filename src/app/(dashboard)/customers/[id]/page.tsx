'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Customer } from '@/lib/types/order';
import { Button } from '@/components/ui/Button';
import { 
  User, Mail, Phone, MapPin, Package, IndianRupee, 
  Calendar, Edit, ArrowLeft, Trash2, Plus, Star,
  TrendingUp, ShoppingBag, Clock, Home, X, Save
} from 'lucide-react';

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'addresses'>('overview');
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [addressForm, setAddressForm] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    label: '',
    isDefault: false
  });

  useEffect(() => {
    fetchCustomerData();
  }, [params.id]);

  useEffect(() => {
    if (customer) {
      setEditForm({
        name: customer.name,
        email: customer.email,
        phone: customer.phone || ''
      });
    }
  }, [customer]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      
      // Fetch customer details
      const customerDoc = await getDoc(doc(db, 'customers', params.id as string));
      if (customerDoc.exists()) {
        setCustomer({ id: customerDoc.id, ...customerDoc.data() } as Customer);
      }

      // Fetch customer orders
      const ordersQuery = query(
        collection(db, 'orders'),
        where('customerId', '==', params.id)
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)}`;
  };

  const handleEditCustomer = async () => {
    try {
      await updateDoc(doc(db, 'customers', customer!.id), {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        updatedAt: new Date()
      });
      setCustomer({ ...customer!, ...editForm, updatedAt: new Date() });
      setIsEditingCustomer(false);
      alert('Customer updated successfully!');
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Failed to update customer');
    }
  };

  const handleEditAddress = (address: any) => {
    setEditingAddressId(address.id);
    setAddressForm({
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      label: address.label,
      isDefault: address.isDefault
    });
  };

  const handleSaveAddress = async () => {
    try {
      const updatedAddresses = customer!.addresses!.map(addr => 
        addr.id === editingAddressId 
          ? { ...addr, ...addressForm }
          : addressForm.isDefault 
            ? { ...addr, isDefault: false }
            : addr
      );

      await updateDoc(doc(db, 'customers', customer!.id), {
        addresses: updatedAddresses,
        updatedAt: new Date()
      });

      setCustomer({ ...customer!, addresses: updatedAddresses });
      setEditingAddressId(null);
      alert('Address updated successfully!');
    } catch (error) {
      console.error('Error updating address:', error);
      alert('Failed to update address');
    }
  };

  const handleAddAddress = async () => {
    try {
      const newAddress = {
        ...addressForm,
        id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString()
      };

      const updatedAddresses = addressForm.isDefault
        ? [...(customer!.addresses || []).map(addr => ({ ...addr, isDefault: false })), newAddress]
        : [...(customer!.addresses || []), newAddress];

      await updateDoc(doc(db, 'customers', customer!.id), {
        addresses: updatedAddresses,
        updatedAt: new Date()
      });

      setCustomer({ ...customer!, addresses: updatedAddresses });
      setIsAddingAddress(false);
      setAddressForm({
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        label: '',
        isDefault: false
      });
      alert('Address added successfully!');
    } catch (error) {
      console.error('Error adding address:', error);
      alert('Failed to add address');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      const updatedAddresses = customer!.addresses!.filter(addr => addr.id !== addressId);

      await updateDoc(doc(db, 'customers', customer!.id), {
        addresses: updatedAddresses,
        updatedAt: new Date()
      });

      setCustomer({ ...customer!, addresses: updatedAddresses });
      alert('Address deleted successfully!');
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Failed to delete address');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <User className="h-24 w-24 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Customer Not Found</h2>
          <p className="text-slate-600 mb-6">The customer you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/customers')} variant="primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customers
          </Button>
        </div>
      </div>
    );
  }

  const defaultAddress = customer.addresses?.find(addr => addr.isDefault) || customer.addresses?.[0];
  const avgOrderValue = customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-amber-50/20 to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => router.push('/customers')} 
                variant="ghost"
                className="hover:bg-slate-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{customer.name}</h1>
                <p className="text-sm text-slate-500 mt-1">Customer since {formatDate(customer.createdAt)}</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                className="border-slate-300 hover:bg-slate-50"
                onClick={() => {
                  setActiveTab('overview');
                  setIsEditingCustomer(true);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="danger">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white/20 rounded-full p-2">
              <ShoppingBag className="h-8 w-8 opacity-80" />
                  </div>
                   <div className="bg-white/20 rounded-full px-3 py-1 text-xs font-semibold">
                Total
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-1">{customer.totalOrders}</h3>
            <p className="text-blue-100 text-sm font-medium">Total Orders</p>
          </div>

          <div className="bg-linear-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white/20 rounded-full p-2">
                <IndianRupee className="h-8 w-8 opacity-80" />
              </div>
              <div className="bg-white/20 rounded-full px-3 py-1 text-xs font-semibold">
                Lifetime
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-1">{formatCurrency(customer.totalSpent)}</h3>
            <p className="text-emerald-100 text-sm font-medium">Total Spent</p>
          </div>

          <div className="bg-linear-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white/20 rounded-full p-2">
                <TrendingUp className="h-8 w-8 opacity-80" />
              </div>
              <div className="bg-white/20 rounded-full px-3 py-1 text-xs font-semibold">
                Average
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-1">{formatCurrency(avgOrderValue)}</h3>
            <p className="text-amber-100 text-sm font-medium">Avg Order Value</p>
          </div>

          <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white/20 rounded-full p-2">
                  <Star className="h-8 w-8 opacity-80" />
                </div>
              <div className="bg-white/20 rounded-full px-3 py-1 text-xs font-semibold">
                Status
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-1">
              {customer.totalOrders > 5 ? 'VIP' : customer.totalOrders > 0 ? 'Active' : 'New'}
            </h3>
            <p className="text-purple-100 text-sm font-medium">Customer Status</p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'overview'
                  ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <User className="h-5 w-5 inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'orders'
                  ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Package className="h-5 w-5 inline mr-2" />
              Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'addresses'
                  ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Home className="h-5 w-5 inline mr-2" />
              Addresses ({customer.addresses?.length || 0})
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Contact Information */}
                  <div className="bg-linear-to-br from-slate-50 to-white rounded-xl p-6 border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                      <div className="bg-amber-100 rounded-lg p-2 mr-3">
                        <User className="h-5 w-5 text-amber-600" />
                      </div>
                      Contact Information
                    </h3>
                    {isEditingCustomer ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-2">Name</label>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-2">Email Address</label>
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-2">Phone Number</label>
                          <input
                            type="tel"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-slate-500 font-medium mb-1">Email Address</p>
                            <p className="text-slate-900 font-medium">{customer.email}</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <Phone className="h-5 w-5 text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-slate-500 font-medium mb-1">Phone Number</p>
                            <p className="text-slate-900 font-medium">{customer.phone || 'Not provided'}</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-slate-500 font-medium mb-1">Last Updated</p>
                            <p className="text-slate-900 font-medium">{formatDate(customer.updatedAt)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Default Address */}
                  <div className="bg-linear-to-br from-slate-50 to-white rounded-xl p-6 border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                      <div className="bg-amber-100 rounded-lg p-2 mr-3">
                        <MapPin className="h-5 w-5 text-amber-600" />
                      </div>
                      Default Address
                    </h3>
                    {defaultAddress ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                            <Star className="h-3 w-3 mr-1" />
                            {defaultAddress.label}
                          </span>
                        </div>
                        <p className="text-slate-900 font-medium">{defaultAddress.street}</p>
                        <p className="text-slate-600">{defaultAddress.city}</p>
                        <p className="text-slate-600">{defaultAddress.state}, {defaultAddress.postalCode}</p>
                        <p className="text-slate-600 font-medium">{defaultAddress.country}</p>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-500">No address available</p>
                        <Button variant="outline" className="mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Address
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* All Addresses Section - Only shown in edit mode */}
                {isEditingCustomer && (
                  <div className="bg-linear-to-br from-slate-50 to-white rounded-xl p-6 border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                      <div className="bg-amber-100 rounded-lg p-2 mr-3">
                        <Home className="h-5 w-5 text-amber-600" />
                      </div>
                      All Addresses
                    </h3>
                    {customer.addresses && customer.addresses.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {customer.addresses.map((address) => (
                          <div
                            key={address.id}
                            className="bg-white rounded-xl p-6 border-2 border-slate-200 hover:border-amber-300 transition-all"
                          >
                            {editingAddressId === address.id ? (
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  placeholder="Label"
                                  value={addressForm.label}
                                  onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                                />
                                <input
                                  type="text"
                                  placeholder="Street Address"
                                  value={addressForm.street}
                                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                                />
                                <input
                                  type="text"
                                  placeholder="City"
                                  value={addressForm.city}
                                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                  <input
                                    type="text"
                                    placeholder="State"
                                    value={addressForm.state}
                                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Postal Code"
                                    value={addressForm.postalCode}
                                    onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                                  />
                                </div>
                                <input
                                  type="text"
                                  placeholder="Country"
                                  value={addressForm.country}
                                  onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                                />
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={addressForm.isDefault}
                                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                                  />
                                  <span className="text-sm font-medium text-slate-700">Set as default</span>
                                </label>
                                <div className="flex space-x-2 pt-2">
                                  <Button variant="primary" onClick={handleSaveAddress} className="flex-1">
                                    <Save className="h-4 w-4 mr-1" />
                                    Save
                                  </Button>
                                  <Button variant="outline" onClick={() => setEditingAddressId(null)} className="flex-1">
                                    <X className="h-4 w-4 mr-1" />
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-start justify-between mb-3">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                    address.isDefault 
                                      ? 'bg-amber-100 text-amber-700' 
                                      : 'bg-slate-100 text-slate-700'
                                  }`}>
                                    {address.isDefault && <Star className="h-3 w-3 mr-1" />}
                                    {address.label}
                                  </span>
                                  <div className="flex space-x-2">
                                    <button 
                                      onClick={() => handleEditAddress(address)}
                                      className="text-slate-400 hover:text-amber-600 transition-colors"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    {!address.isDefault && (
                                      <button 
                                        onClick={() => handleDeleteAddress(address.id)}
                                        className="text-slate-400 hover:text-red-600 transition-colors"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-1 text-slate-700">
                                  <p className="font-medium">{address.street}</p>
                                  <p>{address.city}</p>
                                  <p>{address.state}, {address.postalCode}</p>
                                  <p className="font-medium text-slate-900">{address.country}</p>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                        <div className="bg-white rounded-xl p-6 border-2 border-slate-200">
                          {isAddingAddress ? (
                            <div className="space-y-3">
                              <h4 className="font-bold text-slate-900 mb-3">Add New Address</h4>
                              <input
                                type="text"
                                placeholder="Label (e.g., Home, Office)"
                                value={addressForm.label}
                                onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                              />
                              <input
                                type="text"
                                placeholder="Street Address"
                                value={addressForm.street}
                                onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                              />
                              <input
                                type="text"
                                placeholder="City"
                                value={addressForm.city}
                                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                              />
                              <div className="grid grid-cols-2 gap-3">
                                <input
                                  type="text"
                                  placeholder="State"
                                  value={addressForm.state}
                                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                                />
                                <input
                                  type="text"
                                  placeholder="Postal Code"
                                  value={addressForm.postalCode}
                                  onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                                />
                              </div>
                              <input
                                type="text"
                                placeholder="Country"
                                value={addressForm.country}
                                onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                              />
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={addressForm.isDefault}
                                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                                />
                                <span className="text-sm font-medium text-slate-700">Set as default</span>
                              </label>
                              <div className="flex space-x-2 pt-2">
                                <Button variant="primary" onClick={handleAddAddress} className="flex-1">
                                  <Save className="h-4 w-4 mr-1" />
                                  Add Address
                                </Button>
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    setIsAddingAddress(false);
                                    setAddressForm({
                                      street: '',
                                      city: '',
                                      state: '',
                                      postalCode: '',
                                      country: 'India',
                                      label: '',
                                      isDefault: false
                                    });
                                  }} 
                                  className="flex-1"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setIsAddingAddress(true)}
                              className="w-full h-full min-h-50 flex flex-col items-center justify-center bg-linear-to-br from-amber-50 to-white rounded-xl border-2 border-dashed border-amber-300 hover:border-amber-400 hover:bg-amber-50 transition-all group"
                            >
                              <Plus className="h-12 w-12 text-amber-400 group-hover:text-amber-500 mb-3" />
                              <p className="text-amber-600 font-semibold">Add New Address</p>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Home className="h-20 w-20 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No Addresses</h3>
                        <p className="text-slate-600 mb-6">No addresses have been added yet.</p>
                        <Button variant="primary" onClick={() => setIsAddingAddress(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Address
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons - Only shown in edit mode */}
                {isEditingCustomer && (
                  <div className="flex justify-end space-x-3">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditingCustomer(false);
                        setEditingAddressId(null);
                        setIsAddingAddress(false);
                        setEditForm({
                          name: customer.name,
                          email: customer.email,
                          phone: customer.phone || ''
                        });
                        setAddressForm({
                          street: '',
                          city: '',
                          state: '',
                          postalCode: '',
                          country: 'India',
                          label: '',
                          isDefault: false
                        });
                      }}
                      className="px-8"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel All Changes
                    </Button>
                    <Button variant="primary" onClick={handleEditCustomer} className="px-8">
                      <Save className="h-4 w-4 mr-2" />
                      Save Customer Info
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-linear-to-br from-white to-slate-50 rounded-xl p-6 border border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => router.push(`/orders/${order.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-bold text-slate-900">Order #{order.orderNumber || order.id.slice(-8)}</h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                                order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-slate-600">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {formatDate(order.createdAt)}
                              </div>
                              <div className="flex items-center">
                                <Package className="h-4 w-4 mr-1" />
                                {order.items?.length || 0} items
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-slate-900">{formatCurrency(order.totalAmount || 0)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="h-20 w-20 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No Orders Yet</h3>
                    <p className="text-slate-600 mb-6">This customer hasn't placed any orders.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'addresses' && (
              <div>
                {customer.addresses && customer.addresses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customer.addresses.map((address) => (
                      <div
                        key={address.id}
                        className="bg-linear-to-br from-white to-slate-50 rounded-xl p-6 border-2 border-slate-200 hover:border-amber-300 transition-all"
                      >
                        {editingAddressId === address.id ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              placeholder="Label"
                              value={addressForm.label}
                              onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                            />
                            <input
                              type="text"
                              placeholder="Street Address"
                              value={addressForm.street}
                              onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                            />
                            <input
                              type="text"
                              placeholder="City"
                              value={addressForm.city}
                              onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="text"
                                placeholder="State"
                                value={addressForm.state}
                                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                              />
                              <input
                                type="text"
                                placeholder="Postal Code"
                                value={addressForm.postalCode}
                                onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                              />
                            </div>
                            <input
                              type="text"
                              placeholder="Country"
                              value={addressForm.country}
                              onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                            />
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={addressForm.isDefault}
                                onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                              />
                              <span className="text-sm font-medium text-slate-700">Set as default</span>
                            </label>
                            <div className="flex space-x-2 pt-2">
                              <Button variant="primary" onClick={handleSaveAddress} className="flex-1">
                                <Save className="h-4 w-4 mr-1" />
                                Save
                              </Button>
                              <Button variant="outline" onClick={() => setEditingAddressId(null)} className="flex-1">
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between mb-3">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                address.isDefault 
                                  ? 'bg-amber-100 text-amber-700' 
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {address.isDefault && <Star className="h-3 w-3 mr-1" />}
                                {address.label}
                              </span>
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => handleEditAddress(address)}
                                  className="text-slate-400 hover:text-amber-600 transition-colors"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                {!address.isDefault && (
                                  <button 
                                    onClick={() => handleDeleteAddress(address.id)}
                                    className="text-slate-400 hover:text-red-600 transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1 text-slate-700">
                              <p className="font-medium">{address.street}</p>
                              <p>{address.city}</p>
                              <p>{address.state}, {address.postalCode}</p>
                              <p className="font-medium text-slate-900">{address.country}</p>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                    <div className="bg-linear-to-br from-white to-slate-50 rounded-xl p-6 border-2 border-slate-200">
                      {isAddingAddress ? (
                        <div className="space-y-3">
                          <h4 className="font-bold text-slate-900 mb-3">Add New Address</h4>
                          <input
                            type="text"
                            placeholder="Label (e.g., Home, Office)"
                            value={addressForm.label}
                            onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                          />
                          <input
                            type="text"
                            placeholder="Street Address"
                            value={addressForm.street}
                            onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                          />
                          <input
                            type="text"
                            placeholder="City"
                            value={addressForm.city}
                            onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="State"
                              value={addressForm.state}
                              onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                            />
                            <input
                              type="text"
                              placeholder="Postal Code"
                              value={addressForm.postalCode}
                              onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                            />
                          </div>
                          <input
                            type="text"
                            placeholder="Country"
                            value={addressForm.country}
                            onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                          />
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={addressForm.isDefault}
                              onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                            />
                            <span className="text-sm font-medium text-slate-700">Set as default</span>
                          </label>
                          <div className="flex space-x-2 pt-2">
                            <Button variant="primary" onClick={handleAddAddress} className="flex-1">
                              <Save className="h-4 w-4 mr-1" />
                              Add Address
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setIsAddingAddress(false);
                                setAddressForm({
                                  street: '',
                                  city: '',
                                  state: '',
                                  postalCode: '',
                                  country: 'India',
                                  label: '',
                                  isDefault: false
                                });
                              }} 
                              className="flex-1"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setIsAddingAddress(true)}
                          className="w-full h-full min-h-50 flex flex-col items-center justify-center bg-linear-to-br from-amber-50 to-white rounded-xl border-2 border-dashed border-amber-300 hover:border-amber-400 hover:bg-amber-50 transition-all group"
                        >
                          <Plus className="h-12 w-12 text-amber-400 group-hover:text-amber-500 mb-3" />
                          <p className="text-amber-600 font-semibold">Add New Address</p>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Home className="h-20 w-20 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No Addresses</h3>
                    <p className="text-slate-600 mb-6">No addresses have been added yet.</p>
                    <Button variant="primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Address
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}