// src/app/(dashboard)/orders/new/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ArrowLeft, Plus, Trash2, Search, User, MapPin, AlertCircle, X, Mail, Phone, Home, Package } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { collection, addDoc, serverTimestamp, getDocs, query, where, updateDoc, doc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Customer, Address } from '@/lib/types/order';

interface Product {
  id: string;
  name: string;
  availableGrams: number[];
  pricePerVariant: Record<number, number>;
  category: string;
  roastLevel: string;
  imageUrl?: string;
}

interface OrderItem {
  productId: string;
  productName: string;
  category: string;
  roastLevel: string;
  grams: number;
  quantity: number;
  pricePerUnit: number;
  subtotal: number;
  imageUrl?: string;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  label?: string;
}

interface LegacyCustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  addresses?: Address[];
  totalOrders: number;
  totalSpent: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Customer search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState<Customer | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [manualOrderNumber, setManualOrderNumber] = useState('');
  
  // Customer Information
  const [customer, setCustomer] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    label: '',
  });

  // Order Items
  const [items, setItems] = useState<OrderItem[]>([
    { 
      productId: '', 
      productName: '', 
      category: '',
      roastLevel: '',
      grams: 250, 
      quantity: 1, 
      pricePerUnit: 0, 
      subtotal: 0,
      imageUrl: '' 
    }
  ]);

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, 'products'), where('isActive', '==', true));
        const querySnapshot = await getDocs(q);
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
      }
    };
    fetchProducts();
  }, []);

  const convertLegacyCustomer = (legacyData: LegacyCustomerData): Customer => {
    if (legacyData.addresses && Array.isArray(legacyData.addresses) && legacyData.addresses.length > 0) {
      return legacyData as Customer;
    }

    if (legacyData.address) {
      const convertedAddress: Address = {
        id: `addr_legacy_${Date.now()}`,
        street: legacyData.address.street,
        city: legacyData.address.city,
        state: legacyData.address.state,
        postalCode: legacyData.address.postalCode,
        country: legacyData.address.country,
        label: 'Default',
        isDefault: true,
        createdAt: new Date().toISOString(),
      };

      return {
        ...legacyData,
        addresses: [convertedAddress]
      } as Customer;
    }

    return {
      ...legacyData,
      addresses: []
    } as Customer;
  };

  // Enhanced search function
  const handleSearchCustomer = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setSearchingCustomer(true);
    setSearchResults([]);

    try {
      const customersRef = collection(db, 'customers');
      const querySnapshot = await getDocs(customersRef);
      
      const searchTerm = searchQuery.toLowerCase().trim();
      const results: Customer[] = [];

      querySnapshot.docs.forEach((doc) => {
        const rawData = {
          id: doc.id,
          ...doc.data()
        } as LegacyCustomerData;

        const customerData = convertLegacyCustomer(rawData);

        // Multi-field search
        const matchesName = customerData.name.toLowerCase().includes(searchTerm);
        const matchesEmail = customerData.email.toLowerCase().includes(searchTerm);
        const matchesPhone = customerData.phone.toLowerCase().includes(searchTerm);
        
        // Search in all addresses
        const matchesAddress = customerData.addresses?.some(addr => 
          addr.street.toLowerCase().includes(searchTerm) ||
          addr.city.toLowerCase().includes(searchTerm) ||
          addr.state.toLowerCase().includes(searchTerm) ||
          addr.postalCode.includes(searchTerm)
        ) || false;

        if (matchesName || matchesEmail || matchesPhone || matchesAddress) {
          results.push(customerData);
        }
      });

      if (results.length > 0) {
        setSearchResults(results);
        setShowSearchModal(true);
        toast.success(`Found ${results.length} customer${results.length > 1 ? 's' : ''}`);
      } else {
        toast('No customers found - Create new customer', {
          icon: '👤',
        });
        setCustomer({
          name: '',
          email: searchQuery.includes('@') ? searchQuery : '',
          phone: searchQuery.match(/\d/) ? searchQuery : '',
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'India',
          label: '',
        });
      }
    } catch (error) {
      console.error('Error searching customer:', error);
      toast.error('Failed to search customers');
    } finally {
      setSearchingCustomer(false);
    }
  };

  const selectCustomer = (selectedCustomer: Customer) => {
    setExistingCustomer(selectedCustomer);
    setCustomer({
      name: selectedCustomer.name,
      email: selectedCustomer.email,
      phone: selectedCustomer.phone,
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      label: '',
    });

    // Select default address if available
    if (selectedCustomer.addresses && selectedCustomer.addresses.length > 0) {
      const defaultAddr = selectedCustomer.addresses.find(a => a.isDefault);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      } else {
        setSelectedAddressId(selectedCustomer.addresses[0].id);
      }
    }

    setShowSearchModal(false);
    setSearchQuery('');
    toast.success(`Selected: ${selectedCustomer.name}`);
  };

  const addItem = () => {
    setItems([...items, { 
      productId: '', 
      productName: '', 
      category: '',
      roastLevel: '',
      grams: 250, 
      quantity: 1, 
      pricePerUnit: 0, 
      subtotal: 0,
      imageUrl: ''
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItemProduct = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newItems = [...items];
    const firstGram = product.availableGrams[0];
    
    newItems[index] = {
      ...newItems[index],
      productId: product.id,
      productName: product.name,
      category: product.category,
      roastLevel: product.roastLevel,
      grams: firstGram,
      pricePerUnit: product.pricePerVariant[firstGram],
      subtotal: newItems[index].quantity * product.pricePerVariant[firstGram],
      imageUrl: product.imageUrl || '',
    };
    
    setItems(newItems);
  };

  const updateItemGrams = (index: number, grams: number) => {
    const newItems = [...items];
    const product = products.find(p => p.id === newItems[index].productId);
    
    if (product) {
      const price = product.pricePerVariant[grams];
      newItems[index].grams = grams;
      newItems[index].pricePerUnit = price;
      newItems[index].subtotal = newItems[index].quantity * price;
      setItems(newItems);
    }
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index].quantity = quantity;
    newItems[index].subtotal = quantity * newItems[index].pricePerUnit;
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const checkDuplicateOrderNumber = async (orderNum: string): Promise<boolean> => {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('orderNumber', '==', orderNum.trim()));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking duplicate order number:', error);
    return false;
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!customer.name || !customer.email || !customer.phone) {
        throw new Error('Please fill in all customer information');
      }

      if (!manualOrderNumber.trim()) {
        throw new Error('Please enter the order number from Dukaan');
      }

      if (items.some(item => !item.productId || item.pricePerUnit <= 0)) {
        throw new Error('Please select products for all order items');
      }

      let customerId: string;
      let addressId: string;
      const totalAmount = calculateTotal();
      const isDuplicate = await checkDuplicateOrderNumber(manualOrderNumber);

      if (isDuplicate) {
        throw new Error('This order number already exists in the system. Please check Dukaan and enter a unique order number.');
        }

      let addressToUse: Address | CustomerInfo;
      if (existingCustomer && !useNewAddress && selectedAddressId) {
        const selectedAddr = existingCustomer.addresses?.find(a => a.id === selectedAddressId);
        if (!selectedAddr) {
          throw new Error('Please select a delivery address');
        }
        addressToUse = selectedAddr;
        addressId = selectedAddr.id;
      } else {
        if (!customer.street || !customer.city || !customer.state || !customer.postalCode) {
          throw new Error('Please fill in all address details');
        }
        addressToUse = customer;
        addressId = `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      if (existingCustomer) {
        customerId = existingCustomer.id;

        if (useNewAddress) {
          const newAddress: Address = {
            id: addressId,
            street: customer.street,
            city: customer.city,
            state: customer.state,
            postalCode: customer.postalCode,
            country: customer.country,
            label: customer.label || 'Other',
            isDefault: existingCustomer.addresses?.length === 0,
            createdAt: new Date().toISOString(),
          };

          const customerRef = doc(db, 'customers', customerId);
          const currentAddresses = existingCustomer.addresses || [];
          
          await updateDoc(customerRef, {
            addresses: [...currentAddresses, newAddress],
            totalOrders: increment(1),
            totalSpent: increment(totalAmount),
            updatedAt: serverTimestamp(),
          });
        } else {
          const customerRef = doc(db, 'customers', customerId);
          await updateDoc(customerRef, {
            totalOrders: increment(1),
            totalSpent: increment(totalAmount),
            updatedAt: serverTimestamp(),
          });
        }
      } else {
        const newAddress: Address = {
          id: addressId,
          street: customer.street,
          city: customer.city,
          state: customer.state,
          postalCode: customer.postalCode,
          country: customer.country,
          label: customer.label || 'Default',
          isDefault: true,
          createdAt: new Date().toISOString(),
        };

        const customerRef = await addDoc(collection(db, 'customers'), {
          name: customer.name,
          email: customer.email.toLowerCase(),
          phone: customer.phone,
          addresses: [newAddress],
          totalOrders: 1,
          totalSpent: totalAmount,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        customerId = customerRef.id;
      }

      const orderNumber = manualOrderNumber.trim();

      await addDoc(collection(db, 'orders'), {
  orderNumber,
  customerId,

  // 🔒 ADDRESS SNAPSHOT (IMMUTABLE)
  deliveryAddress: {
    id: addressId,
    label: addressToUse.label || 'Delivery',
    street: addressToUse.street,
    city: addressToUse.city,
    state: addressToUse.state,
    postalCode: addressToUse.postalCode,
    country: addressToUse.country,
  },

  items: items.map(item => ({
    productId: item.productId,
    productName: item.productName,
    category: item.category,
    roastLevel: item.roastLevel,
    grams: item.grams,
    quantity: item.quantity,
    pricePerUnit: item.pricePerUnit,
    subtotal: item.subtotal,
    imageUrl: item.imageUrl,
  })),

  totalAmount,
  currency: 'INR',
  status: 'RECEIVED',

  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});


      toast.success(
        existingCustomer 
          ? useNewAddress 
            ? 'Order created with new delivery address!'
            : 'Order created for existing customer!'
          : 'Order created with new customer!'
      );
      router.push('/orders');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableGramsForItem = (index: number) => {
    const item = items[index];
    const product = products.find(p => p.id === item.productId);
    return product?.availableGrams || [];
  };

  const getAvailableProductsForItem = (currentIndex: number) => {
  // Get all already selected product IDs except the current item
  const selectedProductIds = items
    .map((item, idx) => idx !== currentIndex ? item.productId : null)
    .filter(id => id !== null && id !== '');
  
  // Filter out already selected products
  return products.filter(p => !selectedProductIds.includes(p.id));
};

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link 
            href="/orders"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create New Order</h1>
          <p className="text-gray-600 mt-1">Search for customer or create new</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Search */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Customer Search</h2>
          </div>
          
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchCustomer())}
                disabled={!!existingCustomer}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <Button
              type="button"
              onClick={handleSearchCustomer}
              loading={searchingCustomer}
              disabled={searchingCustomer || !!existingCustomer || !searchQuery.trim()}
              className="px-6"
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
            {existingCustomer && (
              <Button
                type="button"
                onClick={() => {
                  setExistingCustomer(null);
                  setSearchQuery('');
                  setCustomer({
                    name: '',
                    email: '',
                    phone: '',
                    street: '',
                    city: '',
                    state: '',
                    postalCode: '',
                    country: 'India',
                    label: '',
                  });
                  setSelectedAddressId('');
                  setUseNewAddress(false);
                }}
                variant="ghost"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Existing Customer Info */}
          {existingCustomer && (
            <div className="p-4 bg-linear-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-green-900 text-lg">{existingCustomer.name}</h3>
                      <p className="text-xs text-green-700">Existing Customer</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-semibold">
                    {existingCustomer.totalOrders} Orders
                  </div>
                  <p className="text-sm text-green-700 mt-1">₹{existingCustomer.totalSpent.toFixed(2)} total</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm mt-4 pt-3 border-t border-green-200">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-xs text-green-600 font-medium">Email</p>
                    <p className="text-green-900 font-medium">{existingCustomer.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-xs text-green-600 font-medium">Phone</p>
                    <p className="text-green-900 font-medium">{existingCustomer.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-xs text-green-600 font-medium">Addresses</p>
                    <p className="text-green-900 font-medium">{existingCustomer.addresses?.length || 0} saved</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Customer Information - Only for new customers */}
        {!existingCustomer && searchQuery && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">New Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                placeholder="Rajesh Kumar"
                required
              />
              <Input
                label="Email *"
                type="email"
                value={customer.email}
                onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                placeholder="rajesh@example.com"
                required
              />
              <Input
                label="Phone *"
                type="tel"
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                placeholder="+91 98765 43210"
                required
              />
            </div>
          </Card>
        )}

        {/* Address Selection/Input */}
        {(existingCustomer || (!existingCustomer && searchQuery)) && (
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">Delivery Address</h2>
            </div>

            {existingCustomer && 
             existingCustomer.addresses && 
             Array.isArray(existingCustomer.addresses) && 
             existingCustomer.addresses.length > 0 && 
             !useNewAddress ? (
              <div className="space-y-3 mb-4">
                <p className="text-sm text-gray-600 mb-3 font-medium">
                  Select delivery address ({existingCustomer.addresses.length} saved)
                </p>
                {existingCustomer.addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedAddressId === addr.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={addr.id}
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {addr.label && (
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold">
                              {addr.label}
                            </span>
                          )}
                          {addr.isDefault && (
                            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-900 font-semibold mb-1">{addr.street}</p>
                        <p className="text-sm text-gray-600">
                          {addr.city}, {addr.state} {addr.postalCode}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{addr.country}</p>
                      </div>
                      {selectedAddressId === addr.id && (
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                          <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            ) : existingCustomer && existingCustomer.addresses?.length === 0 && !useNewAddress ? (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">No saved addresses</p>
                  <p className="text-xs text-yellow-700 mt-1">This customer doesn't have any saved addresses yet. Please add one below.</p>
                </div>
              </div>
            ) : null}

            {existingCustomer && existingCustomer.addresses && existingCustomer.addresses.length > 0 && (
              <Button
                type="button"
                onClick={() => {
                  setUseNewAddress(!useNewAddress);
                  if (!useNewAddress) {
                    setCustomer({
                      ...customer,
                      street: '',
                      city: '',
                      state: '',
                      postalCode: '',
                      country: 'India',
                      label: '',
                    });
                  }
                }}
                variant="outline"
                size="sm"
                className="mb-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                {useNewAddress ? 'Use existing address instead' : 'Add new delivery address'}
              </Button>
            )}

            {(useNewAddress || !existingCustomer || existingCustomer.addresses?.length === 0) && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-linear-to-br from-gray-50 to-blue-50 rounded-lg border-2 border-gray-200">
                  <Input
                    label="Address Label"
                    value={customer.label}
                    onChange={(e) => setCustomer({ ...customer, label: e.target.value })}
                    placeholder="Home, Office, etc."
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="Street Address *"
                      value={customer.street}
                      onChange={(e) => setCustomer({ ...customer, street: e.target.value })}
                      placeholder="123 MG Road"
                      required
                    />
                  </div>
                  <Input
                    label="City *"
                    value={customer.city}
                    onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                    placeholder="Bangalore"
                    required
                  />
                  <Input
                    label="State *"
                    value={customer.state}
                    onChange={(e) => setCustomer({ ...customer, state: e.target.value })}
                    placeholder="Karnataka"
                    required
                  />
                  <Input
                    label="Postal Code *"
                    value={customer.postalCode}
                    onChange={(e) => setCustomer({ ...customer, postalCode: e.target.value })}
                    placeholder="560001"
                    required
                  />
                  <Input
                    label="Country *"
                    value={customer.country}
                    onChange={(e) => setCustomer({ ...customer, country: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Manual Order Number Input */}
<Card>
  <div className="flex items-center gap-2 mb-4">
    <Package className="w-5 h-5 text-purple-600" />
    <h2 className="text-lg font-semibold text-gray-900">Order Number</h2>
  </div>
  
  <div className="bg-linear-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4">
    <Input
      label="Order Number from Dukaan *"
      value={manualOrderNumber}
      onChange={(e) => setManualOrderNumber(e.target.value)}
      placeholder="Enter order number (e.g., 22456989)"
      required
      className="font-mono text-lg"
    />
    <p className="text-xs text-purple-700 mt-2 flex items-center gap-2">
      <AlertCircle className="w-4 h-4" />
      Enter the exact order number from Dukaan website
    </p>
  </div>
</Card>

        {/* Order Items */}
        <Card>
          <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
          <Button 
            type="button" 
            onClick={addItem} 
            variant="outline" 
            size="sm"
            disabled={items.filter(i => i.productId).length >= products.length}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
        </div>

        {/* Add this warning message below the header */}
        {items.filter(i => i.productId).length >= products.length && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              All available products have been added to the order.
            </p>
          </div>
        )}

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3 border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeItem(index)}
                      variant="ghost"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Select
                label={`Select Product * (${getAvailableProductsForItem(index).length} available)`}
                value={item.productId}
                onChange={(e) => updateItemProduct(index, e.target.value)}
                options={[
                  { value: '', label: '-- Select Product --' },
                  ...getAvailableProductsForItem(index).map(p => ({ 
                    value: p.id, 
                    label: p.name 
                  }))
                ]}
                required
              />

                  {item.productId && (
                    <>
                      <Select
                        label="Size *"
                        value={item.grams.toString()}
                        onChange={(e) => updateItemGrams(index, parseInt(e.target.value))}
                        options={getAvailableGramsForItem(index).map(g => ({
                          value: g.toString(),
                          label: `${g}g - ₹${products.find(p => p.id === item.productId)?.pricePerVariant[g].toFixed(2)}`
                        }))}
                        required
                      />

                      <Input
                        label="Quantity *"
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                        required
                      />
                    </>
                  )}
                </div>

                {item.productId && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      {item.category} • {item.roastLevel} Roast
                      {item.imageUrl && (
                        <span className="ml-2 text-xs text-green-600">📷 Image available</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-600">Subtotal: </span>
                      <span className="text-lg font-semibold text-gray-900">
                        ₹{item.subtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t-2 border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-gray-700">Total Amount</span>
              <span className="text-2xl font-bold text-blue-600">₹{calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Submit Buttons - Fixed positioning */}
<div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-9999">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
    <div className="flex gap-4">
      <Button
        type="button"
        variant="outline"
        onClick={() => router.push('/orders')}
        disabled={loading}
        className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3"
      >
        Cancel
      </Button>
      <Button
  type="submit"
  loading={loading}
  disabled={loading}
  className="
    flex-1
    bg-linear-to-r from-stone-950 via-amber-950 to-brown-900
    hover:from-stone-900 hover:via-amber-900 hover:to-brown-800
    text-white font-bold py-3
    shadow-[0_12px_40px_rgba(74,44,22,0.75)]
  "
>
  {loading ? 'Creating Order...' : 'Create Order'}
</Button>


    </div>
  </div>
</div>
      </form>

      {/* Customer Search Results Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-linear-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Search Results</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Found {searchResults.length} customer{searchResults.length > 1 ? 's' : ''} matching "{searchQuery}"
                  </p>
                </div>
                <button
                  onClick={() => setShowSearchModal(false)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(80vh-120px)] p-6">
              <div className="space-y-4">
                {searchResults.map((cust) => (
                  <div
                    key={cust.id}
                    onClick={() => selectCustomer(cust)}
                    className="p-5 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-gray-900">{cust.name}</h4>
                          <p className="text-sm text-gray-500">Customer ID: {cust.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold inline-block">
                          {cust.totalOrders} Orders
                        </div>
                        <p className="text-sm text-gray-600 mt-1">₹{cust.totalSpent.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm font-medium text-gray-900">{cust.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="text-sm font-medium text-gray-900">{cust.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-orange-600" />
                        <div>
                          <p className="text-xs text-gray-500">Addresses</p>
                          <p className="text-sm font-medium text-gray-900">{cust.addresses?.length || 0} saved</p>
                        </div>
                      </div>
                    </div>

                    {cust.addresses && cust.addresses.length > 0 && (
                      <div className="border-t border-gray-200 pt-3">
                        <p className="text-xs font-semibold text-gray-500 mb-2">SAVED ADDRESSES:</p>
                        <div className="space-y-2">
                          {cust.addresses.slice(0, 2).map((addr) => (
                            <div key={addr.id} className="text-sm text-gray-600 pl-3 border-l-2 border-gray-300">
                              <span className="font-medium">{addr.label}: </span>
                              {addr.street}, {addr.city}, {addr.state}
                            </div>
                          ))}
                          {cust.addresses.length > 2 && (
                            <p className="text-xs text-gray-500 pl-3">
                              +{cust.addresses.length - 2} more address{cust.addresses.length - 2 > 1 ? 'es' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <Button
                        type="button"
                        size="sm"
                        className="w-full"
                        onClick={() => selectCustomer(cust)}
                      >
                        Select Customer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}