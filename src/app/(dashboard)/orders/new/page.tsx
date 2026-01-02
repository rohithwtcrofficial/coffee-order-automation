// src/app/(dashboard)/orders/new/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

interface Product {
  id: string;
  name: string;
  availableGrams: number[];
  pricePerVariant: Record<number, number>;
  category: string;
  roastLevel: string;
  imageUrl?: string; // Optional image URL for future use
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
  imageUrl?: string; // Store product image for order history
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
}

export default function NewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Customer Information
  const [customer, setCustomer] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'INDIA',
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
      imageUrl: product.imageUrl || '', // Store image URL from product
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate
      if (!customer.name || !customer.email || !customer.phone) {
        throw new Error('Please fill in all customer information');
      }

      if (items.some(item => !item.productId || item.pricePerUnit <= 0)) {
        throw new Error('Please select products for all order items');
      }

      // Create customer first
      const customerRef = await addDoc(collection(db, 'customers'), {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: {
          street: customer.street,
          city: customer.city,
          state: customer.state,
          postalCode: customer.postalCode,
          country: customer.country,
        },
        totalOrders: 1,
        totalSpent: calculateTotal(),
        createdAt: serverTimestamp(),
      });

      // Generate order number
      const orderNumber = `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

      // Create order
      await addDoc(collection(db, 'orders'), {
        orderNumber,
        customerId: customerRef.id,
        items: items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          category: item.category,
          roastLevel: item.roastLevel,
          grams: item.grams,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit,
          subtotal: item.subtotal,
          imageUrl: item.imageUrl, // Store image URL in order
        })),
        totalAmount: calculateTotal(),
        currency: 'INR', // Store currency for future reference
        status: 'PLACED',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success('Order created successfully!');
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

  return (
    <div className="space-y-6 pb-24">
      <Link 
        href="/orders"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Orders
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Order</h1>
        <p className="text-gray-600 mt-1">Add customer information and select products</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
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
            <Input
              label="Street Address *"
              value={customer.street}
              onChange={(e) => setCustomer({ ...customer, street: e.target.value })}
              placeholder="123 MG Road"
              required
            />
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
        </Card>

        {/* Order Items */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
            <Button type="button" onClick={addItem} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
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
                    label="Select Product *"
                    value={item.productId}
                    onChange={(e) => updateItemProduct(index, e.target.value)}
                    options={[
                      { value: '', label: '-- Select Product --' },
                      ...products.map(p => ({ value: p.id, label: p.name }))
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

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between text-xl font-bold">
              <span>Total Amount</span>
              <span className="text-primary-600">₹{calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Submit Buttons - FIXED: Now visible */}
        <div className="flex gap-4 sticky bottom-0 bg-white p-4 rounded-lg border-2 border-primary-200 shadow-lg">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/orders')}
            disabled={loading}
            className="w-32"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            loading={loading} 
            disabled={loading || items.some(i => !i.productId)}
            className="flex-1"
          >
            {loading ? 'Creating Order...' : 'Create Order'}
          </Button>
        </div>
      </form>
    </div>
  );
}