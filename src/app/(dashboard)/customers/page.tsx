// src/app/(dashboard)/customers/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Eye, Mail, Phone, MapPin, Search, RefreshCw, Users, 
  TrendingUp, DollarSign, ShoppingBag, Download, Filter,
  Star, Award, UserPlus
} from 'lucide-react';
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
  const [sortBy, setSortBy] = useState<'name' | 'orders' | 'spent' | 'recent'>('recent');

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

  // Search and sort filter
  useEffect(() => {
    let filtered = [...customers];

    // Apply search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(customer => {
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
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'orders':
          return b.totalOrders - a.totalOrders;
        case 'spent':
          return b.totalSpent - a.totalSpent;
        case 'recent':
        default:
          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
      }
    });
    
    setFilteredCustomers(filtered);
  }, [searchTerm, customers, sortBy]);

  // Calculate stats
  const stats = {
    total: customers.length,
    totalOrders: customers.reduce((sum, c) => sum + c.totalOrders, 0),
    totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
    avgOrderValue: customers.length > 0 
      ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.reduce((sum, c) => sum + c.totalOrders, 0)
      : 0,
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
    }).format(d);
  };

  return (
    <div className="min-h-screen bg-linear-to-r from-gray-50 to-purple-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-400 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            {/* Header Content */}
            <div className="flex flex-col gap-4">
              {/* Top Row - Title & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Left Side - Title & Description */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-r from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                      Customers
                    </h1>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Manage customer relationships • {customers.length} total
                    </p>
                  </div>
                </div>

                {/* Right Side - Action Buttons */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200">
                    <Download className="w-5 h-5 text-gray-600" />
                  </button>
                  <Button
                    onClick={fetchCustomers}
                    variant="outline"
                    size="sm"
                    loading={loading}
                    className="border-2"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-linear-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <p className="text-xs text-blue-700 font-semibold uppercase">Total Customers</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <div className="bg-linear-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingBag className="w-4 h-4 text-purple-600" />
                    <p className="text-xs text-purple-700 font-semibold uppercase">Total Orders</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">{stats.totalOrders}</p>
                </div>
                <div className="bg-linear-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <p className="text-xs text-green-700 font-semibold uppercase">Total Revenue</p>
                  </div>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <div className="bg-linear-to-r from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                    <p className="text-xs text-amber-700 font-semibold uppercase">Avg Order</p>
                  </div>
                  <p className="text-2xl font-bold text-amber-900">{formatCurrency(stats.avgOrderValue)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-400 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Search & Filter Bar */}
        <Card className="border-none shadow-lg">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by name, email, phone, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 border-2 border-gray-200 focus:border-purple-500 rounded-xl"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors bg-white font-medium text-sm"
              >
                <option value="recent">Most Recent</option>
                <option value="name">Name (A-Z)</option>
                <option value="orders">Most Orders</option>
                <option value="spent">Highest Spent</option>
              </select>
              {searchTerm && (
                <Button
                  variant="ghost"
                  onClick={() => setSearchTerm('')}
                  size="sm"
                  className="border-2 border-gray-200"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
          {searchTerm && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-gray-600">Found</span>
              <span className="font-bold text-purple-700">{filteredCustomers.length}</span>
              <span className="text-gray-600">customer{filteredCustomers.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </Card>

        {loading ? (
          <Card className="border-none shadow-lg">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600 mt-4 font-medium">Loading customers...</p>
            </div>
          </Card>
        ) : filteredCustomers.length === 0 ? (
          <Card className="border-none shadow-lg">
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-linear-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {searchTerm ? 'No customers found' : 'No customers yet'}
              </h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search terms' : 'Customers will appear here once orders are placed'}
              </p>
            </div>
          </Card>
        ) : (
          <Card padding={false} className="border-none shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-linear-to-r from-gray-50 to-purple-50">
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer, index) => {
                    const primaryAddress = getPrimaryAddress(customer);
                    const addressCount = customer.addresses?.length || 0;
                    const isTopCustomer = customer.totalSpent > 5000;
                    
                    return (
                      <tr key={customer.id} className="hover:bg-linear-to-r hover:from-purple-50 hover:to-pink-50 transition-all group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-linear-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg">
                              {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-bold text-gray-900">
                                  {customer.name}
                                </div>
                                {isTopCustomer && (
                                  <div title="Top Customer">
                                    <Award className="w-4 h-4 text-amber-500" />
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 font-mono">
                                ID: {customer.id.slice(0, 8)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1.5">
                            <div className="flex items-center text-sm text-gray-900">
                              <Mail className="w-3.5 h-3.5 mr-2 text-gray-400" />
                              {customer.email}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="w-3.5 h-3.5 mr-2 text-gray-400" />
                              {customer.phone}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {primaryAddress ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {primaryAddress.city}, {primaryAddress.state}
                              </div>
                              <div className="text-sm text-gray-500">
                                {primaryAddress.country}
                              </div>
                              {addressCount > 1 && (
                                <div className="flex items-center text-xs text-purple-600 mt-1 font-medium">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  +{addressCount - 1} more address{addressCount - 1 > 1 ? 'es' : ''}
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
                          <Badge 
                            variant={customer.totalOrders > 5 ? 'success' : 'info'}
                            className="font-bold"
                          >
                            {customer.totalOrders} order{customer.totalOrders !== 1 ? 's' : ''}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-green-700">
                            {formatCurrency(customer.totalSpent)}
                          </div>
                          {customer.totalOrders > 0 && (
                            <div className="text-xs text-gray-500">
                              {formatCurrency(customer.totalSpent / customer.totalOrders)}/order
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(customer.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Link href={`/customers/${customer.id}`}>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="group-hover:bg-purple-100 group-hover:text-purple-700 transition-colors"
                            >
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
    </div>
  );
}