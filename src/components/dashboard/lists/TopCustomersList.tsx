// src/components/dashboard/lists/TopCustomersList.tsx

import { Card } from '@/components/ui/Card';
import { Star, Users, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';
import { getDateRangeLabel } from '@/lib/utils/dashboard-utils';
import Link from 'next/link';

interface TopCustomer {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  totalOrders: number;
  periodSpent: number;
  periodOrders: number;
}

interface TopCustomersListProps {
  customers: TopCustomer[];
  dateRange: string;
  customStart?: Date | null;
  customEnd?: Date | null;
}

export const TopCustomersList = ({ customers, dateRange, customStart, customEnd }: TopCustomersListProps) => {
  const rangeLabel = getDateRangeLabel(dateRange, customStart, customEnd);

  return (
    <Card className="p-6 border-none shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Top Customers
          </h3>
          <p className="text-sm text-gray-600 mt-1">Highest spending in {rangeLabel}</p>
        </div>
        <Link href="/customers" className="text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1">
          View all <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      {customers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {customers.map((customer, index) => (
            <div
              key={customer.id}
              className="relative p-5 bg-linear-to-br from-purple-50 to-pink-50 rounded-xl hover:shadow-lg transition-all group overflow-hidden"
            >
              <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs shadow-lg">
                #{index + 1}
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg mb-3">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <p className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-purple-600 transition-colors mb-1">
                  {customer.name}
                </p>
                <p className="text-xs text-gray-600 line-clamp-1 mb-2">{customer.email}</p>
                <div className="w-full pt-3 border-t border-purple-200">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">Period Spent</span>
                    <span className="font-bold text-green-700">{formatCurrency(customer.periodSpent)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Orders</span>
                    <span className="font-bold text-purple-700">{customer.periodOrders}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No customers yet</p>
        </div>
      )}
    </Card>
  );
};