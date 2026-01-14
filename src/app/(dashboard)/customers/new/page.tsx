// src/app/(dashboard)/customers/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  ArrowLeft, Save, UserPlus, Mail, Phone, MapPin, 
  Home, Plus, Trash2, X, Star
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AddressForm {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  label: string;
  isDefault: boolean;
}

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Customer Form State
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // Address Form State
  const [addresses, setAddresses] = useState<AddressForm[]>([
    {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      label: 'Default',
      isDefault: true,
    }
  ]);

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Validate customer info
    if (!customerForm.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!customerForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerForm.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!customerForm.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }

    // Validate at least one address
    if (addresses.length === 0) {
      newErrors.addresses = 'At least one address is required';
    } else {
      // Validate first address (required)
      const firstAddr = addresses[0];
      if (!firstAddr.street.trim()) newErrors.street0 = 'Street is required';
      if (!firstAddr.city.trim()) newErrors.city0 = 'City is required';
      if (!firstAddr.state.trim()) newErrors.state0 = 'State is required';
      if (!firstAddr.postalCode.trim()) newErrors.postalCode0 = 'Postal code is required';
      if (!firstAddr.country.trim()) newErrors.country0 = 'Country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddAddress = () => {
    setAddresses([
      ...addresses,
      {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        label: `Address ${addresses.length + 1}`,
        isDefault: false,
      }
    ]);
  };

  const handleRemoveAddress = (index: number) => {
    if (addresses.length === 1) {
      toast.error('At least one address is required');
      return;
    }
    
    const newAddresses = addresses.filter((_, i) => i !== index);
    
    // If removed address was default, make first address default
    if (addresses[index].isDefault && newAddresses.length > 0) {
      newAddresses[0].isDefault = true;
    }
    
    setAddresses(newAddresses);
  };

  const handleSetDefaultAddress = (index: number) => {
    setAddresses(addresses.map((addr, i) => ({
      ...addr,
      isDefault: i === index
    })));
  };

  const handleAddressChange = (index: number, field: keyof AddressForm, value: string | boolean) => {
    const newAddresses = [...addresses];
    newAddresses[index] = {
      ...newAddresses[index],
      [field]: value
    };
    setAddresses(newAddresses);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    
    try {
      // Format addresses with IDs and timestamps
      const formattedAddresses = addresses.map(addr => ({
        ...addr,
        id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
      }));

      // Create customer document
      const customerData = {
        name: customerForm.name.trim(),
        email: customerForm.email.trim().toLowerCase(),
        phone: customerForm.phone.trim(),
        addresses: formattedAddresses,
        totalOrders: 0,
        totalSpent: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'customers'), customerData);
      
      toast.success('Customer created successfully!');
      router.push(`/customers/${docRef.id}`);
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error('Failed to create customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-purple-50/20 to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
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
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="h-7 w-7 text-purple-600" />
                  Create New Customer
                </h1>
                <p className="text-sm text-slate-500 mt-1">Add a new customer to your database</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information Card */}
          <Card className="border-none shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Customer Information</h2>
                <p className="text-sm text-slate-600">Basic details about the customer</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  className={`w-full px-4 py-3 border-2 ${errors.name ? 'border-red-300' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                  placeholder="John Doe"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    className={`w-full pl-11 pr-4 py-3 border-2 ${errors.email ? 'border-red-300' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                    placeholder="john.doe@example.com"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    className={`w-full pl-11 pr-4 py-3 border-2 ${errors.phone ? 'border-red-300' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                    placeholder="+91-9876543210"
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
            </div>
          </Card>

          {/* Addresses Card */}
          <Card className="border-none shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Addresses</h2>
                  <p className="text-sm text-slate-600">Add customer addresses ({addresses.length})</p>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleAddAddress}
                variant="outline"
                size="sm"
                className="border-2 border-amber-200 hover:bg-amber-50"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Address
              </Button>
            </div>

            {errors.addresses && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm font-medium">{errors.addresses}</p>
              </div>
            )}

            <div className="space-y-6">
              {addresses.map((address, index) => (
                <div 
                  key={index}
                  className={`p-6 rounded-xl border-2 ${address.isDefault ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200 bg-white'} transition-all`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <MapPin className={`w-5 h-5 ${address.isDefault ? 'text-amber-600' : 'text-slate-400'}`} />
                      <h3 className="font-bold text-slate-900">
                        {address.label || `Address ${index + 1}`}
                        {index === 0 && <span className="text-red-500 ml-1">*</span>}
                      </h3>
                      {address.isDefault && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                          <Star className="w-3 h-3 mr-1" />
                          Default
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!address.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(index)}
                          className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                        >
                          Set as default
                        </button>
                      )}
                      {addresses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAddress(index)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Label */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Address Label
                      </label>
                      <input
                        type="text"
                        value={address.label}
                        onChange={(e) => handleAddressChange(index, 'label', e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Home, Office, etc."
                      />
                    </div>

                    {/* Street */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Street Address {index === 0 && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={address.street}
                        onChange={(e) => handleAddressChange(index, 'street', e.target.value)}
                        className={`w-full px-4 py-2.5 border-2 ${errors[`street${index}`] ? 'border-red-300' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                        placeholder="Street address"
                      />
                      {errors[`street${index}`] && <p className="text-red-500 text-xs mt-1">{errors[`street${index}`]}</p>}
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        City {index === 0 && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={address.city}
                        onChange={(e) => handleAddressChange(index, 'city', e.target.value)}
                        className={`w-full px-4 py-2.5 border-2 ${errors[`city${index}`] ? 'border-red-300' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                        placeholder="City"
                      />
                      {errors[`city${index}`] && <p className="text-red-500 text-xs mt-1">{errors[`city${index}`]}</p>}
                    </div>

                    {/* State */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        State {index === 0 && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={address.state}
                        onChange={(e) => handleAddressChange(index, 'state', e.target.value)}
                        className={`w-full px-4 py-2.5 border-2 ${errors[`state${index}`] ? 'border-red-300' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                        placeholder="State"
                      />
                      {errors[`state${index}`] && <p className="text-red-500 text-xs mt-1">{errors[`state${index}`]}</p>}
                    </div>

                    {/* Postal Code */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Postal Code {index === 0 && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={address.postalCode}
                        onChange={(e) => handleAddressChange(index, 'postalCode', e.target.value)}
                        className={`w-full px-4 py-2.5 border-2 ${errors[`postalCode${index}`] ? 'border-red-300' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                        placeholder="PIN code"
                      />
                      {errors[`postalCode${index}`] && <p className="text-red-500 text-xs mt-1">{errors[`postalCode${index}`]}</p>}
                    </div>

                    {/* Country */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Country {index === 0 && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={address.country}
                        onChange={(e) => handleAddressChange(index, 'country', e.target.value)}
                        className={`w-full px-4 py-2.5 border-2 ${errors[`country${index}`] ? 'border-red-300' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                        placeholder="Country"
                      />
                      {errors[`country${index}`] && <p className="text-red-500 text-xs mt-1">{errors[`country${index}`]}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/customers')}
              className="px-8 border-2"
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="px-8 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              loading={loading}
            >
              <Save className="w-4 h-4 mr-2" />
              Create Customer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}