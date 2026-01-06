// src/app/(dashboard)/customers/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Eye, Mail, Phone, MapPin, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Customer, Address } from '@/lib/types/order';
import toast from 'react-hot-toast';

// Helper function to get primary address
function getPrimaryAddress(customer: any): Address | null {
  if (customer.addresses && Array.isArray(customer.addresses) && customer.addresses.length > 0) {
    const defaultAddr = customer.addresses.find((a: any) => a.isDefault);
    return defaultAddr || customer.addresses[0];
  }
  
  if (customer.address) {
    return {
      id: 'legacy',
      ...customer.address,
      label: 'Default',
      isDefault: true,
      createdAt: new Date().toISOString(),
    };
  }
  
  return null;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'customers'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const querySnapshot = await getDocs(q);
      const customersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Customer[];
      
      setCustomers(customersData);
      setFilteredCustomers(customersData);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Search filter
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = customers.filter(customer => {
      const primaryAddr = getPrimaryAddress(customer);
      
      return (
        customer.name.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term) ||
        customer.phone.toLowerCase().includes(term) ||
        (primaryAddr?.city?.toLowerCase().includes(term)) ||
        (primaryAddr?.state?.toLowerCase().includes(term)) ||
        (primaryAddr?.country?.toLowerCase().includes(term))
      );
    });
    
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

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
    }).format(d);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">View and manage customer information</p>
        </div>
        <Button
          onClick={fetchCustomers}
          variant="outline"
          size="sm"
          loading={loading}
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by name, email, phone, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchTerm && (
            <Button
              variant="ghost"
              onClick={() => setSearchTerm('')}
              size="sm"
            >
              Clear
            </Button>
          )}
        </div>
        {searchTerm && (
          <p className="text-sm text-gray-600 mt-2">
            Found {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
          </p>
        )}
      </Card>

      {loading ? (
        <Card>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading customers...</p>
          </div>
        </Card>
      ) : filteredCustomers.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600">
              {searchTerm ? 'No customers found matching your search' : 'No customers found'}
            </p>
          </div>
        </Card>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => {
                  const primaryAddress = getPrimaryAddress(customer);
                  const addressCount = customer.addresses?.length || (customer.address ? 1 : 0);
                  
                  return (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {customer.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {customer.id.slice(0, 8)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-900">
                            <Mail className="w-3 h-3 mr-1 text-gray-400" />
                            {customer.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-3 h-3 mr-1 text-gray-400" />
                            {customer.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {primaryAddress ? (
                          <div>
                            <div className="text-sm text-gray-900">
                              {primaryAddress.city}, {primaryAddress.state}
                            </div>
                            <div className="text-sm text-gray-500">
                              {primaryAddress.country}
                            </div>
                            {addressCount > 1 && (
                              <div className="flex items-center text-xs text-blue-600 mt-1">
                                <MapPin className="w-3 h-3 mr-1" />
                                +{addressCount - 1} more
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400 italic">
                            No address
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="info">
                          {customer.totalOrders} order{customer.totalOrders !== 1 ? 's' : ''}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(customer.totalSpent)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(customer.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link href={`/customers/${customer.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}